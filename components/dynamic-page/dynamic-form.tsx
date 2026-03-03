// components/dynamic/DynamicForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageConfig, FieldDefinition } from '@/lib/schemas/page-config';
import FormFieldRenderer from './fields/form-field-renderer';
import { BizDataService } from '@/lib/biz-data-service';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  config: PageConfig;
  mode: 'create' | 'edit';
  entityId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function DynamicForm({ config, mode, entityId, onSubmit, onCancel }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (mode === 'edit' && entityId) {
      loadEntityData();
    } else {
      // 设置默认值
      const defaults: Record<string, any> = {};
      Object.entries(config.model.fields).forEach(([key, field]) => {
        if (field.defaultValue !== undefined) {
          defaults[key] = field.defaultValue;
        } else if (field.type === 'date' || field.type === 'datetime') {
          // 如果日期字段没有初始值，默认显示当天日期 (YYYY-MM-DD)
          defaults[key] = new Date().toISOString().split('T')[0];
        }
      });
      setFormData(defaults);
    }
  }, [mode, entityId]);

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
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const formView = config.views.form;
  const columns = formView?.columns ?? 1;
  const labelLayout = formView?.labelLayout ?? 'vertical';
  const labelWidth = formView?.labelWidth;

  type SectionItem = string | { key: string; label?: string; type?: string; datasource?: string };

  const renderField = (item: SectionItem) => {
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

    return (
      <FormFieldRenderer
        key={key}
        field={field}
        value={formData[key]}
        onChange={(value) => handleChange(key, value)}
        onExtraChange={(extra) => {
          Object.entries(extra).forEach(([k, v]) => handleChange(k, v));
        }}
        disabled={loading}
        labelLayout={labelLayout}
        labelWidth={labelWidth}
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
              {section.fields.map((item) => renderField(item))}
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
        <Button type="submit" disabled={loading}>
          {loading ? '提交中...' : mode === 'create' ? '创建' : '更新'}
        </Button>
      </div>
    </form>
  );
}