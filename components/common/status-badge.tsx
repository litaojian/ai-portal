import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { type LucideIcon } from "lucide-react";

export type StatusType =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "failed"
  | "draft"
  | "active"
  | "inactive";

interface StatusConfig {
  label: string;
  className: string;
  icon: LucideIcon;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  pending: {
    label: "待处理",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: Clock,
  },
  processing: {
    label: "处理中",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Loader2,
  },
  completed: {
    label: "已完成",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "已取消",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
  failed: {
    label: "失败",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: AlertCircle,
  },
  draft: {
    label: "草稿",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    icon: FileText,
  },
  active: {
    label: "激活",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2,
  },
  inactive: {
    label: "未激活",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  showIcon?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function StatusBadge({
  status,
  customLabel,
  showIcon = true,
  variant = "default",
  className,
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <Badge
        variant="outline"
        className={cn("h-5 text-xs gap-1", config.className, className)}
      >
        {customLabel || config.label}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium hover:opacity-80 transition-opacity",
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            status === "processing" && "animate-spin"
          )}
        />
      )}
      {customLabel || config.label}
    </Badge>
  );
}

// 状态点组件（用于表格中的紧凑显示）
export interface StatusDotProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function StatusDot({ status, size = "md", animated = false }: StatusDotProps) {
  const config = statusConfigs[status];

  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        config.className.split(" ")[0], // 提取背景色类
        animated && "animate-pulse"
      )}
      title={config.label}
    />
  );
}

// 获取状态配置（用于自定义渲染）
export function getStatusConfig(status: StatusType) {
  return statusConfigs[status];
}

// 状态列表（用于筛选器等）
export const allStatuses: StatusType[] = Object.keys(statusConfigs) as StatusType[];

// 获取状态选项（用于 Select 组件）
export function getStatusOptions(includeStatuses?: StatusType[]) {
  const statuses = includeStatuses || allStatuses;
  return statuses.map((status) => ({
    value: status,
    label: statusConfigs[status].label,
  }));
}
