import { z } from 'zod'

// ─────────────────────────────────────────────
// 지점(Branch) 목록 아이템
// 레거시: types/stores.ts StoreListItem (관리자 목록 전용)
// ─────────────────────────────────────────────
export const branchListItemSchema = z.object({
  id: z.number(),
  sn: z.string().nullable().optional(),
  name: z.string(),
  brand_name: z.string().nullable().optional(),
  is_active: z.boolean(),
  pos: z.string().nullable().optional(),
  external_sn: z.string().nullable().optional(),
  available_take_types: z.array(z.number()).optional(),
  update_dt: z.string().nullable().optional(),
  create_dt: z.string().nullable().optional(),
})

export type BranchListItem = z.infer<typeof branchListItemSchema>

export const branchListResponseSchema = z.object({
  count: z.number(),
  results: z.array(branchListItemSchema),
})

export type BranchListResponse = z.infer<typeof branchListResponseSchema>

// ─────────────────────────────────────────────
// 지점 목록 조회 파라미터
// 레거시: types/stores.ts FetchManagementStoreListParams
// ─────────────────────────────────────────────
export const branchListParamsSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(20),
  q: z.string().optional(),
  search_key: z.string().optional(),
  is_active: z.boolean().nullable().optional(),
  available_take_types: z.string().optional(),
  brand_id__in: z.union([z.string(), z.array(z.string())]).optional(),
  brand_id: z.number().optional(),
  order_by: z.string().default('name'),
  order_direction: z.enum(['asc', 'desc']).default('asc'),
})

export type BranchListParams = z.infer<typeof branchListParamsSchema>

// ─────────────────────────────────────────────
// 지점 상세 (운영사 management API)
// 레거시: types/stores.ts ManagementStoreDetail
// ─────────────────────────────────────────────
// 주문 서비스(테이크타입) 정책 항목
const takePolicySchema = z.object({
  take_type: z.number(),
  payment_methods: z.array(z.string()).optional(),
  contact_display: z.string().optional(),
  disposable_display: z.string().optional(),
  request_display: z.string().optional(),
  min_order_amount: z.number().nullable().optional(),
  max_order_amount: z.number().nullable().optional(),
  min_order_count: z.number().nullable().optional(),
  max_order_count: z.number().nullable().optional(),
  order_display_time: z.number().nullable().optional(),
})

export const branchDetailSchema = z.object({
  id: z.string().or(z.number()),
  sn: z.string().nullable().optional(),
  name: z.string(),
  brand_name: z.string().nullable().optional(),
  brand: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  is_active: z.boolean(),
  pos: z.string().nullable().optional(),
  external_sn: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  full_address: z.string().nullable().optional(),
  business_name: z.string().nullable().optional(),
  registration_number: z.string().nullable().optional(),
  representative_name: z.string().nullable().optional(),
  administrator_username: z.string().nullable().optional(),
  administrator_update_dt: z.string().nullable().optional(),
  update_dt: z.string().nullable().optional(),
  create_dt: z.string().nullable().optional(),
  // 주문 서비스 탭 관련 필드
  take_types_policy: z.array(takePolicySchema).optional(),
  table_count: z.number().nullable().optional(),
  room_count: z.number().nullable().optional(),
  number_of_tables_or_rooms: z.number().nullable().optional(),
  use_pre_pay: z.boolean().nullable().optional(),
  use_post_pay: z.boolean().nullable().optional(),
  pg: z.string().nullable().optional(),
  payment_id: z.string().nullable().optional(),
  secret_key: z.string().nullable().optional(),
  cancel_password: z.string().nullable().optional(),
  did_order_mgmt_available_mode: z.array(z.string()).optional(),
  coupon_validation_code: z.string().nullable().optional(),
  // 웹주문 화면 설정 탭 관련 필드
  banner_media_urls: z.array(z.string()).optional(),
  banner_display_duration_seconds: z.number().optional(),
  modal_images: z.array(z.object({
    id: z.number().optional(),
    image_url: z.string(),
    ordering: z.number(),
    link: z.string().optional(),
    is_active: z.boolean().optional(),
  })).optional(),
  is_web_order_model_auto_slide: z.boolean().optional(),
  web_order_model_display_duration_seconds: z.number().optional(),
})

export type BranchDetail = z.infer<typeof branchDetailSchema>

// ─────────────────────────────────────────────
// 웹주문 배너 수정 payload
// PUT /v1/b/management/stores/{storeId}/banner
// ─────────────────────────────────────────────
export const updateBranchBannerPayloadSchema = z.object({
  banner_media_urls: z.array(z.string()),
  banner_display_duration_seconds: z.number(),
})
export type UpdateBranchBannerPayload = z.infer<typeof updateBranchBannerPayloadSchema>

// ─────────────────────────────────────────────
// 웹주문 팝업 모달 수정 payload
// PUT /v1/b/management/stores/{storeId}/modal
// ─────────────────────────────────────────────
export const updateBranchModalPayloadSchema = z.object({
  modal_images: z.array(z.object({
    image_url: z.string(),
    ordering: z.number(),
    link: z.string(),
    is_active: z.boolean(),
  })),
  is_web_order_model_auto_slide: z.boolean(),
  web_order_model_display_duration_seconds: z.number(),
})
export type UpdateBranchModalPayload = z.infer<typeof updateBranchModalPayloadSchema>

