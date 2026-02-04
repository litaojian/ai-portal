"use server";

import { db } from "@/lib/db";
import { applications, oidcClients } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { count, desc, eq, inArray, or, like } from "drizzle-orm";

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
  const filters: any[] = []; // Use array for AND conditions

  if (query) {
    filters.push(or(
      like(applications.name, `%${query}%`),
      like(applications.description, `%${query}%`)
    ));
  }

  if (type && type !== "all") {
    filters.push(eq(applications.type, type));
  }

  if (status && status !== "all") {
    filters.push(eq(applications.status, status));
  }

  // Combine all filters with AND (implicit in drizzle-orm if passed specifically, wait, need `and(...)` util if array)
  // Actually, drizzle `where` accepts one condition. I need to use `and(...filters)`

  // Conditional import AND
  const { and } = await import("drizzle-orm");
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [data, totalCount] = await Promise.all([
    db.query.applications.findMany({
      where: whereClause,
      limit,
      offset: skip,
      orderBy: [desc(applications.updatedAt)],
      with: {
        oidcClient: true,
      }
    }),
    db.select({ count: count() }).from(applications).where(whereClause),
  ]);

  const mappedData = data.map((app: any) => ({
    ...app,
    oidcClient: app.oidcClient?.[0] || null,
  }));

  return { data: mappedData, total: totalCount[0].count, page, limit, totalPages: Math.ceil(totalCount[0].count / limit) };
}

export async function createApp(formData: z.infer<typeof appSchema>) {
  const validated = appSchema.parse(formData);
  const { type, redirectUris, grantTypes, responseTypes, scope, ...appData } = validated;

  if (type === "internal") {
    await db.insert(applications).values({
      ...appData,
      type: "internal",
    });
  } else {
    // Third party - Create with OIDC Client
    const clientId = `client_${Math.random().toString(36).substring(2, 15)}`;
    const clientSecret = `secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const uris = redirectUris?.split(",").map(s => s.trim()).filter(Boolean) || [];

    // Use transaction
    await db.transaction(async (tx) => {
      const newAppId = crypto.randomUUID();

      await tx.insert(applications).values({
        id: newAppId,
        ...appData,
        type: "third_party",
      });

      await tx.insert(oidcClients).values({
        applicationId: newAppId,
        clientId,
        clientSecret,
        clientName: appData.name,
        clientUri: appData.url,
        redirectUris: uris,
        grantTypes: grantTypes || ["authorization_code"],
        responseTypes: responseTypes || ["code"],
        scope: scope || "openid profile email",
      });
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

  await db.transaction(async (tx) => {
    await tx.update(applications).set(updateData).where(eq(applications.id, id));

    if (type === "third_party") {
      const uris = redirectUris?.split(",").map(s => s.trim()).filter(Boolean) || [];

      // Upsert OIDC Client?
      // Drizzle doesn't support deep upsert in one go easily.
      // We check if it exists or use `onConflictDoUpdate`

      // First, ensure we have an application Id logic. 
      // Since we are updating app `id`, oidcClient should reference it.

      // We can do an upsert on oidcClients for applicationId (which is unique)
      // But wait, applicationId is unique index? Yes `appIdx`.

      // Generate new ID if needed? No, clientId should persist if updating.
      // We should try to find existing client or create new.

      const existingClient = await tx.query.oidcClients.findFirst({
        where: eq(oidcClients.applicationId, id)
      });

      if (existingClient) {
        await tx.update(oidcClients).set({
          clientName: appData.name,
          clientUri: appData.url,
          redirectUris: uris,
          grantTypes: grantTypes || ["authorization_code"],
          scope: scope || "openid profile email",
        }).where(eq(oidcClients.id, existingClient.id));
      } else {
        await tx.insert(oidcClients).values({
          applicationId: id,
          clientId: `client_${Math.random().toString(36).substring(2, 15)}`,
          clientSecret: `secret_${Math.random().toString(36).substring(2, 15)}`,
          clientName: appData.name || "",
          clientUri: appData.url,
          redirectUris: uris,
          grantTypes: grantTypes || ["authorization_code"],
          responseTypes: responseTypes || ["code"],
          scope: scope || "openid profile email",
        });
      }
    }
  });

  revalidatePath("/apps");
  return { success: true };
}

export async function deleteApp(id: string) {
  await db.delete(applications).where(eq(applications.id, id));
  revalidatePath("/apps");
  return { success: true };
}

export async function deleteManyApps(ids: string[]) {
  if (ids.length === 0) return { success: true };
  await db.delete(applications).where(inArray(applications.id, ids));
  revalidatePath("/apps");
  return { success: true };
}
