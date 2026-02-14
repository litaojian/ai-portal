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
import { Search, X, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

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
        if (field.type === 'date-range' && Array.isArray(field.defaultValue)) {
          const [startStr, endStr] = field.defaultValue;
          const range: DateRange = { from: undefined, to: undefined };

          const parseDateKeyword = (kw: string) => {
            if (kw === 'yesterday') return new Date(Date.now() - 86400000);
            if (kw === 'today') return new Date();
            return new Date(kw);
          };

          if (startStr) range.from = parseDateKeyword(startStr);
          if (endStr) range.to = parseDateKeyword(endStr);

          defaults[field.key] = range;
        } else if (field.defaultValue === 'yesterday') {
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
                const firstOpt = options[0];
                const isString = typeof firstOpt === 'string';
                const valueKey = field.remoteOptions?.valueKey || 'value';
                const firstVal = isString ? firstOpt : (firstOpt[valueKey] || firstOpt.value);
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
    // Process values: flatten date-ranges
    const processedValues = { ...values };

    config.views.search?.fields.forEach(field => {
      if (field.type === 'date-range' && field.names && field.names.length === 2) {
        const range = values[field.key] as DateRange | undefined;
        if (range) {
          if (range.from) processedValues[field.names[0]] = format(range.from, 'yyyy-MM-dd');
          if (range.to) processedValues[field.names[1]] = format(range.to, 'yyyy-MM-dd');
        }
        // Remove the composite key from output
        delete processedValues[field.key];
      }
    });

    onSearch(processedValues);
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

          // Width handling
          let widthClass = "w-[180px]";
          if (searchField.width === 'sm') widthClass = "w-[120px]";
          if (searchField.width === 'md') widthClass = "w-[240px]";
          if (searchField.width === 'lg') widthClass = "w-[320px]";
          if (searchField.width === 'xl') widthClass = "w-[400px]";

          return (
            <div key={searchField.key} className={`flex flex-col gap-1 ${widthClass}`}>
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
                    {options?.map((opt: any) => {
                      const isString = typeof opt === 'string';
                      const value = isString ? opt : (opt.value || opt[searchField.remoteOptions?.valueKey || 'value']);
                      const label = isString ? opt : (opt.label || opt[searchField.remoteOptions?.labelKey || 'label']);
                      return (
                        <SelectItem key={String(value)} value={String(value)} className="text-xs">
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (fieldDef.type === 'date' || searchField.type === 'date') ? (
                <Input
                  type="date"
                  className="!h-8 w-full !text-xs !px-2"
                  value={values[searchField.key] || ""}
                  onChange={(e) => handleChange(searchField.key, e.target.value)}
                />
              ) : (fieldDef.type === 'date-range' || searchField.type === 'date-range') ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={searchField.key}
                      variant={"outline"}
                      className={cn(
                        "w-full h-8 justify-start text-left font-normal px-2 text-xs",
                        !values[searchField.key] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {values[searchField.key]?.from ? (
                        values[searchField.key].to ? (
                          <>
                            {format(values[searchField.key].from, "y年M月d日", { locale: zhCN })} -{" "}
                            {format(values[searchField.key].to, "y年M月d日", { locale: zhCN })}
                          </>
                        ) : (
                          format(values[searchField.key].from, "y年M月d日", { locale: zhCN })
                        )
                      ) : (
                        <span>选择日期范围</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={values[searchField.key]?.from}
                      selected={values[searchField.key]}
                      onSelect={(val) => handleChange(searchField.key, val)}
                      numberOfMonths={2}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
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