// ─────────────────────────────────────────────
// 영업시간 (opening-hours API)
// 레거시: store/business-hours
// ─────────────────────────────────────────────
const timeValueSchema = z.union([
  z.string(),
  z.object({ hour: z.union([z.string(), z.number()]), minute: z.union([z.string(), z.number()]) }),
])

const businessHourEntrySchema = z.object({
  days: z.array(z.number()).optional(),
  start_time: timeValueSchema.optional(),
  end_time: timeValueSchema.optional(),
  is_24_hours: z.boolean().optional(),
})

const breakTimeEntrySchema = z.object({
  days: z.array(z.number()).optional(),
  start_time: timeValueSchema.optional(),
  end_time: timeValueSchema.optional(),
})

const regularClosingDateSchema = z.object({
  weeks: z.array(z.number()).optional(),
  days: z.array(z.number()).optional(),
}).passthrough()

const temporaryClosingDateSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).passthrough()

export const openingHoursSchema = z.object({
  business_hours: z.array(businessHourEntrySchema).optional(),
  break_times: z.array(breakTimeEntrySchema).optional(),
  business_hours_text: z.union([z.array(z.string()), z.string()]).optional(), // API가 "" 또는 [] 반환
  regular_closing_dates: z.array(regularClosingDateSchema).optional(),
  temporary_closing_dates: z.array(temporaryClosingDateSchema).optional(),
  is_closed_in_holiday: z.boolean().optional(),
}).passthrough()

export type OpeningHours = z.infer<typeof openingHoursSchema>

// ─────────────────────────────────────────────
// 매장 일반정보 수정 payload
// 레거시: store/stores/actions.ts updateStoreGeneralInfo
// PUT /v1/b/management/stores/{storeId}/general-information
// ─────────────────────────────────────────────
export const branchGeneralInfoPayloadSchema = z.object({
  name: z.string().min(1, '매장명을 입력해 주세요.'),
  phone_number: z.string().nullable().optional(),
  full_address: z.string().nullable().optional(),
  is_active: z.boolean(),
  business_name: z.string().nullable().optional(),
  registration_number: z.string().nullable().optional(),
  representative_name: z.string().nullable().optional(),
})

export type BranchGeneralInfoPayload = z.infer<typeof branchGeneralInfoPayloadSchema>

// ─────────────────────────────────────────────
// 로그인 계정 설정 payload
// 레거시: store/stores/actions.ts upsertStoreAdministrator
// POST /v1/b/management/stores/{storeId}/administrator
// ─────────────────────────────────────────────
export const branchAdministratorPayloadSchema = z.object({
  username: z.string().min(1, '로그인 ID를 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
})

export type BranchAdministratorPayload = z.infer<typeof branchAdministratorPayloadSchema>

// ─────────────────────────────────────────────
// 영업시간 수정 payload
// 레거시: store/business-hours/actions.js putOpeningHours
// PUT /stores/{storeId}/opening-hours
// ─────────────────────────────────────────────
export type OpeningHoursPayload = OpeningHours

// ─────────────────────────────────────────────
// 매장 설정 수정 payload
// 레거시: store/stores/actions.ts updateStoreConfig
// PUT /v1/b/management/stores/{storeId}/config
// ─────────────────────────────────────────────
export const storeConfigPayloadSchema = z.object({
  pos: z.string(),
  external_sn: z.string().optional(),
  use_pre_pay: z.boolean(),
  use_post_pay: z.boolean(),
  pg: z.string(),
  payment_id: z.string(),
  secret_key: z.string(),
  cancel_password: z.string(),
  did_order_mgmt_available_mode: z.array(z.string()),
  coupon_validation_code: z.string(),
})

export type StoreConfigPayload = z.infer<typeof storeConfigPayloadSchema>

// ─────────────────────────────────────────────
// 주문 서비스 등록/수정 payload
// 레거시: store/stores/actions.ts upsertStoreTakeType
// POST /v1/b/management/stores/{storeId}/take-types
// ─────────────────────────────────────────────
export const upsertTakeTypePayloadSchema = z.object({
  take_type: z.number(),
  policy: z.object({
    take_type: z.number(),
    phone_number_required: z.boolean(),
    available_payment_codes: z.array(z.string()),
    request_notes_required: z.boolean(),
    disposable_item_required: z.boolean(),
    minimum_order_amount: z.number(),
    maximum_order_amount: z.number(),
    minimum_order_quantity: z.number(),
    maximum_order_quantity: z.number(),
    delivery_time_buffer: z.number().optional(),
    special_request_required: z.boolean().optional(),
  }),
  auto_pickup_complete_setup_time: z.number().optional(),
})

export type UpsertTakeTypePayload = z.infer<typeof upsertTakeTypePayloadSchema>

// ─────────────────────────────────────────────
// 매장 생성 payload
// 레거시: types/stores.ts CreateStorePayload + BranchCreateModal.vue handleSubmit
// POST /v1/b/management/stores
// ─────────────────────────────────────────────
export const createBranchPayloadSchema = z.object({
  brand_id: z.union([z.string(), z.number()], { message: '브랜드를 선택해 주세요.' }).refine((v) => v !== '' && v !== undefined, { message: '브랜드를 선택해 주세요.' }),
  name: z.string().min(1, '매장명을 입력해 주세요.'),
  phone_number: z.string().optional(),
  full_address: z.string().optional(),
  is_active: z.literal(true),
  business_name: z.string().optional(),
  registration_number: z.string().optional(),
  representative_name: z.string().optional(),
})

export type CreateBranchPayload = z.infer<typeof createBranchPayloadSchema>
