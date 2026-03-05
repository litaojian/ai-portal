"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    IconVideo,
    IconPhoto,
    IconMusic,
    IconBrain,
    IconCopy,
    IconCheck,
    IconStarFilled,
    IconStar,
    IconArrowsExchange,
    IconX,
    IconPlayerPlay,
    IconVolume,
    IconChevronDown,
    IconChevronUp,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubType {
    id: string;
    label: string;
}

interface Category {
    id: string;
    label: string;
    subTypes: SubType[];
}

interface TestCase {
    id: string;
    model: string;
    vendor: string;
    vendorTag: string;
    category: string;
    subType: string;
    mediaType: "video" | "image" | "audio";
    prompt: string;
    outputUrl: string;
    thumbnail?: string;
    inputAsset?: string;
    tags: string[];
    rating: number;
    highlights: string[];
    limitations?: string[];
    params: Record<string, string>;
    costEstimate?: string;
    latency?: string;
}

interface ApiCasesData {
    categories: Category[];
    cases: TestCase[];
}

// ─── Vendor config ─────────────────────────────────────────────────────────────

const vendorColors: Record<string, string> = {
    openai: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400",
    google: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400",
    kuaishou: "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400",
    bytedance: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400",
    alibaba: "bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400",
    runway: "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400",
    midjourney: "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400",
    bfl: "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400",
    ideogram: "bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-400",
    elevenlabs: "bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400",
    suno: "bg-teal-500/10 text-teal-700 border-teal-200 dark:text-teal-400",
    udio: "bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:text-cyan-400",
    anthropic: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400",
};

const categoryIcons: Record<string, React.ReactNode> = {
    video: <IconVideo className="size-4" />,
    image: <IconPhoto className="size-4" />,
    audio: <IconMusic className="size-4" />,
    multimodal: <IconBrain className="size-4" />,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) =>
                i <= rating ? (
                    <IconStarFilled key={i} className="size-3 text-amber-400" />
                ) : (
                    <IconStar key={i} className="size-3 text-muted-foreground/30" />
                )
            )}
        </div>
    );
}

