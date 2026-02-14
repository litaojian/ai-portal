import { z } from "zod";

// --- 基础字段定义 ---
export const FieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "date-range",
  "datetime",
  "select",
  "boolean",
  "textarea",
  "json",
  // 可以在此扩展更多类型，如 'image', 'user-picker' 等
]);

export const ValidationSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
});

export const SelectOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  color: z.string().optional(), // 用于 Badge 渲染
});

export const FieldSchema = z.object({
  label: z.string(),
  type: FieldTypeSchema,
  hidden: z.boolean().optional(),
  primaryKey: z.boolean().optional(),
  options: z.array(SelectOptionSchema).optional(), // 仅 select 类型有效
  format: z.string().optional(), // 如 'currency', 'percentage'
  defaultValue: z.any().optional(),
  validation: ValidationSchema.optional(),
});

// --- 视图配置 ---
const ConditionValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number()])),
  z.object({
    operator: z.enum(["in", "nin", "eq", "ne", "gt", "lt", "ge", "le"]),
    value: z.any()
  })
]);

const RowActionSchema = z.union([
  z.string(),
  z.object({
    action: z.string(),
    title: z.string().optional(),
    icon: z.string().optional(),
    conditions: z.record(z.string(), ConditionValueSchema).optional(),
  })
]);

export const TableColumnSchema = z.object({
  key: z.string(),
  label: z.string().optional(), // 覆盖 model 中的 label
  width: z.number().optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  sortable: z.boolean().optional(),
  copyable: z.boolean().optional(),
  component: z.string().optional(), // 强制指定渲染组件，如 'badge', 'link'
  hidden: z.boolean().optional(), // 在表格中默认隐藏
  permissions: z.array(z.string()).optional(), // 列级别的权限控制 (e.g. ['ADMIN'])
  align: z.enum(["left", "center", "right"]).optional(),
  summaryType: z.enum(["sum", "avg", "count", "label"]).optional(),
  summaryText: z.string().optional(),
});

export const SearchFieldSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  width: z.string().optional(), // 'sm' | 'md' | 'lg' | 'xl' or custom class
  component: z.string().optional(), // 如 'date-range'
  type: FieldTypeSchema.optional(), // Allow overriding type in search
  defaultValue: z.any().optional(),

  // For date-range, map to separate start/end fields
  names: z.array(z.string()).optional(),

  // Custom options for select types in search (overrides model definition)
  options: z.array(SelectOptionSchema).optional(),
  remoteOptions: z.object({
    api: z.string(),
    labelKey: z.string(),
    valueKey: z.string(),
  }).optional(),
  required: z.boolean().optional(),
});

export const FormSectionSchema = z.object({
  title: z.string().optional(),
  fields: z.array(
    z.union([
      z.string(), // 简写，直接引用 key
      z.object({
        key: z.string(),
        colSpan: z.number().optional(),
        component: z.string().optional(),
      }),
    ])
  ),
});

// --- 权限配置 ---
export const PermissionConfigSchema = z.object({
  view: z.array(z.string()).optional(), // 谁能看
  create: z.array(z.string()).optional(), // 谁能建
  update: z.array(z.string()).optional(), // 谁能改
  delete: z.array(z.string()).optional(), // 谁能删
  export: z.array(z.string()).optional(), // 谁能导出
});

// --- 根配置 ---
export const PageConfigSchema = z.object({
  meta: z.object({
    key: z.string(),
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    api: z.string().optional(),
  }),
  permissions: PermissionConfigSchema.optional(),
  model: z.object({
    fields: z.record(z.string(), FieldSchema),
  }),
  views: z.object({
    search: z.object({
      fields: z.array(SearchFieldSchema),
      showReset: z.boolean().optional(),
    }).optional(),
    table: z.object({
      size: z.enum(["default", "small"]).optional(),
      scroll: z.number().optional(),
      summary: z.boolean().optional(),
      rownum: z.boolean().optional(),
      checkbox: z.boolean().optional(),
      columns: z.array(TableColumnSchema),
      actions: z.object({
        row: z.array(RowActionSchema).optional(),
        toolbar: z.array(
          z.union([
            z.string(),
            z.object({
              title: z.string(),
              action: z.string(),
              icon: z.string().optional(),
              variant: z.string().optional(),
            })
          ])
        ).optional(),
      }).optional(),
      pagination: z.object({
        enabled: z.boolean().optional(),
        pageSize: z.number().optional(),
      }).optional(),
    }),
    form: z.object({
      layout: z.enum(["stack", "grid"]).optional(),
      columns: z.number().optional(),
      sections: z.array(FormSectionSchema),
    }).optional(),
  }),
});

// 导出 TypeScript 类型
export type PageConfig = z.infer<typeof PageConfigSchema>;
export type FieldDefinition = z.infer<typeof FieldSchema>;
export type TableColumnDefinition = z.infer<typeof TableColumnSchema>;
