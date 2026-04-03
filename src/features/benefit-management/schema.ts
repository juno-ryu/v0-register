import { z } from 'zod'

// ─────────────────────────────────────────────
// 쿠폰 상태
// 레거시: CouponStatus (types/coupon.ts)
// ─────────────────────────────────────────────
export const COUPON_STATUS = {
  RESERVED: 1,
  IN_PROGRESS: 2,
  TERMINATED: 4,
} as const

export type CouponStatus = (typeof COUPON_STATUS)[keyof typeof COUPON_STATUS]

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  [COUPON_STATUS.RESERVED]: '예약',
  [COUPON_STATUS.IN_PROGRESS]: '진행',
  [COUPON_STATUS.TERMINATED]: '종료',
}

// ─────────────────────────────────────────────
// 발급된 쿠폰 상태
// 레거시: IssuedCouponStatus (types/coupon.ts)
// ─────────────────────────────────────────────
export const ISSUED_COUPON_STATUS = {
  UNUSED: 0,
  USED: 1,
  EXPIRED: 2,
} as const

export type IssuedCouponStatus =
  (typeof ISSUED_COUPON_STATUS)[keyof typeof ISSUED_COUPON_STATUS]

export const ISSUED_COUPON_STATUS_LABEL: Record<IssuedCouponStatus, string> = {
  [ISSUED_COUPON_STATUS.UNUSED]: '미사용',
  [ISSUED_COUPON_STATUS.USED]: '사용',
  [ISSUED_COUPON_STATUS.EXPIRED]: '만료',
}

// ─────────────────────────────────────────────
// 할인 유형
// 레거시: DiscountType (types/coupon.ts)
// ─────────────────────────────────────────────
export const DISCOUNT_TYPE = {
  AMOUNT: 0,
  PERCENTAGE: 1,
} as const

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE]

// ─────────────────────────────────────────────
// 쿠폰 유형
// 레거시: CouponType (types/coupon.ts)
// ─────────────────────────────────────────────
export const COUPON_TYPE = {
  DISCOUNT: 'discount',
  BONUS: 'bonus',
} as const

export type CouponType = (typeof COUPON_TYPE)[keyof typeof COUPON_TYPE]

// ─────────────────────────────────────────────
// 쿠폰 사용 채널
// 레거시: CouponUsageChannel (types/coupon.ts)
// ─────────────────────────────────────────────
export const COUPON_USAGE_CHANNEL = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BOTH: 'BOTH',
} as const

export type CouponUsageChannel =
  (typeof COUPON_USAGE_CHANNEL)[keyof typeof COUPON_USAGE_CHANNEL]

// ─────────────────────────────────────────────
// 발급 제한 유형
// 레거시: each_user_max_quantity (1 = 1인 1회)
// ─────────────────────────────────────────────
export const ISSUE_LIMIT = {
  ONE_PER_USER: 1,
  UNLIMITED: null,
} as const

// ─────────────────────────────────────────────
// 쿠폰 목록 아이템
// 레거시: CouponListItemRaw (types/coupon.ts)
// ─────────────────────────────────────────────
export const couponListItemSchema = z.object({
  id: z.number(),
  brand_name: z.string(),
  create_dt: z.string(),
  issue_type: z.number(),
  name: z.string(),
  discount_amount: z.number(),
  discount_type: z.number(),
  max_discount_amount: z.number(),
  min_payment_amount: z.number().nullable(),
  issuable_start_date: z.string(),
  issuable_end_date: z.string(),
  status: z.number(),
  issue_quantity: z.number().nullable(),
  total_quantity: z.number(),
  stores: z.array(z.number()),
  coupon_type: z.string(),
  message_send_available: z.boolean(),
})

export type CouponListItem = z.infer<typeof couponListItemSchema>

// ─────────────────────────────────────────────
// 쿠폰 상세
// 레거시: CouponDetailRaw (types/coupon.ts)
// ─────────────────────────────────────────────
export const couponDetailSchema = couponListItemSchema.extend({
  description: z.string(),
  each_user_max_quantity: z.number().nullable(),
  usable_start_date: z.string(),
  usable_end_date: z.string(),
  image_url: z.string().nullable(),
  usage_channel: z.string(),
  usage_notes: z.string(),
  issuable_quantity: z.number(),
})

export type CouponDetail = z.infer<typeof couponDetailSchema>

// ─────────────────────────────────────────────
// 쿠폰 목록 응답
// ─────────────────────────────────────────────
export const couponListResponseSchema = z.object({
  count: z.number(),
  results: z.array(couponListItemSchema),
})

export type CouponListResponse = z.infer<typeof couponListResponseSchema>

// ─────────────────────────────────────────────
// 쿠폰 목록 조회 파라미터
// 레거시: FetchCouponsParams (types/coupon.ts)
// ─────────────────────────────────────────────
export const couponListParamsSchema = z.object({
  search: z.string().optional(),
  brand_id__in: z.union([z.number(), z.string()]).optional(),
  store_id__in: z.union([z.number(), z.string()]).optional(),
  status__in: z.union([z.number(), z.string()]).optional(),
  // 매장 계정 발행일 범위 필터
  issuable_start_date: z.string().optional(),
  issuable_end_date: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
})

