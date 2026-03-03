
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

    // Extract site override (_site or site_url), remove it from forwarded query params
    const siteOverride = searchParams.get('_site') || searchParams.get('site_url');
    const forwardParams = new URLSearchParams(searchParams);
    forwardParams.delete('_site');
    forwardParams.delete('site_url');
    const queryString = forwardParams.toString();

    // Construct upstream URL
    const upstreamPath = path.join('/');
    let url: string;
    let headers: Record<string, string>;

    if (siteOverride) {
        // External site: use _site as base, no internal auth headers
        const cleanSite = siteOverride.replace(/\/$/, '');
        url = `${cleanSite}/${upstreamPath}${queryString ? `?${queryString}` : ''}`;
        headers = getAuthHeaders();
    } else {
        // Internal Go API: add signature auth headers
        url = `${GO_API_URL}/api/${upstreamPath}${queryString ? `?${queryString}` : ''}`;
        headers = getAuthHeaders();
    }
    console.log(`[Integration Proxy] Proxying to: ${url}, ${headers}`);

    try {
        const response = await fetch(url, {
            headers,
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

        // Normalize Go API envelope: { success: true, data: ... } → unwrap to data
        // This converts { success, data: { data:[], total:N } } → { data:[], total:N }
        // and { success, data: [...] } → [...] so PageBuilder can handle all formats uniformly
        if (data && typeof data === 'object' && data.success === true && data.data !== undefined) {
            return NextResponse.json(data.data);
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("[Integration Proxy] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const upstreamPath = path.join('/');
    const bodyText = await request.text();

    // Extract site_url from body to support external site routing
    let siteOverride: string | null = null;
    let forwardBody = bodyText;
    if (bodyText) {
        try {
            const bodyJson = JSON.parse(bodyText);
            if (bodyJson.site_url) {
                siteOverride = bodyJson.site_url;
                delete bodyJson.site_url;
                forwardBody = JSON.stringify(bodyJson);
            }
        } catch {
            // not JSON, forward as-is
        }
    }

    let url: string;
    let headers: Record<string, string>;

    if (siteOverride) {
        const cleanSite = siteOverride.replace(/\/$/, '');
        url = `${cleanSite}/${upstreamPath}`;
        headers = getAuthHeaders();
    } else {
        url = `${GO_API_URL}/api/${upstreamPath}`;
        headers = getAuthHeaders();
    }

    console.log(`[Integration Proxy] POST proxying to: ${url}, ${headers}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: forwardBody,
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

        if (data && typeof data === 'object' && data.success === true && data.data !== undefined) {
            return NextResponse.json(data.data);
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("[Integration Proxy] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}
