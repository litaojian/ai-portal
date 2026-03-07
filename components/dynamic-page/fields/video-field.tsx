import React from 'react';
import { FieldDefinition } from '@/lib/schemas/page-config';

interface VideoFieldProps {
    field?: FieldDefinition;
    value: any;
    disabled?: boolean;
}

export default function VideoField({ value }: VideoFieldProps) {
    if (!value) {
        return <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md text-center">暂无视频</div>;
    }

    const videoUrl = typeof value === 'string' ? value : '';

    return (
        <div className="w-full flex justify-center bg-black/5 rounded-md overflow-hidden p-2">
            <video
                src={videoUrl}
                controls
                className="max-h-[60vh] max-w-full"
            />
        </div>
    );
}
