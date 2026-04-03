import { axiosInstance } from '@/lib/axios'
import type { DashboardParams, DashboardData, RevenueGraphItem } from '@/features/dashboard/schema'

interface DashboardApiParams {
  params: DashboardParams
  // 레거시 getEffectiveStoreId 로직을 호출자(queries)가 처리 후 전달
  effectiveStoreId: string | null | undefined
  brandId: string | null | undefined
}

/**
 * 대시보드 요약 데이터 조회
 * 레거시: store/dashboard/actions.js fetchDashboardData
 * GET /orders/dashboard/{startDate}/{endDate}/{term}
 */
export const fetchDashboardData = async ({
  params,
  effectiveStoreId,
  brandId,
}: DashboardApiParams): Promise<DashboardData> => {
  const { startDate, endDate, term } = params

  const queryParams = effectiveStoreId
    ? { store_id__in: effectiveStoreId }
    : brandId ? { brand_id__in: brandId } : {}

  const { data } = await axiosInstance.get<DashboardData>(
    `/orders/dashboard/${startDate}/${endDate}/${term}`,
    { params: queryParams },
  )

  return data ?? {}
}

/**
 * 매출 차트 데이터 조회
 * 레거시: store/dashboard/actions.js fetchDashboardChart
 * GET /orders/graph/revenue/{startDate}/{endDate}/{term}
 */
export const fetchRevenueChart = async ({
  params,
  effectiveStoreId,
  brandId,
}: DashboardApiParams): Promise<RevenueGraphItem[]> => {
  const { startDate, endDate, term } = params

  const queryParams = effectiveStoreId
    ? { store_id__in: effectiveStoreId }
    : brandId ? { brand_id__in: brandId } : {}

  const { data } = await axiosInstance.get<RevenueGraphItem[]>(
    `/orders/graph/revenue/${startDate}/${endDate}/${term}`,
    { params: queryParams },
  )

  return data ?? []
}
