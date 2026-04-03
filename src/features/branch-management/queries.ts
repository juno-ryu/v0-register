import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import {
  fetchBranchList,
  fetchBranchDetail,
  fetchBranchOpeningHours,
  updateBranchGeneralInfo,
  upsertBranchAdministrator,
  updateBranchOpeningHours,
  updateStoreConfig,
  upsertStoreTakeType,
  deleteStoreTakeType,
  validateCouponCode,
  createBranch,
  updateBranchBanner,
  updateBranchModal,
} from '@/features/branch-management/api'
import type {
  BranchListParams,
  BranchGeneralInfoPayload,
  BranchAdministratorPayload,
  OpeningHoursPayload,
  StoreConfigPayload,
  UpsertTakeTypePayload,
  CreateBranchPayload,
  UpdateBranchBannerPayload,
  UpdateBranchModalPayload,
} from '@/features/branch-management/schema'

export const branchesKeys = {
  all: ['branches'] as const,
  list: (params: BranchListParams) => [...branchesKeys.all, 'list', params] as const,
  detail: (storeId: string) => [...branchesKeys.all, 'detail', storeId] as const,
  openingHours: (storeId: string) => [...branchesKeys.all, 'opening-hours', storeId] as const,
}

export function getDefaultBranchListParams(): BranchListParams {
  return { page: 1, per_page: 20, order_by: 'name', order_direction: 'asc' }
}

export const branchListQueryOptions = (params: BranchListParams) =>
  queryOptions({
    queryKey: branchesKeys.list(params),
    queryFn: () => fetchBranchList(params),
  })

/**
 * 매장 생성
 * 레거시: store/stores/actions.ts createStore
 */
export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all })
    },
    onError: (error: unknown) => {
      console.error('매장 생성 실패:', error)
    },
  })
}

/**
 * 지점 목록 조회
 * 레거시: store/stores/actions.ts fetchManagementStoreList
 */
export function useBranchList(params: BranchListParams) {
  return useQuery(branchListQueryOptions(params))
}

/**
 * 지점 상세 조회
 * 레거시: store/stores/actions.ts fetchManagementStoreDetail
 */
export function useBranchDetail(storeId: string) {
  return useQuery({
    queryKey: branchesKeys.detail(storeId),
    queryFn: () => fetchBranchDetail(storeId),
    enabled: !!storeId,
  })
}

/**
 * 영업시간 조회
 * 레거시: store/business-hours/actions.ts fetchOpeningHours
 */
export function useBranchOpeningHours(storeId: string) {
  return useQuery({
    queryKey: branchesKeys.openingHours(storeId),
    queryFn: () => fetchBranchOpeningHours(storeId),
    enabled: !!storeId,
  })
}

/**
 * 매장 일반정보 수정
 * 레거시: store/stores/actions.ts updateStoreGeneralInfo
 */
export function useUpdateBranchGeneralInfo(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BranchGeneralInfoPayload) =>
      updateBranchGeneralInfo(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('매장 일반정보 수정 실패:', error)
    },
  })
}

/**
 * 로그인 계정 설정
 * 레거시: store/stores/actions.ts upsertStoreAdministrator
 */
export function useUpsertBranchAdministrator(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BranchAdministratorPayload) =>
      upsertBranchAdministrator(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('로그인 계정 설정 실패:', error)
    },
  })
}

/**
 * 영업시간 수정
 * 레거시: store/business-hours/actions.js putOpeningHours
 */
export function useUpdateBranchOpeningHours(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OpeningHoursPayload) =>
      updateBranchOpeningHours(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.openingHours(storeId) })
    },
    onError: (error: unknown) => {
      console.error('영업시간 수정 실패:', error)
    },
  })
}

/**
 * 매장 설정 수정 (포스/PG/KDS 통합)
 * 레거시: store/stores/actions.ts updateStoreConfig
 */
export function useUpdateStoreConfig(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreConfigPayload) => updateStoreConfig(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('매장 설정 수정 실패:', error)
    },
  })
}

/**
 * 주문 서비스 등록/수정
 * 레거시: store/stores/actions.ts upsertStoreTakeType
 */
export function useUpsertStoreTakeType(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertTakeTypePayload) => upsertStoreTakeType(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('주문 서비스 등록/수정 실패:', error)
    },
  })
}

/**
 * 주문 서비스 삭제
 * 레거시: store/stores/actions.ts deleteStoreTakeType
 */
export function useDeleteStoreTakeType(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (takeType: number) => deleteStoreTakeType(storeId, takeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('주문 서비스 삭제 실패:', error)
    },
  })
}

/**
 * 웹주문 배너 수정
 * PUT /v1/b/management/stores/:storeId/banner
 */
export function useUpdateBranchBanner(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBranchBannerPayload) =>
      updateBranchBanner(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('웹주문 배너 수정 실패:', error)
    },
  })
}

/**
 * 웹주문 팝업 모달 수정
 * PUT /v1/b/management/stores/:storeId/modal
 */
export function useUpdateBranchModal(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBranchModalPayload) =>
      updateBranchModal(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(storeId) })
    },
    onError: (error: unknown) => {
      console.error('웹주문 팝업 모달 수정 실패:', error)
    },
  })
}

/**
 * 쿠폰 코드 중복 확인
 * 레거시: store/stores/actions.ts validateCouponCode
 */
export function useValidateCouponCode() {
  return useMutation({
    mutationFn: ({ couponCode, storeId }: { couponCode: string; storeId: string }) =>
      validateCouponCode(couponCode, storeId),
  })
}