function MediaPreview({ testCase, compact = false }: { testCase: TestCase; compact?: boolean }) {
    const height = compact ? "h-36" : "h-48";

    if (testCase.mediaType === "audio") {
        return (
            <div className={`${height} bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-lg flex flex-col items-center justify-center gap-2 border border-border/50`}>
                <IconVolume className="size-8 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">音频示例</span>
                <div className="flex gap-0.5 items-end h-6">
                    {[3, 5, 7, 4, 8, 6, 9, 5, 7, 4, 6, 8, 5, 3, 7].map((h, i) => (
                        <div
                            key={i}
                            className="w-1 bg-violet-400/60 rounded-full"
                            style={{ height: `${h * 3}px` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const thumb = testCase.thumbnail || testCase.outputUrl;
    if (!thumb) {
        return (
            <div className={`${height} bg-muted rounded-lg flex items-center justify-center`}>
                <span className="text-xs text-muted-foreground">暂无预览</span>
            </div>
        );
    }

    return (
        <div className={`relative ${height} rounded-lg overflow-hidden bg-muted group`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={thumb}
                alt={`${testCase.model} 生成示例`}
                className="w-full h-full object-cover"
            />
            {testCase.mediaType === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="size-10 rounded-full bg-white/90 flex items-center justify-center">
                        <IconPlayerPlay className="size-5 text-black ml-0.5" />
                    </div>
                </div>
            )}
            {testCase.inputAsset && (
                <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">图生视频</Badge>
                </div>
            )}
        </div>
    );
}

function PromptCopyButton({ prompt }: { prompt: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="复制提示词"
        >
            {copied ? <IconCheck className="size-3.5 text-green-500" /> : <IconCopy className="size-3.5" />}
        </button>
    );
}

function CaseCard({
    testCase,
    compareMode,
    isSelected,
    onToggleSelect,
    compact = false,
}: {
    testCase: TestCase;
    compareMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    compact?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const vendorColor = vendorColors[testCase.vendorTag] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <div
            className={`
                relative flex flex-col rounded-xl border bg-card transition-all duration-200
                ${compact ? "border-2" : "hover:shadow-md"}
                ${isSelected ? "border-primary shadow-md shadow-primary/10" : "border-border"}
                ${compareMode ? "cursor-pointer" : ""}
            `}
            onClick={compareMode ? () => onToggleSelect(testCase.id) : undefined}
        >
            {/* Compare selection indicator */}
            {compareMode && (
                <div className={`absolute top-3 right-3 z-10 size-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected ? "bg-primary border-primary" : "bg-background border-border"}`}>
                    {isSelected && <IconCheck className="size-3 text-primary-foreground" />}
                </div>
            )}

            <div className="p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs border ${vendorColor}`}>
                                {testCase.vendor}
                            </Badge>
                            <span className="font-semibold text-sm truncate">{testCase.model}</span>
                        </div>
                        <RatingStars rating={testCase.rating} />
                    </div>
                </div>

                {/* Media Preview */}
                <MediaPreview testCase={testCase} compact={compact} />

                {/* Prompt */}
                <div className="flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            <span className="text-foreground/50 font-medium mr-1">Prompt:</span>
                            {testCase.prompt}
                        </p>
                    </div>
                    <PromptCopyButton prompt={testCase.prompt} />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                    {testCase.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Highlights */}
                <ul className="space-y-1">
                    {testCase.highlights.slice(0, expanded ? undefined : 2).map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                            <span>{h}</span>
                        </li>
                    ))}
                    {testCase.limitations?.slice(0, expanded ? undefined : 1).map((l, i) => (
                        <li key={`l${i}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-amber-500 mt-0.5 shrink-0">△</span>
                            <span>{l}</span>
                        </li>
                    ))}
                </ul>

                {/* Expand toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                >
                    {expanded ? <IconChevronUp className="size-3" /> : <IconChevronDown className="size-3" />}
                    {expanded ? "收起" : "查看更多"}
                </button>

                {/* Params */}
                {expanded && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/50">
                        {Object.entries(testCase.params).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground shrink-0">{k}:</span>
                                <span className="text-xs font-medium truncate">{v}</span>
                            </div>
                        ))}
                        {testCase.costEstimate && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground shrink-0">费用:</span>
                                <span className="text-xs font-medium">{testCase.costEstimate}</span>
                            </div>
                        )}
                        {testCase.latency && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground shrink-0">延迟:</span>
                                <span className="text-xs font-medium">{testCase.latency}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Compare view: same prompt, side-by-side
function CompareView({
    cases,
    onExit,
}: {
    cases: TestCase[];
    onExit: () => void;
}) {
    if (cases.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            {/* Header bar */}
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                    <IconArrowsExchange className="size-4 text-primary" />
                    <span className="text-sm font-medium">对比模式</span>
                    <span className="text-xs text-muted-foreground">
                        已选 {cases.length} 个模型 · 相同 Prompt 横向对比
                    </span>
                </div>
                <Button variant="ghost" size="sm" onClick={onExit} className="h-7 gap-1">
                    <IconX className="size-3.5" /> 退出对比
                </Button>
            </div>

            {/* Shared prompt */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">共用 Prompt</p>
                <p className="text-sm leading-relaxed">{cases[0].prompt}</p>
            </div>

            {/* Side-by-side cards */}
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(cases.length, 3)}, minmax(0, 1fr))` }}
            >
                {cases.map((c) => (
                    <CaseCard
                        key={c.id}
                        testCase={c}
                        compareMode={false}
                        isSelected={false}
                        onToggleSelect={() => {}}
                        compact
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ApiCasesClient({ data }: { data: ApiCasesData }) {
    const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id || "video");
    const [activeSubType, setActiveSubType] = useState("all");
    const [compareMode, setCompareMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const currentCategory = data.categories.find((c) => c.id === activeCategory);

    // Reset subtype when switching category
    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        setActiveSubType("all");
        setSelectedIds([]);
        setCompareMode(false);
    };

    const filteredCases = useMemo(() => {
        return data.cases.filter((c) => {
            if (c.category !== activeCategory) return false;
            if (activeSubType !== "all" && c.subType !== activeSubType) return false;
            return true;
        });
    }, [data.cases, activeCategory, activeSubType]);

    const selectedCases = useMemo(
        () => filteredCases.filter((c) => selectedIds.includes(c.id)),
        [filteredCases, selectedIds]
    );

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 3) return prev; // max 3
            return [...prev, id];
        });
    };

    const handleToggleCompareMode = () => {
        setCompareMode((prev) => !prev);
        if (compareMode) setSelectedIds([]);
    };

    const isInCompareView = compareMode && selectedIds.length >= 2;

    return (
        <div className="flex flex-col gap-6">
            {/* Page title */}
            <div>
                <h1 className="text-xl font-bold tracking-tight">AI 应用场景测试</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    按媒体类型浏览各厂商主流模型的实际生成效果，选择 2-3 个模型进行横向对比
                </p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
                {data.categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                            ${activeCategory === cat.id
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {categoryIcons[cat.id]}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* SubType + Compare row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveSubType("all")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${activeSubType === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            }`}
                    >
                        全部
                    </button>
                    {currentCategory?.subTypes.map((st) => (
                        <button
                            key={st.id}
                            onClick={() => setActiveSubType(st.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                ${activeSubType === st.id
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                }`}
                        >
                            {st.label}
                        </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                        {filteredCases.length} 个模型
                    </span>
                </div>

                {/* Compare toggle */}
                <Button
                    variant={compareMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleCompareMode}
                    className="gap-2 h-8"
                >
                    <IconArrowsExchange className="size-3.5" />
                    {compareMode
                        ? `对比中 (${selectedIds.length}/3)`
                        : "开启对比"}
                </Button>
            </div>

            {/* Compare hint */}
            {compareMode && !isInCompareView && (
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
                    <IconArrowsExchange className="size-4 shrink-0" />
                    <span>
                        点击下方卡片选择模型（最多3个），选好后将自动进入对比视图
                        {selectedIds.length > 0 && `，已选 ${selectedIds.length} 个`}
                    </span>
                </div>
            )}

            {/* Compare view OR card grid */}
            {isInCompareView ? (
                <CompareView
                    cases={selectedCases}
                    onExit={() => { setCompareMode(false); setSelectedIds([]); }}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCases.map((c) => (
                        <CaseCard
                            key={c.id}
                            testCase={c}
                            compareMode={compareMode}
                            isSelected={selectedIds.includes(c.id)}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                    {filteredCases.length === 0 && (
                        <div className="col-span-full py-16 text-center text-muted-foreground">
                            <IconPhoto className="size-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">暂无该分类的测试案例</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
