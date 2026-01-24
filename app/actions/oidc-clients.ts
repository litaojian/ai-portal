"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  const [data, total] = await Promise.all([
    prisma.oidcClient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.oidcClient.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createOidcClient(formData: z.infer<typeof oidcClientSchema>) {
  // 生成 Client ID 和 Secret
  const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
  const clientSecret = `secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

  // 处理输入数据
  const redirectUris = formData.redirectUris.split(",").map(s => s.trim()).filter(Boolean);
  
  await prisma.oidcClient.create({
    data: {
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
    },
  });

  revalidatePath("/oidc/clients");
  return { success: true };
}

export async function deleteOidcClient(id: string) {
  await prisma.oidcClient.delete({
    where: { id },
  });
  revalidatePath("/oidc/clients");
  return { success: true };
}
