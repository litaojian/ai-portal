"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface QuickFilter {
  value: string;
  label: string;
  count?: number;
}

export interface ListFiltersConfig {
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  quickFilters?: QuickFilter[];
  showDateRange?: boolean;
  customFilters?: React.ReactNode;
  onSearch?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onQuickFilterChange?: (values: string[]) => void;
  onReset?: () => void;
}

export function ListFilters({
  searchPlaceholder = "搜索...",
  statusOptions = [],
  quickFilters = [],
  showDateRange = false,
  customFilters,
  onSearch,
  onStatusChange,
  onQuickFilterChange,
  onReset,
}: ListFiltersConfig) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onStatusChange?.(value);
  };

  const toggleQuickFilter = (value: string) => {
    const newFilters = selectedQuickFilters.includes(value)
      ? selectedQuickFilters.filter((f) => f !== value)
      : [...selectedQuickFilters, value];

    setSelectedQuickFilters(newFilters);
    onQuickFilterChange?.(newFilters);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatus("all");
    setSelectedQuickFilters([]);
    onReset?.();
  };

  const hasActiveFilters = searchTerm || status !== "all" || selectedQuickFilters.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 搜索和状态筛选行 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 搜索框 */}
            <div className="md:col-span-5">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9 h-10 bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 状态筛选 */}
            {statusOptions.length > 0 && (
              <div className="md:col-span-3">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-10 bg-background/50 border-border/60">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 自定义筛选器插槽 */}
            {customFilters && (
              <div className="md:col-span-4">
                {customFilters}
              </div>
            )}
          </div>

          {/* 快捷筛选标签 */}
          {quickFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium mr-2">
                快速筛选：
              </span>
              {quickFilters.map((filter) => (
                <Badge
                  key={filter.value}
                  variant={selectedQuickFilters.includes(filter.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    selectedQuickFilters.includes(filter.value)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleQuickFilter(filter.value)}
                >
                  {filter.label}
                  {filter.count !== undefined && (
                    <span className="ml-1.5 opacity-70">({filter.count})</span>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* 操作按钮行 */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <span className="text-xs text-muted-foreground">
                  已应用 {selectedQuickFilters.length + (status !== "all" ? 1 : 0) + (searchTerm ? 1 : 0)} 个筛选条件
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  重置
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                高级筛选
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
