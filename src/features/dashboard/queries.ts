import { useQuery, queryOptions } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { useAuthStore, selectIsStoreAccount } from '@/store/useAuthStore'
import { fetchDashboardData, fetchRevenueChart } from '@/features/dashboard/api'
import type { DashboardParams, RevenueChartData, RevenueGraphItem } from '@/features/dashboard/schema'
import { TERM_TYPE } from '@/features/dashboard/schema'

// 쿼리 키 팩토리
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (params: DashboardParams) => [...dashboardKeys.all, 'data', params] as const,
  chart: (params: DashboardParams) => [...dashboardKeys.all, 'chart', params] as const,
}

/**
 * 레거시 getEffectiveStoreId 로직 포팅
 * 매장 계정: 자신의 storeId만 사용 (보안)
 * 브랜드/운영사: 선택된 storeId 사용
 */
function getEffectiveStoreId(
  isStoreAccount: boolean,
  userStoreId: string | null,
  selectedStoreId: string | null | undefined,
): string | null {
  if (isStoreAccount && userStoreId) {
    return userStoreId
  }
  return selectedStoreId ?? null
}

/**
 * 기본 날짜 파라미터 생성 - 레거시와 동일하게 어제 날짜
 */
export function getDefaultDashboardParams(): DashboardParams {
  const yesterday = addDays(new Date(), -1)
  const dateStr = format(yesterday, 'yyyy-MM-dd')
  return {
    startDate: dateStr,
    endDate: dateStr,
    term: TERM_TYPE.DAILY,
  }
}

/**
 * x축 레이블 변환
 * 레거시 chartFactory.js processXAxisLabel 포팅
 */
function processXAxisLabel(term: string, date: string): string {
  switch (term) {
    case TERM_TYPE.DAILY:
      return date
    case TERM_TYPE.CUSTOM:
    case TERM_TYPE.WEEKLY:
      return date + '~'
    case TERM_TYPE.MONTHLY:
      return date.slice(0, 7) // 'yyyy/MM'
    default:
      return date
  }
}

/**
 * RevenueGraphItem[] → RevenueChartData[] 변환
 * 레거시 createRevenueChart 포팅
 */
export function transformRevenueChart(
  items: RevenueGraphItem[],
  term: string,
): RevenueChartData[] {
  return items.map((item) => {
    const formattedDate = format(new Date(item.date), 'yyyy/MM/dd')
    return {
      date: processXAxisLabel(term, formattedDate),
      revenue: item.total_sales_amount,
      orderCount: item.total_order_count,
    }
  })
}

// loader 용 standalone queryOptions (hooks 없이 loader에서 prefetch 가능)
export const dashboardDataQueryOptions = (
  params: DashboardParams,
  effectiveStoreId: string | null | undefined,
  brandId: string | null | undefined,
) =>
  queryOptions({
    queryKey: dashboardKeys.data(params),
    queryFn: () => fetchDashboardData({ params, effectiveStoreId, brandId }),
  })

export const dashboardChartQueryOptions = (
  params: DashboardParams,
  effectiveStoreId: string | null | undefined,
  brandId: string | null | undefined,
) =>
  queryOptions({
    queryKey: dashboardKeys.chart(params),
    queryFn: async () => {
      const raw = await fetchRevenueChart({ params, effectiveStoreId, brandId })
      return transformRevenueChart(raw, params.term)
    },
  })

// 대시보드 요약 데이터 훅
export function useDashboardData(
  params: DashboardParams,
  options?: { enabled?: boolean },
) {
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  const effectiveStoreId = getEffectiveStoreId(
    isStoreAccount,
    userStoreId,
    params.storeId ?? null,
  )

  return useQuery({
    queryKey: dashboardKeys.data(params),
    queryFn: () =>
      fetchDashboardData({
        params,
        effectiveStoreId,
        brandId: params.brandId ?? userBrandId,
      }),
    enabled: options?.enabled !== false,
  })
}

// 매출 차트 데이터 훅
export function useDashboardChart(
  params: DashboardParams,
  options?: { enabled?: boolean },
) {
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  const effectiveStoreId = getEffectiveStoreId(
    isStoreAccount,
    userStoreId,
    params.storeId ?? null,
  )

  return useQuery({
    queryKey: dashboardKeys.chart(params),
    queryFn: async () => {
      const raw = await fetchRevenueChart({
        params,
        effectiveStoreId,
        brandId: params.brandId ?? userBrandId,
      })
      return transformRevenueChart(raw, params.term)
    },
    enabled: options?.enabled !== false,
  })
}
