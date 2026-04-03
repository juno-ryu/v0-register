import { axiosInstance } from '@/lib/axios'
import type {
  MenuListParams,
  MenuListResponse,
  MenuItem,
  MenuForm,
  MenuBulkOrdering,
  MenuCategoryItem,
  MenuCategoryMenu,
  OptionCategoryItem,
  OperationProfile,
  OperationProfileForm,
  MenuCategory,
  MenuCategoryForm,
  OptionCategory,
  OptionCategoryForm,
  BulkOrderingItem,
} from '@/features/menu-management/schema'

const MENUS_PREFIX = '/v1/b/backoffice/menus'
const MENU_CATEGORIES_PREFIX = '/v1/b/backoffice/menu-categories'
const OPTION_CATEGORIES_PREFIX = '/v1/b/backoffice/option-categories'
const STORES_PREFIX = '/v1/b/stores'

/**
 * 메뉴 목록 조회
 * 레거시: actions.ts fetchMenuList
 * GET /v1/b/backoffice/menus?parent_object_id={storeId}&limit=9999&order_by=ordering&order_direction=asc
 */
export async function fetchMenuList(params: MenuListParams): Promise<MenuListResponse> {
  const response = await axiosInstance.get<MenuListResponse>(MENUS_PREFIX, { params })
  return response.data
}

/**
 * 메뉴 생성
 * 레거시: actions.ts postMenu
 * POST /v1/b/backoffice/menus
 * hasImage=true → multipart/form-data (FormData), false → JSON
 */
export async function createMenu(payload: MenuForm | FormData): Promise<MenuItem> {
  const isFormData = payload instanceof FormData
  const response = await axiosInstance.post<MenuItem>(MENUS_PREFIX, payload, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' },
  } : undefined)
  return response.data
}

/**
 * 메뉴 수정
 * 레거시: actions.ts putMenu
 * PUT /v1/b/backoffice/menus/{id}
 * hasImage=true → multipart/form-data (FormData), false → JSON
 */
export async function updateMenu(menuId: string, payload: Partial<MenuForm> | FormData): Promise<MenuItem> {
  const isFormData = payload instanceof FormData
  const response = await axiosInstance.put<MenuItem>(`${MENUS_PREFIX}/${menuId}`, payload, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' },
  } : undefined)
  return response.data
}

/**
 * 메뉴 삭제
 * 레거시: actions.ts deleteMenu
 * DELETE /v1/b/backoffice/menus/{id}
 */
export async function deleteMenu(menuId: string): Promise<void> {
  await axiosInstance.delete(`${MENUS_PREFIX}/${menuId}`)
}

/**
 * 메뉴 순서 일괄 변경
 * 레거시: actions.ts updateMenuOrdering
 * PUT /v1/b/backoffice/menus/bulk/ordering
 */
export async function updateMenuOrdering(payload: MenuBulkOrdering): Promise<void> {
  await axiosInstance.put(`${MENUS_PREFIX}/bulk/ordering`, payload.menus)
}

/**
 * 메뉴 카테고리 목록 조회
 * 레거시: actions.ts fetchMenuCategories
 * GET /v1/b/backoffice/menu-categories?parent_object_id={storeId}
 */
export async function fetchMenuCategories(storeId: string): Promise<MenuCategoryItem[]> {
  const response = await axiosInstance.get<{ count: number; results: MenuCategoryItem[] }>(
    MENU_CATEGORIES_PREFIX,
    { params: { parent_object_id: storeId, limit: 9999, order_by: 'ordering', order_direction: 'asc' } },
  )
  return response.data.results
}

/**
 * 옵션 카테고리 목록 조회
 * 레거시: actions.ts fetchOptionCategories
 * GET /v1/b/backoffice/option-categories?parent_object_id={storeId}
 */
export async function fetchOptionCategories(storeId: string): Promise<OptionCategoryItem[]> {
  const response = await axiosInstance.get<{ count: number; results: OptionCategoryItem[] }>(
    OPTION_CATEGORIES_PREFIX,
    { params: { parent_object_id: storeId, limit: 9999, order_by: 'ordering', order_direction: 'asc' } },
  )
  return response.data.results
}

