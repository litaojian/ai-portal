// components/dynamic/DynamicForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageConfig, FieldDefinition } from '@/lib/schemas/page-config';
import FormFieldRenderer from './fields/form-field-renderer';
import { BizDataService } from '@/lib/biz-data-service';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ExtraButton = { action: string; actionParams?: Record<string, string>; api?: string; method?: string; bodyFields?: string[]; resultPath?: string; copyResult?: boolean; validateRequired?: boolean };

interface DynamicFormProps {
  config: PageConfig;
  mode: 'create' | 'edit';
  entityId?: string;
  onSubmit: (data: any) => Promise<any>;
  onCancel?: () => void;
}

export default function DynamicForm({ config, mode, entityId, onSubmit, onCancel }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (mode === 'create') {
      const defaults: Record<string, any> = {};
      Object.entries(config.model.fields).forEach(([key, field]) => {
        if (field.defaultValue !== undefined) {
          defaults[key] = field.defaultValue;
        } else if (field.type === 'date' || field.type === 'datetime') {
          defaults[key] = new Date().toISOString().split('T')[0];
        }
      });
      return defaults;
    }
    return {};
  });

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedAction, setCopiedAction] = useState<number | null>(null);
  type BtnState = { loading: boolean; result: unknown; error: string | null };
  const [btnStates, setBtnStates] = useState<Record<number, BtnState>>({});

  useEffect(() => {
    if (mode === 'edit' && entityId) {
      loadEntityData();
    } else if (mode === 'create') {
      // 在模式切回、依赖变更时仍要恢复出厂默认设置
      const defaults: Record<string, any> = {};
      Object.entries(config.model.fields).forEach(([key, field]) => {
        if (field.defaultValue !== undefined) {
          defaults[key] = field.defaultValue;
        } else if (field.type === 'date' || field.type === 'datetime') {
          defaults[key] = new Date().toISOString().split('T')[0];
        }
      });
      setFormData(defaults);
      setErrors({});
    }
  }, [mode, entityId, config]);

  const loadEntityData = async () => {
    const dataService = BizDataService.getInstance();
    try {
      const data = await dataService.fetchOne(config.meta.key, entityId!, config.meta.api);

      // 确保编辑模式下，如果日期字段为空，也显示默认日期
      const enrichedData = { ...data };
      Object.entries(config.model.fields).forEach(([key, field]) => {
        if ((field.type === 'date' || field.type === 'datetime') && !enrichedData[key]) {
          enrichedData[key] = new Date().toISOString().split('T')[0];
        }
      });

      setInitialData(enrichedData);
      setFormData(enrichedData);
    } catch (error) {
      console.error("Failed to load entity data", error);
    }
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };

      // Process onChange actions defined in field config
      const field = config.model.fields[fieldName];
      if (field?.onChange) {
        for (const event of field.onChange) {
          const resolvedValue = event.value !== undefined
            ? event.value.replace(/\{\{value\}\}/g, String(value ?? ''))
            : String(value ?? '');

          if (event.action === 'updateJsonField' && event.target && event.jsonPath) {
            try {
              const raw = newData[event.target];
              const json = raw ? JSON.parse(raw) : {};
              json[event.jsonPath] = resolvedValue;
              newData[event.target] = JSON.stringify(json, null, 2);
            } catch {
              // skip if target field is not valid JSON
            }
          } else if (event.action === 'setField' && event.target) {
            newData[event.target] = resolvedValue;
          }
        }
      }

      return newData;
    });
    if (errors[fieldName]) {
      setErrors(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    Object.entries(config.model.fields).forEach(([key, field]) => {
      if (field.validation?.required) {
        const value = formData[key];
        if (value === undefined || value === null || value === '') {
          newErrors[key] = `${field.label}不能为空`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getValueByPath = (obj: unknown, path: string): unknown => {
    return path.split(/\.|\[(\d+)\]/).filter(Boolean).reduce<unknown>((cur, key) => {
      if (cur == null || typeof cur !== 'object') return undefined;
      return (cur as Record<string, unknown>)[key];
    }, obj);
  };

  const handleExtraButtonClick = async (btn: ExtraButton, idx: number) => {
    if (btn.action === 'callApi' && btn.api) {
      if (btn.validateRequired) {
        const fields = btn.bodyFields ?? Object.keys(config.model.fields);
        const newErrors: Record<string, string> = {};
        for (const key of fields) {
          const field = config.model.fields[key];
          if (field?.validation?.required) {
            const val = formData[key];
            if (val === undefined || val === null || val === '') {
              newErrors[key] = `${field.label}不能为空`;
            }
          }
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }
      }
      const body = btn.bodyFields
        ? Object.fromEntries(btn.bodyFields.map((k) => [k, formData[k]]))
        : formData;
      setBtnStates(prev => ({ ...prev, [idx]: { loading: true, result: null, error: null } }));
      try {
        const res = await fetch(btn.api, {
          method: btn.method ?? 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setBtnStates(prev => ({ ...prev, [idx]: { loading: false, result: null, error: json ? JSON.stringify(json, null, 2) : `HTTP ${res.status}` } }));
        } else {
          const displayResult = btn.resultPath ? getValueByPath(json, btn.resultPath) : json;
          if (btn.copyResult) {
            const text = typeof displayResult === 'string' ? displayResult : JSON.stringify(displayResult, null, 2);
            navigator.clipboard?.writeText(text);
            setBtnStates(prev => ({ ...prev, [idx]: { loading: false, result: null, error: null } }));
            setCopiedAction(idx);
            setTimeout(() => setCopiedAction(null), 2000);
          } else {
            setBtnStates(prev => ({ ...prev, [idx]: { loading: false, result: displayResult, error: null } }));
          }
        }
      } catch (e) {
        setBtnStates(prev => ({ ...prev, [idx]: { loading: false, result: null, error: e instanceof Error ? e.message : '请求失败' } }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (result && typeof result === 'object') {
        setFormData(result);
      }
    } finally {
      setLoading(false);
    }
  };

  const formView = config.views.form;
  const columns = formView?.columns ?? 1;
  const labelLayout = formView?.labelLayout ?? 'vertical';
  const labelWidth = formView?.labelWidth;

  type SectionItem = string | { key: string; label?: string; type?: string; datasource?: string };

  const renderField = (item: SectionItem, sectionLabelLayout?: 'vertical' | 'horizontal', sectionLabelWidth?: string) => {
    const key = typeof item === 'string' ? item : item.key;
    const itemType = typeof item !== 'string' ? item.type : undefined;
    const itemDatasource = typeof item !== 'string' ? item.datasource : undefined;
    const itemLabel = typeof item !== 'string' ? item.label : undefined;

    const modelField = config.model.fields[key];
    if (!modelField && !itemType) return null;
    if (modelField?.hidden) return null;

    const field: FieldDefinition = modelField
      ? {
        ...modelField,
        ...(itemLabel !== undefined && { label: itemLabel }),
        ...(itemType !== undefined && { type: itemType as FieldDefinition['type'] }),
        ...(itemDatasource !== undefined && { datasource: itemDatasource }),
      }
      : {
        label: itemLabel ?? key,
        type: (itemType as FieldDefinition['type']) ?? 'text',
        datasource: itemDatasource,
      } as FieldDefinition;

    // Resolve dynamic datasource if it contains variables like {{field_key}}
    let effectiveDatasource = field.datasource;
    if (effectiveDatasource && effectiveDatasource.includes('{{')) {
      // Replace all occurrences of {{key}} with the corresponding value from formData
      effectiveDatasource = effectiveDatasource.replace(/{{([^}]+)}}/g, (_, varName) => {
        const val = formData[varName.trim()];
        return val !== undefined && val !== null ? encodeURIComponent(String(val)) : '';
      });
      // If any variable was not found (resulting in an empty string replacement where expected), 
      // you might want to return early or handle it. Currently, it evaluates to whatever string results.
    }

    return (
      <FormFieldRenderer
        key={key}
        field={field}
        value={formData[key]}
        onChange={(value) => handleChange(key, value)}
        onExtraChange={(extra) => {
          Object.entries(extra).forEach(([k, v]) => handleChange(k, v));
        }}
        disabled={loading || field.disabled}
        labelLayout={sectionLabelLayout || labelLayout}
        labelWidth={sectionLabelWidth || labelWidth}
        effectiveDatasource={effectiveDatasource}
        error={errors[key]}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formView?.sections ? (
        // Render by views.form.sections
        formView.sections.map((section, si) => (
          <div key={si} className="space-y-3">
            {section.title && (
              <h3 className="text-sm font-medium text-muted-foreground pb-1 border-b">
                {section.title}
              </h3>
            )}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {section.fields.map((item, ii) => {
                const colSpan = typeof item === 'object' ? (item as any).colSpan : 1;
                return (
                  <div
                    key={ii}
                    style={{
                      gridColumn: colSpan > 1 ? `span ${colSpan} / span ${colSpan}` : 'auto'
                    }}
                  >
                    {renderField(item, section.labelLayout, section.labelWidth)}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        // Fallback: all non-hidden model fields
        <div className="grid gap-4">
          {Object.entries(config.model.fields)
            .filter(([_, field]) => !field.hidden)
            .map(([key]) => renderField(key))}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
        )}
        {formView?.extraButtons
          ?.filter((btn) => !btn.editOnly || mode === 'edit')
          ?.map((btn, i) => {
            const state = btnStates[i];
            const isLoading = btn.action === 'callApi' && !!state?.loading;
            return (
              <Button
                key={i}
                type="button"
                variant={btn.variant ?? 'outline'}
                disabled={loading || isLoading}
                onClick={() => handleExtraButtonClick(btn, i)}
              >
                {isLoading
                  ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />{btn.loadingTitle ?? '处理中...'}</>
                  : (copiedAction === i ? '已复制' : btn.title)
                }
              </Button>
            );
          })}
        {!formView?.submitButton?.hidden && (
          <Button
            type="submit"
            disabled={loading}
            variant={formView?.submitButton?.variant ?? 'default'}
          >
            {loading
              ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />{formView?.submitButton?.loadingTitle ?? '处理中...'}</>
              : (formView?.submitButton?.title ?? (mode === 'create' ? '创建' : '更新'))}
          </Button>
        )}
      </div>
      {formView?.extraButtons?.map((_btn, i) => {
        const state = btnStates[i];
        if (!state || state.loading || (state.result === null && state.error === null)) return null;
        return (
          <div key={i} className={`rounded-md border p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto ${state.error ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'bg-muted'}`}>
            {state.error
              ? state.error
              : (typeof state.result === 'string' ? state.result : JSON.stringify(state.result, null, 2))
            }
          </div>
        );
      })}
    </form>
  );
}