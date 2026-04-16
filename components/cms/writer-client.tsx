"use client";

import * as React from "react";
import { useState, useTransition, useEffect } from "react";
import { 
    IconBulb, 
    IconListDetails, 
    IconFileText, 
    IconArrowRight, 
    IconLoader2, 
    IconHistory,
    IconDeviceFloppy,
    IconSparkles,
    IconEdit,
    IconLayoutGrid,
    IconCalendarStats,
    IconUserCheck,
    IconChevronRight,
    IconCircleCheckFilled,
    IconAlertCircle,
    IconCheck
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { WriterSidebar, WriterConfig } from "./writer-sidebar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Types ---
type Step = "column" | "plan" | "outline" | "content" | "audit";

interface Topic {
    id: string;
    topicName: string;
    topicDesc: string;
    ipPositioning: string;
    targetAudience: string;
    coreLabels: string;
    contentMatrix: string;
}

interface PlanTask {
    id: string;
    title: string;
    type: string;
    suggestedDate: string;
    keywords: string[];
    isCompleted?: boolean;
}

interface OutlineItem {
    id: string;
    title: string;
    description?: string;
}

// --- API Fetching ---
const fetchTopics = async () => {
    const res = await fetch("/api/rest/cms/topics");
    const json = await res.json();
    return json.data || [];
};

// --- Mock Generation Functions ---
const mockGeneratePlan = async (topic: Topic): Promise<PlanTask[]> => {
    await new Promise(r => setTimeout(r, 2000));
    return [
        { id: "p1", title: `${topic.topicName}：大模型的国产化替代与选择`, type: "深度分析", suggestedDate: "2026-04-05", keywords: ["国产大模型", "LLM", "DeepSeek"] },
        { id: "p2", title: "如何利用 AI 自动化处理日常周报", type: "应用测评", suggestedDate: "2026-04-12", keywords: ["自动化", "办公效率", "提示词"] },
        { id: "p3", title: "开发者必看：2026 年 IDE 插件的新趋势", type: "行业简评", suggestedDate: "2026-04-19", keywords: ["IDE", "编程辅助", "VSCode"] },
        { id: "p4", title: "AI 如何改变初创企业的技术栈选择", type: "深度分析", suggestedDate: "2026-04-26", keywords: ["初创企业", "技术选型", "成本控制"] }
    ];
};

const mockGenerateOutline = async (taskTitle: string, topic: Topic): Promise<OutlineItem[]> => {
    await new Promise(r => setTimeout(r, 1500));
    return [
        { id: "1", title: "引言", description: "结合当前专栏定位，引入话题背景" },
        { id: "2", title: "核心观点一：深度原理解析", description: "针对目标受众，提供专业的技术或逻辑分析" },
        { id: "3", title: "核心观点二：实战案例展示", description: "体现 IP 风格的实操建议或案例分享" },
        { id: "4", title: "结论与延伸思考", description: "基于内容矩阵要求的收尾" }
    ];
};

const mockGenerateContent = async (outline: OutlineItem[], topic: Topic): Promise<string> => {
    await new Promise(r => setTimeout(r, 3000));
    return `# 文稿预览\n\n[IP 定位: ${topic.ipPositioning}]\n\n[目标客群: ${topic.targetAudience}]\n\n正文内容：在数字化浪潮中...`;
};

export default function WriterClient() {
    // --- State ---
    const [step, setStep] = useState<Step>("column");
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");
    const [plan, setPlan] = useState<PlanTask[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [content, setContent] = useState("");
    const [auditStatus, setAuditStatus] = useState<"draft" | "pending" | "approved" | "rejected">("draft");
    
    const [config, setConfig] = useState<WriterConfig>({
        type: "article",
        style: "professional",
        tone: "professional",
        language: "zh-CN",
        length: [1],
        model: "gpt-4o",
        useKeywords: true,
        temperature: [0.7]
    });

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const load = async () => {
            const data = await fetchTopics();
            setTopics(data);
        };
        load();
    }, []);

    const currentTopic = topics.find(t => t.id === selectedTopicId);
    const currentTask = plan.find(p => p.id === selectedTaskId);

    // --- Handlers ---
    const handleStartPlanning = (topicId: string) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        setSelectedTopicId(topicId);
        startTransition(async () => {
            const result = await mockGeneratePlan(topic);
            setPlan(result);
            setStep("plan");
            toast.success(`已为 ${topic.topicName} 生成月度计划`);
        });
    };

    const handleSelectTask = (taskId: string) => {
        setSelectedTaskId(taskId);
        const task = plan.find(p => p.id === taskId);
        if (!task || !currentTopic) return;
        
        startTransition(async () => {
            const result = await mockGenerateOutline(task.title, currentTopic);
            setOutline(result);
            setStep("outline");
            toast.success("正在根据该任务生成大纲...");
        });
    };

    const handleGenerateContent = () => {
        if (!currentTopic) return;
        startTransition(async () => {
            const result = await mockGenerateContent(outline, currentTopic);
            setContent(result);
            setStep("content");
            toast.success("初稿已生成");
        });
    };

    const handleSubmitAudit = () => {
        setAuditStatus("pending");
        setStep("audit");
        toast.info("已提交人工审核");
    };

    const handleApprove = () => {
        setAuditStatus("approved");
        toast.success("审核通过，已标记为结稿");
    };

    const handleReject = () => {
        setAuditStatus("rejected");
        setStep("content");
        toast.warning("已驳回，请根据反馈修改");
    };

    const handleReset = () => {
        if (confirm("重置工作流？")) {
            setStep("column");
            setSelectedTopicId("");
            setPlan([]);
            setSelectedTaskId("");
            setOutline([]);
            setContent("");
            setAuditStatus("draft");
        }
    };

    // --- Sub-renderers ---
    const renderStepIndicator = () => {
        const steps: { key: Step; label: string; icon: any }[] = [
            { key: "column", label: "专栏定位", icon: IconLayoutGrid },
            { key: "plan", label: "月度计划", icon: IconCalendarStats },
            { key: "outline", label: "大纲策略", icon: IconListDetails },
            { key: "content", label: "生成草稿", icon: IconFileText },
            { key: "audit", label: "人工审核", icon: IconUserCheck }
        ];

        return (
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                {steps.map((s, idx) => {
                    const isActive = step === s.key;
                    const order = steps.findIndex(st => st.key === step);
                    const isCompleted = idx < order;
                    const Icon = s.icon;

                    return (
                        <React.Fragment key={s.key}>
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => isCompleted && setStep(s.key)}>
                                <div className={cn(
                                    "flex items-center justify-center size-9 rounded-full border-2 transition-all duration-300",
                                    isActive ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : 
                                    isCompleted ? "border-primary/40 bg-primary/5 text-primary" : "border-muted text-muted-foreground"
                                )}>
                                    {isCompleted ? <IconCircleCheckFilled size={18} /> : <Icon size={18} />}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider whitespace-nowrap",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "h-[1.5px] flex-1 min-w-[15px] mx-1 rounded-full transition-colors duration-300",
                                    isCompleted ? "bg-primary/40" : "bg-muted"
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-1 gap-6 min-h-0 animate-fade-in">
            {/* Sidebar Config (Context-aware) */}
            <aside className="w-80 shrink-0 bg-secondary/20 rounded-2xl border p-5 flex flex-col gap-6 overflow-y-auto">
                {step === "column" ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <IconBulb size={22} />
                            </div>
                            <h3 className="font-bold text-lg">专栏选择</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            请从以下专栏中选择一个作为本次创作的组织单元，AI 将基于该专栏的 IP 定位和内容矩阵生成计划。
                        </p>
                        <div className="space-y-3">
                            {topics.map(topic => (
                                <Card 
                                    key={topic.id} 
                                    className={cn(
                                        "cursor-pointer hover:border-primary/50 transition-all",
                                        selectedTopicId === topic.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""
                                    )}
                                    onClick={() => setSelectedTopicId(topic.id)}
                                >
                                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm font-bold">{topic.topicName}</CardTitle>
                                        <IconChevronRight size={16} className="text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-[11px] text-muted-foreground line-clamp-2">{topic.topicDesc}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {topic.coreLabels?.split(',').slice(0, 2).map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">{tag.trim()}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Button 
                            className="w-full h-11 gap-2 font-bold" 
                            disabled={!selectedTopicId || isPending}
                            onClick={() => handleStartPlanning(selectedTopicId)}
                        >
                            {isPending ? <IconLoader2 className="animate-spin" /> : <IconSparkles size={18} />}
                            制定月度计划
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">活跃专栏</h4>
                            <p className="text-sm font-bold truncate">{currentTopic?.topicName}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{currentTopic?.ipPositioning}</p>
                        </div>
                        <WriterSidebar config={config} onChange={setConfig} />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-muted-foreground hover:text-destructive text-xs"
                            onClick={handleReset}
                        >
                            <IconHistory size={14} className="mr-2" />
                            重置工作流
                        </Button>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-card rounded-2xl border shadow-xl shadow-primary/5 overflow-hidden relative">
                {/* Header Bar */}
                <header className="px-8 py-5 border-b bg-muted/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <IconFileText className="size-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground/90">
                                内容创作生产线
                                <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5 uppercase font-mono py-0 tracking-tighter">Enterprise</Badge>
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase opacity-60">COLUMN-CENTRIC PIPELINE</p>
                        </div>
                    </div>
                    {auditStatus !== 'draft' && (
                        <Badge className={cn(
                            "px-3 py-1 font-bold",
                            auditStatus === 'pending' && "bg-amber-500 hover:bg-amber-600",
                            auditStatus === 'approved' && "bg-emerald-500 hover:bg-emerald-600",
                            auditStatus === 'rejected' && "bg-destructive hover:bg-destructive/90"
                        )}>
                            状态: {auditStatus === 'pending' ? '待审核' : auditStatus === 'approved' ? '审核通过' : '驳回待修'}
                        </Badge>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-10 flex flex-col">
                    {renderStepIndicator()}

                    <div className="flex-1 max-w-4xl mx-auto w-full">
                        {step === "column" && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-10">
                                <div className="size-20 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground/30">
                                    <IconLayoutGrid size={40} />
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-xl font-bold">请先选择业务主阵地</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        每一个专栏对应一个独立的内容策略体系。请在左侧面板选择一个专栏，AI 将根据该专栏的客户画像和内容矩阵为您定制月度计划。
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === "plan" && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black">四月创作蓝图</h3>
                                        <p className="text-xs text-muted-foreground">根据专栏 IP 定位与内容矩阵推演生成</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                        <IconSparkles size={14} className="text-primary" /> 重新规划
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {plan.map((task, idx) => (
                                        <div 
                                            key={task.id} 
                                            className="group flex items-center justify-between p-5 rounded-2xl border bg-secondary/5 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                                            onClick={() => handleSelectTask(task.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-background border font-mono shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                                    <span className="text-[10px] opacity-40 uppercase">Day</span>
                                                    <span className="text-lg font-black leading-none">{task.suggestedDate.slice(-2)}</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-1.5 font-bold uppercase">{task.type}</Badge>
                                                        <h5 className="text-base font-bold group-hover:text-primary transition-colors">{task.title}</h5>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {task.keywords.map(kw => (
                                                            <span key={kw} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <span className="size-1 rounded-full bg-muted-foreground/30" /> {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="size-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                                                <IconArrowRight size={18} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === "outline" && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="size-2 rounded-full bg-primary" />
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Outline Strategy</span>
                                    </div>
                                    <h3 className="text-xl font-bold">{currentTask?.title}</h3>
                                </div>

                                <div className="space-y-4">
                                    {outline.map((item, idx) => (
                                        <div key={item.id} className="relative pl-12 group">
                                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border group-hover:bg-primary transition-colors ml-[17.5px]" />
                                            <div className="absolute left-0 top-0 size-9 rounded-xl border bg-background flex items-center justify-center text-sm font-black text-muted-foreground group-hover:border-primary group-hover:text-primary transition-all z-10">
                                                {idx + 1}
                                            </div>
                                            <Card className="border-none shadow-none bg-transparent hover:bg-muted/30 transition-all rounded-xl">
                                                <CardContent className="p-4 pt-0">
                                                    <Input 
                                                        value={item.title} 
                                                        onChange={(e) => {
                                                            const newOutline = [...outline];
                                                            newOutline[idx].title = e.target.value;
                                                            setOutline(newOutline);
                                                        }}
                                                        className="h-8 text-sm font-bold border-none p-0 focus:ring-0 bg-transparent"
                                                    />
                                                    <Textarea 
                                                        value={item.description}
                                                        onChange={(e) => {
                                                            const newOutline = [...outline];
                                                            newOutline[idx].description = e.target.value;
                                                            setOutline(newOutline);
                                                        }}
                                                        className="min-h-[40px] text-xs text-muted-foreground leading-relaxed border-none p-0 focus:ring-0 bg-transparent resize-none"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" className="px-8 font-bold" onClick={() => setStep("plan")}>返回计划</Button>
                                    <Button className="flex-1 h-12 gap-2 text-base font-bold shadow-xl shadow-primary/20" onClick={handleGenerateContent} disabled={isPending}>
                                        {isPending ? <IconLoader2 className="animate-spin" /> : <IconSparkles size={20} />}
                                        根据策略生成初稿
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "content" && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="flex items-center gap-3 text-primary">
                                        <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                            <IconCheck size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">文案初稿已生成</h4>
                                            <p className="text-[10px] opacity-80 italic">已匹配 {currentTopic?.topicName} 的 IP 人设风格</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] gap-1.5 font-bold">
                                            <IconHistory size={14} /> 恢复历史
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] gap-1.5 font-bold">
                                            <IconDeviceFloppy size={14} /> 存为草稿
                                        </Button>
                                    </div>
                                </div>

                                <Card className="border-2 border-primary/5 shadow-2xl overflow-hidden rounded-2xl">
                                    <CardContent className="p-0">
                                        <div className="p-8 pb-10">
                                            <Textarea 
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="min-h-[500px] border-none focus:ring-0 text-base leading-relaxed p-0 font-serif resize-none"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4 flex-col sm:flex-row">
                                    <Button variant="outline" className="flex-1 h-12 font-bold" onClick={() => setStep("outline")}>修改生成策略</Button>
                                    <Button className="flex-1 h-12 gap-2 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 border-none" onClick={handleSubmitAudit}>
                                        <IconUserCheck size={20} />
                                        提请人工审核
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "audit" && (
                            <div className="space-y-10 animate-fade-in-up py-10 text-center">
                                <div className="relative inline-block">
                                    <div className="size-24 rounded-[30%] bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        {auditStatus === 'pending' ? <IconLoader2 size={48} className="animate-spin" /> : 
                                         auditStatus === 'approved' ? <IconCircleCheckFilled size={60} className="text-emerald-500" /> : 
                                         <IconAlertCircle size={60} className="text-destructive" />}
                                    </div>
                                </div>
                                <div className="space-y-3 max-w-md mx-auto">
                                    <h3 className="text-2xl font-black">
                                        {auditStatus === 'pending' ? '审核队列中...' : 
                                         auditStatus === 'approved' ? '专栏结稿成功！' : '需要进一步修改'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {auditStatus === 'pending' ? '文稿已同步至审核端，请等待专栏主审确认。您可以继续规划该专栏的后续任务。' : 
                                         auditStatus === 'approved' ? '文章内容已获得人工审核通过，现在可以进行正式发布或排期同步。' : 
                                         '主审提出了一些反馈意见：内容的深度仍有欠缺，请针对 IP 定位进行针对性润色。'}
                                    </p>
                                </div>
                                
                                <div className="flex gap-4 max-w-sm mx-auto pt-6">
                                    {auditStatus === 'pending' ? (
                                        <>
                                            <Button variant="outline" className="flex-1 font-bold" onClick={handleApprove}>模拟: 审核通过</Button>
                                            <Button variant="ghost" className="flex-1 font-bold text-destructive" onClick={handleReject}>模拟: 驳回</Button>
                                        </>
                                    ) : (
                                        <Button className="w-full h-12 font-bold" onClick={() => setStep("plan")}>返回月度计划</Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cyber Footer Status */}
                <footer className="px-8 py-3 border-t bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                            <span className="size-2 rounded-full bg-green-500" />
                            SYS Ready
                        </div>
                        <Separator orientation="vertical" className="h-3" />
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                            Topic: {currentTopic?.topicName || 'None'}
                        </div>
                        <Separator orientation="vertical" className="h-3" />
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                            Task: {currentTask?.title || 'Standalone'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono text-muted-foreground">TIMESTAMP: {new Date().toISOString().slice(11, 19)}</div>
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="animate-pulse">●</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
