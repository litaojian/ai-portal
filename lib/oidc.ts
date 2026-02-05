import Provider, { Configuration } from "oidc-provider";
import { DrizzleOidcAdapter } from "./oidc-adapter";

// 生产环境应从环境变量加载 JWKS
// 这里为了演示，生成一个临时的。注意：重启后 Key 变化会导致旧 Token 失效。
// 实际部署时必须固定 JWKS。
const jwks = {
  "keys": [
    {
      "kty": "RSA",
      "n": "_SBasDcmoKtRz9jIrsBinHb4QNpKe-G81z8v1MXTD7Ypzeh4Jll8Bj53nCQg56WBeCiFb2Ar5OkX_VAATRBHbEfUDu-4WisB33KotnQn_PdFUoywAlTZZkYW5JuTSe4fr5BQc1rQKpxPHXMg7rCA-Nfhp_A28U6u7MSn59bK_duHj6uAqw5dCMTlWO2t6zywXue0LGSbpXiNYxvur9pnyUiCJCkDAptEc8JLPAIJcB2l4S8GCIJDWoKG69lhs739-YLm6iDFGz5KpMuhKd7cWdUVtWeFypyudXS650ARdEgRvzJttCrhZ5wgUMA2g-AGkdtvsNPWtSs4mpyF7zmqzw",
      "e": "AQAB",
      "d": "auVbZw9xlfbDlgL2vQ66zx_gmp8jRy24PLyO6Eww8lU0bsCE4JCwz7lYydCw-D8JNScEFloxhJayitWTg9t4hwjq2kd-kwddpqo3B0gGfrF8P7Wb9EOn_Wx_k9KRYPygndkbPPE5aajR-UiI9SeU3fOikSz9I1ylZjttkJdBW0f1Ehw6m5G4Rqc3PCJQk8FMZqZnhEzKP4Xc19PMIPEoRC54OA32Zs-5LHziw2qB-62vwOXrnNR9pFzoTeAI3fC5EFVuSGBp5UPUWqetVDr10xw8BAt-jEE0AHEqM6t6Se_Mpza2w1GNHauM3Cf8zs_KmbGx_3SX6CXHxUd6TZah",
      "p": "_9pvzv9Iw3z4HXCHUgvok29F2qL1Gen2OIz2-As_dKoHYpdfQuKoJjD2n21LnDRcPwGRapdhJr-05x5VJn929OstpUNLXLc_BZFjzwdNKnyFr0muf2WJrITN7moBKOng7dCYac103lnnCDw3AuCHYpw0JqGFaWC-vWcnElz7G78",
      "q": "_UWEY-8UBLuXQkDDgvgoeCBtsJ-10Xh3SCFWOdavlX1uvUDTUZfvI47b161ffJnE0Ku3HHgI7KeD-DRg9lsDViK4l0eFFzyA13llHa8F0_AWKqknX3-3P2zjLmr08hw7yEpkyc97HzqzQOvsfWRp5t1ZwkppLdpuRj9rp5o-dPE",
      "dp": "QzneDwG82MDJYNLke4Ztge_G5v_SbxCuhYVkjyBFeB4E-r7TZPuxOve6lYFeUJjhdByxXNSRzmCo4-FwdkEfvJLe14GrF51-jbP6CbfdasB1T-2IUCkZ1569jVuFGn75fwNESOiXQKVWsy8_NR5R9HMesNfX-ixVcebcuVJ9GHk",
      "dq": "VlWQH5CrvkFD-m2hN8_n26sSORb4H4N1Bb13axfnmom7af_jCPlFp1VXU1niJtMz5_3g2W-Be0pPDhisxM2ZgY8sZUUX9SfGs6zJ7yhuUCSTKc-ngEJE8PXpKzWCcdV1-3yAhtqXGbokyIijgMrt3qitpDFBUUQYOxH7XJKTn8E",
      "qi": "onkwIOGVnGk2f1bRPRw1uQoAO4_3WWvtLfW0mNeiDCVN0mgrzV-7NsphA7gHVpKF_-0nA6z58Kju40aGUU1dc_tm8m0pXiLr-Jur48MZ7Ce_K_ILfrdL9aoDXAsfCQ7s1T666MyX4sKPpUCAMU8erjNszvGN9_jfM3wxHdev9yY",
      "use": "sig",
      "kid": "main-key",
      "alg": "RS256"
    }
  ]
};;

let providerCache: Provider | null = null;
let lastIssuer: string | null = null;

export function getOidcProvider(issuer: string) {
  const protocol = issuer.startsWith('https') ? 'https' : 'http';
  if (providerCache && lastIssuer === issuer) {
    return providerCache;
  }

  const configuration: Configuration = {
    adapter: DrizzleOidcAdapter as any,
    clients: [], // 我们通过 Adapter 动态加载
    jwks,
    cookies: {
      keys: process.env.OIDC_COOKIE_KEYS ? process.env.OIDC_COOKIE_KEYS.split(',') : ["default-secret-key-change-me"],
      names: {
        session: '_session',
        interaction: '_interaction',
        resume: '_resume',
      },
      short: {
        secure: protocol === 'https',
        httpOnly: true,
        sameSite: 'lax' as const
      },
      long: {
        secure: protocol === 'https',
        httpOnly: true,
        sameSite: 'lax' as const
      },
    },
    clientBasedCORS(ctx: any, origin: string, client: any) {
      // 生产环境应检查 client.redirectUris
      if (process.env.NODE_ENV === 'development') return true;
      return client.redirectUris.some((uri: string) => new URL(uri).origin === origin);
    },
    renderError: async (ctx: any, out: any, error: any) => {
      console.error('[OIDC Provider Error]', error);
      // 重定向到自定义错误页面
      const url = new URL('/oidc/error', issuer);
      url.searchParams.set('error', error.message);
      if (process.env.NODE_ENV === 'development') {
        url.searchParams.set('details', error.stack || '');
      }
      ctx.redirect(url.href);
    },
    pkce: {
      required: () => true, // 强制使用 PKCE 提高安全性
    },
    interactions: {
      url(ctx: any, interaction: any) {
        return `/oidc/interaction/${interaction.uid}`;
      },
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
    // 账户查找
    findAccount: async (ctx: any, id: string) => {
      console.log(`[OIDC Provider] findAccount: ${id}`);
      return {
        accountId: id,
        async claims(use: string, scope: string) {
          console.log(`[OIDC Provider] generating claims for ${id} scope=${scope} use=${use}`);
          try {
            const nickname = id.includes('@') ? id.split('@')[0] : id;
            const claims = {
              sub: id,
              email: id.includes('@') ? id : `${id}@example.com`,
              email_verified: true,
              name: "Test User",
              nickname,
              profile: `https://example.com/${id}`
            };
            return claims;
          } catch (error) {
            console.error(`[OIDC Provider] Error generating claims for ${id}:`, error);
            throw error;
          }
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
      Interaction: 60 * 60, // 1 hour for debugging
    },
  };
  const provider = new Provider(issuer, configuration);

  providerCache = provider;
  lastIssuer = issuer;

  return provider;
}
