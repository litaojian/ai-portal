"use client";

import { useState } from "react";
import { Application } from "@/lib/db/schema";
import { AppSheet } from "./app-sheet";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { deleteApp } from "@/app/actions/apps";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/common/data-table";
import { getAppColumns } from "./columns";

interface AppClientProps {
  initialData: Application[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function AppClient({ initialData, total, currentPage, totalPages }: AppClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    setEditingApp(null);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteApp(deleteId);
      toast.success("应用已删除");
      setDeleteId(null);
    }
  };

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page on filter/search change
    if (!updates.page && (updates.query !== undefined || updates.type !== undefined || updates.status !== undefined)) {
      params.delete("page");
    }
    router.push(`/apps?${params.toString()}`);
  };

  const onTabChange = (val: string) => {
    updateUrl({ type: val });
  };

  const onStatusChange = (val: string) => {
    updateUrl({ status: val });
  };

  const handleSearch = (val: string) => {
    updateUrl({ query: val || null });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage.toString() });
  };

  const columns = getAppColumns({
    onEdit: handleEdit,
    onDelete: setDeleteId,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={type} onValueChange={onTabChange} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">全部类型</TabsTrigger>
            <TabsTrigger value="internal">内部应用</TabsTrigger>
            <TabsTrigger value="third_party">第三方应用</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="published">已上架</SelectItem>
              <SelectItem value="offline">已下架</SelectItem>
              <SelectItem value="draft">开发中</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        searchKey="name"
        searchPlaceholder="搜索应用..."
        pageCount={totalPages}
        pageIndex={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增应用
        </Button>
      </DataTable>

      <AppSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        app={editingApp}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该应用及其所有数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
