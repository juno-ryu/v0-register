import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { Button } from '@/components/ui/button'
import { priceFormat } from '@/utils/price'
import { formatDate } from '@/utils/date'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import {
  COUPON_STATUS,
  COUPON_STATUS_LABEL,
  DISCOUNT_TYPE,
  COUPON_TYPE,
} from '@/features/benefit-management/schema'
import type { CouponListItem } from '@/features/benefit-management/schema'

interface BenefitsTableProps {
  data: CouponListItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (coupon: CouponListItem) => void
  onIssueClick: (coupon: CouponListItem) => void
  onMessageClick: (coupon: CouponListItem) => void
  onCopyUrlClick: (coupon: CouponListItem) => void
  onStoreCountClick: (coupon: CouponListItem) => void
}

// 쿠폰 혜택 셀 렌더링 — 레거시 discountText 로직 포팅
function CouponBenefitCell({ coupon }: { coupon: CouponListItem }) {
  // 추가 혜택 (bonus 타입)
  if (coupon.coupon_type === COUPON_TYPE.BONUS) {
    return <strong>추가 혜택</strong>
  }
  // 할인율
  if (coupon.discount_type === DISCOUNT_TYPE.PERCENTAGE) {
    return (
      <div className="flex flex-col">
        <strong>{coupon.discount_amount} %</strong>
        {coupon.max_discount_amount > 0 && (
          <span className="typo-micro1 text-muted-foreground">
            (최대 {priceFormat(coupon.max_discount_amount)} 원)
          </span>
        )}
      </div>
    )
  }
  // 할인 금액
  return <strong>{priceFormat(coupon.discount_amount)} 원</strong>
}

// 발급수량 셀 — 사용수(굵게) / 총수량
function IssueQuantityCell({ coupon }: { coupon: CouponListItem }) {
  return (
    <div className="flex flex-col items-start">
      <strong>{coupon.issue_quantity ?? 0}</strong>
      <span className="typo-micro1 text-muted-foreground">/{coupon.total_quantity}</span>
    </div>
  )
}

// 발행/메시지 버튼 활성 조건 — 진행 중 상태에서만 활성
function isActionEnabled(status: number): boolean {
  return status === COUPON_STATUS.IN_PROGRESS
}

export function BenefitsTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onRowClick,
  onIssueClick,
  onMessageClick,
  onCopyUrlClick,
  onStoreCountClick,
}: BenefitsTableProps) {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)

  const columns = useMemo<ColumnDef<CouponListItem>[]>(
    () => {
      const cols: ColumnDef<CouponListItem>[] = [
        {
          header: '#',
          accessorKey: 'id',
          size: 68,
          meta: { align: 'center' },
          cell: ({ row }) => (
            <span className="typo-body3 text-muted-foreground">{row.original.id}</span>
          ),
        },
        {
          header: '쿠폰명',
          accessorKey: 'name',
          minSize: 220,
          cell: ({ row }) => (
            <Button variant="link" className="h-auto p-0 text-left typo-body3 weight-500" onClick={() => onRowClick(row.original)}>
              {row.original.name}
            </Button>
          ),
        },
      ]

      // 브랜드 컬럼 — 운영사 계정만 (레거시 동일)
      if (isManagementAccount) {
        cols.push({
          header: '브랜드',
          accessorKey: 'brand_name',
          size: 140,
          cell: ({ row }) => (
            <span className="typo-body3">{row.original.brand_name}</span>
          ),
        })
      }

      cols.push(
        {
          header: '등록일시',
          accessorKey: 'create_dt',
          size: 96,
          cell: ({ row }) => (
            <div className="whitespace-normal typo-body3 text-muted-foreground">
              {formatDate(row.original.create_dt, 'yy/MM/dd HH:mm:ss')}
            </div>
          ),
        },
        {
          header: '발행기간',
          accessorKey: 'issuable_start_date',
          size: 108,
          cell: ({ row }) => (
            <div className="whitespace-normal typo-body3 text-muted-foreground">
              {formatDate(row.original.issuable_start_date, 'yy/MM/dd')} ~{' '}
              {formatDate(row.original.issuable_end_date, 'yy/MM/dd')}
            </div>
          ),
        },
        {
          header: '쿠폰 혜택',
          accessorKey: 'discount_amount',
          size: 140,
          meta: { align: 'right' },
          cell: ({ row }) => <CouponBenefitCell coupon={row.original} />,
        },
        {
          header: '최소주문',
          accessorKey: 'min_payment_amount',
          size: 116,
          meta: { align: 'right' },
          cell: ({ row }) => (
            <span className="typo-body3">
              {row.original.min_payment_amount != null && row.original.min_payment_amount > 0
                ? `${priceFormat(row.original.min_payment_amount)} 원`
                : '-'}
            </span>
          ),
        },
        {
          header: '상태',
          accessorKey: 'status',
          size: 64,
          meta: { align: 'center' },
          cell: ({ row }) => (
            <span className="typo-body3">{COUPON_STATUS_LABEL[row.original.status as keyof typeof COUPON_STATUS_LABEL] ?? row.original.status}</span>
          ),
        },
        {
          header: '발급수량',
          accessorKey: 'issue_quantity',
          size: 84,
          meta: { align: 'right' },
          cell: ({ row }) => <IssueQuantityCell coupon={row.original} />,
        },
        {
          header: '적용매장',
          accessorKey: 'stores',
          size: 76,
          meta: { align: 'right' },
          cell: ({ row }) => (
            <Button variant="link" className="h-auto p-0 typo-body3 weight-500" onClick={() => onStoreCountClick(row.original)}>
              {row.original.stores.length}
            </Button>
          ),
        },
        {
          header: '사용URL',
          id: 'copy_url',
          size: 76,
          meta: { align: 'center' },
          cell: ({ row }) => (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 typo-micro1"
              onClick={() => onCopyUrlClick(row.original)}
            >
              복사
            </Button>
          ),
        },
        {
          header: '발행',
          id: 'issue',
          size: 76,
          meta: { align: 'center' },
          cell: ({ row }) => (
            <Button
              size="sm"
              className="h-7 px-2 typo-micro1"
              disabled={!isActionEnabled(row.original.status)}
              onClick={() => onIssueClick(row.original)}
            >
              발행
            </Button>
          ),
        },
        {
          header: '메시지',
          id: 'message',
          size: 76,
          meta: { align: 'center' },
          cell: ({ row }) => (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 typo-micro1"
              disabled={!row.original.message_send_available}
              onClick={() => onMessageClick(row.original)}
            >
              발송
            </Button>
          ),
        },
      )

      return cols
    },
    [isManagementAccount, onRowClick, onIssueClick, onMessageClick, onCopyUrlClick, onStoreCountClick],
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
