import { z } from "zod";

// --- 基础字段定义 ---
export const FieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "date-range",
  "datetime",
  "select",
  "radio",
  "combobox",
  "boolean",
  "textarea",
  "json",
  "video",
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
  disabled: z.boolean().optional(),
  readonly: z.boolean().optional(),
  clearable: z.boolean().optional(),
  primaryKey: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(SelectOptionSchema).optional(),
  format: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: ValidationSchema.optional(),
  datasource: z.string().optional(), // for combobox: remote options API path
  dependencies: z.array(z.string()).optional(), // Fields this one depends on (triggers reload)
  labelKey: z.string().optional(),   // combobox: which field in response to use as label
  valueKey: z.string().optional(),   // combobox: which field in response to use as value
  displayFields: z.array(z.object({
    key: z.string(),
    label: z.string().optional(),
    width: z.string().optional(),    // e.g. "w-24", "flex-1"
  })).optional(),                    // combobox: columns to show in dropdown
  fieldMapping: z.record(z.string(), z.string()).optional(), // combobox: map data source fields to form fields
  onChange: z.array(z.object({
    action: z.enum(["setField", "updateJsonField"]),
    target: z.string(),           // target field name to update
    jsonPath: z.string().optional(), // for updateJsonField: the JSON key path to update
    value: z.string().optional(), // template string; use {{value}} for the current field value
  })).optional(),                 // actions to trigger when this field value changes
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
    dialogConfig: z.string().optional(), // Path to view dialog config JSON (relative to config/pages/)
    conditions: z.record(z.string(), ConditionValueSchema).optional(),
  })
]);

export const TableColumnSchema = z.object({
  key: z.string(),
  label: z.string().optional(), // 覆盖 model 中的 label
  path: z.string().optional(), // 支持嵌套路径，如 'contract.quoteAmount'
  width: z.union([z.number(), z.string()]).optional(),
  minWidth: z.union([z.number(), z.string()]).optional(),
  maxWidth: z.union([z.number(), z.string()]).optional(),
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
  clearable: z.boolean().optional(),
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
  labelLayout: z.enum(["vertical", "horizontal"]).optional(),
  labelWidth: z.string().optional(),
  fields: z.array(
    z.union([
      z.string(),
      z.object({
        key: z.string(),
        label: z.string().optional(),
        colSpan: z.number().optional(),
        component: z.string().optional(),
        type: z.string().optional(),       // view-level type override (e.g. "combobox")
        datasource: z.string().optional(), // view-level datasource override
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
    defaultView: z.enum(["list", "form"]).optional(), // Renamed from default_view to camelCase
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
        mode: z.enum(['server', 'client']).optional(),
      }).optional(),
    }),
    form: z.object({
      layout: z.enum(["stack", "grid"]).optional(),
      columns: z.number().optional(),
      width: z.string().optional(),
      labelLayout: z.enum(["vertical", "horizontal"]).optional(),
      labelWidth: z.string().optional(),
      sections: z.array(FormSectionSchema),
      submitButton: z.object({
        title: z.string().optional(),
        loadingTitle: z.string().optional(),
        icon: z.string().optional(),
        hidden: z.boolean().optional(),
        variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
      }).optional(),
      extraButtons: z.array(z.object({
        action: z.string(),
        title: z.string(),
        loadingTitle: z.string().optional(),
        api: z.string().optional(),
        method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
        bodyFields: z.array(z.string()).optional(),
        resultPath: z.string().optional(),
        copyResult: z.boolean().optional(),
        validateRequired: z.boolean().optional(),
        variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
        editOnly: z.boolean().optional(),
      })).optional(),
    }).optional(),
  }),
});

// 导出 TypeScript 类型
export type PageConfig = z.infer<typeof PageConfigSchema>;
export type FieldDefinition = z.infer<typeof FieldSchema>;
export type TableColumnDefinition = z.infer<typeof TableColumnSchema>;
