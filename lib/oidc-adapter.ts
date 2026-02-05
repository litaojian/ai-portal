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
    const data = {
      id,
      type: this.name,
      payload: payload,
      grantId: payload.grantId,
      userCode: payload.userCode,
      uid: payload.uid || id,
      expiresAt,
      updatedAt: new Date(),
    };

    console.log(`[OIDC Adapter] Upserting ${this.name} id=${id} uid=${payload.uid}`, {
      keys: Object.keys(payload),
      returnTo: payload.returnTo,
      redirectUri: (payload.params as any)?.redirect_uri
    });

    // Special logging for Grant to debug payload issue
    if (this.name === "Grant") {
      console.log(`[OIDC Adapter] Grant FULL PAYLOAD:`, JSON.stringify(payload, null, 2));
    }

    try {
      // 使用先删除后插入的方式，确保在某些 MySQL 环境下的稳定性
      await db.delete(oidcPayloads).where(eq(oidcPayloads.id, id));
      await db.insert(oidcPayloads).values(data);
    } catch (err) {
      console.error(`[OIDC Adapter] Upsert failed for ${this.name} id=${id}`, err);
      throw err;
    }
  }

  async find(id: string) {
    console.log(`[OIDC Adapter] Finding ${this.name} id=${id}`);
    if (this.name === "Client") {
      const client = await db.query.oidcClients.findFirst({
        where: eq(oidcClients.clientId, id),
      });

      if (!client) {
        return undefined;
      }

      const parseJson = (val: any) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch (e) {
            return val;
          }
        }
        return val;
      };

      const result: any = {
        client_id: client.clientId,
        client_secret: client.clientSecret || undefined,
        client_name: client.clientName || undefined,
        client_uri: client.clientUri || undefined,
        logo_uri: client.logoUri || undefined,
        redirect_uris: parseJson(client.redirectUris),
        grant_types: parseJson(client.grantTypes),
        response_types: parseJson(client.responseTypes),
        scope: client.scope,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      };

      Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);
      return result;
    }

    const doc = await db.query.oidcPayloads.findFirst({
      where: eq(oidcPayloads.id, id),
    });

    if (!doc) {
      return undefined;
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return undefined;
    }

    let payload = doc.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error(`[OIDC Adapter] Failed to parse payload for ${id}:`, e);
      }
    }

    const result = {
      ...(payload as any),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };

    return result;
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
