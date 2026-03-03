'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { FieldDefinition } from '@/lib/schemas/page-config';

type ComboboxOption = {
  label: string;
  value: string;
  extra?: Record<string, unknown>;
  raw: Record<string, unknown>;
};

interface ComboboxFieldProps {
  field: FieldDefinition;
  value: string | null | undefined;
  onChange: (value: string) => void;
  onExtraChange?: (extra: Record<string, unknown>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ComboboxField({
  field,
  value,
  onChange,
  onExtraChange,
  disabled,
  placeholder,
}: ComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState<string | null>(null);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [fetching, setFetching] = useState(!!field.datasource);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!field.datasource) return;
    fetch(field.datasource)
      .then((r) => r.json())
      .then((data) => {
        const raw: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.data ?? []);
        const lk = field.labelKey;
        const vk = field.valueKey;
        setOptions(
          raw.map((item) => ({
            label: String(lk ? item[lk] : (item['label'] ?? item['name'] ?? item)),
            value: String(vk ? item[vk] : (item['value'] ?? item['id'] ?? item)),
            extra: item['extra'] as Record<string, unknown> | undefined,
            raw: item,
          }))
        );
        setFetching(false);
      })
      .catch((err) => {
        console.error(err);
        setFetching(false);
      });
  }, [field.datasource, field.labelKey, field.valueKey]);

  const selectedLabel = options.find((o) => o.value === String(value ?? ''))?.label ?? '';
  const inputValue = searchInput !== null ? searchInput : selectedLabel;

  const filtered = options.filter((o) =>
    searchInput ? o.label.toLowerCase().includes(searchInput.toLowerCase()) : true
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const close = () => {
    setOpen(false);
    setSearchInput(null);
    setActiveIndex(-1);
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    if (onExtraChange && option.extra) onExtraChange(option.extra);
    close();
  };

  // Auto-highlight: compute new filtered immediately to set activeIndex=0
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const next = options.filter((o) =>
      q ? o.label.toLowerCase().includes(q.toLowerCase()) : true
    );
    setSearchInput(q);
    setOpen(true);
    setActiveIndex(next.length > 0 ? 0 : -1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { close(); return; }
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) handleSelect(filtered[activeIndex]);
    }
  };

  const displayFields = field.displayFields;
  const hasHeaders = displayFields?.some((df) => df.label);

  return (
    <Popover
      open={open && filtered.length > 0}
      onOpenChange={(o) => { if (!o) close(); }}
    >
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          value={fetching ? '' : inputValue}
          placeholder={fetching ? '加载中...' : (placeholder ?? '请选择或搜索')}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          disabled={disabled || fetching}
          className="h-9 text-sm"
        />
      </PopoverAnchor>

      <PopoverContent
        className="p-0 overflow-hidden"
        style={{
          width: 'var(--radix-popover-trigger-width)',
          maxHeight: 'calc(var(--radix-popover-content-available-height) - 8px)',
        }}
        align="start"
        sideOffset={4}
        // Keep focus on Input when clicking inside the dropdown
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={close}
      >
        <div role="listbox" className="overflow-auto h-full">
          {hasHeaders && (
            <div className="flex gap-3 px-2 py-1 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-popover">
              <span className="w-4 shrink-0" />
              {displayFields!.map((df) => (
                <span key={df.key} className={cn('truncate', df.width ?? 'flex-1')}>
                  {df.label ?? df.key}
                </span>
              ))}
            </div>
          )}
          {filtered.map((o, index) => (
            <div
              key={o.value}
              ref={(el) => { itemRefs.current[index] = el; }}
              role="option"
              aria-selected={String(value ?? '') === o.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(o)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex items-center px-2 py-1.5 mx-1 my-0.5 rounded-sm cursor-pointer text-sm select-none',
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4 shrink-0',
                  String(value ?? '') === o.value ? 'opacity-100' : 'opacity-0'
                )}
              />
              {displayFields ? (
                <div className="flex gap-3 flex-1 min-w-0">
                  {displayFields.map((df) => (
                    <span key={df.key} className={cn('truncate text-sm', df.width ?? 'flex-1')}>
                      {String(o.raw[df.key] ?? '')}
                    </span>
                  ))}
                </div>
              ) : (
                o.label
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
