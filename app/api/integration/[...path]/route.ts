
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";


// Environment variables
const GO_API_URL = process.env.GO_API_URL || "http://localhost:9601";
const GO_API_SECRET = process.env.GO_API_SECRET || "16361a36-397e-4028-9844-325df2008779";

// Helper to generate signature
function generateSignature(nonce: string, timestamp: string, secret: string): string {
    const data = `${nonce}${secret}${timestamp}`;
    return crypto.createHash("sha256").update(data).digest("hex");
}


// Helper to get auth headers
function getAuthHeaders() {
    const nonce = crypto.randomUUID();
    const timestamp = Date.now().toString(); // Use milliseconds
    const signature = generateSignature(nonce, timestamp, GO_API_SECRET);

    return {
        "X-Nonce": nonce,
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        "Content-Type": "application/json"
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Construct upstream URL
    // path is an array, e.g. ['logs', 'sources'] -> /api/logs/sources
    const upstreamPath = path.join('/');
    const queryString = searchParams.toString();
    const url = `${GO_API_URL}/api/${upstreamPath}${queryString ? `?${queryString}` : ''}`;
    console.log(`[Integration Proxy] Proxying to: ${url}`);

    try {
        const response = await fetch(url, {
            headers: getAuthHeaders(),
            cache: "no-store"
        });

        if (!response.ok) {
            console.error(`[Integration Proxy] Upstream error: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Upstream error: ${response.statusText}`, success: false },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("[Integration Proxy] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}