export type CouponListParams = z.infer<typeof couponListParamsSchema>

// ─────────────────────────────────────────────
// 쿠폰 생성/수정 폼
// 레거시: CouponPayload (types/coupon.ts)
// ─────────────────────────────────────────────
export const couponFormSchema = z.object({
  name: z.string().min(1, '쿠폰명을 입력해주세요.').max(24, '쿠폰명은 24자 이내로 입력해주세요.'),
  description: z.string().max(500).default(''),
  usage_notes: z.string().max(500).default(''),
  image_url: z.string().nullable().optional(),
  usage_channel: z.string().default(COUPON_USAGE_CHANNEL.OFFLINE),
  coupon_type: z.string().default(COUPON_TYPE.DISCOUNT),
  discount_type: z.number().default(DISCOUNT_TYPE.AMOUNT),
  discount_amount: z.coerce.number().nullable().optional(),
  max_discount_amount: z.coerce.number().default(0),
  min_payment_amount: z.coerce.number().nullable().optional(),
  hasMinimumOrderAmount: z.boolean().default(false),
  total_quantity: z.coerce.number().nullable().optional(),
  each_user_max_quantity: z.coerce.number().nullable().optional(),
  issuable_start_date: z.string().nullable().optional(),
  issuable_end_date: z.string().nullable().optional(),
  usable_start_date: z.string().nullable().optional(),
  usable_end_date: z.string().nullable().optional(),
  isSamePeriod: z.boolean().default(true),
  stores: z.array(z.number()).nullable().optional(),
  issue_type: z.number().default(0),
})

export type CouponForm = z.infer<typeof couponFormSchema>

// ─────────────────────────────────────────────
// 발급된 쿠폰 아이템
// 레거시: IssuedCouponRaw (types/coupon.ts)
// ─────────────────────────────────────────────
export const issuedCouponItemSchema = z.object({
  coupon_id: z.number(),
  create_dt: z.string(),
  brand_name: z.string(),
  name: z.string(),
  discount_amount: z.number(),
  discount_type: z.number(),
  max_discount_amount: z.number(),
  coupon_type: z.string(),
  used_dt: z.string().nullable(),
  order_number: z.string().nullable(),
  status: z.number(),
  usable_end_date: z.string(),
  sn: z.string(),
  user_phone_number: z.string(),
  store_sn: z.string(),
  used_store_info: z
    .object({
      sn: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export type IssuedCouponItem = z.infer<typeof issuedCouponItemSchema>

// ─────────────────────────────────────────────
// 발급된 쿠폰 목록 응답
// ─────────────────────────────────────────────
export const issuedCouponListResponseSchema = z.object({
  count: z.number(),
  results: z.array(issuedCouponItemSchema),
})

export type IssuedCouponListResponse = z.infer<typeof issuedCouponListResponseSchema>

// ─────────────────────────────────────────────
// 발급된 쿠폰 목록 조회 파라미터
// 레거시: FetchIssuedCouponsParams (types/coupon.ts)
// ─────────────────────────────────────────────
export const issuedCouponListParamsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  search: z.string().optional(),
  brand_id__in: z.union([z.number(), z.string()]).optional(),
  store_id__in: z.union([z.number(), z.string()]).optional(),
  status__in: z.union([z.number(), z.string()]).optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
})

export type IssuedCouponListParams = z.infer<typeof issuedCouponListParamsSchema>

// ─────────────────────────────────────────────
// 발급 가능 정보
// 레거시: publish-modal/index.vue issuableInformation
// ─────────────────────────────────────────────
export const issuableInformationSchema = z.object({
  coupon_name: z.string(),
  total_issuable_quantity: z.number(),   // 최대 발행 수량
  issued_quantity: z.number(),           // 발행된 수량
  eligible_users_count: z.number(),      // 광고 수신 동의 고객 수
  issue_available_users_count: z.number(), // 발급 가능 사용자 수
})

export type IssuableInformation = z.infer<typeof issuableInformationSchema>

// 발급 결과
export const issueResultSchema = z.object({
  issue_success_count: z.number(),
  issue_failed_count: z.number(),
  issued_session: z.string(),
})

export type IssueResult = z.infer<typeof issueResultSchema>

// ─────────────────────────────────────────────
// 프리셋 메시지
// 레거시: send-message-modal/MessageSelect.vue
// ─────────────────────────────────────────────
export const presetMessageSchema = z.object({
  key: z.string(),                          // 메시지 ID
  name: z.string(),                         // 메시지명
  rcs_price: z.number(),                    // RCS 단가
  legacy_message_type: z.string().nullable().optional(), // 대체 메시지 유형
  legacy_price: z.number().nullable().optional(),        // 대체 메시지 단가
  create_dt: z.string(),                    // 등록일
  isDisabled: z.boolean().optional(),
})

export type PresetMessage = z.infer<typeof presetMessageSchema>

// ─────────────────────────────────────────────
// 전송 가능 사용자 정보
// 레거시: send-message-modal/index.vue fetchSendableUsers
// ─────────────────────────────────────────────
export const sendableUsersInfoSchema = z.object({
  number_of_sending_messages: z.number(),
})

export type SendableUsersInfo = z.infer<typeof sendableUsersInfoSchema>
