import { axiosInstance } from '@/lib/axios'
import type {
  AggregatedOrderMenu,
  AggregatedOrderMenuOption,
  StatisticsCategoryRow,
  StatisticsParams,
  StatisticsProductRow,
} from '@/features/statistics/schema'
import { ROW_TYPE } from '@/features/statistics/schema'

// ─────────────────────────────────────────────
// 카테고리별 그룹핑 변환
// 레거시: store/statistics/actions.js transformAggregatedData
// ─────────────────────────────────────────────
function transformAggregatedData<T extends Record<string, unknown>>(
  response: T[],
  categoryKey: string,
): StatisticsCategoryRow[] {
  const idKey = `${categoryKey}_id`
  const nameKey = `${categoryKey}_name`

  const grouped = response.reduce<Record<string, StatisticsCategoryRow>>((acc, item) => {
    const category = item[nameKey] as string

    if (!acc[category]) {
      acc[category] = {
        type: ROW_TYPE.CATEGORY,
        category_name: category,
        [idKey]: item[idKey],
        [nameKey]: item[nameKey],
        total_quantity: 0,
        total_price: 0,
        percentage: 0,
        total_membership_discounted_quantity: 0,
        total_membership_discounted_price: 0,
        items: [],
      }
    }

    acc[category].total_quantity += item.total_quantity as number
    acc[category].total_price += item.total_price as number
    acc[category].percentage += item.percentage as number
    acc[category].total_membership_discounted_quantity +=
      (item.total_membership_discounted_quantity as number) || 0
    acc[category].total_membership_discounted_price +=
      (item.total_membership_discounted_price as number) || 0
    acc[category].items.push({
      type: ROW_TYPE.PRODUCT,
      ...(item as object),
    } as StatisticsProductRow)

    return acc
  }, {})

  return Object.values(grouped)
}

// ─────────────────────────────────────────────
// 상품 매출 조회
// 레거시: store/statistics/actions.js fetchAggregatedOrderMenus
// GET /v1/b/stores/{storeId}/aggregated-order-menus
// ─────────────────────────────────────────────
export async function fetchAggregatedOrderMenus(
  params: StatisticsParams,
): Promise<StatisticsCategoryRow[]> {
  const { storeId, ...restParams } = params
  const response = await axiosInstance.get<AggregatedOrderMenu[]>(
    `/v1/b/stores/${storeId}/aggregated-order-menus`,
    { params: restParams },
  )
  return transformAggregatedData(response.data, 'menu_category')
}

// ─────────────────────────────────────────────
// 상품 옵션 매출 조회
// 레거시: store/statistics/actions.js fetchAggregatedOrderMenuOptions
// GET /v1/b/stores/{storeId}/aggregated-order-menu-options
// ─────────────────────────────────────────────
export async function fetchAggregatedOrderMenuOptions(
  params: StatisticsParams,
): Promise<StatisticsCategoryRow[]> {
  const { storeId, ...restParams } = params
  const response = await axiosInstance.get<AggregatedOrderMenuOption[]>(
    `/v1/b/stores/${storeId}/aggregated-order-menu-options`,
    { params: restParams },
  )
  return transformAggregatedData(response.data, 'option_category')
}

// ─────────────────────────────────────────────
// 상품 매출 엑셀 데이터 조회
// 레거시: store/statistics/actions.js fetchAggregatedOrderMenusExcel
// GET /v1/b/stores/{storeId}/aggregated-order-menus-for-excel
// ─────────────────────────────────────────────
export async function fetchAggregatedOrderMenusExcelData(
  params: StatisticsParams,
): Promise<unknown[][]> {
  const { storeId, ...restParams } = params
  const response = await axiosInstance.get<unknown[][]>(
    `/v1/b/stores/${storeId}/aggregated-order-menus-for-excel`,
    { params: restParams, timeout: 60000 },
  )
  return response.data
}

// ─────────────────────────────────────────────
// 상품 옵션 매출 엑셀 데이터 조회
// 레거시: store/statistics/actions.js fetchAggregatedOrderMenuOptionsExcel
// GET /v1/b/stores/{storeId}/aggregated-order-menu-options-for-excel
// ─────────────────────────────────────────────
export async function fetchAggregatedOrderMenuOptionsExcelData(
  params: StatisticsParams,
): Promise<unknown[][]> {
  const { storeId, ...restParams } = params
  const response = await axiosInstance.get<unknown[][]>(
    `/v1/b/stores/${storeId}/aggregated-order-menu-options-for-excel`,
    { params: restParams, timeout: 60000 },
  )
  return response.data
}
