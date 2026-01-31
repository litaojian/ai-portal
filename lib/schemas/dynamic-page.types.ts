// types/config.types.ts
export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'richText' | 'file';
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean;
  };
  ui?: {
    width?: string;
    placeholder?: string;
    showInTable?: boolean;
    showInForm?: boolean;
  };
}

export interface ActionConfig {
  id: string;
  name: string;
  type: 'create' | 'edit' | 'delete' | 'export' | 'custom';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  confirmation?: string;
  permissions?: string[];
}

export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  description?: string;
  modelName: string;
  fields: FieldConfig[];
  actions: ActionConfig[];
  permissions?: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
  };
  ui?: {
    layout?: 'table' | 'card' | 'list';
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}