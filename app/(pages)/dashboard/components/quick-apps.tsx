"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Users,
  FileText,
  Settings,
  BarChart3,
  Mail,
  LucideIcon
} from "lucide-react";

interface QuickApp {
  id: string;
  name: string;
  icon: LucideIcon;
  status: "active" | "maintenance" | "inactive";
  url: string;
  description?: string;
  color: string; // 用于渐变配色
}

const apps: QuickApp[] = [
  {
    id: "1",
    name: "数据看板",
    icon: BarChart3,
    status: "active",
    url: "/dashboard",
    description: "实时数据分析",
    color: "from-primary to-accent"
  },
  {
    id: "2",
    name: "用户管理",
    icon: Users,
    status: "active",
    url: "/users",
    description: "用户权限配置",
    color: "from-accent to-primary"
  },
  {
    id: "3",
    name: "文档中心",
    icon: FileText,
    status: "active",
    url: "/docs",
    description: "知识库管理",
    color: "from-primary via-accent to-primary"
  },
  {
    id: "4",
    name: "系统设置",
    icon: Settings,
    status: "active",
    url: "/settings",
    description: "系统配置",
    color: "from-accent via-primary to-accent"
  },
  {
    id: "5",
    name: "消息中心",
    icon: Mail,
    status: "maintenance",
    url: "/messages",
    description: "通知与消息",
    color: "from-primary to-primary"
  },
  {
    id: "6",
    name: "AI 助手",
    icon: Zap,
    status: "active",
    url: "/ai-assistant",
    description: "智能辅助工具",
    color: "from-accent to-accent"
  },
];

const statusConfig = {
  active: {
    label: "运行中",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
  },
  maintenance: {
    label: "维护中",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
  },
  inactive: {
    label: "已停用",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
  }
};

export function QuickApps() {
  const handleAppClick = (app: QuickApp) => {
    if (app.status === "active") {
      window.location.href = app.url;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">快捷应用</CardTitle>
          <Badge variant="outline" className="text-xs">
            {apps.filter(app => app.status === "active").length} / {apps.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 p-4 pt-0">
        {apps.map((app) => {
          const Icon = app.icon;
          const isActive = app.status === "active";

          return (
            <div
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={`
                group relative overflow-hidden rounded-xl border border-border/50
                transition-all duration-300
                ${isActive
                  ? 'hover:scale-105 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 内容区 */}
              <div className="relative flex flex-col items-center gap-3 p-4">
                {/* 图标 */}
                <div className="relative">
                  <div className={`
                    absolute inset-0 blur-xl rounded-full
                    ${isActive ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-muted/20'}
                    transition-all duration-300
                  `} />
                  <div className={`
                    relative p-3 rounded-xl shadow-lg
                    bg-gradient-to-br ${app.color}
                    ${isActive ? 'group-hover:scale-110' : ''}
                    transition-transform duration-300
                  `}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* 应用名称 */}
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-sm leading-tight">
                    {app.name}
                  </h3>
                  {app.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {app.description}
                    </p>
                  )}
                </div>

                {/* 状态标签 */}
                <Badge
                  variant="outline"
                  className={`text-xs ${statusConfig[app.status].className}`}
                >
                  {statusConfig[app.status].label}
                </Badge>
              </div>

              {/* Hover 光波效果 */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
