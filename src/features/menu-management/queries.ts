import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'
import {
  fetchMenuList, createMenu, updateMenu, deleteMenu, updateMenuOrdering, fetchMenuCategories, fetchOptionCategories,
  fetchOperationProfiles, createOperationProfile, updateOperationProfile, deleteOperationProfile, updateOperationProfileOrdering, syncMenu,
  fetchMenusForDropdown,
  fetchMenuCategoriesDetail, createMenuCategory, updateMenuCategory, deleteMenuCategory, updateMenuCategoryOrdering,
  fetchOptionCategoriesDetail, createOptionCategory, updateOptionCategory, deleteOptionCategory, updateOptionCategoryOrdering,
  fetchOrigins, updateOrigins,
} from '@/features/menu-management/api'
import type {
  MenuListParams, MenuForm, MenuBulkOrdering,
  OperationProfileForm, MenuCategoryForm, OptionCategoryForm, BulkOrderingItem,
} from '@/features/menu-management/schema'

export const menuKeys = {
  all: ['menus'] as const,
  list: (storeId: string) => [...menuKeys.all, 'list', storeId] as const,
  detail: (menuId: string) => [...menuKeys.all, 'detail', menuId] as const,
}

/**
 * 메뉴 목록 조회
 * 레거시: store/menu-management/actions.ts fetchMenuList
 * storeId가 없으면 쿼리 비활성화
 */
export const menuListQueryOptions = (storeId: string) => {
  const params: MenuListParams = { parent_object_id: storeId, limit: 9999, order_by: 'ordering', order_direction: 'asc' }
  return queryOptions({ queryKey: menuKeys.list(storeId), queryFn: () => fetchMenuList(params) })
}

export function useMenuList(storeId: string | null) {
  return useQuery({ ...menuListQueryOptions(storeId ?? ''), enabled: !!storeId })
}

/**
 * 메뉴 생성
 * 레거시: store/menu-management/actions.ts createMenu
 */
export function useCreateMenu(_storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuForm | FormData) => createMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
    onError: (error: unknown) => {
      console.error('메뉴 생성 실패:', error)
    },
  })
}

/**
 * 메뉴 수정
 * 레거시: store/menu-management/actions.ts putMenu
 */
export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ menuId, payload }: { menuId: string; payload: Partial<MenuForm> | FormData }) =>
      updateMenu(menuId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
    onError: (error: unknown) => {
      console.error('메뉴 수정 실패:', error)
    },
  })
}

/**
 * 메뉴 삭제
 * 레거시: store/menu-management/actions.ts deleteMenu
 */
export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (menuId: string) => deleteMenu(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
    onError: (error: unknown) => {
      console.error('메뉴 삭제 실패:', error)
    },
  })
}

/**
 * 메뉴 순서 일괄 변경
 * 레거시: store/menu-management/actions.ts updateMenuOrdering
 */
export function useUpdateMenuOrdering() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuBulkOrdering) => updateMenuOrdering(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
    onError: (error: unknown) => {
      console.error('메뉴 순서 변경 실패:', error)
    },
  })
}

/**
 * 메뉴 카테고리 목록 조회
 * 레거시: store/menu-management/actions.ts fetchMenuCategories
 */
export const menuCategoriesQueryOptions = (storeId: string) =>
  queryOptions({ queryKey: ['menu-categories', storeId], queryFn: () => fetchMenuCategories(storeId) })

export function useMenuCategories(storeId: string | null) {
  return useQuery({ ...menuCategoriesQueryOptions(storeId ?? ''), enabled: !!storeId })
}

export const optionCategoriesQueryOptions = (storeId: string) =>
  queryOptions({ queryKey: ['option-categories', storeId], queryFn: () => fetchOptionCategories(storeId) })

export function useOptionCategories(storeId: string | null) {
  return useQuery({ ...optionCategoriesQueryOptions(storeId ?? ''), enabled: !!storeId })
}

// ─────────────────────────────────────────────
// 운영모드 훅
// ─────────────────────────────────────────────

export const operationProfileKeys = {
  all: (storeId: string) => ['operation-profiles', storeId] as const,
}

export const operationProfilesQueryOptions = (storeId: string) =>
  queryOptions({ queryKey: operationProfileKeys.all(storeId), queryFn: () => fetchOperationProfiles(storeId) })

export function useOperationProfiles(storeId: string | null) {
  return useQuery({ ...operationProfilesQueryOptions(storeId ?? ''), enabled: !!storeId })
}

export function useCreateOperationProfile(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OperationProfileForm) => createOperationProfile(storeId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationProfileKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('운영모드 생성 실패:', error)
    },
  })
}

export function useUpdateOperationProfile(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ profileId, payload }: { profileId: number; payload: OperationProfileForm }) =>
      updateOperationProfile(storeId!, profileId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationProfileKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('운영모드 수정 실패:', error)
    },
  })
}

export function useDeleteOperationProfile(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (profileId: number) => deleteOperationProfile(storeId!, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationProfileKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('운영모드 삭제 실패:', error)
    },
  })
}

export function useUpdateOperationProfileOrdering(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: BulkOrderingItem[]) => updateOperationProfileOrdering(storeId!, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationProfileKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('운영모드 순서 변경 실패:', error)
    },
  })
}

export function useSyncMenu(storeId: string | null) {
  return useMutation({
    mutationFn: () => syncMenu(storeId!),
  })
}

