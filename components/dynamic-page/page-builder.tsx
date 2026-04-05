'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ConfigService } from '@/lib/config-service';
import { PageConfig } from '@/lib/schemas/page-config';
import { DynamicTable } from './dynamic-table';
import DynamicForm from './dynamic-form';
import { DynamicSearch } from './dynamic-search';

import { BizDataService } from '@/lib/biz-data-service';
import { Card, CardContent } from '@/components/ui/card';

// Shadcn DialogContent has a built-in sm:max-w-lg that beats non-responsive classes.
// Use inline style to reliably control dialog width.
const MAX_W: Record<string, string> = {
  'max-w-sm': '24rem', 'max-w-md': '28rem', 'max-w-lg': '32rem',
  'max-w-xl': '36rem', 'max-w-2xl': '42rem', 'max-w-3xl': '48rem',
  'max-w-4xl': '56rem', 'max-w-5xl': '64rem', 'max-w-6xl': '72rem',
};
const dlgWidth = (cls?: string): React.CSSProperties =>
  ({ maxWidth: MAX_W[cls ?? 'max-w-2xl'] ?? '42rem' });
import { Plus, Upload, Download, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DynamicDialog } from './dynamic-dialog';
import { getCustomDialog } from '@/lib/custom-dialog-registry';
import { ActionDialogConfig } from '@/lib/schemas/dynamic-dialog-config';


interface PageBuilderProps {
  pageId: string;
  mode?: 'list' | 'create' | 'edit' | 'view';
  entityId?: string;
}

// Custom action handler is now processed within the component switch

