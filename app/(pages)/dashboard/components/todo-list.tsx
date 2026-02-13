"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  completed: boolean;
}

const priorityConfig = {
  high: {
    label: "高优先级",
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    color: "text-red-600 dark:text-red-400"
  },
  medium: {
    label: "中优先级",
    variant: "secondary" as const,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    color: "text-yellow-600 dark:text-yellow-400"
  },
  low: {
    label: "低优先级",
    variant: "outline" as const,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    color: "text-blue-600 dark:text-blue-400"
  }
};

const initialTodos: TodoItem[] = [
  {
    id: "1",
    title: "完成用户管理模块开发",
    priority: "high",
    dueDate: "2026-02-15",
    completed: false
  },
  {
    id: "2",
    title: "审查代码提交记录",
    priority: "medium",
    dueDate: "2026-02-14",
    completed: false
  },
  {
    id: "3",
    title: "更新 API 文档",
    priority: "medium",
    completed: false
  },
  {
    id: "4",
    title: "修复登录页面样式问题",
    priority: "low",
    dueDate: "2026-02-16",
    completed: true
  },
];

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "今天";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "明天";
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric"
      });
    }
  };

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">待办事项</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {incompleteTodos.length} 项待完成
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-1 p-4 pt-0 max-h-[400px] overflow-y-auto">
        {/* 未完成任务 */}
        {incompleteTodos.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => toggleTodo(todo.id)}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id)}
              className="mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm leading-tight",
                todo.completed && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                {todo.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(todo.dueDate)}</span>
                  </div>
                )}

                <Badge
                  variant="outline"
                  className={cn("text-xs h-5", priorityConfig[todo.priority].className)}
                >
                  {priorityConfig[todo.priority].label}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {/* 分隔线 */}
        {completedTodos.length > 0 && incompleteTodos.length > 0 && (
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground/70 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                已完成
              </span>
            </div>
          </div>
        )}

        {/* 已完成任务 */}
        {completedTodos.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer opacity-60"
            onClick={() => toggleTodo(todo.id)}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id)}
              className="mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight line-through text-muted-foreground">
                {todo.title}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                {todo.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(todo.dueDate)}</span>
                  </div>
                )}

                <Badge
                  variant="outline"
                  className={cn("text-xs h-5", priorityConfig[todo.priority].className)}
                >
                  {priorityConfig[todo.priority].label}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {/* 空状态 */}
        {todos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">暂无待办事项</p>
            <p className="text-xs mt-1">点击上方 + 按钮添加任务</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
