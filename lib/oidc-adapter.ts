import { db } from "@/lib/db";
import { oidcPayloads, oidcClients } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { Adapter, AdapterPayload } from "oidc-provider";

export class DrizzleOidcAdapter implements Adapter {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn: number) {
    if (this.name === "Client") {
      return;
    }

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    await db.insert(oidcPayloads).values({
      id,
      type: this.name,
      payload: payload,
      grantId: payload.grantId,
      userCode: payload.userCode,
      uid: payload.uid,
      expiresAt,
      updatedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        payload: payload,
        expiresAt,
        updatedAt: new Date(),
      }
    });
  }

  async find(id: string) {
    if (this.name === "Client") {
      const client = await db.query.oidcClients.findFirst({
        where: eq(oidcClients.clientId, id),
      });

      if (!client) return undefined;

      const result: any = {
        client_id: client.clientId,
        client_secret: client.clientSecret || undefined,
        client_name: client.clientName || undefined,
        client_uri: client.clientUri || undefined,
        logo_uri: client.logoUri || undefined,
        redirect_uris: client.redirectUris, // Already parsed
        grant_types: client.grantTypes,
        response_types: client.responseTypes,
        scope: client.scope,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      };

      Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

      console.log(`[OIDC Adapter] Found client: ${id}`, result);
      return result;
    }

    const doc = await db.query.oidcPayloads.findFirst({
      where: eq(oidcPayloads.id, id),
    });

    if (!doc) return undefined;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return undefined;
    }

    return {
      ...(doc.payload as any),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUserCode(userCode: string) {
    const doc = await db.query.oidcPayloads.findFirst({
      where: eq(oidcPayloads.userCode, userCode),
    });

    if (!doc) return undefined;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return undefined;
    }

    return {
      ...(doc.payload as any),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUid(uid: string) {
    const doc = await db.query.oidcPayloads.findFirst({
      where: eq(oidcPayloads.uid, uid),
    });

    if (!doc) return undefined;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return undefined;
    }

    return {
      ...(doc.payload as any),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async consume(id: string) {
    if (this.name === "Client") return;

    await db.update(oidcPayloads)
      .set({ consumedAt: new Date() })
      .where(eq(oidcPayloads.id, id));
  }

  async destroy(id: string) {
    if (this.name === "Client") return;

    try {
      await db.delete(oidcPayloads).where(eq(oidcPayloads.id, id));
    } catch (err) {
      // ignore
    }
  }

  async revokeByGrantId(grantId: string) {
    if (this.name === "Client") return;

    await db.delete(oidcPayloads).where(eq(oidcPayloads.grantId, grantId));
  }
}