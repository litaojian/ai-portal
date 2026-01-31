import { Input } from "@/components/ui/input";
import { FieldDefinition } from "@/lib/schemas/page-config";

interface DateFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function DateField({ field, value, onChange, disabled }: DateFieldProps) {
  // value expected to be YYYY-MM-DD string or Date object
  const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value;

  return (
    <Input
      type="date"
      value={dateValue || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
