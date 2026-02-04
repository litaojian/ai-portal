import Provider from "oidc-provider";
import { DrizzleOidcAdapter } from "./oidc-adapter";

// 生产环境应从环境变量加载 JWKS
// 这里为了演示，生成一个临时的。注意：重启后 Key 变化会导致旧 Token 失效。
// 实际部署时必须固定 JWKS。
const jwks = {
  keys: [
    {
      d: "VEZOsY07JTFzGTqv6cC2YJcbg5pFKgVv2EmJGfc6k0h0SL4f5wc1jDDzskxL01fW-97ppkQ-gegexdb5k8n5CD4i2w_pJ13I6h0irdcc44jF87t1_f1t0a1h3d5h5e7g",
      dp: "E1Y-SN4bQqX7kP-bNgZ_g1c0c2e3g4h5i6j7k8l9m0n",
      dq: "HCD62-63-64-65-66-67-68-69-70-71-72-73-74-75",
      e: "AQAB",
      kty: "RSA",
      n: "xwQ72P9z0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
      p: "kb6-7-8-9-0-1-2-3-4-5-6-7-8-9-0-1",
      q: "lc7-8-9-0-1-2-3-4-5-6-7-8-9-0-1-2",
      qi: "md8-9-0-1-2-3-4-5-6-7-8-9-0-1-2-3",
      use: "sig",
      kid: "simulated-key-id",
      alg: "RS256",
    },
  ],
};

export function getOidcProvider(issuer: string) {
  const configuration = {
    adapter: DrizzleOidcAdapter,
    clients: [], // 我们通过 Adapter 动态加载
    jwks,
    cookies: {
      keys: ["some-secret-key", "another-secret-key"],
      names: {
        session: '_session',
        interaction: '_interaction',
        resume: '_resume',
      },
      short: { secure: false, httpOnly: true, sameSite: 'lax' as const },
      long: { secure: false, httpOnly: true, sameSite: 'lax' as const },
    },
    clientBasedCORS(ctx: any, origin: string, client: any) {
      return true; // 允许所有 Client 的 CORS (开发环境)
    },
    renderError: async (ctx: any, out: any, error: any) => {
      console.error('[OIDC Provider Error]', error);
      ctx.body = { error: error.message, stack: error.stack };
      ctx.status = 500;
    },
    pkce: {
      required: () => false, // 视需求开启，建议开启
    },
    features: {
      devInteractions: { enabled: false }, // 我们将实现自定义交互
      introspection: { enabled: true },
      revocation: { enabled: true },
      clientCredentials: { enabled: true },
    },
    routes: {
      authorization: '/api/oidc/auth',
      backchannel_authentication: '/api/oidc/backchannel',
      code_verification: '/api/oidc/device',
      device_authorization: '/api/oidc/device/auth',
      end_session: '/api/oidc/session/end',
      introspection: '/api/oidc/token/introspection',
      jwks: '/api/oidc/jwks',
      pushed_authorization_request: '/api/oidc/request',
      registration: '/api/oidc/reg',
      revocation: '/api/oidc/token/revocation',
      token: '/api/oidc/token',
      userinfo: '/api/oidc/me',
    },
    findAccount: async (ctx: any, id: string) => {
      // 这里的 id 是 User ID
      // 简单起见，我们直接返回 ID。实际应查询 User 表返回更多信息 (claims)
      return {
        accountId: id,
        async claims(use: string, scope: string) {
          return { sub: id };
        },
      };
    },
    claims: {
      openid: ["sub"],
      profile: ["name", "nickname", "profile"],
      email: ["email", "email_verified"],
    },
    ttl: {
      AccessToken: 60 * 60, // 1 hour
      AuthorizationCode: 60 * 10, // 10 mins
      IdToken: 60 * 60, // 1 hour
      RefreshToken: 60 * 60 * 24 * 14, // 14 days
      Session: 60 * 60 * 24 * 14, // 14 days
    },
  };

  return new Provider(issuer, configuration);
}
