"use server";

import { getOidcProvider } from "@/lib/oidc";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import * as fs from 'fs';
import * as path from 'path';

// 这是一个 helper，用于在 Server Action 中构造 mock req/res
async function getProviderAndContext() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const issuer = `${protocol}://${host}`;
  const provider = getOidcProvider(issuer);
  return { provider, issuer };
}

// 登录验证 (Server Action)
export async function verifyCredentials(email: string, pass: string) {
  console.log(`[OIDC Action] verifyCredentials: ${email}`);
  // 实际项目中应使用 Drizzle 查询数据库中的 users 表
  // 并使用 bcrypt 或 similar 进行密码比对
  // 这里为了演示，假设 admin@example.com / 123456 为合法账号
  if (email === "admin@example.com" && pass === "123456") {
    return { success: true, accountId: "admin-id" };
  }

  // 如果没有配置用户，或者处于开发模式，我们可以临时允许所有登录用于调试
  if (process.env.NODE_ENV === 'development') {
    return { success: true, accountId: email };
  }

  throw new Error("Invalid username or password");
}

function log(msg: string) {
  console.log(msg);
  try {
    fs.appendFileSync(path.resolve(process.cwd(), 'oidc-debug.log'), msg + '\n');
  } catch (e) { }
}

export async function getInteractionDetails(uid: string) {
  const { provider } = await getProviderAndContext();

  // 我们需要从数据库中找到这个 Session。
  const interaction = await provider.Interaction.find(uid);

  if (!interaction) {
    throw new Error("Interaction not found");
  }

  log(`[OIDC Interaction] Loaded details for ${uid}`);

  return JSON.parse(JSON.stringify(interaction)); // 去除不可序列化对象
}

export async function submitLogin(uid: string, accountId: string) {
  const { provider } = await getProviderAndContext();
  const interaction = await provider.Interaction.find(uid);

  if (!interaction) throw new Error("Interaction not found");

  interaction.result = {
    login: { accountId },
  };
  await interaction.save(120); // TTL

  // 返回应该重定向的地址
  // 按照 OIDC 流程，我们只需保存结果，然后重定向回 provider 的 resume 地址
  const returnTo = interaction.returnTo;
  log(`[OIDC Action] submitLogin success for ${uid}. Redirecting to: ${returnTo}`);
  return returnTo;
}

export async function submitConsent(uid: string) {
  const { provider } = await getProviderAndContext();
  const interaction = await provider.Interaction.find(uid);
  log(`[OIDC Action] submitConsent for uid: ${uid}`);
  if (!interaction) throw new Error("Interaction not found");

  try {
    // Find or create Grant
    let grant;
    if (interaction.grantId) {
      grant = await provider.Grant.find(interaction.grantId);
    }

    if (!grant) {
      grant = new provider.Grant({
        accountId: interaction.session?.accountId,
        clientId: interaction.params.client_id as string,
      });
    }

    // Add requested scopes to grant
    const requestedScopes = (interaction.params.scope as string) || '';
    if (requestedScopes) {
      grant.addOIDCScope(requestedScopes);
      log(`[OIDC Action] Added scopes to Grant: ${requestedScopes}`);
    }

    // Save grant
    const grantId = await grant.save();
    log(`[OIDC Action] Grant saved: ${grantId}`);

    // Set consent result with explicit scope information
    const scopes = requestedScopes.split(' ').filter(Boolean);
    interaction.result = {
      consent: {
        grantId,
        // Explicitly tell oidc-provider which scopes were granted
        scope: scopes.join(' '),
      },
    };

    await interaction.save(120);

    log(`[OIDC Action] submitConsent success for ${uid}. Redirecting to: ${interaction.returnTo}`);
    return interaction.returnTo;
  } catch (error: any) {
    log(`[OIDC Action] Error in submitConsent: ${error.message}`);
    log(`[OIDC Action] Error stack: ${error.stack}`);
    throw error;
  }
}

export async function abortInteraction(uid: string) {
  const { provider } = await getProviderAndContext();
  const interaction = await provider.Interaction.find(uid);

  if (!interaction) throw new Error("Interaction not found");

  interaction.result = {
    error: 'access_denied',
    error_description: 'End-User aborted interaction',
  };
  await interaction.save(120);

  log(`[OIDC Action] abortInteraction for ${uid}. Redirecting to: ${interaction.returnTo}`);
  return interaction.returnTo;
}
