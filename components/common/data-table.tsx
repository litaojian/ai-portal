"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string; // Column accessor key to filter by
  searchPlaceholder?: string;
  children?: React.ReactNode; // For extra toolbar actions like "Create" button
  
  // Server-side pagination support
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (value: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "搜索...",
  children,
  pageCount,
  pageIndex,
  pageSize = 10,
  onPageChange,
  onSearch,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  // Explicit pagination state for client-side pagination
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const isManual = pageCount !== undefined;

  const table = useReactTable({
    data,
    columns,
    pageCount: isManual ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      // Use prop-based pagination for manual, otherwise use local state
      pagination: isManual ? {
        pageIndex: (pageIndex || 1) - 1,
        pageSize,
      } : pagination,
    },
    manualPagination: isManual,
    manualFiltering: !!onSearch,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side models if not manual
    getPaginationRowModel: !isManual ? getPaginationRowModel() : undefined,
    getSortedRowModel: !isManual ? getSortedRowModel() : undefined,
    getFilteredRowModel: !isManual ? getFilteredRowModel() : undefined,
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  };

  const handlePageChange = (idx: number) => {
      if (onPageChange) {
          onPageChange(idx + 1);
      } else {
          table.setPageIndex(idx);
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {searchKey && (
          <div className="flex items-center py-4">
            <Input
              placeholder={searchPlaceholder}
              value={(searchValue || (table.getColumn(searchKey)?.getFilterValue() as string)) ?? ""}
              onChange={(event) => handleSearch(event.target.value)}
              className="max-w-sm"
              onKeyDown={(e) => {
                if(e.key === "Enter" && onSearch) onSearch(searchValue);
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
            {children}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
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
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
             {/* Selection text logic if needed */}
             {isManual ? `共 ${pageCount ? pageCount * pageSize : 0} 条 (估算)` : `共 ${table.getFilteredRowModel().rows.length} 条`}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
           {/* Page Size Selector - Hide for manual for now or implement logic */}
          {!isManual && (
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">每页行数</p>
                <Select
                value={`${table.getState().pagination?.pageSize ?? 10}`}
                onValueChange={(value) => {
                    table.setPageSize(Number(value));
                }}
                >
                <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination?.pageSize ?? 10} />
                </SelectTrigger>
                <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          )}
          
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            第 {(table.getState().pagination?.pageIndex ?? 0) + 1} 页 / 共{" "}
            {table.getPageCount()} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange((table.getState().pagination?.pageIndex ?? 0) - 1)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange((table.getState().pagination?.pageIndex ?? 0) + 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
