import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // In Next.js App Router (async params)
) {
    try {
        const { id } = await context.params;
        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl) {
            return NextResponse.json({ error: 'Config missing: NEW_API_URL is not set in .env' }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/video/generations/${id}`;

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Video task poll error:", error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
