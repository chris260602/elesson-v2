"use client"

import * as React from "react"
import {
  Column,
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  RowSelectionState, // Import types
  OnChangeFn,        // Import types
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpDown, ArrowUp, ArrowDown, ArrowDownUp } from "lucide-react"

// 1. Add Selection Props to Interface
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableSorting?: boolean
  enablePagination?: boolean
  initialPageSize?: number
  // Selection Props
  state?: {
    rowSelection?: RowSelectionState; 
  };
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
}

const formatId = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
}

const getColumnLabel = (column: Column<any, any>) => {
  const meta = column.columnDef.meta as { mobileLabel?: string } | undefined;
  if (meta?.mobileLabel) return meta.mobileLabel;
  if (typeof column.columnDef.header === 'string') return column.columnDef.header;
  return formatId(column.id);
}

export function CTable<TData, TValue>({
  columns,
  data,
  enableSorting = true,
  enablePagination = true,
  initialPageSize = 10,
  // Destructure new props
  state, 
  onRowSelectionChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    // 2. Connect Selection Logic
    getRowId: getRowId, 
    enableRowSelection: true, 
    onRowSelectionChange: onRowSelectionChange,
    state: {
      sorting,
      // Safety check: ensure rowSelection is never undefined if state is passed
      rowSelection: state?.rowSelection ?? {}, 
    },
    initialState: {
      pagination: { pageSize: initialPageSize },
    },
    onSortingChange: setSorting,
  })

  // 3. FIX: Add safety check 'sorting?.[0]' to prevent "reading '0'" error
  const currentSort = sorting?.[0]
  const activeSortColumnId = currentSort?.id

  const handleMobileSortSelect = (columnId: string) => {
    if (columnId === "none") {
      setSorting([])
      return
    }
    table.setSorting([{ id: columnId, desc: false }])
  }

  const toggleSortDirection = () => {
    if (!currentSort) return
    table.setSorting([{ id: currentSort.id, desc: !currentSort.desc }])
  }

  return (
    <div className="space-y-4">
      
      {/* MOBILE SORTING */}
      {enableSorting && (
        <div className="flex items-end gap-2 md:hidden">
          <div className="w-full space-y-1">
             <label className="text-xs font-medium text-muted-foreground ml-1">Sort by</label>
             <Select
                value={activeSortColumnId || "none"}
                onValueChange={handleMobileSortSelect}
             >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Default Order</SelectItem>
                    {table.getAllColumns().filter(col => col.getCanSort()).map(column => (
                         <SelectItem key={column.id} value={column.id}>
                            {getColumnLabel(column)}
                         </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 mb-[2px]"
            onClick={toggleSortDirection}
            disabled={!currentSort}
          >
             {currentSort?.desc ? <ArrowDown className="h-4 w-4" /> : currentSort ? <ArrowUp className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4 opacity-50" />}
          </Button>
        </div>
      )}

      {/* DESKTOP TABLE */}
      <div className="hidden rounded-md border md:block">
        <Table className="rounded-md">
          <TableHeader className="bg-primary">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = enableSorting && header.column.getCanSort()
                  const isSorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={isSortable ? "cursor-pointer select-none group" : ""}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSortable && (
                            <>
                              {isSorted === "asc" ? <ArrowUp className="h-4 w-4 text-gray-900" /> : 
                               isSorted === "desc" ? <ArrowDown className="h-4 w-4 text-gray-900" /> : 
                               <ArrowUpDown className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />}
                            </>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE CARDS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div key={row.id} className={`rounded-lg border text-card-foreground shadow-sm p-4 space-y-4 ${row.getIsSelected() ? 'bg-slate-50 border-primary' : 'bg-card'}`}>
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getColumnLabel(cell.column)}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-muted-foreground border rounded-lg border-dashed">
            No results found.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {enablePagination && (
        <div className="flex flex-col gap-4 items-center justify-between py-4 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row w-full sm:w-auto">
            <p className="text-sm font-medium text-muted-foreground">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-full sm:w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8 w-full sm:w-auto">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to previous page</span>
                <span aria-hidden="true">&lt;</span>
              </Button>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to next page</span>
                <span aria-hidden="true">&gt;</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}