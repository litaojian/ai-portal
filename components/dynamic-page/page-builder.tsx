// components/dynamic/PageBuilder.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ConfigService } from '@/lib/config-service';
import { PageConfig } from '@/lib/schemas/dynamic-page.types';
import DynamicTable from './DynamicTable';
import DynamicForm from './dynamic-form';
import { useRouter } from 'next/navigation';

interface PageBuilderProps {
  pageId: string;
  mode?: 'list' | 'create' | 'edit' | 'view';
  entityId?: string;
}

export default function PageBuilder({ pageId, mode = 'list', entityId }: PageBuilderProps) {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadConfig();
  }, [pageId]);

  const loadConfig = async () => {
    setLoading(true);
    const configService = ConfigService.getInstance();
    const pageConfig = await configService.loadConfig(pageId);
    setConfig(pageConfig);
    setLoading(false);
  };

  const handleAction = async (action: string, data?: any) => {
    if (!config) return;

    switch (action) {
      case 'create':
        router.push(`/admin/${pageId}/create`);
        break;
      case 'edit':
        router.push(`/admin/${pageId}/edit/${data.id}`);
        break;
      case 'delete':
        if (confirm('确定要删除吗？')) {
          await deleteEntity(data.id);
        }
        break;
      default:
        // 处理自定义操作
        await handleCustomAction(action, data);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!config) return <div>页面配置不存在</div>;

  return (
    <div className="dynamic-page">
      <div className="page-header">
        <h1>{config.name}</h1>
        <div className="page-actions">
          {config.actions
            .filter(action => action.type === 'create')
            .map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="btn btn-primary"
              >
                {action.name}
              </button>
            ))}
        </div>
      </div>

      {mode === 'list' && (
        <DynamicTable
          config={config}
          onAction={handleAction}
        />
      )}

      {mode === 'create' && (
        <DynamicForm
          config={config}
          mode="create"
          onSubmit={handleFormSubmit}
        />
      )}

      {mode === 'edit' && entityId && (
        <DynamicForm
          config={config}
          mode="edit"
          entityId={entityId}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}