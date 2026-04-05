import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

const PLATFORM_SPECS: Record<string, {
    minWords: number;
    maxWords: number;
    tone: string;
    description: string;
}> = {
    zhihu: { minWords: 800, maxWords: 1500, tone: "专业但接地气", description: "知乎专栏文章" },
    wechat_mp: { minWords: 2000, maxWords: 3000, tone: "专业深度", description: "公众号长文" },
    xiaohongshu: { minWords: 300, maxWords: 500, tone: "轻松实用", description: "小红书笔记" },
    generic: { minWords: 800, maxWords: 2000, tone: "专业", description: "通用文章" },
};

function buildSystemPrompt(topic: {
    topicName: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
}, platform: string) {
    const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.generic;
    return `你是一位资深技术自媒体作者，专注于 B2B 和 AI 领域。你正在为以下专栏撰写文章：

【专栏名称】${topic.topicName}
【IP 定位】${topic.ipPositioning}
【目标客群】${topic.targetAudience}
【核心标签】${topic.coreLabels}
【内容矩阵】${topic.contentMatrix}

写作要求：
- 目标平台：${spec.description}
- 篇幅：${spec.minWords}-${spec.maxWords} 字
- 语气：${spec.tone}，避免学术化堆砌
- 输出格式：标准 Markdown，包含一级标题、二级小标题、正文段落
- 每个小节 200-300 字，逻辑清晰，有实际案例或数据支撑
- 开头要有吸引力（提出问题或引出痛点），结尾有行动号召或思考引导
- 禁止使用 AI 味过重的套话（如"在当今数字化时代"、"综上所述"等）
- 禁止虚构数据或引用不存在的来源`;
}

function buildUserPrompt(articleName: string, extraNotes?: string) {
    let prompt = `请根据以下主题撰写一篇文章：\n\n【文章主题】${articleName}`;
    if (extraNotes) {
        prompt += `\n\n补充说明：${extraNotes}`;
    }
    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task, topic, config } = body;

        if (!task?.id || !task?.articleName) {
            return NextResponse.json({ error: "缺少任务信息" }, { status: 400 });
        }
        if (!topic?.topicName) {
            return NextResponse.json({ error: "缺少专栏信息" }, { status: 400 });
        }

        // Sanitize task ID
        if (!/^[0-9a-fA-F-]+$/.test(task.id)) {
            return NextResponse.json({ error: "无效的任务 ID" }, { status: 400 });
        }

        const platform = config?.platform || 'zhihu';
        const model = config?.model || 'gpt-4.1';
        const extraNotes = config?.extraNotes || '';

        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl || !apiKey) {
            return NextResponse.json({ error: "服务端配置缺失：NEW_API_URL 或 NEW_API_KEY" }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/chat/completions`;
        const systemPrompt = buildSystemPrompt(topic, platform);
        const userPrompt = buildUserPrompt(task.articleName, extraNotes);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);

        const llmRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!llmRes.ok) {
            const errorData = await llmRes.json().catch(() => null);
            const errorMsg = errorData?.error?.message || errorData?.error || '调用 LLM 失败';
            return NextResponse.json({ error: errorMsg }, { status: llmRes.status });
        }

        const llmData = await llmRes.json();
        const content = llmData.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: "LLM 返回内容为空" }, { status: 500 });
        }

        // Save to file
        const articlesDir = path.join(process.cwd(), "content", "articles");
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }
        const filePath = path.join(articlesDir, `${task.id}.md`);
        fs.writeFileSync(filePath, content, "utf-8");

        const wordCount = content.replace(/\s+/g, '').length;
        const summary = content.replace(/^#.*\n+/, '').replace(/\s+/g, ' ').trim().slice(0, 200);

        return NextResponse.json({
            success: true,
            articlePath: `content/articles/${task.id}.md`,
            title: task.articleName,
            wordCount,
            summary,
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: "LLM 调用超时（120秒），请重试" }, { status: 504 });
        }
        console.error("Article Generate Error:", error);
        return NextResponse.json({ error: "内部服务器错误" }, { status: 500 });
    }
}
