// components/dynamic/fields/FormFieldRenderer.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { FieldDefinition } from '@/lib/schemas/page-config';
import TextField from './text-field';
import SelectField from './select-field';
import DateField from './date-field';
import BooleanField from './boolean-field';
import RadioField from './radio-field';
import ComboboxField from './combobox-field';
import TextareaField from './textarea-field';
import JsonField from './json-field';

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  onExtraChange?: (extra: Record<string, unknown>) => void;
  disabled?: boolean;
  placeholder?: string;
  labelLayout?: 'vertical' | 'horizontal';
  labelWidth?: string;
  effectiveDatasource?: string;
  error?: string;
}

export default function FormFieldRenderer({ field, value, onChange, onExtraChange, disabled, placeholder, labelLayout = 'vertical', labelWidth, effectiveDatasource, error }: FormFieldRendererProps) {
  // Prefer field-level placeholder over the externally passed placeholder prop
  const effectivePlaceholder = field.placeholder ?? placeholder;

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={effectivePlaceholder}
          />
        );
      case 'textarea':
        return (
          <TextareaField
            field={field}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={effectivePlaceholder}
          />
        );
      case 'json':
        return (
          <JsonField
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
            placeholder={effectivePlaceholder}
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
            placeholder={effectivePlaceholder}
            effectiveDatasource={effectiveDatasource}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            placeholder={effectivePlaceholder}
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
            placeholder={effectivePlaceholder}
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

  const hintEl = !error && field.validation?.message && (
    <p className="text-[0.8rem] text-muted-foreground">{field.validation.message}</p>
  );

  const errorEl = error && (
    <p className="text-[0.8rem] text-destructive">{error}</p>
  );

  const fieldEl = field.clearable ? (
    <div className="relative">
      {renderField()}
      {!disabled && value != null && value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  ) : renderField();

  if (labelLayout === 'horizontal') {
    return (
      <div className="flex items-start gap-3">
        {labelEl}
        <div className="flex-1 space-y-1">
          {fieldEl}
          {hintEl}
          {errorEl}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {labelEl}
      {fieldEl}
      {hintEl}
      {errorEl}
    </div>
  );
}