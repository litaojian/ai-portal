import { prisma } from "@/lib/prisma";
import { Adapter, AdapterPayload } from "oidc-provider";

export class PrismaAdapter implements Adapter {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn: number) {
    // Client 的 upsert 只有在动态注册时才会调用
    // 我们暂时不通过 OIDC 协议支持动态注册写库，只支持读取后台创建的 Client
    // 如果需要支持动态注册，这里需要添加针对 Client 的逻辑
    if (this.name === "Client") {
       // 暂时忽略，或者实现写 OidcClient 的逻辑
       return; 
    }

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    
    await prisma.oidcPayload.upsert({
      where: { id },
      update: {
        payload: JSON.stringify(payload),
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        id,
        type: this.name,
        payload: JSON.stringify(payload),
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        expiresAt,
      },
    });
  }

  async find(id: string) {
    // 特殊处理 Client
    if (this.name === "Client") {
      const client = await prisma.oidcClient.findUnique({
        where: { clientId: id },
      });

      if (!client) return undefined;

      const result: any = {
        client_id: client.clientId,
        client_secret: client.clientSecret || undefined,
        client_name: client.clientName || undefined,
        client_uri: client.clientUri || undefined,
        logo_uri: client.logoUri || undefined,
        redirect_uris: JSON.parse(client.redirectUris),
        grant_types: JSON.parse(client.grantTypes),
        response_types: JSON.parse(client.responseTypes),
        scope: client.scope,
        token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      };

      // Remove undefined keys
      Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

      console.log(`[OIDC Adapter] Found client: ${id}`, result);
      return result;
    }

    const doc = await prisma.oidcPayload.findUnique({
      where: { id },
    });

    if (!doc) return undefined;
    
    if (doc.expiresAt && doc.expiresAt < new Date()) {
        return undefined;
    }

    return {
      ...JSON.parse(doc.payload),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUserCode(userCode: string) {
    const doc = await prisma.oidcPayload.findFirst({
      where: { userCode },
    });

    if (!doc) return undefined;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
        return undefined;
    }

    return {
      ...JSON.parse(doc.payload),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUid(uid: string) {
    const doc = await prisma.oidcPayload.findFirst({
      where: { uid },
    });

    if (!doc) return undefined;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
        return undefined;
    }

    return {
      ...JSON.parse(doc.payload),
      ...(doc.consumedAt ? { consumed: true } : undefined),
    };
  }

  async consume(id: string) {
    if (this.name === "Client") return; // Client 不会被 consume

    await prisma.oidcPayload.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async destroy(id: string) {
    if (this.name === "Client") return; // 通过后台管理删除，不通过此接口

    try {
      await prisma.oidcPayload.delete({
        where: { id },
      });
    } catch (err) {
      // 忽略
    }
  }

  async revokeByGrantId(grantId: string) {
    if (this.name === "Client") return;

    await prisma.oidcPayload.deleteMany({
      where: { grantId },
    });
  }
}