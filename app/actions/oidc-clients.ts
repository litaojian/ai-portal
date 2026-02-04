"use server";

import { db } from "@/lib/db";
import { oidcClients } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { count, desc, eq } from "drizzle-orm";

const oidcClientSchema = z.object({
  clientName: z.string().min(2, "名称至少需要2个字符"),
  clientUri: z.string().optional(),
  logoUri: z.string().optional(),
  redirectUris: z.string().min(1, "至少需要一个回调地址"), // 前端以逗号分隔输入，后端存 JSON
  grantTypes: z.array(z.string()).min(1),
  responseTypes: z.array(z.string()).min(1),
  scope: z.string().default("openid profile email"),
  tokenEndpointAuthMethod: z.string().default("client_secret_basic"),
});

export async function getOidcClients(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [data, totalCount] = await Promise.all([
    db.query.oidcClients.findMany({
      limit,
      offset: skip,
      orderBy: [desc(oidcClients.createdAt)],
    }),
    db.select({ count: count() }).from(oidcClients),
  ]);

  return { data, total: totalCount[0].count, page, limit, totalPages: Math.ceil(totalCount[0].count / limit) };
}

export async function createOidcClient(formData: z.infer<typeof oidcClientSchema>) {
  // 生成 Client ID 和 Secret
  const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
  const clientSecret = `secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

  // 处理输入数据
  const redirectUris = formData.redirectUris.split(",").map(s => s.trim()).filter(Boolean);

  await db.insert(oidcClients).values({
    clientId,
    clientSecret,
    clientName: formData.clientName,
    clientUri: formData.clientUri,
    logoUri: formData.logoUri,
    redirectUris: JSON.stringify(redirectUris),
    grantTypes: JSON.stringify(formData.grantTypes),
    responseTypes: JSON.stringify(formData.responseTypes),
    scope: formData.scope,
    tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod,
  });

  revalidatePath("/oidc/clients");
  return { success: true };
}

export async function deleteOidcClient(id: string) {
  await db.delete(oidcClients).where(eq(oidcClients.id, id));
  revalidatePath("/oidc/clients");
  return { success: true };
}
