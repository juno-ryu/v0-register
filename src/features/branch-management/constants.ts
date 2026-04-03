// ─────────────────────────────────────────────
// 정렬 옵션 (레거시 STORE_SORT_OPTIONS 포팅)
// ─────────────────────────────────────────────

export interface SortOption {
  label: string
  value: string
  order_by: string
  order_direction: 'asc' | 'desc'
}

export const SORT_OPTIONS: SortOption[] = [
  { label: '매장명 (오름 순)', value: 'name_asc', order_by: 'name', order_direction: 'asc' },
  { label: '매장명 (내림 순)', value: 'name_desc', order_by: 'name', order_direction: 'desc' },
  { label: '등록일 (최신 순)', value: 'create_dt_desc', order_by: 'create_dt', order_direction: 'desc' },
  { label: '등록일 (과거 순)', value: 'create_dt_asc', order_by: 'create_dt', order_direction: 'asc' },
  { label: '업데이트 (최신 순)', value: 'update_dt_desc', order_by: 'update_dt', order_direction: 'desc' },
  { label: '업데이트 (과거 순)', value: 'update_dt_asc', order_by: 'update_dt', order_direction: 'asc' },
]

export const SORT_OPTIONS_BRAND: SortOption[] = [
  { label: '브랜드 (오름 순)', value: 'brand__name_asc', order_by: 'brand__name', order_direction: 'asc' },
  { label: '브랜드 (내림 순)', value: 'brand__name_desc', order_by: 'brand__name', order_direction: 'desc' },
]
