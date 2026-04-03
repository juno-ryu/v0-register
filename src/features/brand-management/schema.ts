import { z } from 'zod'

// ─────────────────────────────────────────────
// 브랜드 목록 아이템
// 레거시: components/brand-management/BrandTable.vue
// ─────────────────────────────────────────────
export const brandListItemSchema = z.object({
  id: z.union([z.string(), z.number()]),           // API는 UUID string 반환
  name: z.string(),
  domain: z.string().nullable().optional(),
  is_active: z.boolean().optional(),               // 상태 판단 기준
  use_user: z.boolean().optional(),                // 일반회원 (레거시: is_admission_confirmed)
  use_membership_user: z.boolean().optional(),     // 임직원회원 (레거시: is_notice_confirmed)
  total_stores_count: z.union([z.string(), z.number()]).nullable().optional(),  // 보유매장
  active_stores_count: z.union([z.string(), z.number()]).nullable().optional(), // 활성매장
  update_dt: z.string().nullable().optional(),     // 업데이트 (레거시: updated_at)
  create_dt: z.string().nullable().optional(),     // 생성일 (레거시: created_at)
})

export type BrandListItem = z.infer<typeof brandListItemSchema>

export const brandListResponseSchema = z.object({
  count: z.number(),
  results: z.array(brandListItemSchema),
})

export type BrandListResponse = z.infer<typeof brandListResponseSchema>

// ─────────────────────────────────────────────
// 브랜드 목록 조회 파라미터
// ─────────────────────────────────────────────
export const brandListParamsSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(20),
})

export type BrandListParams = z.infer<typeof brandListParamsSchema>

// ─────────────────────────────────────────────
// 브랜드 상세
// 레거시: BrandCreateModal.vue loadBrandData()
// ─────────────────────────────────────────────
export const brandDetailSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  domain: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  title: z.string().nullable().optional(),
  service_type: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  main_logo: z.string().nullable().optional(),
  sub_logo: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  og_title: z.string().nullable().optional(),
  og_description: z.string().nullable().optional(),
  use_guest_user: z.boolean().optional(),
  use_user: z.boolean().optional(),
  use_membership_user: z.boolean().optional(),
  theme_colors: z.array(z.string()).optional(),
  registration_number: z.string().nullable().optional(),
  business_report_number: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  representative_name: z.string().nullable().optional(),
  footer_brand_name: z.string().nullable().optional(),
  administrator_username: z.string().nullable().optional(),
  administrator_update_dt: z.string().nullable().optional(),
  update_dt: z.string().nullable().optional(),
  create_dt: z.string().nullable().optional(),
})

export type BrandDetail = z.infer<typeof brandDetailSchema>

// ─────────────────────────────────────────────
// 브랜드 생성/수정 payload
// 레거시: BrandCreateModal.vue handleSubmit()
// ─────────────────────────────────────────────
export const brandFormSchema = z.object({
  name: z.string().min(1, '브랜드 명을 입력해주세요.').default(''),
  domain: z.string().min(5, '도메인을 입력해주세요.').default(''),
  title: z.string().min(1, '페이지 제목을 입력해주세요.').default(''),
  service_type: z.string().default('platform'),
  is_active: z.boolean().default(true),
  image_url: z.string().optional().default(''),
  main_logo: z.string().optional().default(''),
  sub_logo: z.string().optional().default(''),
  og_image: z.string().optional().default(''),
  og_title: z.string().optional().default(''),
  og_description: z.string().optional().default(''),
  use_guest_user: z.boolean().default(true),
  use_user: z.boolean().default(false),
  use_membership_user: z.boolean().default(false),
  theme_colors: z.array(z.string()).default(['', '', '', '', '', '', '']),
  registration_number: z.string().optional().default(''),
  business_report_number: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  representative_name: z.string().optional().default(''),
  footer_brand_name: z.string().optional().default(''),
})

export type BrandForm = z.infer<typeof brandFormSchema>
