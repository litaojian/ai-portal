// components/dynamic/DynamicForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageConfig, FieldConfig } from '@/lib/schemas/dynamic-page.types';
import FormFieldRenderer from './fields/form-field-renderer';
import { DataService } from '@/lib/data-service';

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
      config.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setFormData(defaults);
    }
  }, [mode, entityId]);

  const loadEntityData = async () => {
    const dataService = DataService.getInstance();
    const data = await dataService.fetchOne(config.modelName, entityId!);
    setInitialData(data);
    setFormData(data);
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
    <form onSubmit={handleSubmit} className="dynamic-form">
      <div className="form-grid">
        {config.fields
          .filter(field => field.ui?.showInForm !== false)
          .map(field => (
            <div key={field.id} className="form-field">
              <FormFieldRenderer
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleChange(field.name, value)}
                disabled={loading}
              />
            </div>
          ))}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? '提交中...' : mode === 'create' ? '创建' : '更新'}
        </button>
      </div>
    </form>
  );
}