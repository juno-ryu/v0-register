import { axiosInstance } from '@/lib/axios'
import type {
  CouponListParams,
  CouponListResponse,
  CouponDetail,
  CouponForm,
  IssuedCouponListParams,
  IssuedCouponListResponse,
  IssuableInformation,
  IssueResult,
  PresetMessage,
  SendableUsersInfo,
} from '@/features/benefit-management/schema'

// 레거시 확인: /backoffice/coupons (v1/b prefix 없음)
const COUPONS_PREFIX = '/backoffice/coupons'
// issuable-information, issue-to-all-eligible-users는 /v1/b/coupons 사용 (BUG-D08)
const V1_B_COUPONS_PREFIX = '/v1/b/coupons'
const BRANDS_PREFIX = '/v1/b/brands'
const USERS_COUPONS_PREFIX = '/backoffice/users/coupons'

/**
 * 쿠폰 목록 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.coupons
 * GET /v1/b/backoffice/coupons
 */
export async function fetchCoupons(params: CouponListParams): Promise<CouponListResponse> {
  const response = await axiosInstance.get<CouponListResponse>(COUPONS_PREFIX, { params })
  return response.data
}

/**
 * 쿠폰 상세 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.couponDetail
 * GET /v1/b/backoffice/coupons/{couponId}
 */
export async function fetchCouponDetail(couponId: number): Promise<CouponDetail> {
  const response = await axiosInstance.get<CouponDetail>(`${COUPONS_PREFIX}/${couponId}`)
  return response.data
}

/**
 * 쿠폰 생성
 * 레거시: api/modules/coupon.ts couponEndpoints.coupons (POST)
 * POST /v1/b/backoffice/coupons
 */
export async function createCoupon(payload: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'>): Promise<CouponDetail> {
  const response = await axiosInstance.post<CouponDetail>(COUPONS_PREFIX, payload)
  return response.data
}

/**
 * 쿠폰 수정
 * 레거시: api/modules/coupon.ts couponEndpoints.couponDetail (PUT)
 * PUT /v1/b/backoffice/coupons/{couponId}
 */
export async function updateCoupon(
  couponId: number,
  payload: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'> & { issuable_quantity: number },
): Promise<CouponDetail> {
  const response = await axiosInstance.put<CouponDetail>(`${COUPONS_PREFIX}/${couponId}`, payload)
  return response.data
}

/**
 * 발행 내역(발급된 쿠폰) 목록 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.couponIssuanceHistory
 * GET /v1/b/backoffice/users/coupons/{startDate}/{endDate}
 */
export async function fetchIssuedCoupons(
  params: IssuedCouponListParams,
): Promise<IssuedCouponListResponse> {
  const { startDate, endDate, ...rest } = params
  const response = await axiosInstance.get<IssuedCouponListResponse>(
    `${USERS_COUPONS_PREFIX}/${startDate}/${endDate}`,
    { params: rest },
  )
  return response.data
}

/**
 * 발급 가능 정보 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.issuableInformation
 * GET /v1/b/backoffice/coupons/{couponId}/issuable-information
 */
export async function fetchIssuableInformation(couponId: number): Promise<IssuableInformation> {
  const response = await axiosInstance.get<IssuableInformation>(
    `${V1_B_COUPONS_PREFIX}/${couponId}/issuable-information`,
  )
  return response.data
}

/**
 * 전체 대상 사용자에게 쿠폰 발급
 * 레거시: api/modules/coupon.ts couponEndpoints.issueToAllEligibleUsers
 * POST /v1/b/backoffice/coupons/{couponId}/issue-to-all-eligible-users
 */
export async function issueToAllEligibleUsers(couponId: number): Promise<IssueResult> {
  const response = await axiosInstance.post<IssueResult>(
    `${V1_B_COUPONS_PREFIX}/${couponId}/issue-to-all-eligible-users`,
  )
  return response.data
}

/**
 * 프리셋 메시지 목록 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.presetMessages
 * GET /v1/b/backoffice/brands/{brandId}/coupons/preset-messages
 */
export async function fetchPresetMessages(brandId: number | string): Promise<PresetMessage[]> {
  const response = await axiosInstance.get<PresetMessage[]>(
    `${BRANDS_PREFIX}/${brandId}/coupons/preset-messages`,
  )
  return response.data
}

/**
 * 전송 가능 사용자 정보 조회
 * 레거시: api/modules/coupon.ts couponEndpoints.sendableUsers
 * GET /v1/b/backoffice/brands/{brandId}/coupons/{couponId}/preset-messages/send-infos
 */
export async function fetchSendableUsers(
  brandId: number | string,
  couponId: number | string,
  issuedSession?: string,
): Promise<SendableUsersInfo> {
  const params = issuedSession ? { issued_session: issuedSession } : undefined
  const response = await axiosInstance.get<SendableUsersInfo>(
    `${BRANDS_PREFIX}/${brandId}/coupons/${couponId}/preset-messages/send-infos`,
    { params },
  )
  return response.data
}

/**
 * 프리셋 메시지 발송
 * 레거시: api/modules/coupon.ts couponEndpoints.sendPresetMessage
 * POST /v1/b/backoffice/brands/{brandId}/coupons/{couponId}/preset-messages/send
 */
export async function sendPresetMessage(
  brandId: number | string,
  couponId: number | string,
  presetMessageId: number,
  issuedSession?: string,
): Promise<void> {
  const params = issuedSession ? `?issued_session=${issuedSession}` : ''
  await axiosInstance.post(
    `${BRANDS_PREFIX}/${brandId}/coupons/${couponId}/preset-messages/send${params}`,
    { preset_message_id: presetMessageId },
  )
}

/**
 * 테스트 프리셋 메시지 발송
 * 레거시: api/modules/coupon.ts couponEndpoints.sendTestPresetMessage
 * POST /v1/b/backoffice/brands/{brandId}/coupons/{couponId}/test-preset-messages/send
 */
export async function sendTestPresetMessage(
  brandId: number | string,
  couponId: number | string,
  presetMessageId: number,
  testPhoneNumber: string,
): Promise<void> {
  await axiosInstance.post(
    `${BRANDS_PREFIX}/${brandId}/coupons/${couponId}/test-preset-messages/send`,
    { preset_message_id: presetMessageId, test_phone_number: testPhoneNumber },
  )
}
