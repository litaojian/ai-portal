/**
 * 无障碍辅助组件和工具函数
 * 提供 ARIA 标签、键盘导航等无障碍功能支持
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ============ 1. 跳过导航链接 ============
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4",
        "focus:bg-primary focus:text-primary-foreground focus:outline-none",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  );
}

// ============ 2. 可访问的图标按钮 ============
export interface AccessibleIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // 必须提供 aria-label
  children: React.ReactNode;
}

export function AccessibleIconButton({
  label,
  children,
  className,
  ...props
}: AccessibleIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn("relative", className)}
      {...props}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ============ 3. 实时公告区域 ============
export interface LiveRegionProps {
  children: React.ReactNode;
  polite?: "polite" | "assertive" | "off";
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  polite = "polite",
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={polite}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}

// ============ 4. 焦点陷阱 (Focus Trap) ============
export interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({
  children,
  enabled = true,
  onEscape,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // 获取所有可聚焦元素
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 键关闭
      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      // Tab 键导航
      if (e.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // 设置初始焦点
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onEscape]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ============ 5. 可访问的对话框包装器 ============
export interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: AccessibleDialogProps) {
  useEffect(() => {
    if (isOpen) {
      // 禁用背景滚动
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 对话框 */}
      <FocusTrap enabled={isOpen} onEscape={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? "dialog-description" : undefined}
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "bg-card border rounded-lg shadow-lg p-6 max-w-lg w-full",
            className
          )}
        >
          <h2 id="dialog-title" className="text-xl font-semibold mb-2">
            {title}
          </h2>
          {description && (
            <p id="dialog-description" className="text-muted-foreground mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </FocusTrap>
    </>
  );
}

// ============ 6. 键盘快捷键处理 ============
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
  }
) {
  useEffect(() => {
    if (options?.enabled === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlMatch = options?.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = options?.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = options?.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}

// ============ 7. 屏幕阅读器专用文本 ============
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ============ 8. 可访问的加载指示器 ============
export interface AccessibleLoaderProps {
  label?: string;
  className?: string;
}

export function AccessibleLoader({
  label = "加载中",
  className,
}: AccessibleLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex items-center gap-2", className)}
    >
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ============ 9. 表单字段错误公告 ============
export interface FieldErrorProps {
  id: string;
  error?: string;
  className?: string;
}

export function FieldError({ id, error, className }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn("text-xs text-destructive mt-1", className)}
    >
      {error}
    </p>
  );
}

// ============ 10. 无障碍工具函数 ============

/**
 * 生成唯一的 ID（用于关联 label 和 input）
 */
export function generateId(prefix: string = "field"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 合并 ARIA 属性
 */
export function mergeAriaProps(
  props: Record<string, any>,
  ariaProps: Record<string, any>
): Record<string, any> {
  const merged = { ...props };

  Object.keys(ariaProps).forEach((key) => {
    if (key.startsWith("aria-")) {
      if (key === "aria-describedby" && merged[key]) {
        // 合并多个 describedby
        merged[key] = `${merged[key]} ${ariaProps[key]}`;
      } else {
        merged[key] = ariaProps[key];
      }
    }
  });

  return merged;
}

/**
 * 获取焦点样式类名
 */
export function getFocusClasses(): string {
  return "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
}

/**
 * 检查是否支持 reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ============ 11. 导出所有工具 ============
export const a11y = {
  generateId,
  mergeAriaProps,
  getFocusClasses,
  prefersReducedMotion,
};
