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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentEntityId, setCurrentEntityId] = useState<string | undefined>(undefined);


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
      if (dialogMode === 'create') {
        await dataService.create(config.meta.key, data, config.meta.api);
      } else if (dialogMode === 'edit' && currentEntityId) {
        await dataService.update(config.meta.key, currentEntityId, data, config.meta.api);
      }
      setDialogOpen(false);
      loadListData(); // Refresh list
    } catch (error) {
      console.error("Form submission failed", error);
      // Add toast or error handling here
    }
  };

  const handleAction = async (action: string, data?: any) => {
    if (!config) return;

    switch (action) {
      case 'create':
        setDialogMode('create');
        setCurrentEntityId(undefined);
        setDialogOpen(true);
        break;
      case 'edit':
        setDialogMode('edit');
        setCurrentEntityId(data.id);
        setDialogOpen(true);
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
    <div className="h-full flex flex-col space-y-4">
      {/* Search Area */}
      {config.views.search?.fields && config.views.search.fields.length > 0 && (
        <div className="bg-background border rounded-lg p-3 shadow-sm">
          <DynamicSearch
            config={config}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Toolbar & Table Area */}
      <Card className="flex-1 min-h-0 flex flex-col shadow-sm px-6 pb-6 pt-3">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
            <div className="font-medium text-lg">{config.meta.title}列表</div>
            <div className="flex items-center gap-2">
              {config.views.table.actions?.toolbar?.map((item) => {
                const action = typeof item === 'string' ? item : item.action;
                const title = typeof item === 'string' ? item : item.title;

                let Icon = null;
                if (action === 'create') Icon = Plus;
                if (action === 'import') Icon = Upload;
                if (action === 'export') Icon = Download;

                return (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                    {title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <DynamicTable
                config={config}
                data={listData}
                total={total}
                pagination={pagination}
                onPaginationChange={setPagination}
                onAction={handleAction}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? `新建${config.meta.title}` : `编辑${config.meta.title}`}
            </DialogTitle>
          </DialogHeader>
          <DynamicForm
            config={config}
            mode={dialogMode}
            entityId={currentEntityId}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
