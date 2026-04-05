import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `你是一位专业的内容策划专家。根据用户提供的专栏信息，生成一份详细的内容规划。

你必须以 JSON 格式回复，包含两个字段：
1. "planDocument": Markdown 格式的规划文档，包含每篇文章的主题、类型、摘要和发布时间安排
2. "tasks": 任务数组，每个任务包含 "articleName"（文章标题）和 "dueDate"（截止日期，YYYY-MM-DD 格式）

重要规则：
- 任务的 dueDate 必须在用户指定的日期范围内
- 按照用户指定的每周发布频率均匀分配任务
- 不要生成与"已完成文章"列表中相同或高度相似的主题`;

function buildUserPrompt(params: {
    topic: {
        topicName: string;
        topicDesc: string;
        ipPositioning: string;
        targetAudience: string;
        coreLabels: string;
        contentMatrix: string;
    };
    startDate: string;
    endDate: string;
    frequency: number;
    completedArticles: string[];
    extraNotes: string;
}) {
    const { topic, startDate, endDate, frequency, completedArticles, extraNotes } = params;

    let prompt = `请为以下专栏生成内容规划：

【专栏名称】${topic.topicName}
【专栏描述】${topic.topicDesc}
【IP 定位】${topic.ipPositioning}
【目标客群】${topic.targetAudience}
【核心标签】${topic.coreLabels}
【内容矩阵】${topic.contentMatrix}

要求：
- 时间范围：${startDate} 至 ${endDate}
- 发布频率：每周 ${frequency} 篇
- 根据时间范围和频率自动计算总篇数，均匀分布发布日期`;

    if (completedArticles.length > 0) {
        prompt += `\n\n以下是已完成的文章，请勿生成重复或高度相似的主题：\n`;
        completedArticles.forEach((name, i) => {
            prompt += `${i + 1}. ${name}\n`;
        });
    }

    if (extraNotes) {
        prompt += `\n补充说明：${extraNotes}`;
    }

    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { topic, startDate, endDate, frequency, model, completedArticles, extraNotes } = body;

        if (!topic?.topicName) {
            return NextResponse.json({ error: "缺少专栏信息" }, { status: 400 });
        }
        if (!startDate || !endDate) {
            return NextResponse.json({ error: "缺少时间范围" }, { status: 400 });
        }

        const baseUrl = process.env.NEW_API_URL?.replace(/\/+$/, '') || '';
        const apiKey = process.env.NEW_API_KEY || '';

        if (!baseUrl || !apiKey) {
            return NextResponse.json({ error: "服务端配置缺失：NEW_API_URL 或 NEW_API_KEY_GPT" }, { status: 500 });
        }

        const targetUrl = `${baseUrl}/v1/chat/completions`;

        const userPrompt = buildUserPrompt({
            topic,
            startDate,
            endDate,
            frequency: frequency || 2,
            completedArticles: completedArticles || [],
            extraNotes: extraNotes || '',
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const llmRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || 'gpt-4.1',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
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

        const parsed = JSON.parse(content);

        if (!parsed.planDocument || !Array.isArray(parsed.tasks)) {
            return NextResponse.json({ error: "LLM 返回格式不符合预期" }, { status: 500 });
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: "LLM 调用超时，请重试" }, { status: 504 });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "LLM 返回了无效的 JSON 格式" }, { status: 500 });
        }
        console.error("Topic Planning Error:", error);
        return NextResponse.json({ error: "内部服务器错误" }, { status: 500 });
    }
}
