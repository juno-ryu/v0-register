import { z } from 'zod'

// ─────────────────────────────────────────────
// 통계 타입
// 레거시: STATISTICS_TYPE_OPTIONS (components/statistics/constants.js)
// ─────────────────────────────────────────────
export const STATISTICS_TYPE = {
  PRODUCT_SALES: 'product_sales',
  PRODUCT_OPTION_SALES: 'product_option_sales',
} as const

export type StatisticsType = (typeof STATISTICS_TYPE)[keyof typeof STATISTICS_TYPE]

export const STATISTICS_TYPE_OPTIONS = [
  { label: '상품 매출', value: STATISTICS_TYPE.PRODUCT_SALES },
  { label: '상품 옵션 매출', value: STATISTICS_TYPE.PRODUCT_OPTION_SALES },
]

// ─────────────────────────────────────────────
// 카테고리 묶음/펼쳐보기
// 레거시: CATEGORY_EXPAND_TYPE
// ─────────────────────────────────────────────
export const CATEGORY_EXPAND_TYPE = {
  CATEGORY: 'category',
  EXPAND: 'expand',
} as const

export type CategoryExpandType =
  (typeof CATEGORY_EXPAND_TYPE)[keyof typeof CATEGORY_EXPAND_TYPE]

export const CATEGORY_EXPAND_OPTIONS = [
  { label: '카테고리 묶음', value: CATEGORY_EXPAND_TYPE.CATEGORY },
  { label: '펼쳐보기', value: CATEGORY_EXPAND_TYPE.EXPAND },
]

// ─────────────────────────────────────────────
// 정렬 옵션
// 레거시: ORDERING_OPTIONS
// ─────────────────────────────────────────────
export const ORDERING_OPTIONS = [
  { label: '매출금액 (내림 순)', value: 'total_price' },
  { label: '매출금액 (오름 순)', value: '-total_price' },
  { label: '매출수량 (내림 순)', value: 'total_quantity' },
  { label: '매출수량 (오름 순)', value: '-total_quantity' },
  { label: '상품명 (내림 순)', value: 'product_name' },
  { label: '상품명 (오름 순)', value: '-product_name' },
]

// ─────────────────────────────────────────────
// 행 타입
// ─────────────────────────────────────────────
export const ROW_TYPE = {
  CATEGORY: 'category',
  PRODUCT: 'product',
} as const

export type RowType = (typeof ROW_TYPE)[keyof typeof ROW_TYPE]

// ─────────────────────────────────────────────
// API 응답 스키마 (raw)
// 레거시: store/statistics/actions.js
// ─────────────────────────────────────────────
export const aggregatedOrderMenuSchema = z.object({
  menu_category_id: z.number(),
  menu_category_name: z.string(),
  menu_name: z.string(),
  total_quantity: z.number(),
  total_price: z.number(),
  percentage: z.number(),
  total_membership_discounted_quantity: z.number().nullable(),
  total_membership_discounted_price: z.number().nullable(),
})

export type AggregatedOrderMenu = z.infer<typeof aggregatedOrderMenuSchema>

export const aggregatedOrderMenuOptionSchema = z.object({
  option_category_id: z.number(),
  option_category_name: z.string(),
  option_name: z.string(),
  total_quantity: z.number(),
  total_price: z.number(),
  percentage: z.number(),
  total_membership_discounted_quantity: z.number().nullable(),
  total_membership_discounted_price: z.number().nullable(),
})

export type AggregatedOrderMenuOption = z.infer<typeof aggregatedOrderMenuOptionSchema>

// ─────────────────────────────────────────────
// 클라이언트 사이드 변환 후 행 타입
// 레거시: store/statistics/actions.js transformAggregatedData
// ─────────────────────────────────────────────
export interface StatisticsProductRow {
  type: typeof ROW_TYPE.PRODUCT
  menu_category_name?: string
  option_category_name?: string
  menu_name?: string
  option_name?: string
  total_quantity: number
  total_price: number
  percentage: number
  total_membership_discounted_quantity: number
  total_membership_discounted_price: number
}

export interface StatisticsCategoryRow {
  type: typeof ROW_TYPE.CATEGORY
  category_name: string
  menu_category_name?: string
  option_category_name?: string
  total_quantity: number
  total_price: number
  percentage: number
  total_membership_discounted_quantity: number
  total_membership_discounted_price: number
  items: StatisticsProductRow[]
}

export type StatisticsRow = StatisticsCategoryRow | StatisticsProductRow

// ─────────────────────────────────────────────
// 조회 파라미터
// ─────────────────────────────────────────────
export interface StatisticsParams {
  storeId: string
  from_date: string
  to_date: string
}