// ─────────────────────────────────────────────
// 운영모드 API
// 레거시: store/operation-profile-management/actions.js
// ─────────────────────────────────────────────

/**
 * 운영모드 목록 조회
 * GET /v1/b/stores/{storeId}/operation-categories
 */
export async function fetchOperationProfiles(storeId: string): Promise<OperationProfile[]> {
  const response = await axiosInstance.get<OperationProfile[]>(
    `${STORES_PREFIX}/${storeId}/operation-categories`,
    { params: { order_by: 'ordering', order_direction: 'asc' } },
  )
  return response.data
}

/**
 * 운영모드 생성
 * POST /v1/b/stores/{storeId}/operation-categories
 */
export async function createOperationProfile(storeId: string, payload: OperationProfileForm): Promise<OperationProfile> {
  const response = await axiosInstance.post<OperationProfile>(
    `${STORES_PREFIX}/${storeId}/operation-categories`,
    payload,
  )
  return response.data
}

/**
 * 운영모드 수정
 * PUT /v1/b/stores/{storeId}/operation-categories/{id}
 */
export async function updateOperationProfile(storeId: string, profileId: number, payload: OperationProfileForm): Promise<OperationProfile> {
  const response = await axiosInstance.put<OperationProfile>(
    `${STORES_PREFIX}/${storeId}/operation-categories/${profileId}`,
    payload,
  )
  return response.data
}

/**
 * 운영모드 삭제
 * DELETE /v1/b/stores/{storeId}/operation-categories/{id}
 */
export async function deleteOperationProfile(storeId: string, profileId: number): Promise<void> {
  await axiosInstance.delete(`${STORES_PREFIX}/${storeId}/operation-categories/${profileId}`)
}

/**
 * 운영모드 순서 변경
 * PATCH /v1/b/stores/{storeId}/ordering/operation-categories
 */
export async function updateOperationProfileOrdering(storeId: string, items: BulkOrderingItem[]): Promise<void> {
  await axiosInstance.patch(
    `${STORES_PREFIX}/${storeId}/ordering/operation-categories`,
    { data: items },
  )
}

/**
 * 포스 메뉴 동기화
 * POST /v1/b/stores/{storeId}/menus/sync
 */
export async function syncMenu(storeId: string): Promise<void> {
  await axiosInstance.post(`${STORES_PREFIX}/${storeId}/menus/sync`)
}

/**
 * 상품 드롭다운 목록 조회 (카테고리 폼 — 상품 선택용)
 * GET /v1/b/stores/{storeId}/menus-for-dropdown
 */
export async function fetchMenusForDropdown(storeId: string): Promise<MenuCategoryMenu[]> {
  const response = await axiosInstance.get<MenuCategoryMenu[]>(
    `${STORES_PREFIX}/${storeId}/menus-for-dropdown`,
  )
  return response.data
}

// ─────────────────────────────────────────────
// 카테고리 API
// 레거시: store/menu-management/actions.ts (menuCategories)
// ─────────────────────────────────────────────

/**
 * 카테고리 목록 조회 (상세 — 탭용)
 * GET /v1/b/backoffice/menu-categories?parent_object_id={storeId}
 */
export async function fetchMenuCategoriesDetail(storeId: string): Promise<MenuCategory[]> {
  const response = await axiosInstance.get<{ count: number; results: MenuCategory[] }>(
    MENU_CATEGORIES_PREFIX,
    { params: { parent_object_id: storeId, limit: 9999, order_by: 'ordering', order_direction: 'asc' } },
  )
  return response.data.results
}

/**
 * 카테고리 생성
 * POST /v1/b/backoffice/menu-categories
 */
export async function createMenuCategory(storeId: string, payload: MenuCategoryForm): Promise<MenuCategory> {
  const { menus, ...rest } = payload
  const response = await axiosInstance.post<MenuCategory>(MENU_CATEGORIES_PREFIX, {
    ...rest,
    menus: menus.map((id) => ({ id })),
    parent_object_id: storeId,
  })
  return response.data
}

