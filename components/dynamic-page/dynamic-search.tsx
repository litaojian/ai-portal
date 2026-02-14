"use client";

import React, { useState } from "react";
import { PageConfig } from "@/lib/schemas/page-config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface DynamicSearchProps {
  config: PageConfig;
  onSearch: (values: Record<string, any>) => void;
  onReset: () => void;
  loading?: boolean;
}

export function DynamicSearch({ config, onSearch, onReset, loading }: DynamicSearchProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [remoteOptions, setRemoteOptions] = useState<Record<string, any[]>>({});

  // Initialize defaults and fetch remote options
  React.useEffect(() => {
    if (!config.views.search?.fields) return;

    const defaults: Record<string, any> = {};
    const remoteFetches: Promise<void>[] = [];

    config.views.search.fields.forEach(field => {
      // Handle Default Value
      if (field.defaultValue !== undefined) {
        if (field.defaultValue === 'yesterday') {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          defaults[field.key] = yesterday;
        } else if (field.defaultValue === 'today') {
          const today = new Date().toISOString().split('T')[0];
          defaults[field.key] = today;
        } else {
          defaults[field.key] = field.defaultValue;
        }
      }

      // Handle Remote Options
      if (field.remoteOptions) {
        const fetchPromise = async () => {
          try {
            const res = await fetch(field.remoteOptions!.api);
            if (res.ok) {
              const data = await res.json();
              const options = Array.isArray(data) ? data : (data.data || []);

              setRemoteOptions(prev => ({
                ...prev,
                [field.key]: options
              }));

              // Auto-select first option if required and no default value
              if (field.required && !defaults[field.key] && options.length > 0) {
                const valueKey = field.remoteOptions?.valueKey || 'value';
                const firstVal = options[0][valueKey] || options[0].value;
                // We need to update 'values' state eventually.
                // Since we are inside useEffect, we can't easily update 'defaults' local var used below.
                // But we can update the state directly.
                setValues(prev => ({
                  ...prev,
                  [field.key]: String(firstVal)
                }));
              }
            }
          } catch (e) {
            console.error(`Failed to fetch remote options for ${field.key}`, e);
          }
        };
        remoteFetches.push(fetchPromise());
      }
    });

    setValues(defaults);

    // Trigger initial search with defaults if needed? 
    // Usually user clicks search, but for reports seeing empty page is annoying.
    // Let's not auto-search for now to avoid side effects, or check if onSearch can be called.
    // If we want auto-load, PageBuilder handles 'list' mode load, but it uses 'searchParams'.
    // If we want these defaults to apply to the initial list load in PageBuilder, 
    // PageBuilder should probably be aware of them or we should trigger onSearch on mount.
    // However, PageBuilder loads data on mount. If we want it to use these filters, 
    // we should bubble them up. 
    // For now, let's just set the form values. User sees them, can click Search.

    if (remoteFetches.length > 0) {
      Promise.all(remoteFetches);
    }

  }, [config]);

  // Only render if search fields are configured
  if (!config.views.search?.fields || config.views.search.fields.length === 0) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(values);
  };

  const handleReset = () => {
    const defaults: Record<string, any> = {};
    config.views.search?.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        if (field.defaultValue === 'yesterday') {
          defaults[field.key] = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        } else if (field.defaultValue === 'today') {
          defaults[field.key] = new Date().toISOString().split('T')[0];
        } else {
          defaults[field.key] = field.defaultValue;
        }
      }
    });
    setValues(defaults);
    onReset(); // This usually clears params in PageBuilder. 
    // If we want to reset TO defaults, we might need onSearch(defaults).
    // Let's stick to simple reset for now, but update state to defaults.
  };

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="flex flex-wrap items-end gap-4">
        {config.views.search.fields.map((searchField) => {
          // Fallback to model field def, OR create a transient one if allowed
          const fieldDef = config.model.fields[searchField.key] || {
            type: searchField.type || 'text',
            label: searchField.label || searchField.key
          };

          // Determine options: remote > search config > model config
          const options = remoteOptions[searchField.key] || searchField.options || fieldDef.options;

          return (
            <div key={searchField.key} className="flex flex-col gap-1 w-[180px]">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap block">
                {searchField.label || fieldDef.label}
              </label>

              {fieldDef.type === 'select' || searchField.type === 'select' ? (
                <Select
                  value={values[searchField.key] || "all"}
                  onValueChange={(val) => handleChange(searchField.key, val === "all" ? undefined : val)}
                >
                  <SelectTrigger className="!h-8 w-full !text-xs !py-1">
                    <SelectValue placeholder={searchField.placeholder || "全部"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">全部</SelectItem>
                    {options?.map((opt: any) => (
                      <SelectItem key={String(opt.value || opt[searchField.remoteOptions?.valueKey || 'value'])} value={String(opt.value || opt[searchField.remoteOptions?.valueKey || 'value'])} className="text-xs">
                        {opt.label || opt[searchField.remoteOptions?.labelKey || 'label']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (fieldDef.type === 'date' || searchField.type === 'date') ? (
                <Input
                  type="date"
                  className="!h-8 w-full !text-xs !px-2"
                  value={values[searchField.key] || ""}
                  onChange={(e) => handleChange(searchField.key, e.target.value)}
                />
              ) : (
                <Input
                  placeholder={searchField.placeholder || `请输入`}
                  className="!h-8 w-full !text-xs !px-2"
                  value={values[searchField.key] || ""}
                  onChange={(e) => handleChange(searchField.key, e.target.value)}
                />
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-2 ml-auto">
          <Button type="submit" size="sm" className="h-8 px-4" loading={loading}>
            <Search className="mr-2 h-3.5 w-3.5" />
            查询
          </Button>
          {config.views.search?.showReset && (
            <Button type="button" variant="outline" size="sm" className="h-8 px-4" onClick={handleReset}>
              <X className="mr-2 h-3.5 w-3.5" />
              重置
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
