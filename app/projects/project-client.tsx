"use client";

import { useState } from "react";
import { Project } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteProject } from "@/app/actions/projects";
import { ProjectSheet } from "./project-sheet";
import { DataTable } from "@/components/common/data-table";

interface ProjectClientProps {
  data: Project[];
}

export function ProjectClient({ data }: ProjectClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await deleteProject(deleteId);
    if (res.success) {
      toast.success("项目已删除");
    } else {
      toast.error(res.error);
    }
    setDeleteId(null);
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: "项目名称",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "leader",
      header: "负责人",
      cell: ({ row }) => {
        const leader = row.getValue("leader") as string;
        if (!leader) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {leader.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{leader}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "outline" | "destructive" =
          "outline";
        if (status === "进行中") variant = "default";
        if (status === "已完成") variant = "secondary";
        if (status === "暂停") variant = "destructive";
        
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "priority",
      header: "优先级",
      cell: ({ row }) => {
        const p = row.getValue("priority") as string;
        const color = p === "高" ? "text-red-500" : p === "中" ? "text-yellow-500" : "text-green-500";
        return <span className={`font-medium ${color}`}>{p}</span>;
      },
    },
    {
      accessorKey: "budget",
      header: () => <div className="text-right">预算</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("budget"));
        const formatted = new Intl.NumberFormat("zh-CN", {
          style: "currency",
          currency: "CNY",
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "startDate",
      header: "开始日期",
      cell: ({ row }) => {
        return format(row.getValue("startDate"), "yyyy-MM-dd");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                setEditingProject(project);
                setSheetOpen(true);
              }}
              title="编辑"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">编辑</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-600"
              onClick={() => setDeleteId(project.id)}
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">删除</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="name" 
        searchPlaceholder="搜索项目名称..."
      >
        <Button onClick={() => {
            setEditingProject(null);
            setSheetOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </DataTable>

      <ProjectSheet
        open={sheetOpen}
        onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。该项目及其所有数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
