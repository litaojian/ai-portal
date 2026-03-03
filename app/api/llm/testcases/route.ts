import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ data: [], total: 0 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { site_name, api_token, endpoint_url, request_body } = body;

        if (!site_name || !api_token || !endpoint_url) {
            return NextResponse.json({ error: "Missing required parameters (site_name, api_token, endpoint_url)" }, { status: 400 });
        }

        // Construct target URL
        const baseUrl = site_name.endsWith('/') ? site_name.slice(0, -1) : site_name;
        const path = endpoint_url.startsWith('/') ? endpoint_url : `/${endpoint_url}`;
        const targetUrl = `${baseUrl}${path}`;

        console.log(`Proxying request to: ${targetUrl}`);

        // Parse request_body if it's a string
        let payload = request_body;
        if (typeof request_body === 'string') {
            try {
                payload = JSON.parse(request_body);
            } catch (e) {
                // If not valid JSON, send as is or handle accordingly
            }
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api_token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // We update the response_data field for the frontend to display
        return NextResponse.json({
            ...body,
            response_data: JSON.stringify(data, null, 2)
        });

    } catch (error: any) {
        console.error("Model Test Error:", error);
        return NextResponse.json({
            error: "Model test failed",
            details: error.message
        }, { status: 500 });
    }
}
