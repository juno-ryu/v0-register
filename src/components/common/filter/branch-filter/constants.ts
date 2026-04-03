import { z } from 'zod'
import type { SelectOption } from '@/components/common/filter/constants'

// ─────────────────────────────────────────────
// 스키마 & 타입 — 필드명을 API 파라미터와 일치
// ─────────────────────────────────────────────

export const branchFilterSchema = z.object({
  search_key: z.enum(['name', 'sn', 'external_sn']),
  q: z.string(),
  is_active: z.enum(['all', 'true', 'false']),
  brand_id__in: z.array(z.string()),
  available_take_types: z.array(z.string()),
})

export type BranchFilterValues = z.infer<typeof branchFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export const BRANCH_FILTER_DEFAULTS: BranchFilterValues = {
  search_key: 'name',
  q: '',
  is_active: 'all',
  brand_id__in: [],
  available_take_types: [],
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const SEARCH_KEY_OPTIONS: SelectOption[] = [
  { value: 'name', label: '매장명' },
  { value: 'sn', label: '코드' },
  { value: 'external_sn', label: '가맹점번호' },
]

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'true', label: '운영 중' },
  { value: 'false', label: '운영 중단' },
]

export const TAKE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: '1', label: '테이블주문' },
  { value: '3', label: '픽업(일반)' },
  { value: '7', label: '매장이용' },
  { value: '2', label: '포장' },
  { value: '11', label: '숙박주문' },
  { value: '4', label: '로봇배달' },
]
