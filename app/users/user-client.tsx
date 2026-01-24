"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserSheet } from "./user-sheet";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteUser } from "@/app/actions/users";
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
import { DataTable } from "@/components/common/data-table";
import { getUserColumns, User } from "./columns";

interface UserClientProps {
  initialData: User[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function UserClient({ initialData, total, currentPage, totalPages }: UserClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCreate = () => {
    setEditingUser(null);
    setSheetOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const res = await deleteUser(deleteId);
      if (res.success) {
        toast.success("用户已删除");
      } else {
        toast.error(res.error || "删除失败");
      }
      setDeleteId(null);
    }
  };

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!updates.page) params.delete("page");
    router.push(`/users?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    updateUrl({ query: val || null });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage.toString() });
  };

  const columns = getUserColumns({
    onEdit: handleEdit,
    onDelete: setDeleteId,
  });

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={initialData}
        searchKey="name"
        searchPlaceholder="搜索姓名或邮箱..."
        pageCount={totalPages}
        pageIndex={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增用户
        </Button>
      </DataTable>

      <UserSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        user={editingUser} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该用户账号。
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