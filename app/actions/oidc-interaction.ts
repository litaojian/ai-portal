"use server";

import { getOidcProvider } from "@/lib/oidc";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// 这是一个 helper，用于在 Server Action 中构造 mock req/res
async function getProviderAndContext() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const issuer = `${protocol}://${host}/api/oidc`;
  const provider = getOidcProvider(issuer);
  return { provider, issuer };
}

export async function getInteractionDetails(uid: string) {
  const { provider } = await getProviderAndContext();
  
  // 我们需要从数据库中找到这个 Session。
  // provider.interactionDetails(req, res) 通常从 cookie 读取 uid，或者直接传入 req/res。
  // 但在 Server Action 中，我们没有原始 req/res。
  // 幸好 provider 允许直接通过 uid 查找（内部机制）。
  // 不过 API 是 provider.Interaction.find(uid)
  
  const interaction = await provider.Interaction.find(uid);
  
  if (!interaction) {
    throw new Error("Interaction not found");
  }

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
  return returnTo;
}

export async function submitConsent(uid: string) {
  const { provider } = await getProviderAndContext();
  const interaction = await provider.Interaction.find(uid);

  if (!interaction) throw new Error("Interaction not found");

  interaction.result = {
    consent: {
      // 默认同意所有 scope
      rejectedScopes: [], 
      rejectedClaims: [],
    },
  };
  await interaction.save(120);

  return interaction.returnTo;
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

  return interaction.returnTo;
}
