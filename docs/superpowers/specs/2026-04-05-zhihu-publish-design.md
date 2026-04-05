# 知乎一键发布功能设计文档

> 日期: 2026-04-05
> 状态: 设计完成，待实现
> 范围: 从专栏详情页一键发布已生成文章到知乎创作中心

## 1. 概述

### 目标

在现有 CMS 文章生成功能基础上，增加一键发布到知乎的能力。用户在专栏详情页点击"发布"按钮，系统通过服务端 Playwright 自动化操作知乎创作中心完成文章发布。

### 背景

- 文章生成功能已实现，生成的 Markdown 文件保存在 `content/articles/{task-id}.md`
- 知乎没有官方文章发布 API
- 知乎创作中心（`zhuanlan.zhihu.com/write`）支持 Markdown 语法输入模式
- 当前环境已有 Playwright 可用

### 范围限定

- **包含**：知乎发布 API、Playwright 自动化脚本、Cookie 管理、登录引导、前端发布按钮
- **不包含**：其他平台发布（公众号、小红书等后续扩展）、批量发布、定时发布

---

## 2. 架构

### 数据流

```
用户点击"发布到知乎"
    ↓
POST /api/publish/zhihu
    ↓ 读取 content/articles/{task-id}.md
服务端 Playwright（playwright-core + 系统 Chromium）
    ↓ 加载 Cookie → 打开 zhuanlan.zhihu.com/write
    ↓ 填入标题 + Markdown 正文 → 点击发布
    ↓ 获取发布后的知乎文章 URL
返回结果 → 更新任务状态为 published + contentUrl 为知乎链接
```

### Cookie 管理

- Cookie 保存在 `config/data/zhihu-cookies.json`（加入 .gitignore）
- 发布时加载 Cookie，发布后保存最新 Cookie（保持登录态新鲜）
- Cookie 不存在或过期（检测到跳转登录页）→ 返回 `needLogin: true`
- 前端收到后引导用户通过登录 API 打开浏览器窗口手动登录

---

## 3. API 设计

### `POST /api/publish/zhihu`

发布文章到知乎。

**请求体：**

```typescript
{
  taskId: string;        // 任务 ID（读取对应的 .md 文件）
  articleName: string;   // 文章标题
}
```

**成功响应：**

```typescript
{
  success: true;
  zhihuUrl: string;      // 知乎文章链接
}
```

**需要登录响应：**

```typescript
{
  success: false;
  needLogin: true;
  message: "请先登录知乎";
}
```

**错误响应：**

```typescript
{
  error: string;
}
```

### `POST /api/publish/zhihu/login`

启动浏览器窗口让用户手动登录知乎。

**请求体：** 无

**响应体：**

```typescript
{
  success: true;
  message: "登录成功，Cookie 已保存";
}
```

超时 5 分钟未登录返回错误。

---

## 4. Playwright 自动化脚本

### 核心模块：`lib/zhihu-publisher.ts`

封装三个核心函数：

#### `publishToZhihu(title: string, markdownContent: string): Promise<{ zhihuUrl: string }>`

Playwright 操作步骤：

1. 启动 Chromium（`headless: true`，使用系统已安装的浏览器）
2. 创建 BrowserContext，加载已保存的 Cookie
3. 导航到 `https://zhuanlan.zhihu.com/write`
4. 检测是否跳转到登录页（URL 包含 `signin`）→ 如果是，抛出 `NeedLoginError`
5. 等待编辑器加载：等待标题输入框出现（placeholder "请输入标题"）
6. 点击标题输入框 → 输入文章标题
7. 点击正文输入框 → 粘贴 Markdown 内容（使用 keyboard 输入，知乎编辑器已开启 Markdown 模式）
8. 等待"发布"按钮变为可点击状态（`button:has-text("发布"):not([disabled])`）
9. 点击"发布"按钮
10. 等待页面跳转或发布成功提示 → 获取当前页面 URL 作为知乎文章链接
11. 保存最新 Cookie 到文件
12. 关闭浏览器
13. 返回 `{ zhihuUrl }`

超时：整个发布流程 60 秒。

#### `loginToZhihu(): Promise<void>`

1. 启动 Chromium（`headless: false`，显示窗口让用户操作）
2. 导航到 `https://www.zhihu.com/signin`
3. 轮询等待：每 2 秒检查 URL 是否离开了 signin 页面
4. 检测到登录成功（URL 变为 zhihu.com 首页或其他非登录页）
5. 保存 Cookie 到 `config/data/zhihu-cookies.json`
6. 关闭浏览器

超时：5 分钟。

#### Cookie 工具函数

```typescript
// 保存 Cookie
async function saveCookies(context: BrowserContext): Promise<void>
// 加载 Cookie（返回 null 如果文件不存在）
async function loadCookies(): Promise<Cookie[] | null>
```

