'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FieldDefinition } from '@/lib/schemas/page-config';
import { cn } from '@/lib/utils';
import { WandSparkles, AlertCircle } from 'lucide-react';

interface JsonFieldProps {
    field: FieldDefinition;
    value: any;
    onChange: (value: any) => void;
    disabled?: boolean;
}

function toDisplayString(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string') {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    return JSON.stringify(value, null, 2);
}

export default function JsonField({ field, value, onChange, disabled }: JsonFieldProps) {
    // @ts-ignore
    const rows = field.rows ?? 6;

    const [text, setText] = useState(() => toDisplayString(value));
    const [error, setError] = useState<string | null>(null);
    const prevValueRef = useRef(value);

    // Sync when parent value changes externally (e.g. fieldMapping or form reset)
    useEffect(() => {
        if (value !== prevValueRef.current) {
            prevValueRef.current = value;
            setText(toDisplayString(value));
            setError(null);
        }
    }, [value]);

    const handleChange = useCallback((raw: string) => {
        setText(raw);
        if (!raw.trim()) {
            setError(null);
            onChange(null);
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            setError(null);
            onChange(parsed);
        } catch {
            setError('JSON 格式错误');
            onChange(raw); // pass raw string so form data is not lost
        }
    }, [onChange]);

    const handleFormat = useCallback(() => {
        if (!text.trim()) return;
        try {
            const formatted = JSON.stringify(JSON.parse(text), null, 2);
            setText(formatted);
            setError(null);
            onChange(JSON.parse(formatted));
        } catch {
            setError('JSON 格式错误，无法格式化');
        }
    }, [text, onChange]);

    return (
        <div className="relative group">
            <textarea
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                readOnly={disabled}
                rows={rows}
                spellCheck={false}
                className={cn(
                    'w-full rounded-md border bg-transparent px-3 py-2 text-sm font-mono shadow-sm transition-colors',
                    'resize-none field-sizing-fixed overflow-y-auto',
                    'placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    error
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-input',
                    disabled && 'bg-muted cursor-not-allowed opacity-100'
                )}
            />

            {/* Format button */}
            {!disabled && (
                <button
                    type="button"
                    onClick={handleFormat}
                    title="格式化 JSON"
                    className={cn(
                        'absolute top-1.5 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                        'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                >
                    <WandSparkles className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Error badge */}
            {error && (
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </div>
            )}
        </div>
    );
}
