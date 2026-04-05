import React from 'react';

/**
 * Registry for custom dialog components used with DynamicDialog's `component` config field.
 *
 * When an ActionDialogConfig has a `component` property, PageBuilder looks up
 * the corresponding React component from this registry and renders it instead
 * of the default DynamicDialog.
 *
 * Custom components receive: { open, onOpenChange, data, onSuccess }
 */

export interface CustomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Record<string, any>;
    onSuccess: () => void;
}

type CustomDialogComponent = React.ComponentType<CustomDialogProps>;

const registry = new Map<string, CustomDialogComponent>();

export function registerCustomDialog(name: string, component: CustomDialogComponent) {
    registry.set(name, component);
}

export function getCustomDialog(name: string): CustomDialogComponent | undefined {
    return registry.get(name);
}

// ── Register built-in custom dialogs ──────────────────────────────────────

// Lazy import to avoid circular dependencies and keep the registry lightweight.
// Each custom dialog is registered here with a wrapper that maps props.

import { TopicPlanDialog } from '@/components/cms/topic-plan-dialog';

registerCustomDialog('topicPlan', (props: CustomDialogProps) => (
    <TopicPlanDialog
        open={props.open}
        onOpenChange={props.onOpenChange}
        topic={props.data as any}
        onSuccess={props.onSuccess}
    />
));
