import { FieldDefinition } from '@/lib/schemas/page-config';

interface RadioFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function RadioField({ field, value, onChange, disabled }: RadioFieldProps) {
  const options = field.options ?? [];
  return (
    <div className="flex flex-wrap gap-4 pt-1">
      {options.map((o) => (
        <label key={String(o.value)} className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={field.label}
            value={String(o.value)}
            checked={String(value ?? '') === String(o.value)}
            onChange={() => onChange(o.value)}
            disabled={disabled}
            className="accent-primary"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
