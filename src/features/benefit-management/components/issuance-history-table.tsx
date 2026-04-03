import { useMemo } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { priceFormat } from '@/utils/price'
import { formatDate } from '@/utils/date'
import formatPhoneNumber from '@/utils/phone'
import { useAuthStore, selectIsManagementAccount, selectIsStoreAccount, selectBrandDomain } from '@/store/useAuthStore'
import {
  DISCOUNT_TYPE,
  COUPON_TYPE,
  ISSUED_COUPON_STATUS,
  ISSUED_COUPON_STATUS_LABEL,
} from '@/features/benefit-management/schema'
import type { IssuedCouponItem } from '@/features/benefit-management/schema'

interface IssuanceHistoryTableProps {
  data: IssuedCouponItem[]
  totalCount: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

// 쿠폰 혜택 셀 렌더링
function CouponBenefitCell({ item }: { item: IssuedCouponItem }) {
  if (item.coupon_type === COUPON_TYPE.BONUS) {
    return <strong>추가 혜택</strong>
  }
  if (item.discount_type === DISCOUNT_TYPE.PERCENTAGE) {
    return (
      <div className="flex flex-col">
        <strong>{item.discount_amount} %</strong>
        {item.max_discount_amount > 0 && (
          <span className="typo-micro1 text-muted-foreground">
            (최대 {priceFormat(item.max_discount_amount)} 원)
          </span>
        )}
      </div>
    )
  }
  return <strong>{priceFormat(item.discount_amount)} 원</strong>
}

// 상태 뱃지
function StatusBadge({ status }: { status: number }) {
  const label = ISSUED_COUPON_STATUS_LABEL[status as keyof typeof ISSUED_COUPON_STATUS_LABEL] ?? '-'
  const variant =
    status === ISSUED_COUPON_STATUS.USED
      ? 'default'
      : status === ISSUED_COUPON_STATUS.EXPIRED
        ? 'secondary'
        : 'outline'
  return <Badge variant={variant}>{label}</Badge>
}

export function IssuanceHistoryTable({
  data,
  totalCount,
  page,
  pageSize,
  isLoading,
  onPageChange,
}: IssuanceHistoryTableProps) {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const brandDomain = useAuthStore(selectBrandDomain)

  // 사용URL 복사 — 레거시: https://${brandDetail.domain}/redeem-coupon/${sn}
  const handleCopyRedeemUrl = (sn: string) => {
    const url = brandDomain
      ? `https://${brandDomain}/redeem-coupon/${sn}`
      : `${window.location.origin}/redeem-coupon/${sn}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('쿠폰사용 페이지 URL이 복사되었습니다.', { duration: 3000 })
    }).catch(() => {
      toast.error('복사에 실패했습니다.')
    })
  }

  const columns = useMemo<ColumnDef<IssuedCouponItem>[]>(() => {
    const cols: ColumnDef<IssuedCouponItem>[] = [
      {
        accessorKey: 'sn',
        header: '사용 코드',
        size: 120,
      },
      {
        accessorKey: 'name',
        header: '쿠폰명',
        minSize: 200,
      },
    ]

    // 브랜드 — 운영사 계정만
    if (isManagementAccount) {
      cols.push({
        accessorKey: 'brand_name',
        header: '브랜드',
        size: 140,
      })
    }

    cols.push(
      {
        accessorKey: 'create_dt',
        header: '발행일시',
        size: 96,
        cell: ({ row }) => formatDate(row.original.create_dt),
      },
      {
        accessorKey: 'used_dt',
        header: '사용일시',
        size: 96,
        cell: ({ row }) =>
          row.original.used_dt ? formatDate(row.original.used_dt) : '-',
      },
      {
        id: 'benefit',
        header: '쿠폰 혜택',
        size: 140,
        meta: { align: 'right' },
        cell: ({ row }) => <CouponBenefitCell item={row.original} />,
      },
      {
        accessorKey: 'status',
        header: '상태',
        size: 76,
        meta: { align: 'center' },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'user_phone_number',
        header: '사용자 연락처',
        size: 128,
        meta: { align: 'center' },
        // BUG-D06: +82 포맷 변환
        cell: ({ row }) => formatPhoneNumber(row.original.user_phone_number),
      },
      // BUG-D04: 사용URL 복사 버튼 (레거시 동일)
      {
        id: 'redeem_url',
        header: '사용URL',
        size: 76,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 typo-micro1"
            onClick={() => handleCopyRedeemUrl(row.original.sn)}
          >
            복사
          </Button>
        ),
      },
    )

    // 사용처 — 매장 계정 제외
    if (!isStoreAccount) {
      cols.push({
        id: 'used_store',
        header: '사용처',
        size: 136,
        cell: ({ row }) => row.original.used_store_info?.name ?? '-',
      })
    }

    cols.push({
      accessorKey: 'order_number',
      header: '주문번호',
      size: 108,
      meta: { align: 'center' },
      cell: ({ row }) => row.original.order_number ?? '-',
    })

    return cols
  }, [isManagementAccount, isStoreAccount, brandDomain, handleCopyRedeemUrl])

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