export default function PageBuilder({ pageId, mode = 'list' }: PageBuilderProps) {
  const router = useRouter();
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
  const fullDataCacheRef = useRef<any[]>([]);

  // Create/Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentEntityId, setCurrentEntityId] = useState<string | undefined>(undefined);

  // Action Dialog State
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionDialogData, setActionDialogData] = useState<Record<string, any> | null>(null);
  const [actionDialogConfig, setActionDialogConfig] = useState<ActionDialogConfig | null>(null);

  // Submit Result Dialog State (for standalone form pages)
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    loadConfig();
  }, [pageId]);

  useEffect(() => {
    if (!config || mode !== 'list' || config.meta.defaultView === 'form') return;
    if (config.views.table.pagination?.mode === 'client') {
      loadFullData();
    } else {
      loadListData();
    }
  }, [config, mode, searchParams]);

  useEffect(() => {
    if (!config || mode !== 'list' || config.meta.defaultView === 'form') return;
    if (config.views.table.pagination?.mode === 'client') {
      const { pageIndex, pageSize } = pagination;
      const start = pageIndex * pageSize;
      setListData(fullDataCacheRef.current.slice(start, start + pageSize));
    } else {
      loadListData();
    }
  }, [pagination]);

  const loadConfig = async () => {
    setLoading(true);
    const configService = ConfigService.getInstance();
    const pageConfig = await configService.loadConfig(pageId);
    setConfig(pageConfig);
    // Initialize pageSize from config if available
    if (pageConfig?.views.table?.pagination?.pageSize) {
      setPagination(prev => ({ ...prev, pageSize: pageConfig.views.table.pagination!.pageSize! }));
    }
    setLoading(false);
  };

  const [dataLoading, setDataLoading] = useState(false);

  // ... (previous useEffects)

  const loadFullData = async () => {
    if (!config) return;
    setDataLoading(true);
    try {
      const dataService = BizDataService.getInstance();
      const res = await dataService.fetchAll(config.meta.key, { ...searchParams }, config.meta.api);
      const allData = Array.isArray(res) ? res : (res.data || []);
      fullDataCacheRef.current = allData;
      setTotal(allData.length);
      const { pageIndex, pageSize } = pagination;
      const start = pageIndex * pageSize;
      setListData(allData.slice(start, start + pageSize));
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setDataLoading(false);
    }
  };

  const loadListData = async () => {
    if (!config) return;
    setDataLoading(true);
    try {
      const dataService = BizDataService.getInstance();
      // Check for missing path parameters
      if (config.meta.api && config.meta.api.includes('{')) {
        const matches = config.meta.api.match(/\{(\w+)\}/g);
        if (matches) {
          const missingParams = matches.filter(m => {
            const key = m.slice(1, -1);
            return !searchParams[key];
          });
          if (missingParams.length > 0) {
            console.log(`[PageBuilder] Skip fetch, missing params: ${missingParams.join(', ')}`);
            setDataLoading(false);
            return;
          }
        }
      }

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
    } finally {
      setDataLoading(false);
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
      let res;
      if (dialogMode === 'create') {
        res = await dataService.create(config.meta.key, data, config.meta.api);
      } else if (dialogMode === 'edit' && currentEntityId) {
        res = await dataService.update(config.meta.key, currentEntityId, data, config.meta.api);
      }

      setDialogOpen(false);

      // Show result dialog for standalone form pages (only when submitResult is configured)
      const hasSubmitResult = !!(config.views.form as any)?.submitResult;
      if (config.meta.defaultView === 'form' && res && hasSubmitResult) {
        setSubmitResult(res);
        setResultDialogOpen(true);
      } else if (config.meta.defaultView !== 'form') {
        loadListData(); // Refresh list
      }

      return res;
    } catch (error) {
      console.error("Form submission failed", error);
      // Add toast or error handling here
    }
  };


  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // ... (previous useEffects)

  // ...

  const handleAction = async (action: string, data?: any, actionDef?: Record<string, any>) => {
    if (!config) return;

    setCurrentAction(action);
    // Only set loading for async actions that might take time. 
    // Dialog openers are instant, so checking first.
    if (['create', 'edit', 'showDialog', 'navigate'].includes(action)) {
      // Instant actions
    } else {
      setActionLoading(true);
    }

    try {
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
        case 'navigate': {
          let url = actionDef?.url as string | undefined;
          if (url && data) {
            url = url.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(data[key] ?? '')));
            router.push(url);
          }
          break;
        }
        case 'showDialog': {
          const dialogConfigPath = actionDef?.dialogConfig as string | undefined;
          if (dialogConfigPath) {
            const configService = ConfigService.getInstance();
            const viewCfg = await configService.loadActionDialogConfig(dialogConfigPath);
            if (viewCfg) {
              setActionDialogConfig(viewCfg);
              setActionDialogData(data);
              setActionDialogOpen(true);
            }
          }
          break;
        }
        case 'delete':
          if (confirm('确定要删除吗？')) {
            // Implement delete logic with BizDataService
            const dataService = BizDataService.getInstance();
            await dataService.delete(config.meta.key, data.id, config.meta.api);
            loadListData(); // Reload after delete
          }
          break;
        default:
          if (action === 'callApi' && actionDef?.api) {
            let apiUrl = actionDef.api as string;
            // 替换路径参数，如 /api/xx/{id}
            if (data && typeof data === 'object') {
              for (const key of Object.keys(data)) {
                apiUrl = apiUrl.replace(`{${key}}`, encodeURIComponent(String(data[key])));
              }
            }

            const method = actionDef.method || 'POST';

            const res = await fetch(apiUrl, {
              method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
                ? JSON.stringify(data || {})
                : undefined
            });

            if (!res.ok) {
              const err = await res.json().catch(() => null);
              throw new Error(err?.error || err?.message || '请求失败');
            }
            // 调用成功后可执行刷新等操作
            loadListData();
          } else {
            console.warn("Unhandled action:", action, data);
          }
      }
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setActionLoading(false);
      setCurrentAction(null);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!config) return <div>页面配置不存在</div>;

  if (config.meta.defaultView === 'form') {
    // Resolve submitResult config
    const submitResultCfg = (config.views.form as any)?.submitResult as {
      title?: string;
      fields?: { key: string; label: string }[];
    } | undefined;

    // Build label map from model fields
    const fieldLabelMap: Record<string, string> = {};
    Object.entries(config.model.fields).forEach(([k, f]) => {
      fieldLabelMap[k] = f.label ?? k;
    });

    return (
      <>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <DynamicForm
              config={config}
              mode="create"
              onSubmit={handleFormSubmit}
              onCancel={() => { }}
            />
          </CardContent>
        </Card>

        {/* Submit Result Dialog */}
        <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {submitResultCfg?.title ?? '操作成功'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {submitResult && (() => {
                // Determine which fields to show
                const entries = submitResultCfg?.fields
                  ? submitResultCfg.fields
                    .filter(f => submitResult[f.key] !== undefined && submitResult[f.key] !== null && submitResult[f.key] !== '')
                    .map(f => ({ key: f.key, label: f.label }))
                  : Object.keys(submitResult)
                    .filter(k => submitResult[k] !== undefined && submitResult[k] !== null && submitResult[k] !== '')
                    .map(k => ({ key: k, label: fieldLabelMap[k] ?? k }));

                return (
                  <div className="space-y-2">
                    {entries.map(({ key, label }) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        <span className="w-28 shrink-0 text-muted-foreground font-medium text-right">{label}：</span>
                        <span className="break-all font-mono text-foreground">{String(submitResult[key])}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <DialogFooter>
              <Button onClick={() => setResultDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Search Area */}
      {config.views.search?.fields && config.views.search.fields.length > 0 && (
        <div className="bg-background border rounded-lg p-3 shadow-sm">
          <DynamicSearch
            config={config}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={dataLoading}
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
                  <Button
                    key={action}
                    onClick={() => handleAction(action, undefined, typeof item === 'string' ? undefined : item)}
                    variant="outline"
                    size="sm"
                    className="h-8 shadow-sm"
                    loading={actionLoading && currentAction === action}
                  >
                    {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                    {title}
                  </Button>
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
        <DialogContent className="p-0" style={dlgWidth(config.views.form?.width)}>
          <DialogHeader className="px-6 pt-6 pb-3 pr-12 border-b">
            <DialogTitle>
              {dialogMode === 'create' ? `新建${config.meta.title}` : `编辑${config.meta.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 5rem)' }}>
            <DynamicForm
              key={`${dialogMode}-${currentEntityId || 'new'}-${dialogOpen}`}
              config={config}
              mode={dialogMode}
              entityId={currentEntityId}
              onSubmit={handleFormSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for View/Detail (standard or custom component) */}
      {actionDialogConfig?.component ? (
        // Custom component from registry
        (() => {
          const CustomComp = getCustomDialog(actionDialogConfig.component!);
          if (!CustomComp) return null;
          const refreshList = () => {
            setActionDialogOpen(false);
            if (config!.views.table.pagination?.mode === 'client') {
              loadFullData();
            } else {
              loadListData();
            }
          };
          return (
            <CustomComp
              open={actionDialogOpen}
              onOpenChange={setActionDialogOpen}
              data={actionDialogData ?? {}}
              onSuccess={refreshList}
            />
          );
        })()
      ) : (
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="p-0" style={dlgWidth(actionDialogConfig?.width)}>
            <DialogHeader className="px-6 pt-6 pb-3 pr-12 border-b">
              <DialogTitle>
                {actionDialogConfig?.title ?? `${config.meta.title}详情`}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 5rem)' }}>
              {actionDialogConfig && (
                <DynamicDialog
                  formConfig={actionDialogConfig}
                  pageConfig={config}
                  data={actionDialogData ?? {}}
                  onSuccess={() => { setActionDialogOpen(false); loadListData(); }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
