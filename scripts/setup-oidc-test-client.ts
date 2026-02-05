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

  // 1. 检查是否存在
  const existing = await db.query.oidcClients.findFirst({
    where: eq(oidcClients.clientId, clientId),
  });

  if (existing) {
    console.log("⚠️ 测试客户端已存在，跳过创建。");
    console.log(`Client ID: ${clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
    process.exit(0);
  }

  // 2. 创建应用关联 (可选，为了外键约束，这里简单处理，如果 schema 允许 appId 为空则跳过，
  // 但根据 schema definition: applicationId references applications.id)
  // 让我们先检查 schema，applicationId 是可以为空的吗？
  // schema.ts: applicationId: varchar... references ... { onDelete: "cascade" }
  // 如果没有 notNull()，则是可空的。
  // 查看 schema 定义: applicationId: varchar... (没有 .notNull()) -> 可空。

  // 3. 插入 Client
  try {
    await db.insert(oidcClients).values({
      clientId,
      clientSecret,
      clientName: "OIDC 流程测试应用",
      redirectUris: [redirectUri], // JSON
      grantTypes: ["authorization_code", "refresh_token"], // JSON
      responseTypes: ["code"], // JSON
      scope: "openid profile email",
      tokenEndpointAuthMethod: "client_secret_basic",
    });

    console.log("✅ 测试客户端注册成功！");
    console.log(`Client ID: ${clientId}`);
    console.log(`Redirect URI: ${redirectUri}`);
  } catch (error) {
    console.error("❌ 注册失败:", error);
  }

  process.exit(0);
}

main();
