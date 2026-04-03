// ─────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────
export const TABS = [
  { key: 'operationProfileManagement', label: '운영모드' },
  { key: 'categoryManagement', label: '상품 카테고리' },
  { key: 'menuManagement', label: '상품' },
  { key: 'optionManagement', label: '상품 옵션' },
  { key: 'originManagement', label: '원산지 표기' },
] as const

export type TabKey = (typeof TABS)[number]['key']

// ─────────────────────────────────────────────
// 정렬 옵션 (전 탭 공용)
// ─────────────────────────────────────────────
export const TAB_SORT_OPTIONS = [
  { label: '진열 순', order_by: 'ordering', order_direction: 'asc' as const },
  { label: '노출명 (오름순)', order_by: 'name', order_direction: 'asc' as const },
  { label: '노출명 (내림순)', order_by: 'name', order_direction: 'desc' as const },
  { label: '등록일 (최신순)', order_by: 'create_dt', order_direction: 'desc' as const },
  { label: '등록일 (과거순)', order_by: 'create_dt', order_direction: 'asc' as const },
  { label: '마지막 업데이트 (최신순)', order_by: 'update_dt', order_direction: 'desc' as const },
  { label: '마지막 업데이트 (과거순)', order_by: 'update_dt', order_direction: 'asc' as const },
]

export const SORT_OPTIONS = TAB_SORT_OPTIONS
