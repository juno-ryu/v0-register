import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { fetchBrandList, fetchBrandDetail, createBrand, updateBrand } from '@/features/brand-management/api'
import type { BrandListParams, BrandForm } from '@/features/brand-management/schema'

export const brandKeys = {
  all: ['brands'] as const,
  list: (params: BrandListParams) => [...brandKeys.all, 'list', params] as const,
  detail: (brandId: string | number) => [...brandKeys.all, 'detail', brandId] as const,
}

export function getDefaultBrandListParams(): BrandListParams {
  return { page: 1, per_page: 20 }
}

export const brandListQueryOptions = (params: BrandListParams) =>
  queryOptions({
    queryKey: brandKeys.list(params),
    queryFn: () => fetchBrandList(params),
  })

/**
 * 브랜드 목록 조회
 * 레거시: store/brands/actions.ts fetchBrandList
 */
export function useBrandList(params: BrandListParams) {
  return useQuery(brandListQueryOptions(params))
}

/**
 * 브랜드 상세 조회
 * 레거시: store/brands/actions.ts fetchBrandDetail
 */
export function useBrandDetail(brandId: string | number | null) {
  return useQuery({
    queryKey: brandKeys.detail(brandId!),
    queryFn: () => fetchBrandDetail(brandId!),
    enabled: !!brandId,
  })
}

/**
 * 브랜드 생성
 * 레거시: store/brands/actions.ts createBrand
 */
export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BrandForm) => createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
    onError: (error: unknown) => {
      console.error('브랜드 생성 실패:', error)
    },
  })
}

/**
 * 브랜드 수정
 * 레거시: store/brands/actions.ts updateBrand
 */
export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ brandId, payload }: { brandId: number; payload: Partial<BrandForm> }) =>
      updateBrand(brandId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
    onError: (error: unknown) => {
      console.error('브랜드 수정 실패:', error)
    },
  })
}
