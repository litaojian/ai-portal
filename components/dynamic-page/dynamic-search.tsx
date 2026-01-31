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
}

export function DynamicSearch({ config, onSearch, onReset }: DynamicSearchProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  // Only render if search fields are configured
  if (!config.views.search?.fields || config.views.search.fields.length === 0) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(values);
  };

  const handleReset = () => {
    setValues({});
    onReset();
  };

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSearch} className="mb-4">
      <div className="flex flex-wrap items-end gap-4">
        {config.views.search.fields.map((searchField) => {
          const fieldDef = config.model.fields[searchField.key];
          if (!fieldDef) return null;

          return (
            <div key={searchField.key} className="flex flex-col gap-1 w-[180px]">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap block">
                {searchField.label || fieldDef.label}
              </label>
              
              {fieldDef.type === 'select' ? (
                <Select
                  value={values[searchField.key] || "all"}
                  onValueChange={(val) => handleChange(searchField.key, val === "all" ? undefined : val)}
                >
                  <SelectTrigger className="!h-8 w-full !text-xs !py-1">
                    <SelectValue placeholder={searchField.placeholder || "全部"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">全部</SelectItem>
                    {fieldDef.options?.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : fieldDef.type === 'date' ? (
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
          <Button type="submit" size="sm" className="h-8 px-4">
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
