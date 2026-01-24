"use client";

import { useState } from "react";
import { OidcClient } from "@/prisma/generated/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createOidcClient, deleteOidcClient } from "@/app/actions/oidc-clients";
import { toast } from "sonner";
import { Trash2, Copy } from "lucide-react";

const formSchema = z.object({
  clientName: z.string().min(2, "名称至少2字符"),
  clientUri: z.string().optional(),
  redirectUris: z.string().min(1, "至少需要一个回调地址"),
  grantTypes: z.array(z.string()).min(1, "至少选择一种授权模式"),
  responseTypes: z.array(z.string()).min(1, "至少选择一种响应类型"),
  scope: z.string(),
  tokenEndpointAuthMethod: z.string(),
});

const grantTypeOptions = [
  { id: "authorization_code", label: "授权码模式 (Authorization Code)" },
  { id: "refresh_token", label: "刷新令牌 (Refresh Token)" },
  { id: "implicit", label: "隐式模式 (Implicit)" },
  { id: "client_credentials", label: "客户端凭证 (Client Credentials)" },
];

interface ClientListProps {
  initialData: OidcClient[];
}

export function ClientList({ initialData }: ClientListProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientUri: "",
      redirectUris: "",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      scope: "openid profile email",
      tokenEndpointAuthMethod: "client_secret_basic",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createOidcClient(values);
      toast.success("客户端创建成功");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("创建客户端失败");
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除吗？")) {
      await deleteOidcClient(id);
      toast.success("客户端已删除");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">已注册客户端</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>注册客户端</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>注册新的 OIDC 客户端</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>客户端名称</FormLabel>
                      <FormControl>
                        <Input placeholder="我的应用" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redirectUris"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>回调地址 (Redirect URIs, 逗号分隔)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://app.com/callback, http://localhost:3000/cb" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grantTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>授权模式</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {grantTypeOptions.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="grantTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit">创建</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>客户端 ID</TableHead>
              <TableHead>密钥</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.clientName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-1 rounded">{client.clientId}</code>
                    <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => copyToClipboard(client.clientId)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-1 rounded truncate max-w-[100px] block">
                      {client.clientSecret ? "••••••••" : "公开"}
                    </code>
                     {client.clientSecret && (
                      <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => copyToClipboard(client.clientSecret!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
