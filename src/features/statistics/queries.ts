import { useQuery } from '@tanstack/react-query'
import type { StatisticsParams } from '@/features/statistics/schema'
import { STATISTICS_TYPE } from '@/features/statistics/schema'
import {
  fetchAggregatedOrderMenus,
  fetchAggregatedOrderMenuOptions,
} from '@/features/statistics/api'

export const statisticsKeys = {
  all: ['statistics'] as const,
  menus: (params: StatisticsParams) => ['statistics', 'menus', params] as const,
  menuOptions: (params: StatisticsParams) => ['statistics', 'menuOptions', params] as const,
}

/**
 * 통계 데이터 조회 (통계 타입에 따라 상품 매출 또는 상품 옵션 매출)
 * 레거시: store/statistics/actions.js fetchAggregatedOrderMenus / fetchAggregatedOrderMenuOptions
 */
export function useStatistics(
  params: StatisticsParams & { statisticsType: string },
  enabled: boolean,
) {
  const isProductSales = params.statisticsType === STATISTICS_TYPE.PRODUCT_SALES
  const { statisticsType: _statisticsType, ...baseParams } = params

  const menusQuery = useQuery({
    queryKey: statisticsKeys.menus(baseParams),
    queryFn: () => fetchAggregatedOrderMenus(baseParams),
    enabled: enabled && isProductSales && !!baseParams.storeId,
  })

  const menuOptionsQuery = useQuery({
    queryKey: statisticsKeys.menuOptions(baseParams),
    queryFn: () => fetchAggregatedOrderMenuOptions(baseParams),
    enabled: enabled && !isProductSales && !!baseParams.storeId,
  })

  return isProductSales ? menusQuery : menuOptionsQuery
}
