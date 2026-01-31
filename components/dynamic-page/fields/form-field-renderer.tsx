// components/dynamic/fields/FormFieldRenderer.tsx
import React from 'react';
import { FieldDefinition } from '@/lib/schemas/page-config';
import TextField from './text-field';
import SelectField from './select-field';
import DateField from './date-field';
import BooleanField from './boolean-field';

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function FormFieldRenderer({ field, value, onChange, disabled, placeholder }: FormFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'textarea': // Fallback to text for now
        return (
          <TextField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
          />
        );
      case 'select':
        return (
          <SelectField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
          />
        );
      case 'date':
      case 'datetime': // Fallback to date for now
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        );
      default:
        return (
          <TextField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {field.label}
        {field.validation?.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {renderField()}
      {field.validation?.message && (
        <p className="text-[0.8rem] text-muted-foreground">
            {field.validation.message}
        </p>
      )}
    </div>
  );
}