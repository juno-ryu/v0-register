import { z } from 'zod'

// ─────────────────────────────────────────────
// 메뉴 카테고리 (메뉴에 연결된)
// 레거시: BackofficeMenuMenuCategoryOut
// ─────────────────────────────────────────────
export const menuCategoryRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string().optional(),
  sn: z.string(),
})

export type MenuCategoryRef = z.infer<typeof menuCategoryRefSchema>

// ─────────────────────────────────────────────
// 옵션 카테고리 (메뉴에 연결된)
// 레거시: BackofficeMenuOptionCategoryOut
// ─────────────────────────────────────────────
export const optionCategoryRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  sn: z.string(),
})

export type OptionCategoryRef = z.infer<typeof optionCategoryRefSchema>

// ─────────────────────────────────────────────
// 메뉴 아이템
// 레거시: BackofficeMenuOut
// ─────────────────────────────────────────────
export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  operation_name: z.string().nullable().optional(),   // 노출명
  highlight_description: z.string().nullable().optional(),
  base_price: z.number(),
  image_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  rcs_url: z.string().nullable().optional(),
  origin_price: z.number().nullable().optional(),
  parent_object_id: z.string(),
  max_available_quantity: z.number().nullable().optional(),
  min_available_quantity: z.number().nullable().optional(),
  membership_discount_allowed: z.boolean(),
  sn: z.string(),
  create_dt: z.string(),
  update_dt: z.string(),
  ordering: z.number(),
  menu_categories: z.array(menuCategoryRefSchema),
  option_categories: z.array(optionCategoryRefSchema),
})

export type MenuItem = z.infer<typeof menuItemSchema>

// ─────────────────────────────────────────────
// 메뉴 목록 응답
// 레거시: PaginatedMenuResponse
// ─────────────────────────────────────────────
export const menuListResponseSchema = z.object({
  count: z.number(),
  results: z.array(menuItemSchema),
})

export type MenuListResponse = z.infer<typeof menuListResponseSchema>

// ─────────────────────────────────────────────
// 메뉴 목록 조회 파라미터
// 레거시: actions.ts fetchMenuList params
// ─────────────────────────────────────────────
export const menuListParamsSchema = z.object({
  parent_object_id: z.string(),
  limit: z.number().default(9999),
  order_by: z.string().default('ordering'),
  order_direction: z.enum(['asc', 'desc']).default('asc'),
})

export type MenuListParams = z.infer<typeof menuListParamsSchema>

// ─────────────────────────────────────────────
// 메뉴 생성/수정 폼
// 레거시: MenuPayload
// ─────────────────────────────────────────────
export const menuFormSchema = z.object({
  name: z.string().min(1, '상품명을 입력해주세요.').default(''),
  operation_name: z.string().optional().default(''),
  base_price: z.coerce.number().min(0, '가격을 입력해주세요.').default(0),
  origin_price: z.coerce.number().nullable().optional(),
  highlight_description: z.string().optional().default(''),
  description: z.string().optional().default(''),
  parent_object_id: z.string().default(''),
  menu_categories: z.array(z.number()).default([]),
  option_categories: z.array(z.string()).default([]),
  ordering: z.number().optional(),
  min_available_quantity: z.coerce.number().nullable().optional(),
  max_available_quantity: z.coerce.number().nullable().optional(),
  membership_discount_allowed: z.boolean().default(false),
  // 이미지는 URL 문자열로만 처리 (S3 업로드 후 URL 입력)
  image_url: z.string().nullable().optional().default(''),
})

export type MenuForm = z.infer<typeof menuFormSchema>

// ─────────────────────────────────────────────
// 메뉴 카테고리 아이템 (드롭다운용)
// 레거시: MenuCategory
// ─────────────────────────────────────────────
export const menuCategoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string(),
  sn: z.string().nullable().optional(),
})

export type MenuCategoryItem = z.infer<typeof menuCategoryItemSchema>

// ─────────────────────────────────────────────
// 옵션 카테고리 아이템 (드롭다운용)
// 레거시: OptionCategory
// ─────────────────────────────────────────────
export const optionCategoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  sn: z.string().nullable().optional(),
})

export type OptionCategoryItem = z.infer<typeof optionCategoryItemSchema>

// ─────────────────────────────────────────────
// 메뉴 순서 변경
// 레거시: MenuOrderItem
// ─────────────────────────────────────────────
export const menuOrderItemSchema = z.object({
  id: z.string(),
  ordering: z.number(),
  parent_object_id: z.string(),
})

export type MenuOrderItem = z.infer<typeof menuOrderItemSchema>

