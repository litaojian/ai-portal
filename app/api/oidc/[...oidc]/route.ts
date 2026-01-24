import { getOidcProvider } from "@/lib/oidc";
import { NextRequest, NextResponse } from "next/server";

// 这是一个极其简化的适配器，实际生产中可能需要更健壮的处理
// 参考: https://github.com/panva/node-oidc-provider/issues/688#issuecomment-949437142

async function handler(req: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  // 1. 确定 Issuer (根域名)
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const issuer = `${protocol}://${host}`;
  
  // 2. 初始化 Provider
  const provider = getOidcProvider(issuer);

  // 3. 构造请求路径
  return new Promise<Response>(async (resolve, reject) => {
    const p = await params;
    // 使用完整路径 /api/oidc/...
    const path = `/api/oidc/${p.oidc.join("/")}`;
    console.log(`[OIDC] Incoming request: ${req.method} ${path}`);
    console.log(`[OIDC] Issuer: ${issuer}`);
    
    const reqMock: any = {
      headers: Object.fromEntries(req.headers),
      method: req.method,
      url: path + (req.nextUrl.search || ""),
      body: req.body,
      socket: { encrypted: protocol === 'https' }, 
      connection: { encrypted: protocol === 'https' },
    };

    // 如果是 POST，我们需要读取 body
    if (req.method === 'POST') {
        try {
            const arrayBuffer = await req.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            reqMock.body = buffer;
            console.log(`[OIDC] POST body loaded, size: ${buffer.length}`);
        } catch (e) {
            console.error("[OIDC] Failed to read body:", e);
        }
    }

    const resMock: any = {
        statusCode: 200,
        headers: {},
        setHeader: (k: string, v: string) => { 
            resMock.headers[k] = v; 
        },
        getHeader: (k: string) => resMock.headers[k],
        removeHeader: (k: string) => {
            delete resMock.headers[k];
        },
        end: (chunk: any) => {
            console.log(`[OIDC] Response ended. Status: ${resMock.statusCode}`);
            const response = new NextResponse(chunk, {
                status: resMock.statusCode,
                headers: resMock.headers,
            });
            resolve(response);
        },
        write: (chunk: any) => {
             // console.log(`[OIDC] Write chunk`);
        }
    };

    try {
        const callback = provider.callback();
        await callback(reqMock, resMock);
    } catch (err) {
        console.error("[OIDC] Callback Error:", err);
        resolve(NextResponse.json({ error: "Internal OIDC Error", details: String(err) }, { status: 500 }));
    }
  });
}

export const GET = handler;
export const POST = handler;
