import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { formatDate } from '@/utils/date'
import formatPhoneNumber from '@/utils/phone'
import type { NormalCustomerItem } from '@/features/customers/schema'

interface NormalCustomerTableProps {
  data: NormalCustomerItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function NormalCustomerTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
}: NormalCustomerTableProps) {
  const columns = useMemo<ColumnDef<NormalCustomerItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '#',
        size: 100,
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
        accessorKey: 'first_name',
        header: '이름',
        size: 120,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'registered_store_name',
        header: '가입경로 (매장)',
        minSize: 180,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'subscription_status',
        header: '광고수신',
        size: 84,
        meta: { align: 'center' },
        cell: ({ getValue }) => {
          const val = getValue<boolean>()
          return (
            <span className={val ? 'text-key-blue weight-500' : 'text-neutral-400'}>
              {val ? '동의' : '미동의'}
            </span>
          )
        },
      },
      {
        accessorKey: 'date_joined',
        header: '생성일시',
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<string>()
          if (!val) return '-'
          return (
            <div className="whitespace-pre-line">
              {formatDate(val, 'yy/MM/dd')}{'\n'}{formatDate(val, 'HH:mm:ss')}
            </div>
          )
        },
      },
    ],
    [],
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
