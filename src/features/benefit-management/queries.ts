import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCoupons,
  fetchCouponDetail,
  createCoupon,
  updateCoupon,
  fetchIssuedCoupons,
  fetchIssuableInformation,
  issueToAllEligibleUsers,
  fetchPresetMessages,
  fetchSendableUsers,
  sendPresetMessage,
  sendTestPresetMessage,
} from '@/features/benefit-management/api'
import type { CouponListParams, CouponForm, IssuedCouponListParams, IssueResult } from '@/features/benefit-management/schema'

export const benefitKeys = {
  all: ['benefits'] as const,
  coupons: () => [...benefitKeys.all, 'coupons'] as const,
  couponList: (params: CouponListParams) => [...benefitKeys.coupons(), 'list', params] as const,
  couponDetail: (couponId: number) => [...benefitKeys.coupons(), 'detail', couponId] as const,
  issuedCoupons: () => [...benefitKeys.all, 'issued-coupons'] as const,
  issuedCouponList: (params: IssuedCouponListParams) =>
    [...benefitKeys.issuedCoupons(), 'list', params] as const,
  issuableInfo: (couponId: number) =>
    [...benefitKeys.coupons(), 'issuable-info', couponId] as const,
  presetMessages: (brandId: number | string) =>
    [...benefitKeys.all, 'preset-messages', brandId] as const,
  sendableUsers: (brandId: number | string, couponId: number | string, issuedSession?: string) =>
    [...benefitKeys.all, 'sendable-users', brandId, couponId, issuedSession] as const,
}

/**
 * 쿠폰 목록 조회
 * 레거시: store/coupon/actions.ts fetchBrandCoupons
 */
export function useCoupons(params: CouponListParams) {
  return useQuery({
    queryKey: benefitKeys.couponList(params),
    queryFn: () => fetchCoupons(params),
  })
}

/**
 * 쿠폰 상세 조회
 * 레거시: store/coupon/actions.ts fetchCouponDetail
 */
export function useCouponDetail(couponId: number | null) {
  return useQuery({
    queryKey: benefitKeys.couponDetail(couponId!),
    queryFn: () => fetchCouponDetail(couponId!),
    enabled: couponId != null,
  })
}

/**
 * 쿠폰 생성
 * 레거시: store/coupon/actions.ts createCoupon
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'>) =>
      createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.coupons() })
    },
    onError: (error: unknown) => {
      console.error('쿠폰 생성 실패:', error)
    },
  })
}

/**
 * 쿠폰 수정
 * 레거시: store/coupon/actions.ts updateCoupon
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      couponId,
      payload,
    }: {
      couponId: number
      payload: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'> & {
        issuable_quantity: number
      }
    }) => updateCoupon(couponId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.coupons() })
    },
    onError: (error: unknown) => {
      console.error('쿠폰 수정 실패:', error)
    },
  })
}

/**
 * 발행 내역(발급된 쿠폰) 목록 조회
 * 레거시: store/coupon/actions.ts fetchIssuedCoupons
 */
export function useIssuedCoupons(params: IssuedCouponListParams) {
  return useQuery({
    queryKey: benefitKeys.issuedCouponList(params),
    queryFn: () => fetchIssuedCoupons(params),
    enabled: !!params.startDate && !!params.endDate,
  })
}

/**
 * 발급 가능 정보 조회
 * 레거시: store/coupon/actions.ts fetchIssuableInformation
 */
export function useIssuableInformation(couponId: number | null) {
  return useQuery({
    queryKey: benefitKeys.issuableInfo(couponId!),
    queryFn: () => fetchIssuableInformation(couponId!),
    enabled: couponId != null,
  })
}

/**
 * 전체 대상 사용자에게 쿠폰 발급
 * 레거시: store/coupon/actions.ts issueToAllEligibleUsers
 */
export function useIssueToAllEligibleUsers() {
  const queryClient = useQueryClient()
  return useMutation<IssueResult, Error, number>({
    mutationFn: (couponId: number) => issueToAllEligibleUsers(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.coupons() })
    },
    onError: (error: unknown) => {
      console.error('쿠폰 전체 발급 실패:', error)
    },
  })
}

/**
 * 프리셋 메시지 목록 조회
 * 레거시: store/coupon/actions.ts fetchPresetMessages
 */
export function usePresetMessages(brandId: number | string | null) {
  return useQuery({
    queryKey: benefitKeys.presetMessages(brandId!),
    queryFn: () => fetchPresetMessages(brandId!),
    enabled: brandId != null,
  })
}

/**
 * 전송 가능 사용자 정보 조회
 * 레거시: store/coupon/actions.ts fetchSendableUsers
 */
export function useSendableUsers(
  brandId: number | string | null,
  couponId: number | string | null,
  issuedSession?: string,
) {
  return useQuery({
    queryKey: benefitKeys.sendableUsers(brandId!, couponId!, issuedSession),
    queryFn: () => fetchSendableUsers(brandId!, couponId!, issuedSession),
    enabled: brandId != null && couponId != null,
  })
}

/**
 * 프리셋 메시지 발송
 * 레거시: store/coupon/actions.ts sendPresetMessage
 */
export function useSendPresetMessage() {
  return useMutation({
    mutationFn: ({
      brandId,
      couponId,
      presetMessageId,
      issuedSession,
    }: {
      brandId: number | string
      couponId: number | string
      presetMessageId: number
      issuedSession?: string
    }) => sendPresetMessage(brandId, couponId, presetMessageId, issuedSession),
  })
}

/**
 * 테스트 프리셋 메시지 발송
 * 레거시: store/coupon/actions.ts sendTestPresetMessage
 */
export function useSendTestPresetMessage() {
  return useMutation({
    mutationFn: ({
      brandId,
      couponId,
      presetMessageId,
      testPhoneNumber,
    }: {
      brandId: number | string
      couponId: number | string
      presetMessageId: number
      testPhoneNumber: string
    }) => sendTestPresetMessage(brandId, couponId, presetMessageId, testPhoneNumber),
  })
}
