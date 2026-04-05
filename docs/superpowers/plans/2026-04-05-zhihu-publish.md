# Zhihu One-Click Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-click article publishing to Zhihu from the CMS topic detail page, using server-side Playwright browser automation.

**Architecture:** A core `lib/zhihu-publisher.ts` module handles Playwright automation (launch browser, load cookies, fill content, click publish). Two API routes expose publish and login endpoints. The topic detail page and preview dialog get publish buttons that call the API and update task status to `published`.

**Tech Stack:** playwright-core (browser automation), Next.js 16 API Routes, existing Shadcn/UI components, fs for Cookie persistence.

**Spec:** `docs/superpowers/specs/2026-04-05-zhihu-publish-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `lib/zhihu-publisher.ts` | Core Playwright automation: publishToZhihu, loginToZhihu, Cookie load/save |
| Create | `app/api/publish/zhihu/route.ts` | Publish API: read article file, call publisher, return zhihu URL |
| Create | `app/api/publish/zhihu/login/route.ts` | Login API: launch visible browser for manual login, save cookies |
| Create | `components/cms/zhihu-login-dialog.tsx` | Login prompt Dialog with retry logic |
| Modify | `components/cms/topic-detail-client.tsx:403-415` | Add publish button for reviewed tasks |
| Modify | `components/cms/article-preview-dialog.tsx:63-69` | Add "发布到知乎" button |
| Modify | `.gitignore` | Add zhihu-cookies.json |

---

### Task 0: Install playwright-core and update .gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install playwright-core**

```bash
pnpm add playwright-core
```

This installs `playwright-core` (no bundled browsers — uses system-installed Chromium).

- [ ] **Step 2: Add Cookie file to .gitignore**

Append to `.gitignore`:

```
# Zhihu login cookies (sensitive)
config/data/zhihu-cookies.json
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: add playwright-core dependency and gitignore zhihu cookies"
```

---

### Task 1: Create zhihu-publisher.ts (core Playwright automation)

**Files:**
- Create: `lib/zhihu-publisher.ts`

- [ ] **Step 1: Create the publisher module**

Create `lib/zhihu-publisher.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/zhihu-publisher.ts
git commit -m "feat: add Playwright-based Zhihu publisher module"
```

---

### Task 2: Create publish API endpoint

**Files:**
- Create: `app/api/publish/zhihu/route.ts`

- [ ] **Step 1: Create the publish route**

Create `app/api/publish/zhihu/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { publishToZhihu, NeedLoginError } from "@/lib/zhihu-publisher";

export const dynamic = 'force-dynamic';

// Simple mutex to prevent concurrent publish operations
let isPublishing = false;

export async function POST(request: NextRequest) {
    if (isPublishing) {
        return NextResponse.json({ error: "另一个发布操作正在进行中，请稍后重试" }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { taskId, articleName } = body;

        if (!taskId || !articleName) {
            return NextResponse.json({ error: "缺少 taskId 或 articleName" }, { status: 400 });
        }

        // Sanitize task ID
        if (!/^[0-9a-fA-F-]+$/.test(taskId)) {
            return NextResponse.json({ error: "无效的任务 ID" }, { status: 400 });
        }

        // Read article content
        const filePath = path.join(process.cwd(), "content", "articles", `${taskId}.md`);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "文章文件不存在，请先生成文章" }, { status: 400 });
        }

        const markdownContent = fs.readFileSync(filePath, "utf-8");

        // Strip the first markdown heading (use as title if it exists)
        const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
        const title = articleName;
        const content = titleMatch
            ? markdownContent.replace(/^#\s+.+\n+/, '')
            : markdownContent;

        isPublishing = true;
        const result = await publishToZhihu(title, content);

        return NextResponse.json({
            success: true,
            zhihuUrl: result.zhihuUrl,
        });
    } catch (error: any) {
        if (error instanceof NeedLoginError) {
            return NextResponse.json({
                success: false,
                needLogin: true,
                message: "请先登录知乎",
            }, { status: 401 });
        }
        console.error("Zhihu Publish Error:", error);
        return NextResponse.json({ error: error.message || "发布失败" }, { status: 500 });
    } finally {
        isPublishing = false;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/publish/zhihu/route.ts
git commit -m "feat: add Zhihu publish API endpoint"
```

---

### Task 3: Create login API endpoint

**Files:**
- Create: `app/api/publish/zhihu/login/route.ts`

- [ ] **Step 1: Create the login route**

Create `app/api/publish/zhihu/login/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { loginToZhihu } from "@/lib/zhihu-publisher";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await loginToZhihu();
        return NextResponse.json({
            success: true,
            message: "登录成功，Cookie 已保存",
        });
    } catch (error: any) {
        console.error("Zhihu Login Error:", error);
        return NextResponse.json({
            error: error.message || "登录失败",
        }, { status: 500 });
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/publish/zhihu/login/route.ts
git commit -m "feat: add Zhihu login API endpoint"
```

---

### Task 4: Create ZhihuLoginDialog

**Files:**
- Create: `components/cms/zhihu-login-dialog.tsx`

- [ ] **Step 1: Create the login dialog component**

Create `components/cms/zhihu-login-dialog.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface ZhihuLoginDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoginSuccess: () => void;
}

