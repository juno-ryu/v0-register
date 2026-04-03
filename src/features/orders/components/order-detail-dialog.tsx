import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useOrderDetail, useOrderMenuOptions, useCancelOrder } from '@/features/orders/queries'
import { ORDER_STATUS_ENUM, ORDER_STATUS_COLOR_ENUM } from '@/constants/order'
import {
  TAKE_TYPE_ENUM,
  ORDER_CHANNEL_TRANSLATION,
  ROBOT_DELIVERY_STATUS_TRANSLATION,
  TAKE_TYPE_ENUM_CODE,
} from '@/constants/take-type'
import { PAYMENT_CODE } from '@/constants/payment'
import { formatDate } from '@/utils/date'
import { priceFormat } from '@/utils/price'
import formatPhoneNumber from '@/utils/phone'
import { copyToClipboard } from '@/utils/clipboard'

// WEB_PG 채널에서 취소 가능한 상태 목록 (레거시 동일)
const ALLOWED_CANCEL_STATUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 24, 25, 26, 27, 28, 32, 33, 34]

interface OrderDetailDialogProps {
  orderId: string | null
  open: boolean
  onClose: () => void
  onOrderCancelled: () => void
}

interface InfoRowProps {
  label: string
  value?: string | number | null
  hasCopy?: boolean
  color?: string
}

