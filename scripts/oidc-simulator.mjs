import http from 'http';
import { randomBytes, createHash } from 'crypto';

// 配置
const PORT = 3001;
const ISSUER = 'http://localhost:3000'; // AI Portal 地址
const CLIENT_ID = 'oidc-test-client';
const CLIENT_SECRET = 'test-secret';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// PKCE 辅助函数 (增强安全性，虽然测试可选，但推荐加上)
const base64URLEncode = (str) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};
const sha256 = (buffer) => createHash('sha256').update(buffer).digest();

// 简单的内存存储
let pendingState = null;
let codeVerifier = null;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // 1. 首页：显示登录按钮
    if (url.pathname === '/') {
        // 生成 PKCE
        codeVerifier = base64URLEncode(randomBytes(32));
        const codeChallenge = base64URLEncode(sha256(codeVerifier));
        pendingState = base64URLEncode(randomBytes(16));

        // 构造 OIDC 授权 URL
        const authUrl = new URL(`${ISSUER}/api/oidc/auth`);
        authUrl.searchParams.set('client_id', CLIENT_ID);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid profile email');
        authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.set('state', pendingState);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <style>
                body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
                .card { background: white; padding: 40px; border-radius: 16px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; text-align: center; }
                .btn { display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            </style>
            <div class="card">
                <h1>OIDC 客户端模拟器</h1>
                <p>测试通过 AI Portal 登录流程：</p>
                <a href="${authUrl.toString()}" class="btn">
                    Login with AI Portal
                </a>
                <p style="color: gray; margin-top: 20px; font-size: 13px;">Client ID: ${CLIENT_ID}</p>
            </div>
        `);
        return;
    }

    // 2. 回调页：接收 Code 并换取 Token
    if (url.pathname === '/callback') {
        const error = url.searchParams.get('error');
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>登录失败</h1><p>Error: ${error}</p><p>Description: ${url.searchParams.get('error_description')}</p><a href="/">重试</a>`);
            return;
        }

        if (state !== pendingState) {
            res.writeHead(400);
            res.end('<h1>Security Error</h1><p>State mismatch!</p>');
            return;
        }

        try {
            console.log(`[Client] 收到 Authorization Code: ${code}`);

            // 后端直接通信：换取 Token
            const tokenResponse = await fetch(`${ISSUER}/api/oidc/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(JSON.stringify(tokenData, null, 2));
            }

            console.log(`[Client] 登录成功！展示用户信息。`);

            const idToken = tokenData.id_token;
            const idTokenPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <h1 style="color: #059669; margin-bottom: 24px;">✅ 登录成功!</h1>
                
                <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 12px; margin-bottom: 24px; font-family: system-ui, sans-serif;">
                    <h3 style="margin-top: 0; color: #065f46;">登录用户信息</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #d1fae5;">
                            <td style="padding: 10px 0; color: #047857; font-weight: 600; width: 140px;">用户 ID (sub):</td>
                            <td style="padding: 10px 0; font-family: monospace;">${idTokenPayload.sub}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #d1fae5;">
                            <td style="padding: 10px 0; color: #047857; font-weight: 600;">电子邮箱:</td>
                            <td style="padding: 10px 0;">${idTokenPayload.email || '未提供'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #d1fae5;">
                            <td style="padding: 10px 0; color: #047857; font-weight: 600;">用户姓名:</td>
                            <td style="padding: 10px 0;">${idTokenPayload.name || '未提供'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #047857; font-weight: 600;">认证时间:</td>
                            <td style="padding: 10px 0;">${new Date(idTokenPayload.auth_time * 1000).toLocaleString('zh-CN')}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 32px; display: flex; gap: 12px;">
                    <a href="/logout?id_token_hint=${idToken}" style="padding: 12px 24px; background: #e11d48; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        安全登出 (Logout)
                    </a>
                    <a href="/" style="padding: 12px 24px; background: #f1f5f9; color: #475569; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        返回首页
                    </a>
                </div>

                <details style="margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
                    <summary style="cursor: pointer; color: #64748b; font-weight: 600; padding: 8px;">查看原始 ID Token</summary>
                    <pre style="background: #f8fafc; padding: 16px; border-radius: 4px; margin-top: 12px; font-size: 13px; overflow: auto;">${JSON.stringify(idTokenPayload, null, 2)}</pre>
                </details>
            `);

        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Token 交换失败</h1><pre>${err.message}</pre>`);
        }
        return;
    }

    // 3. 登出页
    if (url.pathname === '/logout') {
        const idTokenHint = url.searchParams.get('id_token_hint');
        const logoutUrl = new URL(`${ISSUER}/api/oidc/session/end`);
        if (idTokenHint) {
            logoutUrl.searchParams.set('id_token_hint', idTokenHint);
        }
        logoutUrl.searchParams.set('post_logout_redirect_uri', `http://localhost:${PORT}/`);

        console.log(`[Client] 请求登出并重定向至: http://localhost:${PORT}/`);
        res.writeHead(302, { Location: logoutUrl.toString() });
        res.end();
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`🚀 模拟客户端已启动: http://localhost:${PORT}`);
});
