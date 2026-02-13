"use client";

import { useState } from "react";
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
    FormSection,
    FormRow,
    FormFieldGroup,
    FormSteps,
    FormDivider,
    FormAlert,
} from "@/components/common/form-layout";
import { FileUpload, type UploadedFile } from "@/components/common/file-upload"; // Assuming this exists or I'll need to check imports. The original file imported it.
import { Plus, X, Save } from "lucide-react";

// Check if these components exist or are local to the page.
// The original file imported them from "@/components/common/form-layout" and "@/components/common/file-upload".
// I will assume they are available.

// 表单验证 Schema
const orderFormSchema = z.object({
    // 基本信息
    orderNumber: z.string().min(1, "订单号不能为空"),
    customerName: z.string().min(2, "客户名称至少2个字符"),
    customerPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
    customerEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
    orderDate: z.string().min(1, "请选择订单日期"),

    // 商品信息
    // items array managed separately in state for complex dynamic fields, or could be in form.
    // The original managed items in state but also had schema validation for items?
    // Original schema:
    /*
    items: z.array(z.object({
          productName: z.string().min(1, "商品名称不能为空"),
          quantity: z.number().min(1, "数量至少为1"),
          price: z.number().min(0, "单价不能为负数"),
        })).min(1, "至少添加一个商品"),
    */
    // For simplicity in this extraction, I'll keep the state-based items logic if that's how it was,
    // but usually it's better to use useFieldArray. The original used state `orderItems`.
    // I will follow the original implementation pattern.

    // 支付信息
    paymentMethod: z.enum(["alipay", "wechat", "bank", "cash"]),

    // 配送信息
    shippingAddress: z.string().min(5, "配送地址至少5个字符"),
    shippingMethod: z.enum(["standard", "express", "pickup"]),

    // 备注
    notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
}

interface OrderFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([
        { id: "1", productName: "", quantity: 1, price: 0 },
    ]);
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            orderNumber: `ORD-${Date.now()}`,
            customerName: "",
            customerPhone: "",
            customerEmail: "",
            orderDate: new Date().toISOString().split("T")[0],
            // items: not in defaultValues for simple fields, but we should validate them manually or add to schema
            paymentMethod: undefined,
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
        // Manual validation for items
        const invalidItems = orderItems.some(i => !i.productName || i.quantity <= 0 || i.price < 0);
        if (invalidItems) {
            alert("请完善商品信息");
            return;
        }

        try {
            setIsSubmitting(true);
            // 更新商品信息和总金额
            const updatedData = {
                ...data,
                items: orderItems,
                totalAmount: calculateTotal(),
                attachments: attachments,
            };

            console.log("订单数据:", updatedData);

            // 模拟API调用
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // alert("订单创建成功！");
            onSuccess?.();
        } catch (error) {
            console.error("提交失败:", error);
            alert("订单创建失败，请重试");
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { title: "基本信息", description: "客户和订单信息" },
        { title: "商品明细", description: "添加订单商品" },
        { title: "支付配送", description: "支付和配送信息" },
        { title: "完成", description: "确认并提交" },
    ];

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* 步骤指示器 - Compact version for Modal */}
            <div className="mb-6 px-1">
                <FormSteps
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={(step) => setCurrentStep(step)}
                    className="mb-0"
                />
            </div>

            <div className="flex-1 overflow-y-auto px-1 pr-2">
                <form id="order-form" onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Step 1: 基本信息 */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <FormSection
                                title="客户信息"
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
                            >
                                <FormFieldGroup
                                    label="订单号"
                                    description="系统自动生成"
                                >
                                    <Input
                                        {...form.register("orderNumber")}
                                        placeholder="订单号"
                                        className="font-mono bg-muted/50"
                                        readOnly
                                    />
                                </FormFieldGroup>
                            </FormSection>
                        </div>
                    )}

                    {/* Step 2: 商品明细 */}
                    {currentStep === 1 && (
                        <FormSection
                            title="商品明细"
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
                        <div className="space-y-6">
                            <FormSection
                                title="支付信息"
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
                                            defaultValue={form.getValues("paymentMethod")}
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

                                    <FormFieldGroup label="订单金额">
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
                                        defaultValue={form.getValues("shippingMethod")}
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

                            <FormSection title="附件上传">
                                <FileUpload
                                    maxSize={10}
                                    maxFiles={5}
                                    accept="image/*,.pdf,.doc,.docx"
                                    value={attachments}
                                    onChange={setAttachments}
                                    showPreview
                                />
                            </FormSection>

                            <FormSection title="备注信息">
                                <FormFieldGroup label="备注">
                                    <Textarea
                                        {...form.register("notes")}
                                        placeholder="请输入订单备注信息"
                                        rows={3}
                                    />
                                </FormFieldGroup>
                            </FormSection>
                        </div>
                    )}

                    {/* Step 4: 确认信息 */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <FormAlert type="info" title="订单确认">
                                请仔细核对订单信息，确认无误后点击"提交订单"按钮。
                            </FormAlert>

                            <FormSection title="订单摘要">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">订单号</p>
                                            <p className="font-mono font-medium">
                                                {form.getValues("orderNumber")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">订单日期</p>
                                            <p className="font-medium">{form.getValues("orderDate")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">客户名称</p>
                                            <p className="font-medium">{form.getValues("customerName")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">联系电话</p>
                                            <p className="font-medium">{form.getValues("customerPhone")}</p>
                                        </div>
                                    </div>

                                    <FormDivider />

                                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                                        <span className="text-lg font-semibold">订单总金额：</span>
                                        <span className="text-2xl font-bold text-primary">
                                            ¥{calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </FormSection>
                        </div>
                    )}
                </form>
            </div>

            <div className="mt-6 flex justify-between pt-4 border-t">
                <div>
                    {currentStep > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={isSubmitting}
                        >
                            上一步
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>

                    {currentStep < steps.length - 1 ? (
                        <Button
                            type="button"
                            onClick={async () => {
                                const fieldsToValidate = [
                                    ['customerName', 'customerPhone', 'orderDate'], // Step 0
                                    [], // Step 1 (manual)
                                    ['paymentMethod', 'shippingAddress', 'shippingMethod'], // Step 2
                                ];

                                if (currentStep === 1) {
                                    const invalidItems = orderItems.some(i => !i.productName || i.quantity <= 0 || i.price < 0);
                                    if (invalidItems) {
                                        alert("请完善商品信息");
                                        return;
                                    }
                                    setCurrentStep(currentStep + 1);
                                } else {
                                    const isValid = await form.trigger(fieldsToValidate[currentStep] as any);
                                    if (isValid) {
                                        setCurrentStep(currentStep + 1);
                                    }
                                }
                            }}
                        >
                            下一步
                        </Button>
                    ) : (
                        <Button type="submit" className="gap-2" form="order-form" disabled={isSubmitting}>
                            <Save className="w-4 h-4" />
                            {isSubmitting ? "提交中..." : "提交订单"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
