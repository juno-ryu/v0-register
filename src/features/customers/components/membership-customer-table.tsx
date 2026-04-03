import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/date'
import formatPhoneNumber from '@/utils/phone'
import { MEMBER_STATUS, MEMBER_STATUS_TEXT } from '@/features/customers/schema'
import type { MembershipCustomerItem } from '@/features/customers/schema'

// 멤버 상태별 배경색 클래스 (Tailwind 토큰 사용)
const STATUS_COLOR_MAP: Record<string, string> = {
  [MEMBER_STATUS.ACTIVE]: 'bg-status-positive',
  [MEMBER_STATUS.PASSWORD_SET_REQUIRED]: 'bg-status-cautionary',
  [MEMBER_STATUS.STOPPED]: 'bg-status-destructive',
  [MEMBER_STATUS.DELETED]: 'bg-neutral-400',
}

interface MembershipCustomerTableProps {
  data: MembershipCustomerItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (customer: MembershipCustomerItem) => void
  onDeleteClick: (customer: MembershipCustomerItem) => void
}

export function MembershipCustomerTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onRowClick,
  onDeleteClick,
}: MembershipCustomerTableProps) {
  const columns = useMemo<ColumnDef<MembershipCustomerItem>[]>(
    () => [
      {
        accessorKey: 'employee_number',
        header: '회원번호',
        size: 120,
        cell: ({ row, getValue }) => (
          <Button
            variant="link"
            className="h-auto p-0 weight-400 text-key-blue"
            onClick={(e) => {
              e.stopPropagation()
              onRowClick(row.original)
            }}
          >
            {getValue<string>() ?? '-'}
          </Button>
        ),
      },
      {
        accessorKey: 'name',
        header: '이름',
        size: 100,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'phone_number',
        header: '연락처',
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<string>()
          if (!val) return '-'
          return formatPhoneNumber(val)
        },
      },
      {
        accessorKey: 'customer_company_name',
        header: '소속',
        minSize: 168,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'sn',
        header: 'RFID',
        size: 96,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'card_number',
        header: '카드번호',
        size: 120,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'status',
        header: '상태',
        size: 100,
        meta: { align: 'center' },
        cell: ({ getValue }) => {
          const status = getValue<string>()
          if (!status) return '-'
          const colorClass = STATUS_COLOR_MAP[status] ?? 'bg-neutral-400'
          const text = MEMBER_STATUS_TEXT[status as keyof typeof MEMBER_STATUS_TEXT] ?? status
          return (
            <span
              className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 typo-micro1 weight-700 text-white ${colorClass}`}
            >
              {text}
            </span>
          )
        },
      },
      {
        accessorKey: 'update_dt',
        header: '업데이트',
        size: 172,
        cell: ({ getValue }) => {
          const val = getValue<string>()
          if (!val) return '-'
          return formatDate(val, 'yy/MM/dd HH:mm:ss')
        },
      },
      {
        accessorKey: 'create_dt',
        header: '생성일시',
        size: 172,
        cell: ({ getValue }) => {
          const val = getValue<string>()
          if (!val) return '-'
          return formatDate(val, 'yy/MM/dd HH:mm:ss')
        },
      },
      {
        id: 'delete',
        header: '삭제',
        size: 56,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const customer = row.original
          const isDeleted = customer.status === MEMBER_STATUS.DELETED
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              style={{ opacity: isDeleted ? 0.2 : 1 }}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClick(customer)
              }}
              aria-label="삭제"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )
        },
      },
    ],
    [onRowClick, onDeleteClick],
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
      emptyMessage="검색 결과가 없습니다."
    />
  )
}
