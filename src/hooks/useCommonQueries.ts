import { useQuery, queryOptions } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'

export interface BrandItem {
  id: string
  name: string
}

export interface StoreItem {
  id: string
  name: string
}

export const commonBrandListQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: ['brands', 'list'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ results: BrandItem[] }>('/v1/b/brands', {
        params: { per_page: 10000 },
      })
      return data?.results ?? []
    },
    enabled,
  })

export const commonStoreListQueryOptions = (brandIds?: string | string[] | number | null) =>
  queryOptions({
    queryKey: ['stores', 'list', brandIds],
    queryFn: async () => {
      const brandIdIn = Array.isArray(brandIds)
        ? brandIds.join(',')
        : brandIds ? String(brandIds) : undefined
      const { data } = await axiosInstance.get<{ results: StoreItem[] }>('backoffice/stores', {
        params: {
          page_size: 10000,
          ...(brandIdIn ? { brand_id__in: brandIdIn } : undefined),
        },
      })
      const results = data?.results ?? []
      return results.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    },
  })

/** 브랜드 목록 조회 (운영사 계정에서만 활성화) */
export function useBrandList(enabled = true) {
  return useQuery(commonBrandListQueryOptions(enabled))
}

/** 매장 목록 조회 (brandId 있으면 해당 브랜드 소속 매장만 조회) */
export function useStoreList(brandId?: string | number | null) {
  return useQuery(commonStoreListQueryOptions(brandId))
}