// ─────────────────────────────────────────────
// 상품 드롭다운 훅 (카테고리 폼 — 상품 선택용)
// ─────────────────────────────────────────────

export function useMenusForDropdown(storeId: string | null) {
  return useQuery({
    queryKey: ['menus-for-dropdown', storeId],
    queryFn: () => fetchMenusForDropdown(storeId!),
    enabled: !!storeId,
  })
}

// ─────────────────────────────────────────────
// 카테고리 훅
// ─────────────────────────────────────────────

export const menuCategoryKeys = {
  all: (storeId: string) => ['menu-categories-detail', storeId] as const,
}

export const menuCategoriesDetailQueryOptions = (storeId: string) =>
  queryOptions({ queryKey: menuCategoryKeys.all(storeId), queryFn: () => fetchMenuCategoriesDetail(storeId) })

export function useMenuCategoriesDetail(storeId: string | null) {
  return useQuery({ ...menuCategoriesDetailQueryOptions(storeId ?? ''), enabled: !!storeId })
}

export function useCreateMenuCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuCategoryForm) => createMenuCategory(storeId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('메뉴 카테고리 생성 실패:', error)
    },
  })
}

export function useUpdateMenuCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: number; payload: MenuCategoryForm }) =>
      updateMenuCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('메뉴 카테고리 수정 실패:', error)
    },
  })
}

export function useDeleteMenuCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => deleteMenuCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('메뉴 카테고리 삭제 실패:', error)
    },
  })
}

export function useUpdateMenuCategoryOrdering(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: BulkOrderingItem[]) => updateMenuCategoryOrdering(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('메뉴 카테고리 순서 변경 실패:', error)
    },
  })
}

// ─────────────────────────────────────────────
// 옵션 카테고리 CRUD 훅
// ─────────────────────────────────────────────

export const optionCategoryKeys = {
  all: (storeId: string) => ['option-categories-detail', storeId] as const,
}

export const optionCategoriesDetailQueryOptions = (storeId: string) =>
  queryOptions({ queryKey: optionCategoryKeys.all(storeId), queryFn: () => fetchOptionCategoriesDetail(storeId) })

export function useOptionCategoriesDetail(storeId: string | null) {
  return useQuery({ ...optionCategoriesDetailQueryOptions(storeId ?? ''), enabled: !!storeId })
}

export function useCreateOptionCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OptionCategoryForm) => createOptionCategory(storeId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optionCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('옵션 카테고리 생성 실패:', error)
    },
  })
}

export function useUpdateOptionCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: OptionCategoryForm }) =>
      updateOptionCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optionCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('옵션 카테고리 수정 실패:', error)
    },
  })
}

export function useDeleteOptionCategory(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => deleteOptionCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optionCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('옵션 카테고리 삭제 실패:', error)
    },
  })
}

export function useUpdateOptionCategoryOrdering(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: BulkOrderingItem[]) => updateOptionCategoryOrdering(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: optionCategoryKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('옵션 카테고리 순서 변경 실패:', error)
    },
  })
}

// ─────────────────────────────────────────────
// 원산지 훅
// ─────────────────────────────────────────────

export const originsKeys = {
  all: (storeId: string) => ['origins', storeId] as const,
}

export function useOrigins(storeId: string | null) {
  return useQuery({
    queryKey: originsKeys.all(storeId ?? ''),
    queryFn: () => fetchOrigins(storeId!),
    enabled: !!storeId,
  })
}

export function useUpdateOrigins(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (origins: string) => updateOrigins(storeId!, origins),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: originsKeys.all(storeId ?? '') })
    },
    onError: (error: unknown) => {
      console.error('원산지 정보 수정 실패:', error)
    },
  })
}

// ─────────────────────────────────────────────
// 매장 선택용 브랜드/매장 목록 쿼리
// ─────────────────────────────────────────────
export interface BrandItem { id: string; name: string }
export interface StoreItem { id: string; name: string }

export const brandsForSelectionQueryOptions = () =>
  queryOptions({
    queryKey: ['brands', 'list-for-selection'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ results: BrandItem[] }>('/v1/b/brands', {
        params: { per_page: 10000 },
      })
      return data?.results ?? []
    },
  })

export const storesForSelectionQueryOptions = (brandId: string) =>
  queryOptions({
    queryKey: ['stores', 'list-for-selection', brandId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ results: StoreItem[] }>('/v1/b/management/stores', {
        params: { per_page: 10000, order_by: 'name', order_direction: 'asc', brand_id__in: brandId },
      })
      return data?.results ?? []
    },
  })

export function useBrandListForSelection(enabled = true) {
  return useQuery({ ...brandsForSelectionQueryOptions(), enabled })
}

export function useStoreListForSelection(brandId: string | null) {
  return useQuery({
    ...storesForSelectionQueryOptions(brandId ?? ''),
    enabled: !!brandId,
  })
}

// ─────────────────────────────────────────────
// 매장 POS 타입 조회 (isDidOnly 판단용)
// ─────────────────────────────────────────────
export function useStorePosType(storeId: string | null) {
  return useQuery({
    queryKey: ['store-detail-pos', storeId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ pos?: string | null }>(`/v1/b/management/stores/${storeId}`)
      return data.pos ?? null
    },
    enabled: !!storeId,
  })
}
