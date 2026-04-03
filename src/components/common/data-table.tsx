import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/common/data-table-pagination'

// TanStack Table ColumnMeta 확장 — align 공통 지원
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: 'left' | 'center' | 'right'
  }
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

/**
 * columnDef의 size/minSize로 CSS style 생성
 * table-layout: fixed 기반 — width가 강제 적용됨
 * - size 지정 → 고정 컬럼 (정확히 해당 px)
 * - minSize만 지정 → fill 컬럼 (최소 너비 보장, 나머지 공간 차지)
 */
function getColumnSizing(colDef: { size?: number; minSize?: number }) {
  if (colDef.size != null) return { width: colDef.size }
  if (colDef.minSize != null) return { minWidth: colDef.minSize }
  return undefined
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // 서버사이드 페이지네이션
  totalCount?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  // 상태
  isLoading?: boolean
  emptyMessage?: string
  // 행 클릭
  onRowClick?: (row: TData) => void
  // 행별 className 커스터마이징
  getRowClassName?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  isLoading = false,
  emptyMessage = '조회된 데이터가 없습니다.',
  onRowClick,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // 기본 size 150 제거 — size 미지정 컬럼이 fill로 동작하도록
    defaultColumn: { size: undefined },
    // 서버사이드이므로 manualPagination
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  })

  // 모든 컬럼의 최소 너비 합계 → table min-width로 사용
  // 컨테이너가 넓으면 fill 컬럼이 나머지 공간 차지, 좁으면 스크롤
  const tableMinWidth = columns.reduce(
    (sum, col) => sum + (col.size ?? col.minSize ?? 0),
    0,
  )

  return (
    <div className="space-y-4">
      {/* 테이블 */}
      <div className="border">
        <Table containerClassName="overflow-auto max-h-[calc(100vh-16rem)]" style={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-accent hover:bg-accent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap typo-micro1 weight-600 text-muted-foreground',
                      ALIGN_CLASS[header.column.columnDef.meta?.align ?? 'left'],
                    )}
                    style={getColumnSizing(header.column.columnDef)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {/* 로딩 상태 — skeleton rows */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="h-12">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              /* 빈 상태 */
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center typo-body3 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              /* 데이터 */
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    getRowClassName?.(row.original),
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'h-12 whitespace-nowrap typo-body3 overflow-hidden text-ellipsis',
                        ALIGN_CLASS[cell.column.columnDef.meta?.align ?? 'left'],
                      )}
                      style={getColumnSizing(cell.column.columnDef)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalCount > 0 && onPageChange && (
        <DataTablePagination
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
