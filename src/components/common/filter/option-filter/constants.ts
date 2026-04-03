import { z } from 'zod'
import type { SelectOption } from '@/components/common/filter/constants'
import type { OptionCategory } from '@/features/menu-management/schema'

// ─────────────────────────────────────────────
// 스키마 & 타입
// ─────────────────────────────────────────────

export const optionFilterSchema = z.object({
  q: z.string(),
  is_active: z.array(z.enum(['active', 'inactive'])),
})

export type OptionFilterValues = z.infer<typeof optionFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export const OPTION_FILTER_DEFAULTS: OptionFilterValues = {
  q: '',
  is_active: ['active'],
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '사용' },
  { value: 'inactive', label: '미사용' },
]

// ─────────────────────────────────────────────
// 클라이언트 사이드 필터 함수
// ─────────────────────────────────────────────

export function filterOptions(items: OptionCategory[], filter: OptionFilterValues): OptionCategory[] {
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
    return true
  })
}
