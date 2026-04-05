import { chromium, type BrowserContext, type Cookie } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const COOKIES_PATH = path.join(process.cwd(), 'config', 'data', 'zhihu-cookies.json');
const ZHIHU_WRITE_URL = 'https://zhuanlan.zhihu.com/write';
const ZHIHU_SIGNIN_URL = 'https://www.zhihu.com/signin';

export class NeedLoginError extends Error {
    constructor() {
        super('请先登录知乎');
        this.name = 'NeedLoginError';
    }
}

// --- Cookie helpers ---

async function saveCookies(context: BrowserContext): Promise<void> {
    const cookies = await context.cookies();
    const dir = path.dirname(COOKIES_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
}

function loadCookies(): Cookie[] | null {
    try {
        if (!fs.existsSync(COOKIES_PATH)) return null;
        const raw = fs.readFileSync(COOKIES_PATH, 'utf-8');
        const cookies = JSON.parse(raw);
        return Array.isArray(cookies) ? cookies : null;
    } catch {
        return null;
    }
}

// --- Find Chromium executable ---

function findChromiumPath(): string | undefined {
    // Common Chromium/Chrome paths on Windows
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

// --- Publish ---

export async function publishToZhihu(
    title: string,
    markdownContent: string
): Promise<{ zhihuUrl: string }> {
    const cookies = loadCookies();
    if (!cookies) throw new NeedLoginError();

    const executablePath = findChromiumPath();
    const browser = await chromium.launch({
        headless: true,
        executablePath,
    });

    try {
        const context = await browser.newContext();
        await context.addCookies(cookies);

        const page = await context.newPage();
        await page.goto(ZHIHU_WRITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Check if redirected to login page
        if (page.url().includes('signin')) {
            throw new NeedLoginError();
        }

        // Wait for title input
        const titleInput = page.locator('textarea[placeholder*="请输入标题"], input[placeholder*="请输入标题"]');
        await titleInput.waitFor({ state: 'visible', timeout: 15000 });

        // Fill title
        await titleInput.click();
        await titleInput.fill(title);

        // Fill content via clipboard paste (faster and more reliable for long text)
        const contentEditor = page.locator('.public-DraftEditor-content, [contenteditable="true"]').first();
        await contentEditor.click();

        await page.evaluate(async (text) => {
            await navigator.clipboard.writeText(text);
        }, markdownContent);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Control+V');

        // Wait for publish button to become enabled
        const publishBtn = page.locator('button:has-text("发布")').last();
        await publishBtn.waitFor({ state: 'visible', timeout: 10000 });

        // Wait a moment for content to be processed
        await page.waitForTimeout(2000);

        // Click publish
        await publishBtn.click();

        // Wait for navigation or success indicator
        await page.waitForURL((url) => !url.toString().includes('/write'), { timeout: 30000 }).catch(() => {});

        // Try to get the published article URL
        await page.waitForTimeout(3000);
        const zhihuUrl = page.url();

        // Save refreshed cookies
        await saveCookies(context);

        return { zhihuUrl };
    } finally {
        await browser.close();
    }
}

// --- Login ---

export async function loginToZhihu(): Promise<void> {
    const executablePath = findChromiumPath();
    const browser = await chromium.launch({
        headless: false,
        executablePath,
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(ZHIHU_SIGNIN_URL, { waitUntil: 'domcontentloaded' });

        // Poll until user completes login (URL leaves signin page)
        const maxWait = 5 * 60 * 1000; // 5 minutes
        const pollInterval = 2000;
        let elapsed = 0;

        while (elapsed < maxWait) {
            await page.waitForTimeout(pollInterval);
            elapsed += pollInterval;

            const currentUrl = page.url();
            if (!currentUrl.includes('signin') && !currentUrl.includes('sign_in')) {
                // Login successful
                await saveCookies(context);
                return;
            }
        }

        throw new Error('登录超时（5分钟），请重试');
    } finally {
        await browser.close();
    }
}