Cookie 文件路径：`config/data/zhihu-cookies.json`

### 知乎页面选择器（基于实际页面探索）

| 元素 | 选择器策略 |
|------|-----------|
| 标题输入框 | `input[placeholder*="请输入标题"]` 或 role textbox with placeholder |
| 正文编辑器 | 标题输入框的下一个 textbox 元素 |
| 发布按钮 | `button:has-text("发布"):not([disabled])` |
| 登录页检测 | URL 包含 `signin` |

### Markdown 内容输入策略

知乎编辑器已开启 Markdown 语法输入模式。直接将 Markdown 文本通过 `page.keyboard.type()` 或 `clipboard paste` 输入到正文编辑器中，编辑器会自动解析 Markdown 格式。

对于长文本，使用剪贴板粘贴（`page.evaluate` 写入 clipboard + Ctrl+V）比逐字输入更快更可靠。

---

## 5. 前端交互设计

### 5.1 任务行发布按钮

- `reviewed` 状态的任务行，操作列增加「发布」按钮（Upload 图标，与 ✨生成/编辑/删除 并列）
- 点击后直接调用 `POST /api/publish/zhihu`，按钮变为加载态
- 成功：任务状态更新为 `published`，contentUrl 更新为知乎链接，toast 成功
- 失败：toast 错误提示
- 返回 `needLogin`：弹出 ZhihuLoginDialog

### 5.2 预览 Dialog 发布按钮

- ArticlePreviewDialog 底部增加「发布到知乎」按钮
- 仅当任务状态为 `reviewed` 时显示（已发布的不显示）
- 点击行为与任务行发布按钮一致

### 5.3 ZhihuLoginDialog（登录引导）

当发布返回 `needLogin` 时弹出：

- 标题："登录知乎"
- 说明文字："发布文章需要知乎登录态。点击下方按钮将打开浏览器窗口，请在窗口中完成知乎登录。"
- 「打开登录窗口」按钮 → 调用 `POST /api/publish/zhihu/login`
- 按钮变为"等待登录中..."加载态
- 登录成功后 → toast 提示 "登录成功" → 关闭 Dialog → 自动重试发布
- 超时或失败 → toast 错误提示

---

## 6. 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `lib/zhihu-publisher.ts` | Playwright 知乎发布核心逻辑（publishToZhihu, loginToZhihu, Cookie 管理） |
| `app/api/publish/zhihu/route.ts` | 知乎发布 API 端点 |
| `app/api/publish/zhihu/login/route.ts` | 知乎登录 API 端点 |
| `components/cms/zhihu-login-dialog.tsx` | 登录引导 Dialog |

### 修改文件

| 文件 | 变更内容 |
|------|---------|
| `components/cms/topic-detail-client.tsx` | reviewed 状态任务行增加"发布"按钮，集成 ZhihuLoginDialog |
| `components/cms/article-preview-dialog.tsx` | 增加"发布到知乎"按钮（reviewed 状态时显示） |
| `.gitignore` | 添加 `config/data/zhihu-cookies.json` |
| `package.json` | 添加 `playwright-core` 依赖 |

---

## 7. 技术约束

| 约束 | 说明 |
|------|------|
| Playwright | 使用 `playwright-core`（不含浏览器下载），复用系统已安装的 Chromium |
| Cookie 存储 | `config/data/zhihu-cookies.json`，加入 .gitignore |
| 发布超时 | 60 秒（AbortController 或 Playwright timeout） |
| 登录超时 | 5 分钟 |
| 并发限制 | 同一时间只允许一个发布操作（避免浏览器实例冲突） |
| Markdown 输入 | 使用剪贴板粘贴方式输入长文本，知乎编辑器自动解析 Markdown |
| 浏览器模式 | 登录：headless: false（需要用户交互）；发布：headless: true |

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|---------|
| Cookie 不存在 | 返回 `needLogin: true` |
| Cookie 过期（跳转登录页） | 返回 `needLogin: true` |
| 文章文件不存在 | 返回 400 错误 |
| Playwright 启动失败 | 返回 500 + 具体错误信息 |
| 发布超时 | 返回 504 超时错误 |
| 知乎页面结构变化 | 返回 500 + "页面结构异常" |
| 发布按钮始终 disabled | 等待超时后返回错误 |

---

## 9. 后续迭代

本次不实现，后续可扩展：

- **批量发布**：选中多篇 reviewed 文章批量发布到知乎
- **定时发布**：设置发布时间，到时自动发布
- **多平台发布**：扩展到公众号、小红书等平台（复用相同架构，新增平台 publisher）
- **发布状态追踪**：记录发布时间、平台、链接等元数据
- **Cookie 自动刷新**：定期访问知乎保持 Cookie 活跃
