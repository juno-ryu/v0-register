import { z } from 'zod'
import type { SelectOption } from '@/components/common/filter/constants'
import type { MenuItem } from '@/features/menu-management/schema'

// ─────────────────────────────────────────────
// 스키마 & 타입
// ─────────────────────────────────────────────

export const menuFilterSchema = z.object({
  search_key: z.enum(['name', 'sn']),
  q: z.string(),
  is_active: z.array(z.enum(['active', 'inactive'])),
  has_image: z.enum(['all', 'with', 'without']),
})

export type MenuFilterValues = z.infer<typeof menuFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export const MENU_FILTER_DEFAULTS: MenuFilterValues = {
  search_key: 'name',
  q: '',
  is_active: ['active'],
  has_image: 'all',
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const SEARCH_KEY_OPTIONS: SelectOption[] = [
  { value: 'name', label: '상품명' },
  { value: 'sn', label: '상품 SN' },
]

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '사용' },
  { value: 'inactive', label: '미사용' },
]

export const IMAGE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'with', label: '이미지 있음' },
  { value: 'without', label: '이미지 없음' },
]

// ─────────────────────────────────────────────
// 클라이언트 사이드 필터 함수
// ─────────────────────────────────────────────

export function filterMenus(menus: MenuItem[], filter: MenuFilterValues): MenuItem[] {
  return menus.filter((item) => {
    // 키워드 검색
    if (filter.q) {
      const lower = filter.q.toLowerCase()
      if (filter.search_key === 'sn') {
        if (!(item.sn ?? '').toLowerCase().includes(lower)) return false
      } else {
        if (
          !item.name.toLowerCase().includes(lower) &&
          !(item.operation_name ?? '').toLowerCase().includes(lower)
        ) return false
      }
    }
    // 상태 (메뉴는 is_active 필드 없음 — 항상 active 취급)
    if (filter.is_active.length > 0 && !filter.is_active.includes('active')) return false
    // 이미지
    if (filter.has_image === 'with' && !item.image_url) return false
    if (filter.has_image === 'without' && item.image_url) return false
    return true
  })
}
