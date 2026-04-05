import { Textarea } from "@/components/ui/textarea";
import { FieldDefinition } from "@/lib/schemas/page-config";

interface TextareaFieldProps {
    field: FieldDefinition;
    value: any;
    onChange: (value: any) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function TextareaField({ field, value, onChange, disabled, placeholder }: TextareaFieldProps) {
    const rows = field.rows || 3;

    return (
        <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            readOnly={disabled}
            placeholder={placeholder}
            rows={rows}
            className={`field-sizing-fixed overflow-y-auto resize-none ${disabled ? "bg-muted cursor-not-allowed opacity-100" : ""}`}
        />
    );
}
