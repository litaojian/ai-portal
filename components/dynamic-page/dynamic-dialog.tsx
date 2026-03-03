'use client';

import { useState } from 'react';
import { PageConfig, FieldDefinition } from '@/lib/schemas/page-config';
import { ActionDialogConfig, ActionDialogButton, ActionDialogFieldItem } from '@/lib/schemas/dynamic-dialog-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface DynamicDialogProps {
  formConfig: ActionDialogConfig;
  pageConfig: PageConfig;
  data: Record<string, unknown>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function resolveField(item: ActionDialogFieldItem) {
  return typeof item === 'string' ? { key: item } : item;
}

function formatReadOnly(value: unknown, fieldDef: FieldDefinition): string {
  if (value === null || value === undefined || value === '') return '—';
  if (fieldDef.type === 'select' && fieldDef.options) {
    const opt = fieldDef.options.find((o) => o.value === value);
    return opt ? opt.label : String(value);
  }
  if (fieldDef.type === 'boolean') return value ? '是' : '否';
  return String(value);
}

// Auto-generate select options by splitting a comma-separated string value.
function autoOptions(raw: unknown) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => ({ label: v, value: v }));
}

// ── result / error blocks ────────────────────────────────────────────────────

function ResultBlock({ result }: { result: unknown }) {
  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  return (
    <pre className="mt-3 rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto border">
      {text}
    </pre>
  );
}

// ── action button ────────────────────────────────────────────────────────────

function ActionButton({
  btn,
  data,
}: {
  btn: ActionDialogButton;
  data: Record<string, unknown>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body = {
        ...(btn.bodyFields
          ? Object.fromEntries(btn.bodyFields.map((k) => [k, data[k]]))
          : data),
        ...(btn.params ?? {}),
      };

      const res = await fetch(btn.api, {
        method: btn.method ?? 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json ? JSON.stringify(json, null, 2) : `HTTP ${res.status}`);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {btn.label}
      </Button>
      {result !== null && <ResultBlock result={result} />}
      {error !== null && (
        <pre className="mt-3 rounded-md bg-destructive/10 text-destructive p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto border border-destructive/20">
          {error}
        </pre>
      )}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export function DynamicDialog({ formConfig, pageConfig, data }: DynamicDialogProps) {
  // Collect all editable field items (not just keys) so we can compute defaults.
  const editableItems = formConfig.sections
    .flatMap((s) => s.fields)
    .filter((item): item is Exclude<ActionDialogFieldItem, string> =>
      typeof item !== 'string' && !!item.editable
    );

  const [editValues, setEditValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    for (const item of editableItems) {
      const { key, type: typeOverride, options: staticOptions } = item;
      const fieldDef = pageConfig.model.fields[key];
      const effectiveType = typeOverride ?? fieldDef?.type ?? 'text';
      const rawValue = data[key];

      if (effectiveType === 'select' || effectiveType === 'radio') {
        const opts =
          staticOptions ??
          (fieldDef?.options
            ? fieldDef.options.map((o) => ({ label: o.label, value: String(o.value) }))
            : autoOptions(data[key]));
        // Use rawValue only if it exactly matches one of the option values,
        // otherwise fall back to the first option (e.g. rawValue is a comma-joined string).
        const matched = opts.find((o) => o.value === String(rawValue ?? ''));
        defaults[key] = matched?.value ?? opts[0]?.value ?? '';
      } else if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        defaults[key] = rawValue;
      } else {
        defaults[key] = '';
      }
    }
    return defaults;
  });

  const mergedData = { ...data, ...editValues };

  const setField = (key: string, value: unknown) =>
    setEditValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {formConfig.sections.map((section, si) => (
        <div key={si}>
          {section.title && (
            <h3 className="text-sm font-medium text-muted-foreground mb-3 pb-1 border-b">
              {section.title}
            </h3>
          )}
          <div
            className="grid gap-x-6 gap-y-4"
            style={{ gridTemplateColumns: `repeat(${section.columns ?? 2}, minmax(0, 1fr))` }}
          >
            {section.fields.map((item, fi) => {
              const { key, label: labelOverride, editable, type: typeOverride, options: staticOptions } =
                resolveField(item);
              const fieldDef = pageConfig.model.fields[key];
              const label = labelOverride ?? fieldDef?.label ?? key;

              if (editable) {
                const effectiveType = typeOverride ?? fieldDef?.type ?? 'text';
                const value = editValues[key] ?? '';

                if (effectiveType === 'select') {
                  const options =
                    staticOptions ??
                    (fieldDef?.options
                      ? fieldDef.options.map((o) => ({ label: o.label, value: String(o.value) }))
                      : autoOptions(data[key]));

                  return (
                    <div key={fi} className="space-y-1">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <Select value={String(value)} onValueChange={(v) => setField(key, v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (effectiveType === 'radio') {
                  const options =
                    staticOptions ??
                    (fieldDef?.options
                      ? fieldDef.options.map((o) => ({ label: o.label, value: String(o.value) }))
                      : autoOptions(data[key]));

                  return (
                    <div key={fi} className="space-y-1">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {options.map((o) => (
                          <label key={o.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name={`radio-${key}`}
                              value={o.value}
                              checked={String(value) === o.value}
                              onChange={() => setField(key, o.value)}
                              className="accent-primary"
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (effectiveType === 'textarea') {
                  return (
                    <div key={fi} className="space-y-1">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <Textarea
                        className="text-sm min-h-[80px]"
                        value={String(value)}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  );
                }

                return (
                  <div key={fi} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <Input
                      className="h-8 text-sm"
                      value={String(value)}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  </div>
                );
              }

              // Read-only
              if (!fieldDef) return null;
              return (
                <div key={fi} className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium break-words">
                    {formatReadOnly(data[key], fieldDef)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {formConfig.buttons && formConfig.buttons.length > 0 && (
        <div className="space-y-4 pt-2 border-t">
          {formConfig.buttons.map((btn, idx) => (
            <ActionButton key={idx} btn={btn} data={mergedData} />
          ))}
        </div>
      )}
    </div>
  );
}
