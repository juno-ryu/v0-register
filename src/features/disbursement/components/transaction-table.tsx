import { useMemo } from 'react'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { priceFormat } from '@/utils/price'
import type { TransactionItem } from '@/features/disbursement/schema'

// 주문채널 번역 (레거시: ORDER_CHANNEL_TRANSLATION)
const ORDER_CHANNEL_LABEL: Record<string, string> = {
  KIOSK: '키오스크',
  MOBILE: '모바일',
  POS: 'POS',
  WEB: '웹',
  APP: '앱',
}

function getOrderChannelText(channel: string | null) {
  if (!channel) return '-'
  return ORDER_CHANNEL_LABEL[channel] ?? channel
}

// 거래분류 (식음료)
function getTransactionTypeText(paymentType: string) {
  return paymentType.includes('PAYMENT') ? '결제' : '환불'
}
function getTransactionTypeClass(paymentType: string) {
  return paymentType.includes('PAYMENT') ? 'text-key-blue' : 'text-status-destructive'
}

// 상태 (급식)
function getPaymentStatusText(paymentType: string) {
  return paymentType.includes('REFUND') ? '취소' : paymentType.includes('PAYMENT') ? '완료' : '취소'
}
function getPaymentStatusClass(paymentType: string) {
  return paymentType.includes('REFUND') ? 'text-muted-foreground' : paymentType.includes('PAYMENT') ? 'text-status-positive' : 'text-muted-foreground'
}

// 금액 표시: PAYMENT면 양수, REFUND면 음수
function formatAmount(amount: number, paymentType: string) {
  const value = paymentType.includes('PAYMENT') ? amount : -amount
  return priceFormat(value)
}

interface TransactionTableProps {
  data: TransactionItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  isMeal: boolean
  onPageChange: (page: number) => void
  onCancelClick?: (item: TransactionItem) => void
}

export function TransactionTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  isMeal,
  onPageChange,
  onCancelClick,
}: TransactionTableProps) {
  const columns = useMemo<ColumnDef<TransactionItem>[]>(() => {
    const base: ColumnDef<TransactionItem>[] = [
      {
        id: 'processed_at',
        header: '거래일시',
        cell: ({ row }) => {
          const dt = row.original.processed_at
          try {
            const d = new Date(dt)
            return (
              <div className="whitespace-pre text-left text-sm">
                {format(d, 'yyyy/MM/dd')}{'\n'}{format(d, 'HH:mm:ss')}
              </div>
            )
          } catch (err: unknown) {
            console.error('거래일시 포맷 변환 실패:', err)
            return <span>{dt ?? '-'}</span>
          }
        },
        size: 112,
      },
      // 식음료: 주문코드 / 급식: 거래코드
      {
        id: 'order_code',
        header: isMeal ? '거래코드' : '주문코드',
        cell: ({ row }) => {
          const code = isMeal
            ? row.original.meal_order_sn
            : row.original.order_sn
          return <span>{code ?? '-'}</span>
        },
        minSize: 124,
      },
    ]

    // 식음료 전용: 주문채널
    if (!isMeal) {
      base.push({
        id: 'order_channel',
        header: '주문채널',
        cell: ({ row }) => <span>{getOrderChannelText(row.original.order_channel)}</span>,
        size: 180,
      })
    }

    base.push({
      id: 'customer_company_name',
      header: '고객사',
      cell: ({ row }) => <span>{row.original.customer_company_name ?? '-'}</span>,
      size: 152,
    })

    // 급식 전용: 급식명
    if (isMeal) {
      base.push({
        id: 'meal_name',
        header: '급식',
        cell: ({ row }) => <span>{row.original.meal_name ?? '-'}</span>,
        size: 124,
      })
    }

    base.push(
      {
        id: 'employee_name',
        header: '회원명',
        cell: ({ row }) => <span>{row.original.employee_name ?? '-'}</span>,
        size: 104,
      },
      {
        id: 'employee_number',
        header: '회원번호',
        cell: ({ row }) => <span>{row.original.employee_number ?? '-'}</span>,
        size: 104,
      },
      // 거래분류(식음료) or 상태(급식)
      {
        id: 'payment_type',
        header: isMeal ? '상태' : '거래분류',
        cell: ({ row }) => {
          const pt = row.original.payment_type
          const text = isMeal ? getPaymentStatusText(pt) : getTransactionTypeText(pt)
          const cls = isMeal ? getPaymentStatusClass(pt) : getTransactionTypeClass(pt)
          return <span className={`weight-700 ${cls}`}>{text}</span>
        },
        size: 84,
        meta: { align: 'center' },
      },
      {
        id: 'bare_total_amount',
        header: '거래금액',
        cell: ({ row }) => (
          <span>{formatAmount(row.original.bare_total_amount, row.original.payment_type)}</span>
        ),
        size: 128,
        meta: { align: 'right' },
      },
      {
        id: 'customer_burden_amount',
        header: '고객부담금액',
        cell: ({ row }) => (
          <span>{formatAmount(row.original.customer_burden_amount, row.original.payment_type)}</span>
        ),
        size: 128,
        meta: { align: 'right' },
      },
      {
        id: 'operator_burden_amount',
        header: '운영사부담금액',
        cell: ({ row }) => (
          <span>{formatAmount(row.original.operator_burden_amount, row.original.payment_type)}</span>
        ),
        size: 128,
        meta: { align: 'right' },
      },
      {
        id: 'customer_company_burden_amount',
        header: '고객사부담금액',
        cell: ({ row }) => (
          <span>{formatAmount(row.original.customer_company_burden_amount, row.original.payment_type)}</span>
        ),
        size: 128,
        meta: { align: 'right' },
      },
    )

    // 급식 전용: 거래취소 버튼
    if (isMeal) {
      base.push({
        id: 'meal_cancel',
        header: '거래취소',
        cell: ({ row }) => {
          const canCancel = row.original.meal_cancel_available ?? false
          return (
            <Button
              size="sm"
              variant={canCancel ? 'default' : 'outline'}
              disabled={!canCancel}
              onClick={() => onCancelClick?.(row.original)}
            >
              거래취소
            </Button>
          )
        },
        size: 90,
        meta: { align: 'center' },
      })
    }

    return base
  }, [isMeal, onCancelClick])

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
