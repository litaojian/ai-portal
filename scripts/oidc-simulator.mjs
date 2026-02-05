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
            <h1>OIDC 客户端模拟器</h1>
            <p>点击下方按钮，测试通过 AI Portal 登录：</p>
            <a href="${authUrl.toString()}" style="padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
                Login with AI Portal
            </a>
            <p style="color: gray; margin-top: 20px;">Client ID: ${CLIENT_ID}</p>
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
            res.end('<h1>Security Error</h1><p>State mismatch! 可能存在 CSRF 攻击。</p>');
            return;
        }

        try {
            console.log(`[Client] 收到 Authorization Code: ${code}`);
            console.log(`[Client] 正在向 ${ISSUER}/api/oidc/token 请求 Token...`);

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
                    code_verifier: codeVerifier, // PKCE
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(JSON.stringify(tokenData, null, 2));
            }

            console.log(`[Client] 登录成功！收到 Token 数据。`);

            // 解码 ID Token (仅供展示，未验证签名)
            const idTokenPayload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <h1 style="color: green">登录成功!</h1>
                <h2>1. 用户身份 (ID Token Payload)</h2>
                <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${JSON.stringify(idTokenPayload, null, 2)}</pre>
                
                <h2>2. 完整 Token 响应</h2>
                <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${JSON.stringify(tokenData, null, 2)}</pre>
                
                <a href="/">返回首页</a>
            `);

        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>Token 交换失败</h1><pre>${err.message}</pre>`);
        }
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`
==================================================`);
    console.log(`🚀 模拟客户端已启动: http://localhost:${PORT}`);
    console.log(`==================================================
`);
});
