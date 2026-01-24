"use client";

import { useState } from "react";
import { Project } from "@prisma/client";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  MoreHorizontal,
  ArrowUpDown,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { ProjectSheet } from "@/components/project-sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectTableProps {
  data: Project[];
}

export function ProjectTable({ data }: ProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
        if (status === "进行中") variant = "default"; // Black/Primary
        if (status === "已完成") variant = "secondary";
        if (status === "暂停") variant = "destructive";
        
        // Custom colors can be applied via classes if needed, sticking to variants for now
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索项目名称..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={() => {
            setEditingProject(null);
            setSheetOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>

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
    </div>
  );
}
