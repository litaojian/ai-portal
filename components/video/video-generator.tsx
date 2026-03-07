"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video, Play, FastForward, CheckCircle2, Download } from "lucide-react";

// Mock from api-cases.json or hardcoded for simplicity
const VIDEO_MODELS = [
    { id: "veo-3.1-generate-preview", label: "Veo 3.1" },
    { id: "kling-1-6", label: "Kling 1.6" },
    { id: "sora-2", label: "Sora 2" },
    { id: "runway-gen3", label: "Gen-3 Alpha" },
];

export default function VideoGenerator() {
    const [model, setModel] = useState("veo-3.1-generate-preview");
    const [prompt, setPrompt] = useState("一只小马在草原上奔跑，草原上绿草如茵，远处有几只羊，天空湛蓝，阳光明媚。");
    const [size, setSize] = useState("1280x720");
    const [duration, setDuration] = useState("4");

    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "queued" | "in_progress" | "completed" | "failed">("idle");
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;

        setStatus("idle");
        setProgress(0);
        setErrorMsg("");
        setTaskId(null);

        try {
            setStatus("queued");
            const res = await fetch("/api/llm/video/generations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    prompt,
                    size,
                    duration: parseInt(duration, 10),
                }),
            });

            const rawData = await res.json();
            if (!res.ok) throw new Error(rawData.error?.message || rawData.error || rawData.message || "Generation request failed");

            // Extract the correct taskId handling potential wrapper formats
            const newTaskId = rawData.data?.task_id || rawData.task_id || rawData.data?.data?.id || rawData.data?.id || rawData.id;

            if (!newTaskId) throw new Error("API respond with unknown format, no task_id found");

            setTaskId(newTaskId);
            setStatus("queued");

            // Start polling
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = setInterval(() => pollStatus(newTaskId), 3000);

        } catch (err: any) {
            console.error(err);
            setStatus("failed");
            setErrorMsg(err.message);
        }
    };

    const pollStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/llm/video/generations/${id}?_t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                }
            });
            if (!res.ok) {
                // If 404 or something, maybe just retry next time, or fail. Wait and see.
                return;
            }

            const rawData = await res.json();

            // Handle wrapped responses from new-api (root, data, or data.data)
            const rootData = rawData.data || rawData;
            const innerData = rootData.data || rootData;

            // Normalize status strings (new-api may return 'SUCCESS' uppercase instead of 'completed')
            let currentStatus = innerData.status || rootData.status;
            if (currentStatus === "SUCCESS" || currentStatus === "SUCCESS") currentStatus = "completed";
            if (currentStatus === "FAIL" || currentStatus === "FAILURE") currentStatus = "failed";

            if (currentStatus) {
                setStatus(currentStatus.toLowerCase());
            }

            // Normalize progress (could be an integer or string like "100%")
            let currentProgress = innerData.progress ?? rootData.progress;
            if (typeof currentProgress === 'string') {
                currentProgress = parseInt(currentProgress.replace('%', ''), 10);
            }
            if (currentProgress !== undefined && !isNaN(currentProgress)) {
                setProgress(currentProgress);
            }

            if (currentStatus?.toLowerCase() === "completed") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setProgress(100);
            } else if (currentStatus?.toLowerCase() === "failed") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setErrorMsg(innerData.error?.message || innerData.fail_reason || rootData.fail_reason || "Task failed on server");
            }
        } catch (err) {
            console.error("Poll error:", err);
        }
    };

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* 左侧控制面板 */}
            <Card className="md:col-span-1 shadow-sm h-fit">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        视频生成配置
                    </CardTitle>
                    <CardDescription>
                        支持 Veo 3.1 等多模态大模型的视频生成
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>选择模型</Label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择生成模型" />
                            </SelectTrigger>
                            <SelectContent>
                                {VIDEO_MODELS.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>提示词 (Prompt)</Label>
                        <Textarea
                            className="h-32 resize-none"
                            placeholder="描述你想要的视频画面，主体、光影、镜头运动..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>分辨率 (宽x高)</Label>
                            <Select value={size} onValueChange={setSize}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1920x1080">16:9 (1080p)</SelectItem>
                                    <SelectItem value="1080x1920">9:16 (竖屏)</SelectItem>
                                    <SelectItem value="1280x720">16:9 (720p)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>时长</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4 秒</SelectItem>
                                    <SelectItem value="5">5 秒</SelectItem>
                                    <SelectItem value="8">8 秒 (Veo)</SelectItem>
                                    <SelectItem value="10">10 秒</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleGenerate}
                        disabled={status === "queued" || status === "in_progress" || !prompt}
                    >
                        {(status === "queued" || status === "in_progress") ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                生成中 ({progress}%)
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                开始生成
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* 右侧预览区 */}
            <Card className="md:col-span-2 shadow-sm min-h-[500px] flex flex-col">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>实时预览区</span>
                        {status === "completed" && (
                            <a href={`/api/llm/videos/${taskId}/content`} download={`video-${taskId}.mp4`}>
                                <Button variant="outline" size="sm" type="button">
                                    <Download className="w-4 h-4 mr-2" />
                                    保存视频
                                </Button>
                            </a>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/10 relative">

                    {status === "idle" && (
                        <div className="text-center text-muted-foreground flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Video className="w-8 h-8 opacity-50" />
                            </div>
                            <p>在左侧配置参数并点击生成，在此处预览视频结果</p>
                        </div>
                    )}

                    {(status === "queued" || status === "in_progress") && (
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-primary flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {status === "queued" ? "排队中..." : "渲染中..."}
                                </span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.max(5, progress)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-4">
                                大模型视频生成通常需要 2-5 分钟，请耐心等待
                            </p>
                        </div>
                    )}

                    {status === "failed" && (
                        <div className="text-center text-destructive flex flex-col items-center max-w-md">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <FastForward className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">生成失败</h3>
                            <p className="text-sm opacity-80">{errorMsg}</p>
                        </div>
                    )}

                    {status === "completed" && taskId && (
                        <div className="w-full flex-1 flex flex-col">
                            <div className="rounded-lg overflow-hidden border shadow-sm aspect-video bg-black flex items-center justify-center relative w-full max-h-[600px] mb-4">
                                <video
                                    src={`/api/llm/videos/${taskId}/content`}
                                    className="w-full max-h-full object-contain"
                                    controls
                                    autoPlay
                                    loop
                                    preload="metadata"
                                >
                                    您的浏览器不支持 HTML5 视频播放。
                                </video>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                生成成功 · 任务 ID: {taskId}
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