export function ZhihuLoginDialog({ open, onOpenChange, onLoginSuccess }: ZhihuLoginDialogProps) {
    const [logging, setLogging] = useState(false);

    const handleLogin = async () => {
        setLogging(true);
        try {
            const res = await fetch('/api/publish/zhihu/login', { method: 'POST' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: '登录失败' }));
                throw new Error(err.error || '登录失败');
            }
            toast.success('知乎登录成功');
            onOpenChange(false);
            onLoginSuccess();
        } catch (error: any) {
            toast.error(error.message || '登录失败，请重试');
        } finally {
            setLogging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!logging) onOpenChange(v); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        登录知乎
                    </DialogTitle>
                    <DialogDescription>
                        发布文章需要知乎登录态。点击下方按钮将打开浏览器窗口，请在窗口中完成知乎登录。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={logging}>取消</Button>
                    <Button onClick={handleLogin} disabled={logging} className="gap-1">
                        {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        {logging ? '等待登录中...' : '打开登录窗口'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cms/zhihu-login-dialog.tsx
git commit -m "feat: add Zhihu login dialog component"
```

---

### Task 5: Add publish button to topic-detail-client.tsx

**Files:**
- Modify: `components/cms/topic-detail-client.tsx`

- [ ] **Step 1: Add imports**

At line 30 (the lucide-react import), add `Upload` to the import:

```typescript
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Sparkles, Upload } from 'lucide-react';
```

After line 35 (the Checkbox import), add:

```typescript
import { ZhihuLoginDialog } from '@/components/cms/zhihu-login-dialog';
```

- [ ] **Step 2: Add state variables**

After the existing article generation state variables (around line 93, after `previewArticleName`), add:

```typescript
// Zhihu publish state
const [publishingTaskId, setPublishingTaskId] = useState<string | null>(null);
const [loginDialogOpen, setLoginDialogOpen] = useState(false);
const [pendingPublishTask, setPendingPublishTask] = useState<{ id: string; articleName: string } | null>(null);
```

- [ ] **Step 3: Add publish handler**

After the `selectedBatchTasks` declaration (around line 271), add:

```typescript
// --- Zhihu publish handlers ---
const handlePublishToZhihu = async (task: DetailItem) => {
    if (!topic) return;
    setPublishingTaskId(task.id);

    try {
        const res = await fetch('/api/publish/zhihu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.id, articleName: task.articleName }),
        });

        const data = await res.json();

        if (data.needLogin) {
            setPendingPublishTask({ id: task.id, articleName: task.articleName });
            setLoginDialogOpen(true);
            return;
        }

        if (!res.ok) {
            throw new Error(data.error || '发布失败');
        }

        // Update task status to published with zhihu URL
        const updatedItems = topic.detailItems.map(item =>
            item.id === task.id
                ? { ...item, status: 'published', contentUrl: data.zhihuUrl }
                : item
        );
        await saveTopic(updatedItems);
        toast.success('文章已发布到知乎');
    } catch (error: any) {
        toast.error(error.message || '发布失败');
    } finally {
        setPublishingTaskId(null);
    }
};

