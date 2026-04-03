import { z } from 'zod'

// 기간 유형 - 레거시 TERM_TYPE_ENUM과 동일
export const TERM_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const

export type TermType = (typeof TERM_TYPE)[keyof typeof TERM_TYPE]

// API 조회 파라미터
export const dashboardParamsSchema = z.object({
  startDate: z.string(), // 'yyyy-MM-dd'
  endDate: z.string(),   // 'yyyy-MM-dd'
  term: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  storeId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
})

export type DashboardParams = z.infer<typeof dashboardParamsSchema>

// 대시보드 요약 데이터 - /orders/dashboard/ 응답
export const dashboardDataSchema = z.object({
  total_order_count: z.number().default(0),
  total_order_count_change_rate: z.number().default(0),
  total_sales_amount: z.number().default(0),
  total_sales_amount_change_rate: z.number().default(0),
  // 월간에서만 사용 (현재 주석처리된 필드 - 향후 확장용)
  total_user_count: z.number().optional(),
  total_user_count_change_rate: z.number().optional(),
})

export type DashboardData = z.infer<typeof dashboardDataSchema>

// 매출 차트 raw 데이터 - /orders/graph/revenue/ 응답의 개별 항목
export const revenueGraphItemSchema = z.object({
  date: z.string(),
  total_sales_amount: z.number(),
  total_order_count: z.number(),
})

export type RevenueGraphItem = z.infer<typeof revenueGraphItemSchema>

// 차트에 사용할 가공된 데이터 포인트
export interface ChartDataPoint {
  label: string
  value: number
}

// Recharts에 전달할 차트 데이터
export interface RevenueChartData {
  date: string       // x축 레이블
  revenue: number    // 매출액
  orderCount: number // 주문건수
}
