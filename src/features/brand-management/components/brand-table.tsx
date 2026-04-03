import { useMemo } from 'react'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { BrandListItem } from '@/features/brand-management/schema'

// ─────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────
function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '-'
  return format(new Date(dt), 'yyyy/MM/dd HH:mm:ss')
}

function formatStoreCount(
  total: string | number | null | undefined,
  active: string | number | null | undefined,
): string {
  const t = total != null ? Number(total) : 0
  const a = active != null ? Number(active) : 0
  return `${t} (활성: ${a})`
}

// ─────────────────────────────────────────────
// 상태 뱃지
// 레거시: BrandTable.vue getStatusText / getStatusClass
// is_active 기준으로 판단 (API에 status 필드 없음)
// ─────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean | undefined }) {
  const active = isActive !== false  // undefined도 운영 중으로 처리
  return (
    <span
      className={`inline-flex items-center gap-1.5 typo-body3 weight-600 ${active ? 'text-status-positive' : 'text-neutral-400'}`}
    >
      <span
        className={`block h-1.5 w-1.5 rounded-full ${active ? 'bg-status-positive' : 'bg-neutral-400'}`}
      />
      {active ? '운영 중' : '운영 중단'}
    </span>
  )
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface BrandTableProps {
  data: BrandListItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (brand: BrandListItem) => void
  onViewStores: (brandId: string | number) => void
}

export function BrandTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onRowClick,
  onViewStores,
}: BrandTableProps) {
  const columns = useMemo<ColumnDef<BrandListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '브랜드',
        minSize: 188,
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: 'domain',
        header: '도메인',
        size: 180,
        // 레거시: domain.split('.')[0] 으로 첫 번째 서브도메인만 표시 (BUG-J01)
        cell: ({ row }) => row.original.domain?.split('.')[0] ?? '-',
      },
      {
        accessorKey: 'is_active',
        header: '상태',
        size: 120,
        meta: { align: 'center' },
        cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
      },
      {
        accessorKey: 'use_user',
        header: '일반회원',
        size: 92,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <div
            className="flex justify-center cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox checked={row.original.use_user ?? false} className="pointer-events-none" />
          </div>
        ),
      },
      {
        accessorKey: 'use_membership_user',
        header: '임직원회원',
        size: 92,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <div
            className="flex justify-center cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox checked={row.original.use_membership_user ?? false} className="pointer-events-none" />
          </div>
        ),
      },
      {
        accessorKey: 'total_stores_count',
        header: '보유매장',
        size: 136,
        cell: ({ row }) =>
          formatStoreCount(row.original.total_stores_count, row.original.active_stores_count),
      },
      {
        accessorKey: 'update_dt',
        header: '업데이트',
        size: 108,
        cell: ({ row }) => formatDateTime(row.original.update_dt),
      },
      {
        accessorKey: 'create_dt',
        header: '생성일',
        size: 108,
        cell: ({ row }) => formatDateTime(row.original.create_dt),
      },
      {
        id: 'actions',
        header: '매장보기',
        size: 80,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              onClick={() => onViewStores(row.original.id)}
            >
              조회
            </Button>
          </div>
        ),
      },
    ],
    [onViewStores],
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      emptyMessage="조회된 브랜드가 없습니다."
    />
  )
}
