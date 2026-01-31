"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FieldDefinition } from "@/lib/schemas/page-config";

// --- Cell Renderer Interface ---
export interface CellRendererProps {
  value: any;
  field: FieldDefinition;
  config?: any; // Extra config passed from column component prop
}

// --- Built-in Renderers (Plugins) ---

const TextRenderer = ({ value }: CellRendererProps) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return <span>{String(value)}</span>;
};

const NumberRenderer = ({ value, field }: CellRendererProps) => {
  if (typeof value !== "number") return <span className="text-muted-foreground">-</span>;
  
  if (field.format === "currency") {
    return (
      <span className="font-mono">
        {new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value)}
      </span>
    );
  }
  
  if (field.format === "percentage") {
    return <span>{(value * 100).toFixed(2)}%</span>;
  }

  return <span>{value}</span>;
};

const DateRenderer = ({ value }: CellRendererProps) => {
  if (!value) return <span className="text-muted-foreground">-</span>;
  try {
    return <span>{format(new Date(value), "yyyy-MM-dd")}</span>;
  } catch {
    return <span>{String(value)}</span>;
  }
};

const BadgeRenderer = ({ value, field }: CellRendererProps) => {
  if (!field.options) return <span>{value}</span>;
  
  const option = field.options.find((opt) => opt.value === value);
  if (!option) return <span>{value}</span>;

  // Simple color mapping
  const colorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    red: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    gray: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  };

  const className = option.color ? colorMap[option.color] : "";

  return (
    <Badge variant="outline" className={className}>
      {option.label}
    </Badge>
  );
};

// --- Registry Core ---

type RendererComponent = React.ComponentType<CellRendererProps>;

const registry: Record<string, RendererComponent> = {
  text: TextRenderer,
  textarea: TextRenderer, // Reuse text for textarea in table
  number: NumberRenderer,
  date: DateRenderer,
  datetime: DateRenderer, // Simplify for now
  select: BadgeRenderer, // Default select to badge in table
  boolean: ({ value }) => <Badge variant={value ? "default" : "secondary"}>{value ? "是" : "否"}</Badge>,
};

// --- API ---

export function registerCellRenderer(type: string, component: RendererComponent) {
  registry[type] = component;
}

export function getCellRenderer(type: string, specificComponent?: string): RendererComponent {
  // If a specific component is requested (e.g. 'link', 'image'), try to find it
  if (specificComponent && registry[specificComponent]) {
    return registry[specificComponent];
  }
  
  // Otherwise fallback to field type
  return registry[type] || TextRenderer;
}
