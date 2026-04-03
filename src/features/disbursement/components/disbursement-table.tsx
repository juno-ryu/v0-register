import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { priceFormat } from '@/utils/price'
import { DISBURSEMENT_STATUS, DISBURSEMENT_STATUS_LABEL } from '@/features/disbursement/schema'
import type { DisbursementSetItem } from '@/features/disbursement/schema'

interface DisbursementTableProps {
  data: DisbursementSetItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  isMeal: boolean
  onPageChange: (page: number) => void
  onDetailClick: (item: DisbursementSetItem) => void
}

export function DisbursementTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  isMeal,
  onPageChange,
  onDetailClick,
}: DisbursementTableProps) {
  const columns = useMemo<ColumnDef<DisbursementSetItem>[]>(
    () => [
      {
        header: '매장',
        accessorKey: 'store_name',
        minSize: 180,
        cell: ({ row }) => (
          <span className="typo-body3">{row.original.store_name ?? '-'}</span>
        ),
      },
      {
        header: '고객사',
        accessorKey: 'customer_company_name',
        size: 152,
        cell: ({ row }) => (
          <span className="typo-body3">{row.original.customer_company_name ?? '-'}</span>
        ),
      },
      {
        header: '정산기간',
        id: 'disbursement_period',
        size: 124,
        cell: ({ row }) => (
          <span className="whitespace-pre typo-body3">
            {row.original.disbursement_period_start}
            {'\n'}~ {row.original.disbursement_period_end}
          </span>
        ),
      },
      {
        header: isMeal ? '이용건수' : '거래건수',
        accessorKey: 'transaction_count',
        size: 84,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="typo-body3">
            {row.original.transaction_count ?? 0}
          </span>
        ),
      },
      {
        header: '상태',
        accessorKey: 'disbursement_status',
        size: 116,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const status = row.original.disbursement_status
          const isCompleted = status === DISBURSEMENT_STATUS.COMPLETED
          return (
            <span
              className={
                isCompleted ? 'typo-body3 text-status-positive' : 'typo-body3 text-status-cautionary'
              }
            >
              {DISBURSEMENT_STATUS_LABEL[status as keyof typeof DISBURSEMENT_STATUS_LABEL] ?? status}
            </span>
          )
        },
      },
      {
        header: isMeal ? '이용금액' : '거래금액',
        id: 'net_total_amount',
        size: 128,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="typo-body3">
            {priceFormat(row.original.total_burden_amounts?.net_total_amount ?? 0)}
          </span>
        ),
      },
      {
        header: '회원부담금액',
        id: 'net_customer_burden_amount',
        size: 128,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="typo-body3">
            {priceFormat(
              row.original.total_burden_amounts?.net_customer_burden_amount ?? 0,
            )}
          </span>
        ),
      },
      {
        header: '운영사부담금액',
        id: 'net_operator_burden_amount',
        size: 128,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="typo-body3">
            {priceFormat(
              row.original.total_burden_amounts?.net_operator_burden_amount ?? 0,
            )}
          </span>
        ),
      },
      {
        header: '고객사부담금액',
        id: 'net_customer_company_burden_amount',
        size: 128,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="typo-body3">
            {priceFormat(
              row.original.total_burden_amounts?.net_customer_company_burden_amount ?? 0,
            )}
          </span>
        ),
      },
      {
        header: '상세내역',
        id: 'detail',
        size: 84,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDetailClick(row.original)
            }}
          >
            조회
          </Button>
        ),
      },
    ],
    [isMeal, onDetailClick],
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
    />
  )
}
