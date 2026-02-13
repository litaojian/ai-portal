import { cn } from "@/lib/utils";

// 基础骨架屏组件
export interface SkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circle";
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded",
    rounded: "rounded-lg",
    circle: "rounded-full",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
    none: "",
  };

  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
}

// 表格骨架屏
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* 表头 */}
      {showHeader && (
        <div className="flex gap-4 pb-3 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-4 flex-1"
              variant="rounded"
            />
          ))}
        </div>
      )}

      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-4",
                colIndex === 0 ? "w-8" : "flex-1"
              )}
              variant="rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// 卡片骨架屏
export interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export function CardSkeleton({
  className,
  showImage = false,
  lines = 3,
}: CardSkeletonProps) {
  return (
    <div className={cn("p-6 border rounded-lg bg-card space-y-4", className)}>
      {/* 图片/图标 */}
      {showImage && (
        <Skeleton className="w-full h-40" variant="rounded" />
      )}

      {/* 标题 */}
      <Skeleton className="h-6 w-3/4" variant="rounded" />

      {/* 内容行 */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
            variant="rounded"
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20" variant="rounded" />
        <Skeleton className="h-9 w-20" variant="rounded" />
      </div>
    </div>
  );
}

// 列表项骨架屏
export interface ListItemSkeletonProps {
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
}

export function ListItemSkeleton({
  className,
  showAvatar = false,
  showActions = false,
}: ListItemSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      {/* 头像/图标 */}
      {showAvatar && (
        <Skeleton className="w-10 h-10" variant="circle" />
      )}

      {/* 内容 */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" variant="rounded" />
        <Skeleton className="h-3 w-2/3" variant="rounded" />
      </div>

      {/* 操作按钮 */}
      {showActions && (
        <Skeleton className="w-8 h-8" variant="rounded" />
      )}
    </div>
  );
}

// 表单骨架屏
export interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 表单标题 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" variant="rounded" />
        <Skeleton className="h-4 w-2/3" variant="rounded" />
      </div>

      {/* 表单字段 */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" variant="rounded" />
          <Skeleton className="h-10 w-full" variant="rounded" />
        </div>
      ))}

      {/* 提交按钮 */}
      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className="h-10 w-24" variant="rounded" />
        <Skeleton className="h-10 w-24" variant="rounded" />
      </div>
    </div>
  );
}

// Dashboard 统计卡片骨架屏
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg bg-card", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" variant="rounded" />
          <Skeleton className="h-8 w-32" variant="rounded" />
          <Skeleton className="h-3 w-20" variant="rounded" />
        </div>
        <Skeleton className="w-12 h-12" variant="rounded" />
      </div>
    </div>
  );
}

// 订单列表页骨架屏
export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" variant="rounded" />
          <Skeleton className="h-4 w-80" variant="rounded" />
        </div>
        <Skeleton className="h-10 w-32" variant="rounded" />
      </div>

      {/* 筛选器 */}
      <div className="p-4 border rounded-lg bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <Skeleton className="h-10 w-full" variant="rounded" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-10 w-full" variant="rounded" />
          </div>
          <div className="md:col-span-4">
            <Skeleton className="h-10 w-full" variant="rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" variant="rounded" />
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="border rounded-lg bg-card p-6">
        <TableSkeleton rows={8} columns={7} />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg bg-card space-y-2">
            <Skeleton className="h-4 w-20" variant="rounded" />
            <Skeleton className="h-8 w-16" variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard 页面骨架屏
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 图表 */}
        <div className="lg:col-span-8">
          <div className="p-6 border rounded-lg bg-card space-y-4">
            <Skeleton className="h-6 w-32" variant="rounded" />
            <Skeleton className="h-80 w-full" variant="rounded" />
          </div>
        </div>

        {/* 快捷应用 */}
        <div className="lg:col-span-4">
          <div className="p-6 border rounded-lg bg-card space-y-4">
            <Skeleton className="h-6 w-32" variant="rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" variant="rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* 待办事项 */}
        <div className="lg:col-span-4">
          <div className="p-6 border rounded-lg bg-card space-y-4">
            <Skeleton className="h-6 w-32" variant="rounded" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} showAvatar={false} showActions />
              ))}
            </div>
          </div>
        </div>

        {/* 日历 */}
        <div className="lg:col-span-4">
          <div className="p-6 border rounded-lg bg-card space-y-4">
            <Skeleton className="h-6 w-32" variant="rounded" />
            <Skeleton className="h-80 w-full" variant="rounded" />
          </div>
        </div>

        {/* 表格 */}
        <div className="lg:col-span-4">
          <div className="p-6 border rounded-lg bg-card space-y-4">
            <Skeleton className="h-6 w-32" variant="rounded" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} showAvatar showActions />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 表单页骨架屏
export function FormPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" variant="rounded" />
          <Skeleton className="h-4 w-80" variant="rounded" />
        </div>
        <Skeleton className="h-10 w-24" variant="rounded" />
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="w-10 h-10" variant="circle" />
              <Skeleton className="h-4 w-20" variant="rounded" />
            </div>
            {i < 3 && <Skeleton className="flex-1 h-0.5 mx-4" />}
          </div>
        ))}
      </div>

      {/* 表单区块 */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg bg-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" variant="rounded" />
              <Skeleton className="h-4 w-64" variant="rounded" />
            </div>
            <FormSkeleton fields={3} />
          </div>
        </div>
      ))}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Skeleton className="h-10 w-24" variant="rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" variant="rounded" />
          <Skeleton className="h-10 w-32" variant="rounded" />
        </div>
      </div>
    </div>
  );
}
