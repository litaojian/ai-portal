import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl) {
            return NextResponse.json({ error: 'Config missing: NEW_API_URL' }, { status: 500 });
        }

        // new-api 代理视频文件的路由
        const targetUrl = `${baseUrl}/v1/videos/${id}/content`;

        // We fetch the video and stream it back.
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const errStr = await response.text();
            return new NextResponse(errStr, { status: response.status });
        }

        // Pass headers properly back to the client, especially for video playback ranging
        const newHeaders = new Headers(response.headers);
        newHeaders.delete('Content-Encoding'); // nextjs will handle it

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    } catch (error: any) {
        console.error("Video content stream error:", error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
