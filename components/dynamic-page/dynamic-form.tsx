// components/dynamic/DynamicForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageConfig } from '@/lib/schemas/page-config';
import FormFieldRenderer from './fields/form-field-renderer';
import { BizDataService } from '@/lib/biz-data-service';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  config: PageConfig;
  mode: 'create' | 'edit';
  entityId?: string;
  onSubmit: (data: any) => Promise<void>;
}

export default function DynamicForm({ config, mode, entityId, onSubmit }: DynamicFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 py-4">
        {Object.entries(config.model.fields)
          .filter(([_, field]) => !field.hidden)
          .map(([key, field]) => (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <FormFieldRenderer
                  field={field}
                  value={formData[key]}
                  onChange={(value) => handleChange(key, value)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? '提交中...' : mode === 'create' ? '创建' : '更新'}
        </Button>
      </div>
    </form>
  );
}