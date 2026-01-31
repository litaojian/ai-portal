"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  RowSelectionState,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pencil, Trash2, Eye } from "lucide-react";
import { PageConfig, FieldDefinition } from "@/lib/schemas/page-config";
import { getCellRenderer } from "./registry";
import { cn } from "@/lib/utils";

interface DynamicTableProps {
  config: PageConfig;
  data: any[];
  total?: number;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  onAction?: (action: string, data: any) => void;
}

export function DynamicTable({
  config,
  data,
  total = 0,
  pagination,
  onPaginationChange,
  onAction
}: DynamicTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Fallback local pagination if not controlled
  const [localPagination, setLocalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const effectivePagination = pagination || localPagination;
  const handlePaginationChange = (updater: any) => {
    const newPagination = typeof updater === 'function' ? updater(effectivePagination) : updater;
    if (onPaginationChange) {
      onPaginationChange(newPagination);
    } else {
      setLocalPagination(newPagination);
    }
  };

  const isSmall = config.views.table.size === 'small';

  // Helper to calculate summary values
  const getSummaryValue = (colKey: string, type: string, text?: string) => {
    if (type === 'label') return text || '';
    if (type === 'sum') {
      const sum = data.reduce((acc, row) => acc + (Number(row[colKey]) || 0), 0);
      // Format if it's amount
      if (config.model.fields[colKey]?.format === 'currency') {
        return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(sum);
      }
      return sum;
    }
    return '';
  };

  // Dynamically generate columns based on config and registry
  const columns = React.useMemo<ColumnDef<any>[]>(() => {
    const dynamicColumns: ColumnDef<any>[] = [];

    // 1. Add Checkbox column if enabled
    if (config.views.table.checkbox) {
      dynamicColumns.push({
        id: "selection",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { align: 'center' }
      });
    }

    // 2. Add Row Number column if enabled (default to true)
    if (config.views.table.rownum !== false) {
      dynamicColumns.push({
        id: "rownum",
        header: "序号",
        cell: ({ row, table }: any) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return pageIndex * pageSize + row.index + 1;
        },
        meta: { align: 'center' }
      });
    }

    // 3. Add Data columns from config
    const dataColumns = config.views.table.columns.map((colConfig) => {
      const fieldDef = config.model.fields[colConfig.key] as FieldDefinition | undefined;
      const rendererType = colConfig.component || fieldDef?.type || 'text';
      const Renderer = getCellRenderer(rendererType);

      // Default alignment: numbers to right, others to left
      const defaultAlign = fieldDef?.type === 'number' ? 'right' : 'left';
      const align = colConfig.align || defaultAlign;

      return {
        accessorKey: colConfig.key,
        header: () => colConfig.label || fieldDef?.label || colConfig.key,
        cell: ({ row }: any) => {
          const value = row.getValue(colConfig.key);
          return (
            <Renderer
              value={value}
              field={fieldDef || { type: 'text', label: colConfig.key }}
              config={colConfig}
            />
          );
        },
        enableSorting: colConfig.sortable ?? false,
        meta: {
          align,
          summaryType: colConfig.summaryType,
          summaryText: colConfig.summaryText
        }
      };
    });

    dynamicColumns.push(...dataColumns);

    // 4. Add Actions Column
    if (config.views.table.actions?.row && config.views.table.actions.row.length > 0) {
      dynamicColumns.push({
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            {config.views.table.actions?.row?.map(action => {
              let Icon = Eye;
              let colorClass = "text-muted-foreground hover:text-primary";
              if (action === 'edit') Icon = Pencil;
              if (action === 'delete') {
                Icon = Trash2;
                colorClass = "text-muted-foreground hover:text-destructive";
              }

              return (
                <Button
                  key={action}
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", colorClass)}
                  onClick={() => onAction?.(action, row.original)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              );
            })}
          </div>
        ),
        meta: { align: 'center' }
      });
    }

    return dynamicColumns;
  }, [config, onAction, data]);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / effectivePagination.pageSize),
    state: {
      sorting,
      rowSelection,
      pagination: effectivePagination,
    },
    manualPagination: true,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = (header.column.columnDef.meta as any)?.align || 'left';
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        isSmall ? "h-8 py-1" : "h-10",
                        align === 'center' && "text-center",
                        align === 'right' && "text-right"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (cell.column.columnDef.meta as any)?.align || 'left';
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          isSmall ? "py-1 px-2 text-xs" : "py-3",
                          align === 'center' && "text-center",
                          align === 'right' && "text-right font-tabular-nums"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {config.views.table.summary && data.length > 0 && (
            <TableFooter className="border-t-2 border-primary/20 bg-muted/30">
              <TableRow className="hover:bg-transparent">
                {table.getVisibleLeafColumns().map((column) => {
                  const meta = column.columnDef.meta as any;
                  const align = meta?.align || 'left';
                  const summaryType = meta?.summaryType;
                  const summaryText = meta?.summaryText;
                  const value = summaryType ? getSummaryValue(column.id, summaryType, summaryText) : '';

                  return (
                    <TableCell
                      key={column.id}
                      className={cn(
                        isSmall ? "py-2 px-2 text-xs" : "py-3",
                        align === 'center' && "text-center",
                        align === 'right' && "text-right font-bold text-primary font-tabular-nums",
                        !summaryType && "text-transparent"
                      )}
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-muted-foreground">
          共 <strong>{total}</strong> 条
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100, 500, 1000].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                    {pageSize} 条/页
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for badge colors (simplified mapping)
function getBadgeColor(color?: string) {
  // Return tailwind classes based on color string
  // This is a naive implementation
  switch (color) {
    case 'green': return "text-green-600 border-green-600";
    case 'blue': return "text-blue-600 border-blue-600";
    case 'red': return "text-red-600 border-red-600";
    case 'yellow': return "text-yellow-600 border-yellow-600";
    default: return "";
  }
}
