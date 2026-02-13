"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormPage,
  FormPageHeader,
  FormSection,
  FormRow,
  FormActions,
  FormFieldGroup,
  FormSteps,
  FormDivider,
  FormAlert,
} from "@/components/common/form-layout";
import { FileUpload, type UploadedFile } from "@/components/common/file-upload";
import { Plus, X, ArrowLeft, Save } from "lucide-react";

// 表单验证 Schema
const orderFormSchema = z.object({
  // 基本信息
  orderNumber: z.string().min(1, "订单号不能为空"),
  customerName: z.string().min(2, "客户名称至少2个字符"),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  customerEmail: z.string().email("请输入有效的邮箱地址").optional(),
  orderDate: z.string().min(1, "请选择订单日期"),

  // 商品信息
  items: z
    .array(
      z.object({
        productName: z.string().min(1, "商品名称不能为空"),
        quantity: z.number().min(1, "数量至少为1"),
        price: z.number().min(0, "单价不能为负数"),
      })
    )
    .min(1, "至少添加一个商品"),

  // 支付信息
  paymentMethod: z.enum(["alipay", "wechat", "bank", "cash"], "请选择支付方式"),
  totalAmount: z.number().min(0, "总金额不能为负数"),

  // 配送信息
  shippingAddress: z.string().min(5, "配送地址至少5个字符"),
  shippingMethod: z.enum(["standard", "express", "pickup"], "请选择配送方式"),

  // 备注
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

// 商品项类型
interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: "1", productName: "", quantity: 1, price: 0 },
  ]);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNumber: `ORD-${Date.now()}`,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      orderDate: new Date().toISOString().split("T")[0],
      items: [{ productName: "", quantity: 1, price: 0 }],
      paymentMethod: undefined,
      totalAmount: 0,
      shippingAddress: "",
      shippingMethod: undefined,
      notes: "",
    },
  });

  // 计算总金额
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  // 添加商品
  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: "",
      quantity: 1,
      price: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  // 删除商品
  const removeItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((item) => item.id !== id));
    }
  };

  // 更新商品
  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // 提交表单
  const onSubmit = async (data: OrderFormData) => {
    try {
      // 更新商品信息和总金额
      const updatedData = {
        ...data,
        items: orderItems,
        totalAmount: calculateTotal(),
      };

      console.log("订单数据:", updatedData);
      console.log("附件:", attachments);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("订单创建成功！");
      router.push("/orders");
    } catch (error) {
      console.error("提交失败:", error);
      alert("订单创建失败，请重试");
    }
  };

  // 表单步骤
  const steps = [
    { title: "基本信息", description: "客户和订单信息" },
    { title: "商品明细", description: "添加订单商品" },
    { title: "支付配送", description: "支付和配送信息" },
    { title: "完成", description: "确认并提交" },
  ];

  return (
    <FormPage>
      {/* 页面标题 */}
      <FormPageHeader
        title="新建订单"
        description="填写订单信息，为客户创建新订单"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </FormPageHeader>

      {/* 步骤指示器 */}
      <FormSteps
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: 基本信息 */}
        {currentStep === 0 && (
          <>
            <FormSection
              title="客户信息"
              description="填写客户的基本联系信息"
              required
            >
              <FormRow columns={2}>
                <FormFieldGroup
                  label="客户名称"
                  required
                  error={form.formState.errors.customerName?.message}
                >
                  <Input
                    {...form.register("customerName")}
                    placeholder="请输入客户名称"
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="联系电话"
                  required
                  error={form.formState.errors.customerPhone?.message}
                >
                  <Input
                    {...form.register("customerPhone")}
                    placeholder="请输入手机号"
                  />
                </FormFieldGroup>
              </FormRow>

              <FormRow columns={2}>
                <FormFieldGroup
                  label="电子邮箱"
                  error={form.formState.errors.customerEmail?.message}
                >
                  <Input
                    {...form.register("customerEmail")}
                    type="email"
                    placeholder="请输入邮箱地址（选填）"
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="订单日期"
                  required
                  error={form.formState.errors.orderDate?.message}
                >
                  <Input
                    {...form.register("orderDate")}
                    type="date"
                  />
                </FormFieldGroup>
              </FormRow>
            </FormSection>

            <FormSection
              title="订单信息"
              description="自动生成的订单编号"
            >
              <FormFieldGroup
                label="订单号"
                description="系统自动生成，可手动修改"
              >
                <Input
                  {...form.register("orderNumber")}
                  placeholder="订单号"
                  className="font-mono"
                />
              </FormFieldGroup>
            </FormSection>
          </>
        )}

        {/* Step 2: 商品明细 */}
        {currentStep === 1 && (
          <FormSection
            title="商品明细"
            description="添加订单中的商品信息"
            required
          >
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium">商品 #{index + 1}</h4>
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <FormRow columns={3}>
                    <FormFieldGroup label="商品名称" required>
                      <Input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(item.id, "productName", e.target.value)
                        }
                        placeholder="请输入商品名称"
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="数量" required>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        placeholder="数量"
                      />
                    </FormFieldGroup>

                    <FormFieldGroup label="单价（¥）" required>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="单价"
                      />
                    </FormFieldGroup>
                  </FormRow>

                  <div className="mt-2 text-right">
                    <span className="text-sm text-muted-foreground">
                      小计：
                    </span>
                    <span className="text-lg font-semibold text-primary ml-2">
                      ¥{(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                添加商品
              </Button>

              <FormDivider />

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <span className="text-lg font-semibold">订单总金额：</span>
                <span className="text-2xl font-bold text-primary">
                  ¥{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </FormSection>
        )}

        {/* Step 3: 支付配送 */}
        {currentStep === 2 && (
          <>
            <FormSection
              title="支付信息"
              description="选择支付方式"
              required
            >
              <FormRow columns={2}>
                <FormFieldGroup
                  label="支付方式"
                  required
                  error={form.formState.errors.paymentMethod?.message}
                >
                  <Select
                    onValueChange={(value: any) =>
                      form.setValue("paymentMethod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择支付方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="bank">银行转账</SelectItem>
                      <SelectItem value="cash">现金</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldGroup>

                <FormFieldGroup label="订单金额" description="根据商品自动计算">
                  <Input
                    value={`¥${calculateTotal().toFixed(2)}`}
                    disabled
                    className="font-semibold"
                  />
                </FormFieldGroup>
              </FormRow>
            </FormSection>

            <FormSection
              title="配送信息"
              description="填写收货地址和配送方式"
              required
            >
              <FormFieldGroup
                label="配送地址"
                required
                error={form.formState.errors.shippingAddress?.message}
              >
                <Textarea
                  {...form.register("shippingAddress")}
                  placeholder="请输入详细的配送地址"
                  rows={3}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="配送方式"
                required
                error={form.formState.errors.shippingMethod?.message}
              >
                <Select
                  onValueChange={(value: any) =>
                    form.setValue("shippingMethod", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择配送方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">标准配送（3-5天）</SelectItem>
                    <SelectItem value="express">快速配送（1-2天）</SelectItem>
                    <SelectItem value="pickup">到店自提</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldGroup>
            </FormSection>

            <FormSection title="附件上传" description="上传订单相关的文件（发票、合同等）">
              <FileUpload
                maxSize={10}
                maxFiles={5}
                accept="image/*,.pdf,.doc,.docx"
                value={attachments}
                onChange={setAttachments}
                showPreview
              />
            </FormSection>

            <FormSection title="备注信息" description="添加订单备注（选填）">
              <FormFieldGroup label="备注">
                <Textarea
                  {...form.register("notes")}
                  placeholder="请输入订单备注信息"
                  rows={4}
                />
              </FormFieldGroup>
            </FormSection>
          </>
        )}

        {/* Step 4: 确认信息 */}
        {currentStep === 3 && (
          <>
            <FormAlert type="info" title="订单确认">
              请仔细核对订单信息，确认无误后点击"提交订单"按钮。
            </FormAlert>

            <FormSection title="订单摘要">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">订单号</p>
                    <p className="font-mono font-medium">
                      {form.watch("orderNumber")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">订单日期</p>
                    <p className="font-medium">{form.watch("orderDate")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">客户名称</p>
                    <p className="font-medium">{form.watch("customerName")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">联系电话</p>
                    <p className="font-medium">{form.watch("customerPhone")}</p>
                  </div>
                </div>

                <FormDivider />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">商品明细</p>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted rounded"
                      >
                        <span>
                          {index + 1}. {item.productName || "(未命名商品)"}
                        </span>
                        <span>
                          {item.quantity} × ¥{item.price.toFixed(2)} = ¥
                          {(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="text-lg font-semibold">订单总金额：</span>
                  <span className="text-2xl font-bold text-primary">
                    ¥{calculateTotal().toFixed(2)}
                  </span>
                </div>

                <FormDivider />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">支付方式</p>
                    <p className="font-medium">
                      {
                        {
                          alipay: "支付宝",
                          wechat: "微信支付",
                          bank: "银行转账",
                          cash: "现金",
                        }[form.watch("paymentMethod") || ""]
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">配送方式</p>
                    <p className="font-medium">
                      {
                        {
                          standard: "标准配送（3-5天）",
                          express: "快速配送（1-2天）",
                          pickup: "到店自提",
                        }[form.watch("shippingMethod") || ""]
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">配送地址</p>
                  <p className="font-medium">{form.watch("shippingAddress")}</p>
                </div>

                {attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      附件 ({attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file) => (
                        <div
                          key={file.id}
                          className="text-xs bg-muted px-3 py-1.5 rounded"
                        >
                          {file.file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>
          </>
        )}

        {/* 操作按钮 */}
        <FormActions align="between" sticky>
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                上一步
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              取消
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                下一步
              </Button>
            ) : (
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                提交订单
              </Button>
            )}
          </div>
        </FormActions>
      </form>
    </FormPage>
  );
}
