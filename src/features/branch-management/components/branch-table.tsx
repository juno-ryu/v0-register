import { useMemo } from 'react'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { TAKE_TYPE_ENUM } from '@/constants/take-type'
import type { BranchListItem } from '@/features/branch-management/schema'

// ─────────────────────────────────────────────
// POS 타입 레이블 (레거시 branch-constants.ts 포팅)
// ─────────────────────────────────────────────
const POS_TYPE_LABEL: Record<string, string> = {
  smartro_pos: '스마일포스',
  harmony_pos: '하모니포스',
  did_only: '미연동',
}

function getPosTypeLabel(posType: string | null | undefined): string {
  if (!posType) return '-'
  return POS_TYPE_LABEL[posType] ?? '-'
}

function formatAvailableTakeTypes(types: number[] | undefined): string {
  if (!types || types.length === 0) return '-'
  return types.map((t) => TAKE_TYPE_ENUM[t as keyof typeof TAKE_TYPE_ENUM] ?? String(t)).join(', ')
}

function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '-'
  return format(new Date(dt), 'yyyy/MM/dd HH:mm:ss')
}

// ─────────────────────────────────────────────
// 상태 뱃지
// ─────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 typo-body3 weight-600 ${isActive ? 'text-status-positive' : 'text-muted-foreground'}`}
    >
      <span
        className={`block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-status-positive' : 'bg-neutral-550'}`}
      />
      {isActive ? '운영 중' : '운영 중단'}
    </span>
  )
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface BranchTableProps {
  data: BranchListItem[]
  isManagement: boolean
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function BranchTable({
  data,
  isManagement,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
}: BranchTableProps) {
  const columns = useMemo<ColumnDef<BranchListItem>[]>(() => {
    const cols: ColumnDef<BranchListItem>[] = [
      {
        accessorKey: 'sn',
        header: '코드',
        size: 128,
        cell: ({ row }) => row.original.sn ?? '-',
      },
      {
        accessorKey: 'name',
        header: '매장',
        minSize: 220,
        cell: ({ row }) => (
          <span className="whitespace-normal">{row.original.name}</span>
        ),
      },
      ...(isManagement
        ? [{
          accessorKey: 'brand_name',
          header: '브랜드',
          size: 180,
          cell: ({ row }: { row: { original: BranchListItem } }) => row.original.brand_name ?? '-',
        } satisfies ColumnDef<BranchListItem>]
        : []),
      {
        accessorKey: 'is_active',
        header: '상태',
        size: 120,
        meta: { align: 'center' },
        cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
      },
      {
        accessorKey: 'pos',
        header: '포스 연동',
        size: 112,
        cell: ({ row }) => getPosTypeLabel(row.original.pos),
      },
      {
        accessorKey: 'external_sn',
        header: '가맹점 번호',
        size: 116,
        cell: ({ row }) => row.original.external_sn ?? '-',
      },
      {
        accessorKey: 'available_take_types',
        header: '주문 서비스',
        size: 180,
        cell: ({ row }) => formatAvailableTakeTypes(row.original.available_take_types),
      },
      {
        accessorKey: 'update_dt',
        header: '업데이트 일시',
        size: 172,
        cell: ({ row }) => formatDateTime(row.original.update_dt),
      },
      {
        accessorKey: 'create_dt',
        header: '등록 일시',
        size: 172,
        cell: ({ row }) => formatDateTime(row.original.create_dt),
      },
    ]
    return cols
  }, [isManagement])

  const handleRowClick = (row: BranchListItem) => {
    // 상세 페이지로 이동 (새 탭 — 레거시 동일 방식)
    window.open(`/branch-management/${row.id}`, '_blank')
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onRowClick={handleRowClick}
      emptyMessage="검색 결과가 없습니다."
    />
  )
}
