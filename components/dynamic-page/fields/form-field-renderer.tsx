// components/dynamic/fields/FormFieldRenderer.tsx
import React from 'react';
import { FieldConfig } from '@/lib/schemas/dynamic-page.types';
import TextField from './text-field';
import SelectField from './select-field';
import DateField from './date-field';
import BooleanField from './boolean-field';

interface FormFieldRendererProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function FormFieldRenderer({ field, value, onChange, disabled }: FormFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <SelectField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      case 'date':
        return (
          <DateField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      case 'boolean':
        return (
          <BooleanField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="form-input"
            placeholder={field.ui?.placeholder}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="form-input"
            placeholder={field.ui?.placeholder}
          />
        );
    }
  };

  return (
    <div className="field-wrapper">
      <label className="field-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
      {renderField()}
      {field.validation && (
        <div className="field-validation"></div>
      )}
    </div>
  );
}