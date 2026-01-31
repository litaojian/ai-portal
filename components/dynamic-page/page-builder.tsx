'use client';

import React, { useEffect, useState } from 'react';
import { ConfigService } from '@/lib/config-service';
import { PageConfig } from '@/lib/schemas/page-config';
import { DynamicTable } from './dynamic-table'; 
import DynamicForm from './dynamic-form';
import { DynamicSearch } from './dynamic-search';
import { useRouter } from 'next/navigation';
import { BizDataService } from '@/lib/biz-data-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Download } from 'lucide-react';

interface PageBuilderProps {
  pageId: string;
  mode?: 'list' | 'create' | 'edit' | 'view';
  entityId?: string;
}

// Stub functions for missing implementations
const deleteEntity = async (id: string) => {
    console.warn("deleteEntity not implemented", id);
};

const handleCustomAction = async (action: string, data: any) => {
    console.warn("handleCustomAction not implemented", action, data);
};

export default function PageBuilder({ pageId, mode = 'list', entityId }: PageBuilderProps) {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  // List View State
  const [listData, setListData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  const router = useRouter();

  useEffect(() => {
    loadConfig();
  }, [pageId]);

  useEffect(() => {
    if (config && mode === 'list') {
        loadListData();
    }
  }, [config, mode, pagination, searchParams]);

  const loadConfig = async () => {
    setLoading(true);
    const configService = ConfigService.getInstance();
    const pageConfig = await configService.loadConfig(pageId);
    setConfig(pageConfig);
    // Initialize pageSize from config if available
    if (pageConfig?.views.table.pagination?.pageSize) {
        setPagination(prev => ({ ...prev, pageSize: pageConfig.views.table.pagination!.pageSize! }));
    }
    setLoading(false);
  };

  const loadListData = async () => {
    if (!config) return;
    try {
        const dataService = BizDataService.getInstance();
        const res = await dataService.fetchAll(config.meta.key, {
            page: pagination.pageIndex + 1,
            pageSize: pagination.pageSize,
            ...searchParams
        }, config.meta.api);
        
        if (Array.isArray(res)) {
            setListData(res);
            setTotal(res.length); // Fallback if API returns array
        } else if (res.data) {
            setListData(res.data);
            setTotal(res.total || 0);
        }
    } catch (error) {
        console.error("Failed to load list data", error);
    }
  };

  const handleSearch = (values: Record<string, any>) => {
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
    setSearchParams(values);
  };

  const handleReset = () => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setSearchParams({});
  };

  const handleFormSubmit = async (data: any) => {
    if (!config) return;
    try {
        const dataService = BizDataService.getInstance();
        if (mode === 'create') {
            await dataService.create(config.meta.key, data, config.meta.api);
        } else if (mode === 'edit' && entityId) {
            await dataService.update(config.meta.key, entityId, data, config.meta.api);
        }
        router.push(`/portal/${pageId}`);
    } catch (error) {
        console.error("Form submission failed", error);
        // Add toast or error handling here
    }
  };

  const handleAction = async (action: string, data?: any) => {
    if (!config) return;

    switch (action) {
      case 'create':
        router.push(`/portal/${pageId}/create`);
        break;
      case 'edit':
        router.push(`/portal/${pageId}/edit/${data.id}`);
        break;
      case 'delete':
        if (confirm('确定要删除吗？')) {
          // Implement delete logic with BizDataService
           const dataService = BizDataService.getInstance();
           await dataService.delete(config.meta.key, data.id, config.meta.api);
           loadListData(); // Reload after delete
        }
        break;
      default:
        await handleCustomAction(action, data);
    }
  };

  const handleCancel = () => {
    router.push(`/portal/${pageId}`);
  };

  if (loading) return <div>加载中...</div>;
  if (!config) return <div>页面配置不存在</div>;

  return (
    <Card className="w-full shadow-sm overflow-hidden min-w-0">
      <CardContent className="p-4 overflow-hidden min-w-0">
        {mode === 'list' && (
            <>
                <div className="space-y-4 min-w-0">
                    <DynamicSearch 
                        config={config} 
                        onSearch={handleSearch} 
                        onReset={handleReset}
                    />
                    
                    <div className="flex items-center justify-end gap-2 border-b pb-4">
                        {config.views.table.actions?.toolbar?.map((item) => {
                            const action = typeof item === 'string' ? item : item.action;
                            const title = typeof item === 'string' ? item : item.title;
                            const isPrimary = action === 'create';
                            
                            let Icon = null;
                            if (action === 'create') Icon = Plus;
                            if (action === 'import') Icon = Upload;
                            if (action === 'export') Icon = Download;

                            return (
                                <button
                                    key={action}
                                    onClick={() => handleAction(action)}
                                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-2 ${
                                        isPrimary 
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow" 
                                            : "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                                    {title}
                                </button>
                            );
                        })}
                    </div>

                    <DynamicTable
                        config={config}
                        data={listData}
                        total={total}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        onAction={handleAction}
                    />
                </div>
            </>
        )}

        {mode === 'create' && (
            <DynamicForm
            config={config}
            mode="create"
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            />
        )}

        {mode === 'edit' && entityId && (
            <DynamicForm
            config={config}
            mode="edit"
            entityId={entityId}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            />
        )}
      </CardContent>
    </Card>
  );
}
