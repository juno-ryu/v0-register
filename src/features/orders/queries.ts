import { sub, format } from 'date-fns'
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { fetchOrdersList, fetchOrderDetail, fetchOrderMenuOptions, cancelOrder } from '@/features/orders/api'
import type { OrdersListParams, CancelOrderParams } from '@/features/orders/schema'

// 기본 조회 파라미터 — 최근 7일 (레거시 동일)
export function getDefaultOrdersParams(): OrdersListParams {
  const today = new Date()
  return {
    startDate: format(sub(today, { days: 6 }), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    page: 1,
    per_page: 20,
  }
}

export const ordersKeys = {
  all: ['orders'] as const,
  list: (params: OrdersListParams) => [...ordersKeys.all, 'list', params] as const,
  detail: (id: string) => [...ordersKeys.all, 'detail', id] as const,
  menuOptions: (id: string) => [...ordersKeys.all, 'menuOptions', id] as const,
}

export const ordersListQueryOptions = (params: OrdersListParams) =>
  queryOptions({
    queryKey: ordersKeys.list(params),
    queryFn: () => fetchOrdersList(params),
  })

export function useOrdersList(params: OrdersListParams) {
  return useQuery(ordersListQueryOptions(params))
}

export function useOrderDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => fetchOrderDetail(id),
    enabled: options?.enabled !== false && !!id,
  })
}

export function useOrderMenuOptions(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ordersKeys.menuOptions(id),
    queryFn: () => fetchOrderMenuOptions(id),
    enabled: options?.enabled !== false && !!id,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CancelOrderParams) => cancelOrder(params),
    onSuccess: (_, { id }) => {
      // 상세 쿼리 무효화 → 목록도 갱신
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error: unknown) => {
      console.error('주문 취소 실패:', error)
    },
  })
}
