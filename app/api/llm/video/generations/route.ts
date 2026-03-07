import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl) {
            return NextResponse.json({ error: 'Config missing: NEW_API_URL is not set in .env' }, { status: 500 });
        }

        // 发送给 new-api 的请求
        const targetUrl = `${baseUrl}/v1/video/generations`;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Video generation post error:", error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
