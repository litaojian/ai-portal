"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "选择日期范围",
  className,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(value);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    onChange?.(undefined);
  };

  // 快捷日期选项
  const quickOptions = [
    {
      label: "今天",
      getValue: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      label: "最近 7 天",
      getValue: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 6);
        return { from, to };
      },
    },
    {
      label: "最近 30 天",
      getValue: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 29);
        return { from, to };
      },
    },
    {
      label: "本月",
      getValue: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from, to };
      },
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 bg-background/50 border-border/60",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <span className="flex items-center gap-2">
                {format(date.from, "yyyy/MM/dd", { locale: zhCN })} -{" "}
                {format(date.to, "yyyy/MM/dd", { locale: zhCN })}
                {date && (
                  <X
                    className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleClear}
                  />
                )}
              </span>
            ) : (
              format(date.from, "yyyy/MM/dd", { locale: zhCN })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* 快捷选项 */}
          <div className="flex flex-col gap-1 p-3 border-r">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              快捷选择
            </p>
            {quickOptions.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                size="sm"
                className="justify-start text-sm h-8 font-normal hover:bg-primary/10"
                onClick={() => handleSelect(option.getValue())}
              >
                {option.label}
              </Button>
            ))}

            {date && (
              <>
                <div className="my-1 h-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-sm h-8 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleSelect(undefined)}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  清除
                </Button>
              </>
            )}
          </div>

          {/* 日历 */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={zhCN}
              className="rounded-md"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 紧凑版日期选择器（单日期）
export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "选择日期",
  className,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onChange?.(selectedDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    onChange?.(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 bg-background/50 border-border/60",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span className="flex items-center gap-2">
              {format(date, "yyyy/MM/dd", { locale: zhCN })}
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleClear}
              />
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={zhCN}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
}
