// components/dynamic/fields/FormFieldRenderer.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { FieldDefinition } from '@/lib/schemas/page-config';
import TextField from './text-field';
import SelectField from './select-field';
import DateField from './date-field';
import BooleanField from './boolean-field';
import RadioField from './radio-field';
import ComboboxField from './combobox-field';

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  onExtraChange?: (extra: Record<string, unknown>) => void;
  disabled?: boolean;
  placeholder?: string;
  labelLayout?: 'vertical' | 'horizontal';
  labelWidth?: string;
}

export default function FormFieldRenderer({ field, value, onChange, onExtraChange, disabled, placeholder, labelLayout = 'vertical', labelWidth }: FormFieldRendererProps) {
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
      case 'radio':
        return (
          <RadioField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      case 'combobox':
        return (
          <ComboboxField
            field={field}
            value={value}
            onChange={onChange}
            onExtraChange={onExtraChange}
            disabled={disabled}
            placeholder={placeholder}
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

  const labelEl = (
    <label className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      labelLayout === 'horizontal' && cn('shrink-0 pt-2', labelWidth ?? 'w-28')
    )}>
      {field.label}
      {field.validation?.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  const hintEl = field.validation?.message && (
    <p className="text-[0.8rem] text-muted-foreground">{field.validation.message}</p>
  );

  if (labelLayout === 'horizontal') {
    return (
      <div className="flex items-start gap-3">
        {labelEl}
        <div className="flex-1 space-y-1">
          {renderField()}
          {hintEl}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {labelEl}
      {renderField()}
      {hintEl}
    </div>
  );
}