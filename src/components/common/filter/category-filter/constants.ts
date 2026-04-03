import { z } from 'zod'
import type { SelectOption } from '@/components/common/filter/constants'
import type { MenuCategory } from '@/features/menu-management/schema'

// ─────────────────────────────────────────────
// 스키마 & 타입
// ─────────────────────────────────────────────

export const categoryFilterSchema = z.object({
  q: z.string(),
  is_active: z.array(z.enum(['active', 'inactive'])),
  operation_mode_applied: z.enum(['all', 'applied', 'not_applied']),
})

export type CategoryFilterValues = z.infer<typeof categoryFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export const CATEGORY_FILTER_DEFAULTS: CategoryFilterValues = {
  q: '',
  is_active: ['active'],
  operation_mode_applied: 'all',
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '사용' },
  { value: 'inactive', label: '미사용' },
]

export const OPERATION_MODE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'applied', label: '운영모드 적용' },
  { value: 'not_applied', label: '운영모드 미적용' },
]

// ─────────────────────────────────────────────
// 클라이언트 사이드 필터 함수
// ─────────────────────────────────────────────

export function filterCategories(items: MenuCategory[], filter: CategoryFilterValues): MenuCategory[] {
  return items.filter((item) => {
    // 키워드 검색
    if (filter.q) {
      const lower = filter.q.toLowerCase()
      if (
        !item.name.toLowerCase().includes(lower) &&
        !(item.operation_name ?? '').toLowerCase().includes(lower)
      ) return false
    }
    // 상태
    if (filter.is_active.length > 0) {
      const isActive = item.is_active !== false
      const matches = (filter.is_active.includes('active') && isActive) || (filter.is_active.includes('inactive') && !isActive)
      if (!matches) return false
    }
    // 운영모드 연결 여부
    if (filter.operation_mode_applied !== 'all') {
      const hasOperationMode = (item.operation_categories?.length ?? 0) > 0
      if (filter.operation_mode_applied === 'applied' && !hasOperationMode) return false
      if (filter.operation_mode_applied === 'not_applied' && hasOperationMode) return false
    }
    return true
  })
}
