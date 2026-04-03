import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import {
  fetchNormalCustomers,
  fetchNormalCustomersExcelDownload,
  fetchMembershipCustomers,
  fetchMembershipCustomerDetail,
  fetchMembershipCustomerDiscountPolicies,
  fetchCustomerCompanies,
  changeMembershipCustomerStatus,
  resetMembershipCustomerPassword,
  membershipCustomerBulkUpload,
  fetchMembershipSyncLogs,
  fetchMembershipCustomerSmilebizUserMediaInfo,
} from '@/features/customers/api'
import type { NormalCustomersParams, MembershipCustomersParams } from '@/features/customers/schema'

export const customersKeys = {
  all: ['customers'] as const,
  normalList: (params: NormalCustomersParams) =>
    [...customersKeys.all, 'normal', 'list', params] as const,
  membershipList: (params: MembershipCustomersParams) =>
    [...customersKeys.all, 'membership', 'list', params] as const,
  membershipDetail: (brandId: number, customerId: number) =>
    [
      ...customersKeys.all,
      'membership',
      'detail',
      brandId,
      customerId,
    ] as const,
  companies: (brandId: number) =>
    [...customersKeys.all, 'companies', brandId] as const,
  syncLogs: (brandId: string | number, params?: Record<string, unknown>) =>
    [...customersKeys.all, 'syncLogs', brandId, params] as const,
}

// ─────────────────────────────────────────────
// 일반 고객
// ─────────────────────────────────────────────

export const normalCustomersQueryOptions = (params: NormalCustomersParams) =>
  queryOptions({
    queryKey: customersKeys.normalList(params),
    queryFn: () => fetchNormalCustomers(params),
    enabled: !!params.brandId,
  })

export function useNormalCustomers(params: NormalCustomersParams) {
  return useQuery(normalCustomersQueryOptions(params))
}

export function useNormalCustomersExcelDownload() {
  return useMutation({
    mutationFn: (params: NormalCustomersParams) =>
      fetchNormalCustomersExcelDownload(params),
  })
}

// ─────────────────────────────────────────────
// 멤버십 고객
// ─────────────────────────────────────────────

export const membershipCustomersQueryOptions = (params: MembershipCustomersParams) =>
  queryOptions({
    queryKey: customersKeys.membershipList(params),
    queryFn: () => fetchMembershipCustomers(params),
    enabled: !!params.brandId,
  })

export function useMembershipCustomers(params: MembershipCustomersParams) {
  return useQuery(membershipCustomersQueryOptions(params))
}

export function useMembershipCustomerDetail(
  brandId: string | number,
  customerId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: customersKeys.membershipDetail(Number(brandId) || 0, customerId ?? 0),
    queryFn: () => fetchMembershipCustomerDetail(brandId as number, customerId!),
    enabled: options?.enabled !== false && !!brandId && !!customerId,
  })
}


export function useMembershipCustomerDiscountPolicies(
  brandId: string | number,
  customerId: number | null,
) {
  return useQuery({
    queryKey: [...customersKeys.all, 'discountPolicies', brandId, customerId] as const,
    queryFn: () => fetchMembershipCustomerDiscountPolicies(brandId as number, customerId!),
    enabled: !!brandId && !!customerId,
  })
}

export function useCustomerCompanies(brandId: string | number) {
  return useQuery({
    queryKey: customersKeys.companies(Number(brandId)),
    queryFn: () => fetchCustomerCompanies(brandId as number),
    enabled: !!brandId,
  })
}

export function useChangeMembershipCustomerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      brandId,
      customerId,
      status,
    }: {
      brandId: number
      customerId: number
      status: string
    }) => changeMembershipCustomerStatus(brandId, customerId, status),
    onSuccess: (_, { brandId }) => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: [...customersKeys.all, 'membership'],
      })
      queryClient.invalidateQueries({
        queryKey: [...customersKeys.all, 'normal'],
      })
      // 해당 브랜드 쿼리 전체 갱신
      queryClient.invalidateQueries({
        queryKey: customersKeys.companies(brandId),
      })
    },
    onError: (error: unknown) => {
      console.error('멤버십 고객 상태 변경 실패:', error)
    },
  })
}

export function useResetMembershipCustomerPassword() {
  return useMutation({
    mutationFn: ({
      brandId,
      customerId,
    }: {
      brandId: number
      customerId: number
    }) => resetMembershipCustomerPassword(brandId, customerId),
  })
}

export function useMembershipCustomerBulkUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      brandId,
      storeId,
      data,
    }: {
      brandId: string | number
      storeId: string | number
      data: { total_data_count: number; data: unknown[][] }
    }) => membershipCustomerBulkUpload(brandId, storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...customersKeys.all, 'membership'],
      })
    },
    onError: (error: unknown) => {
      console.error('멤버십 고객 일괄 업로드 실패:', error)
    },
  })
}

export function useMembershipCustomerSmilebizUserMediaInfo(params: {
  brandId: string | number
  storeId: number | null
  customerId: number | null
  enabled?: boolean
}) {
  const { brandId, storeId, customerId, enabled = true } = params
  return useQuery({
    queryKey: [
      ...customersKeys.all,
      'smilebizMediaInfo',
      brandId,
      storeId,
      customerId,
    ] as const,
    queryFn: () =>
      fetchMembershipCustomerSmilebizUserMediaInfo({
        brandId,
        storeId: storeId!,
        customerId: customerId!,
      }),
    enabled: enabled && !!brandId && !!storeId && !!customerId,
  })
}

export function useMembershipSyncLogs(
  brandId: string | number,
  params?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: customersKeys.syncLogs(brandId, params),
    queryFn: () => fetchMembershipSyncLogs(brandId, params),
    enabled: !!brandId,
  })
}
