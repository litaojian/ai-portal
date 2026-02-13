import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// 表单页面容器
export interface FormPageProps {
  children: React.ReactNode;
  className?: string;
}

export function FormPage({ children, className }: FormPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

// 表单页面标题
export interface FormPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function FormPageHeader({ title, description, children }: FormPageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

// 表单区块容器
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function FormSection({ title, description, children, className, required }: FormSectionProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="flex items-center gap-2">
              {title}
              {required && (
                <span className="text-destructive text-sm">*</span>
              )}
            </CardTitle>
          )}
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && "pt-6")}>
        {children}
      </CardContent>
    </Card>
  );
}

// 表单字段行（支持响应式列布局）
export interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormRow({ children, columns = 1, className }: FormRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// 表单操作按钮区域
export interface FormActionsProps {
  children: React.ReactNode;
  align?: "left" | "right" | "center" | "between";
  className?: string;
  sticky?: boolean;
}

export function FormActions({ children, align = "right", className, sticky }: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 border-t",
        alignClasses[align],
        sticky && "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-4 -mx-6 px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// 表单字段组（标签 + 输入框 + 描述 + 错误提示）
export interface FormFieldGroupProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldGroup({
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// 表单步骤指示器
export interface FormStep {
  title: string;
  description?: string;
}

export interface FormStepsProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function FormSteps({ steps, currentStep, onStepClick, className }: FormStepsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Item */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                {/* Step Number */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 transition-all",
                    isActive && "bg-primary text-primary-foreground border-primary scale-110",
                    isCompleted && "bg-primary/20 text-primary border-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Title */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive && "text-primary",
                      isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-border">
                  <div
                    className={cn(
                      "h-full bg-primary transition-all duration-300",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 表单分隔线（带文本）
export interface FormDividerProps {
  text?: string;
  className?: string;
}

export function FormDivider({ text, className }: FormDividerProps) {
  if (!text) {
    return <Separator className={className} />;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}

// 表单信息提示框
export interface FormAlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormAlert({ type = "info", title, children, className }: FormAlertProps) {
  const typeStyles = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    success: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    error: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className={cn("rounded-lg border p-4", typeStyles[type], className)}>
      {title && (
        <h4 className="font-semibold mb-1">{title}</h4>
      )}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}
