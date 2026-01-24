"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSheet } from "@/components/common/form-sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/app/actions/users";

const formSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  role: z.enum(["USER", "ADMIN"]),
  password: z.string().optional(),
});

interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
}

export function UserSheet({ open, onOpenChange, user }: UserSheetProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "USER",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name || "",
          email: user.email || "",
          role: user.role as any || "USER",
          password: "",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          role: "USER",
          password: "",
        });
      }
    }
  }, [user, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      let res;
      if (user) {
        res = await updateUser({ id: user.id, ...values });
      } else {
        // Create requires password
        if (!values.password || values.password.length < 6) {
           form.setError("password", { message: "新增用户必须设置至少6位密码" });
           setLoading(false);
           return;
        }
        res = await createUser(values as any);
      }

      if (res.success) {
        toast.success(user ? "用户更新成功" : "用户创建成功");
        onOpenChange(false);
      } else {
        toast.error(res.error || "操作失败");
      }
    } catch (error) {
      toast.error("发生未知错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "编辑用户" : "新增用户"}
      description={user ? "修改用户的基本信息。" : "创建一个新的系统用户。"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="输入姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={user ? "" : "after:content-['*'] after:ml-0.5 after:text-red-500"}>
                    {user ? "新密码 (可选)" : "密码"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={user ? "留空保持不变" : "设置初始密码"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {user ? "如需重置密码请填写，否则请留空。" : "初始密码至少 6 位。"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">角色</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">普通用户 (USER)</SelectItem>
                      <SelectItem value="ADMIN">管理员 (ADMIN)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "提交中..." : "保存"}
            </Button>
          </div>
        </form>
      </Form>
    </FormSheet>
  );
}

import { FormDescription } from "@/components/ui/form";