export const menuBulkOrderingSchema = z.object({
  menus: z.array(menuOrderItemSchema),
})

export type MenuBulkOrdering = z.infer<typeof menuBulkOrderingSchema>

// ─────────────────────────────────────────────
// 운영모드 (Operation Profile)
// 레거시: OperationProfile, OperationProfileCategory
// API: GET /v1/b/stores/{storeId}/operation-categories
// ─────────────────────────────────────────────
export const operationProfileCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string().nullable().optional(),
  menus: z.array(z.unknown()).optional(),
})

export type OperationProfileCategory = z.infer<typeof operationProfileCategorySchema>

export const operationProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ordering: z.number().optional(),
  create_dt: z.string().optional(),
  update_dt: z.string().optional(),
  menu_categories: z.array(operationProfileCategorySchema).default([]),
})

export type OperationProfile = z.infer<typeof operationProfileSchema>

export const operationProfileFormSchema = z.object({
  name: z.string().min(1, '운영모드명을 입력해주세요.'),
  operation_name: z.string().optional().default(''),
  description: z.string().optional().default(''),
  menu_categories: z.array(z.number()).default([]),
  ordering: z.number().optional(),
})

export type OperationProfileForm = z.infer<typeof operationProfileFormSchema>

// ─────────────────────────────────────────────
// 카테고리 (Menu Category)
// 레거시: MenuCategory
// API: GET /v1/b/backoffice/menu-categories?parent_object_id={storeId}
// ─────────────────────────────────────────────
export const menuCategoryMenuSchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
})

export type MenuCategoryMenu = z.infer<typeof menuCategoryMenuSchema>

export const menuCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  operation_name: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ordering: z.number().optional(),
  create_dt: z.string().optional(),
  update_dt: z.string().optional(),
  menus: z.array(menuCategoryMenuSchema).default([]),
  operation_categories: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
})

export type MenuCategory = z.infer<typeof menuCategorySchema>

export const menuCategoryFormSchema = z.object({
  name: z.string().min(1, '카테고리명을 입력해주세요.'),
  operation_name: z.string().optional().default(''),
  menus: z.array(z.union([z.string(), z.number()])).default([]),
  ordering: z.number().optional(),
})

export type MenuCategoryForm = z.infer<typeof menuCategoryFormSchema>

// ─────────────────────────────────────────────
// 옵션 (Option Category)
// 레거시: OptionCategory, Option
// API: GET /v1/b/backoffice/option-categories?parent_object_id={storeId}
// ─────────────────────────────────────────────
export const optionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  base_price: z.number().default(0),
  price: z.number().default(0),
  ordering: z.number().optional(),
})

export type Option = z.infer<typeof optionSchema>

export const optionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  operation_name: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  is_required: z.boolean().nullable().optional(),
  is_multiple_selectable: z.boolean().nullable().optional(),
  max_select_count: z.number().nullable().optional(),
  ordering: z.number().optional(),
  create_dt: z.string().optional(),
  update_dt: z.string().optional(),
  options: z.array(optionSchema).default([]),
  menus: z.array(z.union([z.string(), z.number(), z.object({ id: z.string(), name: z.string(), operation_name: z.string().optional(), sn: z.string().optional() })])).optional(),
})

export type OptionCategory = z.infer<typeof optionCategorySchema>

export const optionCategoryFormSchema = z.object({
  name: z.string().min(1, '옵션 카테고리명을 입력해주세요.'),
  operation_name: z.string().optional().default(''),
  is_mandatory: z.boolean().default(false),
  is_multiple_selectable: z.boolean().default(false),
  selectable_count: z.number().nullable().optional(),
  menu_ids: z.array(z.string()).default([]),
  options: z.array(z.object({ name: z.string(), base_price: z.number() })).default([]),
  ordering: z.number().optional(),
})

export type OptionCategoryForm = z.infer<typeof optionCategoryFormSchema>

// ─────────────────────────────────────────────
// 순서 변경 공통
// ─────────────────────────────────────────────
export const bulkOrderingItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ordering: z.number(),
  parent_object_id: z.string(),
})

export type BulkOrderingItem = z.infer<typeof bulkOrderingItemSchema>

// 메뉴 필터
export type MenuStatusFilter = 'all' | 'active' | 'inactive'
export type MenuImageFilter = 'all' | 'with' | 'without'
export type MenuSearchType = 'name' | 'sn'

export interface MenuFilterState {
  keyword: string
  searchType: MenuSearchType
  statusFilter: MenuStatusFilter[]
  imageFilter: MenuImageFilter
}