/**
 * 카테고리 수정
 * PUT /v1/b/backoffice/menu-categories/{id}
 */
export async function updateMenuCategory(categoryId: number, payload: MenuCategoryForm): Promise<MenuCategory> {
  const { menus, ...rest } = payload
  const response = await axiosInstance.put<MenuCategory>(`${MENU_CATEGORIES_PREFIX}/${categoryId}`, {
    ...rest,
    menus: menus.map((id) => ({ id })),
  })
  return response.data
}

/**
 * 카테고리 삭제
 * DELETE /v1/b/backoffice/menu-categories/{id}
 */
export async function deleteMenuCategory(categoryId: number): Promise<void> {
  await axiosInstance.delete(`${MENU_CATEGORIES_PREFIX}/${categoryId}`)
}

/**
 * 카테고리 순서 변경
 * PUT /v1/b/backoffice/menu-categories/bulk/ordering
 */
export async function updateMenuCategoryOrdering(items: BulkOrderingItem[]): Promise<void> {
  await axiosInstance.put(`${MENU_CATEGORIES_PREFIX}/bulk/ordering`, items)
}

// ─────────────────────────────────────────────
// 옵션 카테고리 CRUD API
// 레거시: store/menu-management/actions.ts (optionCategories)
// ─────────────────────────────────────────────

/**
 * 옵션 카테고리 목록 조회 (상세 — 탭용)
 * GET /v1/b/backoffice/option-categories?parent_object_id={storeId}
 */
export async function fetchOptionCategoriesDetail(storeId: string): Promise<OptionCategory[]> {
  const response = await axiosInstance.get<{ count: number; results: OptionCategory[] }>(
    OPTION_CATEGORIES_PREFIX,
    { params: { parent_object_id: storeId, limit: 9999, order_by: 'ordering', order_direction: 'asc' } },
  )
  return response.data.results
}

/**
 * 옵션 카테고리 생성
 * POST /v1/b/backoffice/option-categories
 */
export async function createOptionCategory(storeId: string, payload: OptionCategoryForm): Promise<OptionCategory> {
  const response = await axiosInstance.post<OptionCategory>(OPTION_CATEGORIES_PREFIX, {
    ...payload,
    parent_object_id: storeId,
  })
  return response.data
}

/**
 * 옵션 카테고리 수정
 * PUT /v1/b/backoffice/option-categories/{id}
 */
export async function updateOptionCategory(categoryId: string, payload: OptionCategoryForm): Promise<OptionCategory> {
  const response = await axiosInstance.put<OptionCategory>(`${OPTION_CATEGORIES_PREFIX}/${categoryId}`, payload)
  return response.data
}

/**
 * 옵션 카테고리 삭제
 * DELETE /v1/b/backoffice/option-categories/{id}
 */
export async function deleteOptionCategory(categoryId: string): Promise<void> {
  await axiosInstance.delete(`${OPTION_CATEGORIES_PREFIX}/${categoryId}`)
}

/**
 * 옵션 카테고리 순서 변경
 * PUT /v1/b/backoffice/option-categories/bulk/ordering
 */
export async function updateOptionCategoryOrdering(items: BulkOrderingItem[]): Promise<void> {
  await axiosInstance.put(`${OPTION_CATEGORIES_PREFIX}/bulk/ordering`, items)
}

// ─────────────────────────────────────────────
// 원산지 API
// 레거시: store/menu-management/actions.ts (fetchOrigins, patchOrigins)
// ─────────────────────────────────────────────

/**
 * 원산지 조회
 * GET /v1/b/backoffice/stores/{storeId} → menu_information 필드
 */
export async function fetchOrigins(storeId: string): Promise<string> {
  const response = await axiosInstance.get<{ menu_information: string }>(
    `/backoffice/stores/${storeId}`,
  )
  return response.data.menu_information ?? ''
}

/**
 * 원산지 수정
 * PATCH /backoffice/stores/{storeId}
 */
export async function updateOrigins(storeId: string, origins: string): Promise<void> {
  await axiosInstance.patch(`/backoffice/stores/${storeId}`, { menu_information: origins })
}