function InfoRow({ label, value, hasCopy, color }: InfoRowProps) {
  if (value === undefined || value === null || value === '') return null

  const handleCopy = async () => {
    if (value !== undefined && value !== null) {
      await copyToClipboard(String(value), label)
    }
  }

  return (
    <BaseRow
      label={label}
      className="py-2"
      labelClassName="weight-700"
    >
      <div className="flex items-center gap-2 text-right">
        <span className="typo-body3 break-all" style={{ color }}>{value}</span>
        {hasCopy && (
          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-key-blue" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </BaseRow>
  )
}

// 쿠폰 할인 금액 계산 — 레거시 getCouponDiscountAmount 동일
function getCouponDiscountAmount(coupon: { discount_type: string; discount_amount: number; max_discount_amount: number }, totalBareAmount: number): number {
  if (coupon.discount_type === 'PERCENTAGE') {
    return Math.min(
      Math.floor(totalBareAmount * (coupon.discount_amount / 100)),
      coupon.max_discount_amount,
    )
  }
  return coupon.discount_amount
}

// 점선 구분선 — 레거시 동일
function DottedDivider() {
  return <div className="border-t border-dashed border-neutral-300 my-3" />
}

// 주문 메뉴 목록 탭 — 레거시 OrderMenu.vue 포팅
function OrderMenuTab({ orderId }: { orderId: string }) {
  const { data, isLoading } = useOrderMenuOptions(orderId)

  if (isLoading) return <div className="py-4 text-center typo-body3 text-muted-foreground">로딩 중...</div>
  if (!data) return null

  const discountMembership = data.discount_membership_amount ?? 0
  const discountCoupon = data.discount_coupon_amount ?? 0
  const approvedAmount = data.total_bare_amount - discountMembership - discountCoupon

  return (
    <div>
      {/* 주문 ID + 주문 일시 */}
      <InfoRow label="주문 ID" value={data.sn} hasCopy />
      {data.paid_dt && (
        <InfoRow label="주문 일시" value={formatDate(data.paid_dt, 'yyyy/MM/dd HH:mm:ss')} />
      )}

      <DottedDivider />

      {/* 상품 테이블 헤더 */}
      <div className="flex items-center py-2">
        <span className="flex-1 weight-700 typo-body3">상품 명</span>
        <span className="w-12 text-right weight-700 typo-body3">수량</span>
        <span className="w-20 text-right weight-700 typo-body3">금액</span>
      </div>

      <div className="space-y-0.5">
        <div className="border-t border-dashed border-neutral-300" />
        <div className="border-t border-dashed border-neutral-300" />
      </div>

      {/* 상품 목록 */}
      {data.order_menus?.map((menu, idx) => (
        <div key={menu.id}>
          {/* 메뉴 */}
          <div className="flex items-start py-1.5">
            <span className="flex-1 typo-body3">{menu.name}</span>
            <span className="w-12 text-right typo-body3">{menu.quantity}</span>
            <span className="w-20 text-right typo-body3">{priceFormat(menu.base_price * menu.quantity)} 원</span>
          </div>
          {/* 옵션 */}
          {menu.order_menu_options?.map((opt) => (
            <div key={opt.id} className="flex items-start py-0.5 pl-3">
              <span className="flex-1 typo-micro1 text-muted-foreground">ㄴ {opt.name}</span>
              <span className="w-12 text-right typo-micro1 text-muted-foreground">{opt.quantity}</span>
              <span className="w-20 text-right typo-micro1 text-muted-foreground">{priceFormat(opt.base_price)} 원</span>
            </div>
          ))}
          {/* 메뉴별 할인 */}
          {menu.discount && (
            <div className="flex items-start py-0.5 pl-3">
              <span className="flex-1 typo-micro1 text-muted-foreground">ㄴ {menu.discount.name}</span>
              <span className="w-20 text-right typo-micro1 text-muted-foreground">({priceFormat(menu.discount.amount)})</span>
            </div>
          )}
          {/* 소계 */}
          <div className="text-right py-1 weight-700 typo-body3">
            {priceFormat(menu.total_price)} 원
          </div>
          {/* 메뉴 간 구분선 */}
          {idx < (data.order_menus?.length ?? 0) - 1 && <DottedDivider />}
        </div>
      ))}

      <DottedDivider />

      {/* 금액 요약 */}
      <div className="space-y-1">
        <InfoRow label="총 주문 금액" value={`${priceFormat(data.total_bare_amount)} 원`} />
        <InfoRow label="총 회원 할인 금액" value={`${priceFormat(discountMembership)} 원`} />
        <InfoRow label="쿠폰 할인 금액" value={`${priceFormat(discountCoupon)} 원`} />

        {/* 쿠폰 상세 */}
        {data.used_coupons?.map((coupon, idx) => (
          <div key={idx} className="flex justify-between items-center py-0.5 pl-4">
            <span className="typo-micro1 text-muted-foreground">ㄴ {coupon.name}</span>
            <span className="typo-micro1 text-muted-foreground">
              ({priceFormat(getCouponDiscountAmount(coupon, data.total_bare_amount))} 원)
            </span>
          </div>
        ))}

        <BaseRow
          label="결제 승인 금액"
          value={`${priceFormat(approvedAmount)} 원`}
          className="py-2"
          labelClassName="weight-700"
          valueClassName="weight-700"
        />

        {data.store_comment && (
          <InfoRow label="고객 요청 사항" value={data.store_comment} />
        )}
      </div>
    </div>
  )
}

export function OrderDetailDialog({
  orderId,
  open,
  onClose,
  onOrderCancelled,
}: OrderDetailDialogProps) {
  const [view, setView] = useState<'detail' | 'items'>('detail')

  const { data: order, isLoading } = useOrderDetail(orderId ?? '', {
    enabled: open && !!orderId,
  })
  const { mutate: cancel, isPending: isCancelling } = useCancelOrder()

  const status = order ? ORDER_STATUS_ENUM[order.status as keyof typeof ORDER_STATUS_ENUM] : ''
  const statusColor = ORDER_STATUS_COLOR_ENUM[status]

  const canCancelOrder =
    order?.order_channel === 'WEB_PG' && ALLOWED_CANCEL_STATUSES.includes(order.status)

  // 레거시와 동일한 취소 불가 메시지 (color 포함)
  const cancelErrorMessage = (() => {
    if (!order) return null
    if (order.order_channel === 'WEB_PG' && ALLOWED_CANCEL_STATUSES.includes(order.status)) return null
    if (order.order_channel === 'KIOSK') return { text: '해당 주문은 POS 또는 키오스크에서만\n취소할 수 있습니다.', color: '#7C7C7C' }
    if (order.order_channel === 'POS_POST_PAY' || order.order_channel === 'POS_PRE_PAY') return { text: '해당 주문은 POS에서만 취소할 수 있습니다.', color: '#7C7C7C' }
    if (order.status === 13 || order.status === 14) return { text: '이미 취소된 주문입니다.', color: '#757575' }
    if (order.order_channel === 'WEB_PG') return { text: '환불처리가 불가합니다.\n관리자에게 문의해 주세요.', color: '#E3211E' }
    return null
  })()

  const handleCancel = () => {
    if (!order || !canCancelOrder) return
    cancel(
      { id: order.id, cancelType: 0 },
      {
        onSuccess: () => {
          onOrderCancelled()
        },
      },
    )
  }

  const tableName = (() => {
    if (
      order?.take_type === TAKE_TYPE_ENUM_CODE.IN_STORE ||
      order?.take_type === TAKE_TYPE_ENUM_CODE.STAY_ORDER
    ) {
      return order?.orderer_info?.table_name
    }
    return null
  })()

  const tableLabel =
    order?.take_type === TAKE_TYPE_ENUM_CODE.STAY_ORDER ? '객실 번호' : '테이블 번호'

  const handleClose = () => {
    onClose()
    setView('detail')
  }

  const dialogTitle = view === 'detail' ? (
    <span className="flex items-center gap-2">
      주문 ID: <strong>{order?.sn}</strong>
      {order?.sn && (
        <Button variant="ghost" size="icon" className="h-5 w-5 text-key-blue hover:text-key-blue/80" onClick={() => copyToClipboard(order.sn ?? '', '주문 ID')}>
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </span>
  ) : '주문 내역 상세'

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={dialogTitle}
      widthClass="w-[360px] max-w-[360px]"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            닫기
          </Button>
          {view === 'items' && (
            <Button className="flex-1" onClick={() => setView('detail')}>
              주문정보 보기
            </Button>
          )}
        </>
      }
    >
      <div className="p-4">
          {isLoading || !order ? (
            <div className="py-8 text-center typo-body3 text-muted-foreground">로딩 중...</div>
          ) : view === 'items' ? (
            <OrderMenuTab orderId={order.id} />
          ) : (
            <div>
              {/* 주문 기본 정보 */}
              <InfoRow label="org orderno" value={order.external_sn} hasCopy />
              <InfoRow label="pos orderno" value={order.external_smartro_pos_sn} hasCopy />
              {order.paid_dt && (
                <InfoRow label="주문 일시" value={formatDate(order.paid_dt, 'yyyy/MM/dd HH:mm:ss')} />
              )}
              <InfoRow label="주문 상태" value={status ? `●${status}` : ''} color={statusColor} />
              <InfoRow
                label="주문 채널"
                value={ORDER_CHANNEL_TRANSLATION[order.order_channel as keyof typeof ORDER_CHANNEL_TRANSLATION]}
              />
              <InfoRow
                label="주문 분류"
                value={TAKE_TYPE_ENUM[order.take_type as keyof typeof TAKE_TYPE_ENUM]}
              />
              {tableName && <InfoRow label={tableLabel} value={tableName} />}
              {order.delivery_address && <InfoRow label="배달 위치" value={order.delivery_address} />}
              {order.robot_delivery_status && (
                <InfoRow
                  label="로봇 상태"
                  value={ROBOT_DELIVERY_STATUS_TRANSLATION[order.robot_delivery_status]}
                />
              )}
              {/* 주문 내역 — 레거시: 파란색 링크 텍스트 + 링크 아이콘 클릭 시 items 뷰로 전환 */}
              <BaseRow label="주문 내역" className="py-2" labelClassName="weight-700">
                <button
                  type="button"
                  className="flex items-center gap-1 typo-body3 text-key-blue underline cursor-pointer"
                  onClick={() => setView('items')}
                >
                  {order.menu_title || '-'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </BaseRow>

              <Separator className="my-3" />

              {/* 매장 정보 */}
              <InfoRow label="브랜드 ID" value={order.brand_id} hasCopy />
              <InfoRow label="브랜드 명" value={order.brand_name} />
              <InfoRow label="매장 ID" value={order.store_sn} hasCopy />
              <InfoRow label="매장 명" value={order.store_name} />

              {/* 고객 정보 — 표시할 항목이 있을 때만 Separator 포함 */}
              {(order.employee_number || order.customer_name || order.customer_phone) && (
                <>
                  <Separator className="my-3" />
                  <InfoRow label="회원 번호" value={order.employee_number} hasCopy />
                  <InfoRow label="회원 명" value={order.customer_name} />
                  {order.customer_phone && (
                    <InfoRow label="고객 수신 번호" value={formatPhoneNumber(order.customer_phone)} />
                  )}
                </>
              )}

              <Separator className="my-3" />

              {/* 결제 정보 */}
              {order.payment_data?.AUTH_NO && (
                <InfoRow label="거래 승인 번호" value={order.payment_data.AUTH_NO} hasCopy />
              )}
              {order.paid_dt && (
                <InfoRow label="거래 일시" value={formatDate(order.paid_dt, 'yyyy/MM/dd HH:mm:ss')} />
              )}
              {order.request_amount !== null && order.request_amount !== undefined && (
                <InfoRow label="결제 승인 금액" value={`${priceFormat(order.request_amount)}원`} />
              )}
              {order.payment_cancelled_dt && (
                <InfoRow label="취소 일시" value={formatDate(order.payment_cancelled_dt, 'yyyy/MM/dd HH:mm:ss')} />
              )}
              {order.cancel_amount !== null && order.cancel_amount !== undefined && (
                <InfoRow label="취소 금액" value={`${priceFormat(order.cancel_amount)}원`} />
              )}
              {order.payment_code && (
                <InfoRow label="결제 수단" value={PAYMENT_CODE[order.payment_code]} />
              )}
              {order.payment_data?.CARD_ACQ_NAME && (
                <InfoRow label="카드 사" value={order.payment_data.CARD_ACQ_NAME} />
              )}
              {order.payment_data?.CARD_NO && (
                <InfoRow label="카드 번호" value={order.payment_data.CARD_NO} />
              )}

              {/* 주문 취소 — 레거시: 결제 정보 섹션 마지막 행 */}
              <BaseRow label="주문 취소" className="py-2" labelClassName="weight-700">
                <div className="flex flex-col items-end gap-1">
                  <Button
                    size="sm"
                    variant={canCancelOrder ? 'destructive' : 'outline'}
                    disabled={!canCancelOrder || isCancelling}
                    onClick={handleCancel}
                  >
                    {isCancelling ? '처리 중...' : '취소 및 환불 진행'}
                  </Button>
                  {cancelErrorMessage && (
                    <p
                      className="text-xs text-right whitespace-pre-line max-w-[13rem]"
                      style={{ color: cancelErrorMessage.color }}
                    >
                      {cancelErrorMessage.text}
                    </p>
                  )}
                </div>
              </BaseRow>
            </div>
          )}
      </div>
    </BaseDialog>
  )
}
