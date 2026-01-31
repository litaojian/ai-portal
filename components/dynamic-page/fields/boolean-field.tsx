import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldDefinition } from "@/lib/schemas/page-config";
import { useId } from "react";

interface BooleanFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function BooleanField({ field, value, onChange, disabled }: BooleanFieldProps) {
  const id = useId();
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={id} 
        checked={!!value} 
        onCheckedChange={onChange} 
        disabled={disabled}
      />
      <Label htmlFor={id}>{field.label}</Label>
    </div>
  );
}
