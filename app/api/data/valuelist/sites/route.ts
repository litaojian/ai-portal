import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const SITES_PATH = path.join(process.cwd(), 'config', 'data', 'valuelist', 'sites.json');

async function readSites(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(SITES_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function writeSites(data: any[]): Promise<void> {
    await fs.promises.writeFile(SITES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * GET /api/data/valuelist/sites
 * Returns the list of configured sites.
 * This route overrides the generic [name] valuelist route to also support POST.
 */
export async function GET() {
    const sites = await readSites();
    return NextResponse.json(sites);
}

/**
 * POST /api/data/valuelist/sites
 * Add a new site entry.
 * Body: { label: string, value: string, api_token?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { label, value, api_token } = await request.json();

        if (!label?.trim() || !value?.trim()) {
            return NextResponse.json({ error: 'label and value are required' }, { status: 400 });
        }

        const sites = await readSites();

        // Check for duplicate label or value
        const labelExists = sites.some((s: any) => s.label === label.trim());
        if (labelExists) {
            return NextResponse.json({ error: `Site with label '${label}' already exists` }, { status: 409 });
        }

        const newSite = {
            label: label.trim(),
            value: value.trim().replace(/\/$/, ''),
            extra: { api_token: api_token?.trim() ?? '' },
        };

        sites.push(newSite);
        await writeSites(sites);

        return NextResponse.json(newSite, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Add site failed', details: error.message }, { status: 500 });
    }
}
