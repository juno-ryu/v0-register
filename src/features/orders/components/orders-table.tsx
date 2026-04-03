import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import {
  ORDER_STATUS_ENUM,
  ORDER_STATUS_COLOR_ENUM,
} from '@/constants/order'
import {
  TAKE_TYPE_ENUM,
  ORDER_CHANNEL_TRANSLATION,
} from '@/constants/take-type'
import { priceFormat } from '@/utils/price'
import { formatDate } from '@/utils/date'
import { useAuthStore, selectIsManagementAccount, selectIsBrandAccount } from '@/store/useAuthStore'
import type { OrderItem } from '@/features/orders/schema'

interface OrdersTableProps {
  data: OrderItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (order: OrderItem) => void
}

// 금액 포맷 (음수 포함) — 레거시 negativePriceFormatWithCurrency 포팅
function formatAmount(value: number): string {
  if (value < 0) return `-${priceFormat(Math.abs(value))} 원`
  return `${priceFormat(value)} 원`
}

export function OrdersTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onRowClick,
}: OrdersTableProps) {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  const isBrandAccount = useAuthStore(selectIsBrandAccount)

  const columns = useMemo<ColumnDef<OrderItem>[]>(() => {
    const cols: ColumnDef<OrderItem>[] = [
      {
        accessorKey: 'paidDt',
        header: '주문일시',
        cell: ({ row }) => {
          const val = row.original.paidDt
          if (!val) return '-'
          return (
            <div className="whitespace-pre-line">
              {formatDate(val, 'yyyy/MM/dd')}{'\n'}{formatDate(val, 'HH:mm:ss')}
            </div>
          )
        },
        size: 96,
      },
      {
        accessorKey: 'sn',
        header: '주문 ID',
        size: 124,
      },
    ]

    if (isManagementAccount) {
      cols.push({ accessorKey: 'brandName', header: '브랜드', size: 140 })
    }
    if (isManagementAccount || isBrandAccount) {
      cols.push({ accessorKey: 'storeName', header: '매장', size: 180 })
    }

    cols.push(
      { accessorKey: 'menuTitle', header: '주문내역', minSize: 216 },
      {
        accessorKey: 'orderChannel',
        header: '주문채널',
        size: 108,
        cell: ({ getValue }) => {
          const val = getValue<string>()
          return ORDER_CHANNEL_TRANSLATION[val as keyof typeof ORDER_CHANNEL_TRANSLATION] ?? val
        },
      },
      {
        accessorKey: 'takeType',
        header: '주문분류',
        size: 108,
        cell: ({ getValue }) => {
          const val = getValue<number>()
          return TAKE_TYPE_ENUM[val as keyof typeof TAKE_TYPE_ENUM] ?? val
        },
      },
    )

    cols.push(
      {
        accessorKey: 'employeeNumber',
        header: '회원번호',
        size: 120,
        cell: ({ getValue }) => getValue<string>() ?? '-',
      },
      {
        accessorKey: 'status',
        header: '주문상태',
        size: 128,
        meta: { align: 'center' },
        cell: ({ getValue }) => {
          const status = getValue<number>()
          const label = ORDER_STATUS_ENUM[status as keyof typeof ORDER_STATUS_ENUM]
          const color = ORDER_STATUS_COLOR_ENUM[label]
          return <span style={{ color }}>● {label}</span>
        },
      },
      {
        accessorKey: 'totalBareAmount',
        header: '주문금액',
        size: 116,
        meta: { align: 'right' },
        cell: ({ getValue }) => formatAmount(getValue<number>()),
      },
      {
        accessorKey: 'totalDiscountAmount',
        header: '할인금액',
        size: 116,
        meta: { align: 'right' },
        cell: ({ getValue }) => formatAmount(getValue<number>()),
      },
      {
        accessorKey: 'requestAmount',
        header: '승인금액',
        size: 116,
        meta: { align: 'right' },
        cell: ({ getValue }) => formatAmount(getValue<number>()),
      },
    )

    return cols
  }, [isManagementAccount, isBrandAccount])

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
      emptyMessage="검색 결과가 없습니다."
    />
  )
}
