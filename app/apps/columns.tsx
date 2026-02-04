"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink, Globe, Shield } from "lucide-react";
import { format } from "date-fns";
import { Application } from "@/lib/db/schema";

interface AppColumnsProps {
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}

export const getAppColumns = ({ onEdit, onDelete }: AppColumnsProps): ColumnDef<Application>[] => [
  {
    accessorKey: "name",
    header: "应用名称",
    cell: ({ row }) => {
      const app = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium flex items-center gap-2">
            {app.name}
            {app.url && (
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[280px]">{app.description}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      if (type === "third_party") {
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Globe className="w-3 h-3 mr-1" />第三方</Badge>;
      }
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200"><Shield className="w-3 h-3 mr-1" />内部</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      switch (status) {
        case "published":
          return <Badge className="bg-green-500 hover:bg-green-600">已上架</Badge>;
        case "offline":
          return <Badge variant="secondary">已下架</Badge>;
        case "draft":
        default:
          return <Badge variant="outline" className="text-yellow-600 border-yellow-500">开发中</Badge>;
      }
    },
  },
  {
    accessorKey: "version",
    header: "版本",
  },
  {
    accessorKey: "developer",
    header: "负责人",
    cell: ({ row }) => row.getValue("developer") || "-",
  },
  {
    accessorKey: "updatedAt",
    header: "更新时间",
    cell: ({ row }) => format(new Date(row.getValue("updatedAt")), "yyyy-MM-dd"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const app = row.original;
      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(app)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">编辑</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600"
            onClick={() => onDelete(app.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">删除</span>
          </Button>
        </div>
      );
    },
  },
];
