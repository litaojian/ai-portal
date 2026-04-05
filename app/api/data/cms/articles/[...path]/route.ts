import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = path.join(process.cwd(), 'config', 'data', 'cms', 'articles');

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Sanitize: prevent directory traversal
  const sanitized = segments.map(s => s.replace(/(\.\.(\/|\\|$))+/g, ''));
  const dirPath = path.join(ARTICLES_DIR, ...sanitized);

  try {
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }

    const stat = await fs.promises.stat(dirPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
    }

    const files = await fs.promises.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const articles = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(dirPath, filename);
        const fileStat = await fs.promises.stat(filePath);
        const content = await fs.promises.readFile(filePath, 'utf8');
        const name = path.basename(filename, '.md');

        return {
          name,
          title: extractTitle(content) || name,
          filename,
          path: [...sanitized, filename].join('/'),
          size: fileStat.size,
          updatedAt: fileStat.mtime.toISOString(),
          createdAt: fileStat.birthtime.toISOString(),
        };
      })
    );

    return NextResponse.json(articles);
  } catch (error) {
    console.error('[CMS Articles] Failed to read directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
