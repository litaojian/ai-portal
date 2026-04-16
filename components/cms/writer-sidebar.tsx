"use client";

import * as React from "react";
import { 
    IconSettings, 
    IconPencil, 
    IconTarget, 
    IconLanguage, 
    IconAdjustmentsHorizontal,
    IconClockEdit
} from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export interface WriterConfig {
    type: string;
    style: string;
    tone: string;
    language: string;
    length: number[];
    model: string;
    useKeywords: boolean;
    temperature: number[];
}

interface WriterSidebarProps {
    config: WriterConfig;
    onChange: (config: WriterConfig) => void;
}

export function WriterSidebar({ config, onChange }: WriterSidebarProps) {
    const handleUpdate = (key: keyof WriterConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="flex flex-col gap-6 p-1">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <IconSettings size={18} />
                </div>
                <h3 className="font-semibold text-sm">创作配置</h3>
            </div>

            {/* Content Type */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IconPencil size={14} />
                    <span>内容类型</span>
                </div>
                <Select value={config.type} onValueChange={(v) => handleUpdate("type", v)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="article">深度文章</SelectItem>
                        <SelectItem value="social">社交媒体帖子</SelectItem>
                        <SelectItem value="ad">广告文案</SelectItem>
                        <SelectItem value="email">商业邮件</SelectItem>
                        <SelectItem value="script">视频脚本</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tone & Style */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IconTarget size={14} />
                    <span>写作语调</span>
                </div>
                <Select value={config.tone} onValueChange={(v) => handleUpdate("tone", v)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择语调" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="professional">专业严谨</SelectItem>
                        <SelectItem value="casual">轻松幽默</SelectItem>
                        <SelectItem value="creative">富有创意</SelectItem>
                        <SelectItem value="empathetic">富有同理心</SelectItem>
                        <SelectItem value="authoritative">权威自信</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Language */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IconLanguage size={14} />
                    <span>输出语言</span>
                </div>
                <Select value={config.language} onValueChange={(v) => handleUpdate("language", v)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator className="my-2" />

            {/* Advanced Settings */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IconAdjustmentsHorizontal size={14} />
                    <span>高级参数</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">创作模型</Label>
                    </div>
                    <Select value={config.model} onValueChange={(v: string) => handleUpdate("model", v)}>
                        <SelectTrigger className="h-7 text-[11px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o (推荐)</SelectItem>
                            <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                            <SelectItem value="gemini-1-5-pro">Gemini 1.5 Pro</SelectItem>
                            <SelectItem value="deepseek-v3">DeepSeek V3</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">发散度 (Temp)</Label>
                        <span className="text-[10px] bg-muted px-1 rounded">{config.temperature[0]}</span>
                    </div>
                    <Slider 
                        value={config.temperature} 
                        onValueChange={(v: number[]) => handleUpdate("temperature", v)}
                        max={1} 
                        step={0.1}
                        className="py-1"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">期望长度 (千字)</Label>
                        <span className="text-[10px] bg-muted px-1 rounded">{config.length[0]}k</span>
                    </div>
                    <Slider 
                        value={config.length} 
                        onValueChange={(v: number[]) => handleUpdate("length", v)}
                        min={0.2}
                        max={5} 
                        step={0.1}
                        className="py-1"
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <IconClockEdit size={14} className="text-muted-foreground" />
                        <Label className="text-[11px] text-muted-foreground">启用关键词增强</Label>
                    </div>
                    <Switch 
                        checked={config.useKeywords} 
                        onCheckedChange={(v: boolean) => handleUpdate("useKeywords", v)}
                        className="scale-75 origin-right"
                    />
                </div>
            </div>
        </div>
    );
}