const handleLoginSuccess = () => {
    // After login, retry the pending publish
    if (pendingPublishTask) {
        const task = topic?.detailItems.find(i => i.id === pendingPublishTask.id);
        if (task) handlePublishToZhihu(task);
        setPendingPublishTask(null);
    }
};
```

- [ ] **Step 4: Add publish button to table rows**

In the table row actions area (around line 405), after the existing `{item.status === 'draft' && (` Sparkles button block and before the Pencil button, add:

```tsx
{item.status === 'reviewed' && (
    <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        title="发布到知乎"
        disabled={publishingTaskId === item.id}
        onClick={() => handlePublishToZhihu(item)}
    >
        {publishingTaskId === item.id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />}
    </Button>
)}
```

Also add `Loader2` to the lucide-react import at line 30:

```typescript
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Sparkles, Upload, Loader2 } from 'lucide-react';
```

- [ ] **Step 5: Add ZhihuLoginDialog at end of JSX**

After the ArticlePreviewDialog closing tag (around line 536), before the final `</div>`, add:

```tsx
{/* Zhihu Login Dialog */}
<ZhihuLoginDialog
    open={loginDialogOpen}
    onOpenChange={setLoginDialogOpen}
    onLoginSuccess={handleLoginSuccess}
/>
```

- [ ] **Step 6: Commit**

```bash
git add components/cms/topic-detail-client.tsx
git commit -m "feat: add Zhihu publish button to topic detail page"
```

---

### Task 6: Add publish button to ArticlePreviewDialog

**Files:**
- Modify: `components/cms/article-preview-dialog.tsx`

- [ ] **Step 1: Update the component props and add publish logic**

The component needs two new props: `taskStatus` and `onPublish`. Update the file:

Replace the interface and component signature:

```tsx
interface ArticlePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string | null;
    articleName: string;
    taskStatus?: string;
    onRegenerate: () => void;
    onPublish?: () => void;
}

export function ArticlePreviewDialog({ open, onOpenChange, taskId, articleName, taskStatus, onRegenerate, onPublish }: ArticlePreviewDialogProps) {
```

- [ ] **Step 2: Add publish button to DialogFooter**

Replace the existing DialogFooter:

```tsx
<DialogFooter className="px-6 py-4 border-t">
    <Button variant="outline" onClick={onRegenerate} className="gap-1">
        <RotateCcw className="h-4 w-4" />
        重新生成
    </Button>
    {taskStatus === 'reviewed' && onPublish && (
        <Button variant="outline" onClick={onPublish} className="gap-1">
            <Upload className="h-4 w-4" />
            发布到知乎
        </Button>
    )}
    <Button onClick={() => onOpenChange(false)}>关闭</Button>
</DialogFooter>
```

Also add `Upload` to the lucide-react import:

```typescript
import { Loader2, RotateCcw, Upload } from 'lucide-react';
```

- [ ] **Step 3: Update the caller in topic-detail-client.tsx**

In `topic-detail-client.tsx`, update the ArticlePreviewDialog usage (around line 524) to pass the new props:

```tsx
<ArticlePreviewDialog
    open={previewDialogOpen}
    onOpenChange={setPreviewDialogOpen}
    taskId={previewTaskId}
    articleName={previewArticleName}
    taskStatus={topic?.detailItems.find(i => i.id === previewTaskId)?.status}
    onRegenerate={() => {
        setPreviewDialogOpen(false);
        if (previewTaskId) {
            const task = topic?.detailItems.find(i => i.id === previewTaskId);
            if (task) openGenerateDialog(task);
        }
    }}
    onPublish={() => {
        setPreviewDialogOpen(false);
        if (previewTaskId) {
            const task = topic?.detailItems.find(i => i.id === previewTaskId);
            if (task) handlePublishToZhihu(task);
        }
    }}
/>
```

- [ ] **Step 4: Commit**

```bash
git add components/cms/article-preview-dialog.tsx components/cms/topic-detail-client.tsx
git commit -m "feat: add publish-to-zhihu button in article preview dialog"
```

---

### Task 7: Build verification and manual testing

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Manual testing checklist**

Start the dev server (`pnpm dev`) and verify:

1. Navigate to topic detail page (`/portal/cms/topics/a1b2c3d4-e5f6-7890-abcd-ef1234567801`)
2. Verify `reviewed` status tasks show an Upload (发布) button in the actions column
3. `draft` status tasks should NOT show the publish button
4. `published` status tasks should NOT show the publish button
5. Click publish on a reviewed task → if no cookies, ZhihuLoginDialog appears
6. Click "打开登录窗口" → browser window opens to zhihu.com/signin
7. Complete login → dialog closes, publish retries automatically
8. Verify article appears on Zhihu → task status updates to `published`, contentUrl shows zhihu link
9. Open preview dialog for a reviewed task → "发布到知乎" button visible
10. Open preview dialog for a published task → "发布到知乎" button NOT visible

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
