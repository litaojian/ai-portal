import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const LIBRARY_PATH = path.join(process.cwd(), 'config', 'data', 'testcases', 'library.json');

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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const library = await readLibrary();
    const item = library.find(tc => tc.id === id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    try {
        const library = await readLibrary();
        const idx = library.findIndex(tc => tc.id === id);
        if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        library[idx] = { ...library[idx], ...body, id, updated_at: new Date().toISOString() };
        await writeLibrary(library);
        return NextResponse.json(library[idx]);
    } catch (error: any) {
        return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const library = await readLibrary();
        const idx = library.findIndex(tc => tc.id === id);
        if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const [deleted] = library.splice(idx, 1);
        await writeLibrary(library);
        return NextResponse.json(deleted);
    } catch (error: any) {
        return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
    }
}
