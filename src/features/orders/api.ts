import { axiosInstance } from '@/lib/axios'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderDetail,
  OrderMenuOptionsResponse,
  CancelOrderParams,
} from '@/features/orders/schema'

const ORDERS_PREFIX = '/v1/b/orders'

/**
 * 배열/단일값을 API 파라미터용 문자열로 직렬화
 * 레거시 paramsSerializer 포팅
 */
function serializeParam(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value)) return value.join(',')
  return String(value)
}

/**
 * 주문 목록 조회
 * 레거시: store/orders/actions.js fetchOrdersList
 * GET /v1/b/orders/dates-range/{startDate}/{endDate}
 */
export async function fetchOrdersList(params: OrdersListParams): Promise<OrdersListResponse> {
  const {
    startDate,
    endDate,
    page,
    per_page,
    orderSn,
    employeeNumber,
    takeTypeIn,
    orderChannelIn,
    storeIdIn,
    brandIdIn,
    statusIn,
  } = params

  const queryParams: Record<string, string | number | undefined> = {
    page,
    per_page,
    ...(orderSn && { order_sn: orderSn }),
    ...(employeeNumber && { employee_number: employeeNumber }),
    ...(brandIdIn && { brand_id__in: serializeParam(brandIdIn) }),
    ...(statusIn && { status__in: serializeParam(statusIn) }),
    ...(takeTypeIn && { take_type__in: serializeParam(takeTypeIn) }),
    ...(orderChannelIn && { order_channel__in: serializeParam(orderChannelIn) }),
    ...(storeIdIn && { store_id__in: serializeParam(storeIdIn) }),
  }

  const { data } = await axiosInstance.get<{
    count: number
    results: Record<string, unknown>[]
    total_sales_amount?: number
  }>(`${ORDERS_PREFIX}/dates-range/${startDate}/${endDate}`, {
    params: queryParams,
  })

  // snake_case → camelCase 변환 (레거시 flattenOrdersList 역할)
  const results = (data.results ?? []).map((order) => ({
    id: order.id as string,
    sn: order.sn as string,
    storeName: order.store_name as string | null,
    brandName: order.brand_name as string | null,
    menuTitle: order.menu_title as string | null,
    paidDt: order.paid_dt as string | null,
    takeType: order.take_type as number | null,
    status: order.status as number,
    orderChannel: order.order_channel as string | null,
    totalBareAmount: (order.total_bare_amount as number) ?? 0,
    totalDiscountAmount: (order.total_discount_amount as number) ?? 0,
    requestAmount: (order.request_amount as number) ?? 0,
    employeeNumber: order.employee_number as string | null,
    ordererInfo: order.orderer_info
      ? { tableName: (order.orderer_info as Record<string, unknown>).table_name as string | null }
      : null,
  }))

  return {
    count: data.count ?? 0,
    results,
    totalSalesAmount: data.total_sales_amount,
  }
}

/**
 * 주문 상세 조회
 * GET /v1/b/orders/{id}
 */
export async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const { data } = await axiosInstance.get<OrderDetail>(`${ORDERS_PREFIX}/${id}`, {
    params: { order_id: id },
  })
  return data
}

/**
 * 주문 메뉴 옵션 조회
 * GET /v1/b/orders/{id}/order-menu-options
 */
export async function fetchOrderMenuOptions(id: string): Promise<OrderMenuOptionsResponse> {
  const { data } = await axiosInstance.get<OrderMenuOptionsResponse>(
    `${ORDERS_PREFIX}/${id}/order-menu-options`,
    { params: { order_id: id } },
  )
  return data
}

/**
 * 주문 엑셀 다운로드
 * GET /v1/b/orders/dates-range/{startDate}/{endDate}/excel
 */
export async function fetchOrdersExcelData(
  params: OrdersListParams,
): Promise<{ data: unknown[][]; startDate: string; endDate: string }> {
  const {
    startDate, endDate, orderSn, employeeNumber,
    takeTypeIn, orderChannelIn, storeIdIn, brandIdIn, statusIn,
  } = params

  const queryParams: Record<string, string | undefined> = {
    ...(orderSn && { order_sn: orderSn }),
    ...(employeeNumber && { employee_number: employeeNumber }),
    ...(brandIdIn && { brand_id__in: serializeParam(brandIdIn) }),
    ...(statusIn && { status__in: serializeParam(statusIn) }),
    ...(takeTypeIn && { take_type__in: serializeParam(takeTypeIn) }),
    ...(orderChannelIn && { order_channel__in: serializeParam(orderChannelIn) }),
    ...(storeIdIn && { store_id__in: serializeParam(storeIdIn) }),
  }

  const { data } = await axiosInstance.get<unknown[][]>(
    `${ORDERS_PREFIX}/dates-range/${startDate}/${endDate}/excel`,
    { params: queryParams },
  )
  return { data, startDate, endDate }
}

/**
 * 주문 취소
 * POST /v1/b/orders/{id}/cancel
 */
export async function cancelOrder(params: CancelOrderParams): Promise<void> {
  const { id, cancelType, cancelReason } = params
  await axiosInstance.post(`${ORDERS_PREFIX}/${id}/cancel`, {
    cancel_type: cancelType,
    cancel_reason: cancelReason,
  })
}
