import { Input } from "@/components/ui/input";
import { FieldDefinition } from "@/lib/schemas/page-config";

interface TextFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextField({ field, value, onChange, disabled, placeholder }: TextFieldProps) {
  return (
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
