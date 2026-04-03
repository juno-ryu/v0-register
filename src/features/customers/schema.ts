import { z } from 'zod'

// ─────────────────────────────────────────────
// 멤버 상태 상수
// ─────────────────────────────────────────────
export const MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  PASSWORD_SET_REQUIRED: 'PASSWORD_SET_REQUIRED',
  STOPPED: 'STOPPED',
  DELETED: 'DELETED',
} as const

export type MemberStatusValue = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS]

export const MEMBER_STATUS_TEXT: Record<MemberStatusValue, string> = {
  [MEMBER_STATUS.ACTIVE]: '활성',
  [MEMBER_STATUS.STOPPED]: '중지',
  [MEMBER_STATUS.PASSWORD_SET_REQUIRED]: '비번리셋',
  [MEMBER_STATUS.DELETED]: '삭제',
}

// ─────────────────────────────────────────────
// 일반 고객 목록
// ─────────────────────────────────────────────
export const normalCustomerItemSchema = z.object({
  id: z.number(),
  phone_number: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  registered_store_name: z.string().nullable().optional(),
  subscription_status: z.boolean().nullable().optional(),
  date_joined: z.string().nullable().optional(),
})

export type NormalCustomerItem = z.infer<typeof normalCustomerItemSchema>

export const normalCustomersResponseSchema = z.object({
  count: z.number(),
  results: z.array(normalCustomerItemSchema),
})

export type NormalCustomersResponse = z.infer<typeof normalCustomersResponseSchema>

export const normalCustomersParamsSchema = z.object({
  brandId: z.union([z.number(), z.string()]),
  page: z.number().default(1),
  per_page: z.number().default(20),
  registered_store_ids: z.array(z.number()).optional(),
  search_key: z.string().optional(),
  search_value: z.string().optional(),
  is_subscribed: z.boolean().optional(),
})

export type NormalCustomersParams = z.infer<typeof normalCustomersParamsSchema>

// ─────────────────────────────────────────────
// 멤버십 고객 목록
// ─────────────────────────────────────────────
export const membershipCustomerItemSchema = z.object({
  id: z.number(),
  employee_number: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  customer_company_name: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  card_number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  update_dt: z.string().nullable().optional(),
  create_dt: z.string().nullable().optional(),
})

export type MembershipCustomerItem = z.infer<typeof membershipCustomerItemSchema>

export const membershipCustomersResponseSchema = z.object({
  count: z.number(),
  results: z.array(membershipCustomerItemSchema),
})

export type MembershipCustomersResponse = z.infer<typeof membershipCustomersResponseSchema>

export const membershipCustomersParamsSchema = z.object({
  brandId: z.union([z.number(), z.string()]),
  page: z.number().default(1),
  per_page: z.number().default(20),
  customer_company_ids: z.array(z.number()).optional(),
  search_key: z.string().optional(),
  search_val: z.string().optional(),
  status: z.string().optional(),
})

export type MembershipCustomersParams = z.infer<typeof membershipCustomersParamsSchema>

// ─────────────────────────────────────────────
// 고객사 (CustomerCompany)
// ─────────────────────────────────────────────
export const customerCompanySchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type CustomerCompany = z.infer<typeof customerCompanySchema>

// ─────────────────────────────────────────────
// 멤버십 고객 상세
// ─────────────────────────────────────────────
export const membershipCustomerDetailSchema = z.object({
  id: z.number(),
  employee_number: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  customer_company_name: z.string().nullable().optional(),
  customer_company_id: z.number().nullable().optional(),
  sn: z.string().nullable().optional(),
  card_number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  update_dt: z.string().nullable().optional(),
  create_dt: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  customer_department_name: z.string().nullable().optional(),
  tier: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
})


// ─────────────────────────────────────────────
// 멤버십 고객 할인 정책
// ─────────────────────────────────────────────
export const discountPolicyItemSchema = z.object({
  store_id: z.number(),
  store_name: z.string(),
  policy: z.object({
    meals: z.record(z.string(), z.object({
      meal_name: z.string(),
      customer_company_burden: z.record(z.string(), z.union([z.number(), z.string()])),
      customer_company_burden_type: z.string(),
    })).optional().default({}),
    food: z.object({
      customer_company_burden: z.record(z.string(), z.union([z.number(), z.string()])).optional().default({}),
      customer_company_burden_type: z.string().optional().default(''),
      operator_burden: z.record(z.string(), z.union([z.number(), z.string()])).optional().default({}),
      operator_burden_type: z.string().optional().default(''),
    }).optional(),
  }),
})

export type DiscountPolicyItem = z.infer<typeof discountPolicyItemSchema>

export type MembershipCustomerDetail = z.infer<typeof membershipCustomerDetailSchema>
