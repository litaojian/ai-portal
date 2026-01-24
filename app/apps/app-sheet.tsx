"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { createApp, updateApp } from "@/app/actions/apps";
import { toast } from "sonner";
import { useEffect } from "react";
import { Application } from "@/prisma/generated/client";
import { FormSheet } from "@/components/common/form-sheet";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "应用名称至少需要2个字符"),
  description: z.string().optional(),
  url: z.string().min(1, "访问链接不能为空"),
  icon: z.string().optional(),
  status: z.string(),
  version: z.string().optional(),
  developer: z.string().optional(),
  type: z.string(),
  // OIDC fields
  redirectUris: z.string().optional(),
  grantTypes: z.array(z.string()),
  scope: z.string(),
});

const grantTypeOptions = [
  { id: "authorization_code", label: "授权码模式 (Authorization Code)" },
  { id: "refresh_token", label: "刷新令牌 (Refresh Token)" },
  { id: "implicit", label: "隐式模式 (Implicit)" },
  { id: "client_credentials", label: "客户端凭证 (Client Credentials)" },
];

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: Application | null;
}

export function AppSheet({ open, onOpenChange, app }: AppSheetProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      icon: "",
      status: "draft",
      version: "1.0.0",
      developer: "",
      type: "internal",
      redirectUris: "",
      grantTypes: ["authorization_code", "refresh_token"],
      scope: "openid profile email",
    },
  });

  const appType = form.watch("type");

  useEffect(() => {
    if (app) {
      // Parse OIDC info if available
      const oidc = (app as any).oidcClient;
      let redirectUris = "";
      let grantTypes = ["authorization_code", "refresh_token"];
      let scope = "openid profile email";

      if (oidc) {
        try {
          const uris = JSON.parse(oidc.redirectUris);
          redirectUris = Array.isArray(uris) ? uris.join(", ") : "";
          grantTypes = JSON.parse(oidc.grantTypes);
          scope = oidc.scope;
        } catch (e) {
          console.error("Failed to parse OIDC data", e);
        }
      }

      form.reset({
        name: app.name,
        description: app.description || "",
        url: app.url || "",
        icon: app.icon || "",
        status: app.status,
        version: app.version || "",
        developer: app.developer || "",
        type: (app.type as string) || "internal",
        redirectUris,
        grantTypes,
        scope,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        url: "",
        icon: "",
        status: "draft",
        version: "1.0.0",
        developer: "",
        type: "internal",
        redirectUris: "",
        grantTypes: ["authorization_code", "refresh_token"],
        scope: "openid profile email",
      });
    }
  }, [app, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (app) {
        await updateApp(app.id, values);
        toast.success("应用更新成功");
      } else {
        await createApp(values);
        toast.success("应用创建成功");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("操作失败，请重试");
      console.error(error);
    }
  }

  return (
    <FormSheet 
      open={open} 
      onOpenChange={onOpenChange}
      title={app ? "编辑应用" : "新增应用"}
      description={app ? "修改应用信息。" : "填写新应用的基础信息。"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <h3 className="font-medium text-sm text-muted-foreground">基本配置</h3>
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>应用类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!!app}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">内部应用 (Internal)</SelectItem>
                      <SelectItem value="third_party">第三方应用 (Third Party / OIDC)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    内部应用用于权限受控的内部访问；第三方应用支持 OIDC 登录集成。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">应用名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入应用名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">开发中 (Draft)</SelectItem>
                        <SelectItem value="published">已上架 (Published)</SelectItem>
                        <SelectItem value="offline">已下架 (Offline)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>版本号</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {appType === "third_party" && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h3 className="font-medium text-sm text-muted-foreground">OIDC 客户端配置</h3>
                </div>

                <FormField
                  control={form.control}
                  name="redirectUris"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>回调地址 (Redirect URIs)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="https://example.com/callback, http://localhost/cb" {...field} />
                      </FormControl>
                      <FormDescription>多个地址用逗号分隔。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grantTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>授权模式 (Grant Types)</FormLabel>
                      <div className="grid grid-cols-1 gap-2 border rounded-md p-3 bg-muted/20">
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
                                  <FormLabel className="font-normal text-xs cursor-pointer">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限范围 (Scope)</FormLabel>
                      <FormControl>
                        <Input placeholder="openid profile email" {...field} />
                      </FormControl>
                      <FormDescription>以空格分隔的 OIDC Scopes。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <h3 className="font-medium text-sm text-muted-foreground">详细信息</h3>
            </div>

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">{appType === "third_party" ? "应用主页 / Client URI" : "访问链接 (URL)"}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>图标 (Icon Name or URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Activity, or https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
              control={form.control}
              name="developer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开发者/负责人</FormLabel>
                  <FormControl>
                    <Input placeholder="输入负责人姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="应用简短描述..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存应用</Button>
          </div>
        </form>
      </Form>
    </FormSheet>
  );
}
