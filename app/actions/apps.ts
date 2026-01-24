"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const appSchema = z.object({
  name: z.string().min(2, "名称至少需要2个字符"),
  description: z.string().optional(),
  url: z.string().min(1, "访问链接不能为空"),
  icon: z.string().optional(),
  status: z.string().default("draft"),
  version: z.string().optional(),
  developer: z.string().optional(),
  type: z.string().default("internal"), // internal, third_party
  // OIDC fields
  redirectUris: z.string().optional(),
  grantTypes: z.array(z.string()).optional(),
  responseTypes: z.array(z.string()).optional(),
  scope: z.string().optional(),
});

export async function getApps(query?: string, type: string = "all", status: string = "all", page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
    ];
  }

  if (type && type !== "all") {
    where.type = type;
  }

  if (status && status !== "all") {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        oidcClient: true,
      }
    }),
    prisma.application.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createApp(formData: z.infer<typeof appSchema>) {
  const validated = appSchema.parse(formData);
  const { type, redirectUris, grantTypes, responseTypes, scope, ...appData } = validated;

  if (type === "internal") {
    await prisma.application.create({
      data: {
        ...appData,
        type: "internal",
      },
    });
  } else {
    // Third party - Create with OIDC Client
    const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
    const clientSecret = `secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const uris = redirectUris?.split(",").map(s => s.trim()).filter(Boolean) || [];

    await prisma.application.create({
      data: {
        ...appData,
        type: "third_party",
        oidcClient: {
          create: {
            clientId,
            clientSecret,
            clientName: appData.name,
            clientUri: appData.url,
            redirectUris: JSON.stringify(uris),
            grantTypes: JSON.stringify(grantTypes || ["authorization_code"]),
            responseTypes: JSON.stringify(responseTypes || ["code"]),
            scope: scope || "openid profile email",
          }
        }
      },
    });
  }

  revalidatePath("/apps");
  return { success: true };
}

export async function updateApp(id: string, formData: Partial<z.infer<typeof appSchema>>) {
  const { type, redirectUris, grantTypes, responseTypes, scope, ...appData } = formData;

  const updateData: any = {
    name: appData.name,
    description: appData.description,
    url: appData.url,
    icon: appData.icon,
    status: appData.status,
    version: appData.version,
    developer: appData.developer,
  };

  if (type === "third_party") {
     const uris = redirectUris?.split(",").map(s => s.trim()).filter(Boolean) || [];
     
     updateData.oidcClient = {
       upsert: {
         create: {
           clientId: `client_${Math.random().toString(36).substring(2, 15)}`,
           clientSecret: `secret_${Math.random().toString(36).substring(2, 15)}`,
           clientName: appData.name || "",
           clientUri: appData.url,
           redirectUris: JSON.stringify(uris),
           grantTypes: JSON.stringify(grantTypes || ["authorization_code"]),
           responseTypes: JSON.stringify(responseTypes || ["code"]),
           scope: scope || "openid profile email",
         },
         update: {
           clientName: appData.name,
           clientUri: appData.url,
           redirectUris: JSON.stringify(uris),
           grantTypes: JSON.stringify(grantTypes || ["authorization_code"]),
           scope: scope || "openid profile email",
         }
       }
     };
  }

  await prisma.application.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/apps");
  return { success: true };
}

export async function deleteApp(id: string) {
  await prisma.application.delete({
    where: { id },
  });

  revalidatePath("/apps");
  return { success: true };
}

export async function deleteManyApps(ids: string[]) {
  await prisma.application.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  revalidatePath("/apps");
  return { success: true };
}
