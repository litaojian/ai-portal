import { db } from "@/lib/db";
import { oidcClients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("正在注册测试用 OIDC Client...");

  const clientId = "oidc-test-client";
  const clientSecret = "test-secret";
  const redirectUri = "http://localhost:3001/callback";
  const postLogoutRedirectUri = "http://localhost:3001/";

  // 1. 检查是否存在
  const existing = await db.query.oidcClients.findFirst({
    where: eq(oidcClients.clientId, clientId),
  });

  if (existing) {
    console.log("⚠️ 测试客户端已存在，正在更新配置...");
    await db.update(oidcClients)
      .set({
        clientSecret,
        redirectUris: [redirectUri],
        postLogoutRedirectUris: [postLogoutRedirectUri],
        updatedAt: new Date(),
      })
      .where(eq(oidcClients.clientId, clientId));
    console.log("✅ 测试客户端配置更新成功！");
    process.exit(0);
  }

  // 2. 插入 Client
  try {
    await db.insert(oidcClients).values({
      clientId,
      clientSecret,
      clientName: "OIDC 流程测试应用",
      redirectUris: [redirectUri], // JSON
      postLogoutRedirectUris: [postLogoutRedirectUri], // JSON
      grantTypes: ["authorization_code", "refresh_token"], // JSON
      responseTypes: ["code"], // JSON
      scope: "openid profile email",
      tokenEndpointAuthMethod: "client_secret_basic",
    });

    console.log("✅ 测试客户端注册成功！");
    console.log(`Client ID: ${clientId}`);
    console.log(`Redirect URI: ${redirectUri}`);
    console.log(`Post Logout Redirect URI: ${postLogoutRedirectUri}`);
  } catch (error) {
    console.error("❌ 注册失败:", error);
  }

  process.exit(0);
}

main();
