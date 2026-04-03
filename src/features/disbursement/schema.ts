import { z } from 'zod'

// ─────────────────────────────────────────────
// 지급 상태
// 레거시: DISBURSEMENT_STATUS (config/constants/settlement-constants.ts)
// ─────────────────────────────────────────────
export const DISBURSEMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
} as const

export type DisbursementStatus =
  (typeof DISBURSEMENT_STATUS)[keyof typeof DISBURSEMENT_STATUS]

export const DISBURSEMENT_STATUS_LABEL: Record<DisbursementStatus, string> = {
  [DISBURSEMENT_STATUS.PENDING]: '• 정산 대기 중',
  [DISBURSEMENT_STATUS.COMPLETED]: '• 정산 완료',
}

// ─────────────────────────────────────────────
// 메뉴 타입
// 레거시: MENU_TYPE_ENUM (config/constants)
// ─────────────────────────────────────────────
export const MENU_TYPE = {
  MEAL: 'MEAL',
  FOOD: 'FOOD',
} as const

export type MenuType = (typeof MENU_TYPE)[keyof typeof MENU_TYPE]

// ─────────────────────────────────────────────
// 지급 세트 아이템
// 레거시: OperatorCustomerCompanyDisbursementSetOut
// ─────────────────────────────────────────────
export const disbursementSetItemSchema = z.object({
  id: z.number().nullable(),
  store_name: z.string().nullable(),
  customer_company_name: z.string().nullable(),
  transaction_count: z.number().nullable(),
  disbursement_period_start: z.string(),
  disbursement_period_end: z.string(),
  disbursement_status: z.string(),
  settlement_date: z.string().nullable(),
  total_burden_amounts: z
    .object({
      net_total_amount: z.number(),
      net_customer_burden_amount: z.number(),
      net_operator_burden_amount: z.number(),
      net_customer_company_burden_amount: z.number(),
      total_paid_amount: z.number().optional(),
      total_refunded_amount: z.number().optional(),
    })
    .nullable(),
})

export type DisbursementSetItem = z.infer<typeof disbursementSetItemSchema>

// ─────────────────────────────────────────────
// 지급 세트 목록 응답
// 레거시: PaginateOperatorCustomerCompanyDisbursementSetOut
// ─────────────────────────────────────────────
export const disbursementSetsResponseSchema = z.object({
  count: z.number(),
  total_net_customer_company_burden_amount: z.number().default(0),
  total_number_of_orders_in_disbursements: z.number().default(0),
  results: z.array(disbursementSetItemSchema),
})

export type DisbursementSetsResponse = z.infer<typeof disbursementSetsResponseSchema>

// ─────────────────────────────────────────────
// 목록 조회 파라미터
// 레거시: DisbursementMain.vue params
// ─────────────────────────────────────────────
export const disbursementSetsParamsSchema = z.object({
  disbursement_period_start: z.string(),
  disbursement_period_end: z.string(),
  menu_type: z.string().optional(),
  customer_company_ids: z.string().optional(),
  store_ids: z.string().optional(),
  disbursement_status: z.string().optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
})

export type DisbursementSetsParams = z.infer<typeof disbursementSetsParamsSchema>

// ─────────────────────────────────────────────
// 거래 내역 아이템
// 레거시: transaction-list-table/index.vue
// ─────────────────────────────────────────────
export const transactionItemSchema = z.object({
  id: z.number(),
  processed_at: z.string(),
  order_sn: z.string().nullable(),
  meal_order_sn: z.string().nullable(),
  order_channel: z.string().nullable(),
  customer_company_name: z.string().nullable(),
  meal_name: z.string().nullable(),
  employee_name: z.string().nullable(),
  employee_number: z.string().nullable(),
  payment_type: z.string(),
  bare_total_amount: z.number(),
  customer_burden_amount: z.number(),
  operator_burden_amount: z.number(),
  customer_company_burden_amount: z.number(),
  meal_cancel_available: z.boolean().optional(),
})

export type TransactionItem = z.infer<typeof transactionItemSchema>

export const transactionListResponseSchema = z.object({
  count: z.number(),
  results: z.array(transactionItemSchema),
})

export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>

export const transactionListParamsSchema = z.object({
  operator_customer_company_disbursement_set: z.number(),
  page: z.number().optional(),
  per_page: z.number().optional(),
})

export type TransactionListParams = z.infer<typeof transactionListParamsSchema>

// ─────────────────────────────────────────────
// 세트 요약 (거래 내역 상단 요약 바)
// 레거시: DisbursementSummary.vue → fetchDisbursementSetsSummary
// ─────────────────────────────────────────────
export const disbursementSetSummarySchema = z.object({
  id: z.number(),
  store_name: z.string().nullable(),
  customer_company_name: z.string().nullable(),
  disbursement_period_start: z.string(),
  disbursement_period_end: z.string(),
  transaction_count: z.number().nullable(),
  total_burden_amounts: z.object({
    net_customer_company_burden_amount: z.number(),
  }).nullable(),
})

export type DisbursementSetSummary = z.infer<typeof disbursementSetSummarySchema>
