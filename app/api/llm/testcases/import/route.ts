import { NextRequest, NextResponse } from "next/server";
import { parseCurl } from "@/lib/curl-parser";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const LIBRARY_PATH = path.join(process.cwd(), 'config', 'data', 'testcases', 'library.json');
const SITES_PATH = path.join(process.cwd(), 'config', 'data', 'valuelist', 'sites.json');

async function readLibrary(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(LIBRARY_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function writeLibrary(data: any[]): Promise<void> {
    await fs.promises.writeFile(LIBRARY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function readSites(): Promise<any[]> {
    try {
        const content = await fs.promises.readFile(SITES_PATH, 'utf8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * POST /api/llm/testcases/import
 * Parse a cURL command and save it as a new test case.
 * Body: { curl_raw, title, tags? }
 *
 * If the site is not found in sites.json and new_site is provided,
 * it will also add the new site.
 * Body: { curl_raw, title, tags?, new_site?: { label, value, api_token? } }
 */
export async function POST(request: NextRequest) {
    try {
        const { curl_raw, title, tags, new_site } = await request.json();

        if (!curl_raw?.trim()) {
            return NextResponse.json({ error: 'curl_raw is required' }, { status: 400 });
        }
        if (!title?.trim()) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 });
        }

        const parsed = parseCurl(curl_raw);
        const sites = await readSites();

        // Match site by base_url
        let site_name = '';
        const matched = parsed.base_url
            ? sites.find((s: any) => {
                const siteBase = (s.value ?? '').replace(/\/$/, '');
                return siteBase === parsed.base_url.replace(/\/$/, '');
            })
            : null;

        if (matched) {
            site_name = matched.label;
        } else if (new_site?.label && new_site?.value) {
            // Register new site
            const newSiteEntry = {
                label: new_site.label.trim(),
                value: new_site.value.trim().replace(/\/$/, ''),
                extra: { api_token: new_site.api_token?.trim() ?? '' },
            };
            sites.push(newSiteEntry);
            await fs.promises.writeFile(SITES_PATH, JSON.stringify(sites, null, 2), 'utf8');
            site_name = newSiteEntry.label;
        } else if (parsed.base_url) {
            // Auto-generate site label from host
            const autoLabel = new URL(parsed.base_url).host.replace(/[:.]/g, '_');
            site_name = autoLabel;
        }

        const library = await readLibrary();
        const newItem = {
            id: `tc_${Date.now()}`,
            title: title.trim(),
            model_name: parsed.model_name,
            endpoint_type: parsed.endpoint_type,
            endpoint_url: parsed.endpoint_url,
            site_name,
            request_body: parsed.request_body ?? {},
            curl_raw: curl_raw.trim(),
            tags: tags?.trim() ?? '',
            created_at: new Date().toISOString(),
        };

        library.unshift(newItem);
        await writeLibrary(library);

        return NextResponse.json({
            ...newItem,
            site_matched: !!matched,
            site_auto_created: !matched && !!new_site?.label,
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: 'Import failed', details: error.message }, { status: 500 });
    }
}
