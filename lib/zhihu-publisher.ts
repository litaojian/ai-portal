import fs from 'fs';
import path from 'path';

const COOKIES_PATH = path.join(process.cwd(), 'config', 'data', 'zhihu-cookies.json');

export class NeedLoginError extends Error {
    constructor() {
        super('请先登录知乎');
        this.name = 'NeedLoginError';
    }
}

interface ZhihuCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
}

// --- Cookie helpers ---

function loadCookies(): ZhihuCookie[] | null {
    try {
        if (!fs.existsSync(COOKIES_PATH)) return null;
        const raw = fs.readFileSync(COOKIES_PATH, 'utf-8');
        const cookies = JSON.parse(raw);
        return Array.isArray(cookies) ? cookies : null;
    } catch {
        return null;
    }
}

function buildCookieString(cookies: ZhihuCookie[]): string {
    return cookies
        .filter(c => c.domain && c.domain.includes('zhihu.com'))
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
}

function getXsrfToken(cookies: ZhihuCookie[]): string {
    const xsrf = cookies.find(c => c.name === '_xsrf');
    return xsrf?.value ?? '';
}

function buildHeaders(cookies: ZhihuCookie[]): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'Cookie': buildCookieString(cookies),
        'x-xsrftoken': getXsrfToken(cookies),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://zhuanlan.zhihu.com/write',
        'Origin': 'https://zhuanlan.zhihu.com',
    };
}

// --- Markdown to HTML (basic) ---

function markdownToHtml(md: string): string {
    return md
        .split('\n')
        .map(line => {
            // Headings
            if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
            if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
            if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
            // Bold
            line = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            // Empty line
            if (line.trim() === '') return '';
            // Paragraph
            return `<p>${line}</p>`;
        })
        .filter(Boolean)
        .join('\n');
}

// --- Publish via Zhihu API ---

export async function publishToZhihu(
    title: string,
    markdownContent: string
): Promise<{ zhihuUrl: string }> {
    const cookies = loadCookies();
    if (!cookies) throw new NeedLoginError();

    const headers = buildHeaders(cookies);
    const htmlContent = markdownToHtml(markdownContent);

    // Step 1: Create draft
    const createRes = await fetch('https://zhuanlan.zhihu.com/api/articles/drafts', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
    });

    if (createRes.status === 401 || createRes.status === 403) {
        throw new NeedLoginError();
    }
    if (!createRes.ok) {
        throw new Error(`创建草稿失败: ${createRes.status}`);
    }

    const draft = await createRes.json();
    const draftId = draft.id;

    // Step 2: Update draft with title and content
    const patchRes = await fetch(`https://zhuanlan.zhihu.com/api/articles/${draftId}/draft`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title, content: htmlContent }),
    });

    if (!patchRes.ok) {
        throw new Error(`更新草稿失败: ${patchRes.status}`);
    }

    // Step 3: Publish
    const publishRes = await fetch(`https://zhuanlan.zhihu.com/api/articles/${draftId}/publish`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ column: null, topic_url: '' }),
    });

    if (publishRes.status === 401 || publishRes.status === 403) {
        throw new NeedLoginError();
    }
    if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`发布失败: ${publishRes.status} ${errText}`);
    }

    const zhihuUrl = `https://zhuanlan.zhihu.com/p/${draftId}`;
    return { zhihuUrl };
}

// --- Login (still uses Playwright for interactive browser login) ---

export async function loginToZhihu(): Promise<void> {
    // Dynamic import to avoid requiring playwright-core at module level
    const { chromium } = await import('playwright-core');

    const executablePath = findChromiumPath();
    const browser = await chromium.launch({
        headless: false,
        executablePath,
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('https://www.zhihu.com/signin', { waitUntil: 'domcontentloaded' });

        const maxWait = 5 * 60 * 1000;
        const pollInterval = 2000;
        let elapsed = 0;

        while (elapsed < maxWait) {
            await page.waitForTimeout(pollInterval);
            elapsed += pollInterval;

            const currentUrl = page.url();
            if (!currentUrl.includes('signin') && !currentUrl.includes('sign_in')) {
                // Login successful — save cookies
                const cookies = await context.cookies();
                const dir = path.dirname(COOKIES_PATH);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
                return;
            }
        }

        throw new Error('登录超时（5分钟），请重试');
    } finally {
        await browser.close();
    }
}

function findChromiumPath(): string | undefined {
    const candidates = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe`,
    ].filter(Boolean) as string[];

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}
