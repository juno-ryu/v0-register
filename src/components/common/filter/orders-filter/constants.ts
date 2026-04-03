import { z } from 'zod'
import { format, sub } from 'date-fns'
import { TAKE_TYPE_ENUM_CODE, ORDER_CHANNEL_FILTER_VALUES } from '@/constants/take-type'
import type { SelectOption } from '@/components/common/filter/constants'

export const ordersFilterSchema = z.object({
  search_key: z.enum(['', 'orderSn', 'employeeNumber']),
  q: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  brandIdIn: z.array(z.string()),
  storeIdIn: z.array(z.string()),
  takeTypeIn: z.array(z.string()),
  orderChannelIn: z.array(z.string()),
  statusIn: z.array(z.string()),
})

export type OrdersFilterValues = z.infer<typeof ordersFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export function getDefaultOrdersFilter(): OrdersFilterValues {
  return {
    search_key: 'orderSn',
    q: '',
    startDate: format(sub(new Date(), { days: 6 }), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    brandIdIn: [],
    storeIdIn: [],
    takeTypeIn: [],
    orderChannelIn: [],
    statusIn: [],
  }
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const SEARCH_KEY_OPTIONS: SelectOption[] = [
  { value: 'orderSn', label: '주문ID' },
  { value: 'employeeNumber', label: '회원번호' },
]

export const TAKE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: String(TAKE_TYPE_ENUM_CODE.PICKUP_AND_EAT_IN_STORE), label: '픽업-매장내식사' },
  { value: String(TAKE_TYPE_ENUM_CODE.TAKE_AWAY), label: '픽업-테이크아웃' },
  { value: String(TAKE_TYPE_ENUM_CODE.COUNTER_PICKUP), label: '픽업-일반' },
  { value: String(TAKE_TYPE_ENUM_CODE.IN_STORE), label: '테이블주문' },
]

export const ORDER_CHANNEL_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: ORDER_CHANNEL_FILTER_VALUES.WEB_PG, label: '웹주문' },
  { value: ORDER_CHANNEL_FILTER_VALUES.KIOSK, label: '키오스크' },
  { value: ORDER_CHANNEL_FILTER_VALUES.POS_PRE_PAY, label: '포스(선불)' },
  { value: ORDER_CHANNEL_FILTER_VALUES.POS_POST_PAY, label: '포스(후불)' },
]
