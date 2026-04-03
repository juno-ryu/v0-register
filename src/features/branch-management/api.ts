import { axiosInstance } from '@/lib/axios'
import type {
  BranchListParams,
  BranchListResponse,
  BranchDetail,
  OpeningHours,
  BranchGeneralInfoPayload,
  BranchAdministratorPayload,
  OpeningHoursPayload,
  StoreConfigPayload,
  UpsertTakeTypePayload,
  CreateBranchPayload,
  UpdateBranchBannerPayload,
  UpdateBranchModalPayload,
} from '@/features/branch-management/schema'

/** 운영사 매장 관리 API prefix */
const MANAGEMENT_STORES = '/v1/b/management/stores'

/**
 * 지점(매장) 목록 조회 (운영사 전용)
 * 레거시: store/stores/actions.ts fetchManagementStoreList
 * GET /v1/b/management/stores
 */
export async function fetchBranchList(params: BranchListParams): Promise<BranchListResponse> {
  const response = await axiosInstance.get<BranchListResponse>(MANAGEMENT_STORES, { params })
  return response.data
}

/**
 * 매장 생성
 * 레거시: store/stores/actions.ts createStore
 * POST /v1/b/management/stores
 */
export async function createBranch(payload: CreateBranchPayload): Promise<BranchDetail> {
  const response = await axiosInstance.post<BranchDetail>(MANAGEMENT_STORES, payload)
  return response.data
}

/**
 * 지점 상세 조회 (운영사 전용)
 * 레거시: store/stores/actions.ts fetchManagementStoreDetail
 * GET /v1/b/management/stores/:storeId
 */
export async function fetchBranchDetail(storeId: string): Promise<BranchDetail> {
  const response = await axiosInstance.get<BranchDetail>(`${MANAGEMENT_STORES}/${storeId}`)
  return response.data
}

/**
 * 영업시간 조회
 * 레거시: store/business-hours/actions.ts fetchOpeningHours
 * GET /stores/:storeId/opening-hours
 */
export async function fetchBranchOpeningHours(storeId: string): Promise<OpeningHours> {
  const response = await axiosInstance.get<OpeningHours>(`/stores/${storeId}/opening-hours`)
  return response.data
}

/**
 * 매장 일반정보 수정
 * 레거시: store/stores/actions.ts updateStoreGeneralInfo
 * PUT /v1/b/management/stores/:storeId/general-information
 */
export async function updateBranchGeneralInfo(
  storeId: string,
  payload: BranchGeneralInfoPayload,
): Promise<BranchDetail> {
  const response = await axiosInstance.put<BranchDetail>(
    `${MANAGEMENT_STORES}/${storeId}/general-information`,
    payload,
  )
  return response.data
}

/**
 * 로그인 계정 설정
 * 레거시: store/stores/actions.ts upsertStoreAdministrator
 * POST /v1/b/management/stores/:storeId/administrator
 */
export async function upsertBranchAdministrator(
  storeId: string,
  payload: BranchAdministratorPayload,
): Promise<void> {
  await axiosInstance.post(`${MANAGEMENT_STORES}/${storeId}/administrator`, payload)
}

/**
 * 영업시간 수정
 * 레거시: store/business-hours/actions.js putOpeningHours
 * PUT /stores/:storeId/opening-hours
 */
export async function updateBranchOpeningHours(
  storeId: string,
  payload: OpeningHoursPayload,
): Promise<OpeningHours> {
  const response = await axiosInstance.put<OpeningHours>(
    `/stores/${storeId}/opening-hours`,
    payload,
  )
  return response.data
}

/**
 * 매장 설정 수정 (포스/PG/KDS 통합)
 * 레거시: store/stores/actions.ts updateStoreConfig
 * PUT /v1/b/management/stores/:storeId/config
 */
export async function updateStoreConfig(
  storeId: string,
  payload: StoreConfigPayload,
): Promise<BranchDetail> {
  const response = await axiosInstance.put<BranchDetail>(
    `${MANAGEMENT_STORES}/${storeId}/config`,
    payload,
  )
  return response.data
}

/**
 * 주문 서비스 등록/수정
 * 레거시: store/stores/actions.ts upsertStoreTakeType
 * POST /v1/b/management/stores/:storeId/take-types
 */
export async function upsertStoreTakeType(
  storeId: string,
  payload: UpsertTakeTypePayload,
): Promise<void> {
  await axiosInstance.post(`${MANAGEMENT_STORES}/${storeId}/take-types`, payload)
}

/**
 * 주문 서비스 삭제
 * 레거시: store/stores/actions.ts deleteStoreTakeType
 * DELETE /v1/b/management/stores/:storeId/take-types
 */
export async function deleteStoreTakeType(
  storeId: string,
  takeType: number,
): Promise<void> {
  await axiosInstance.delete(`${MANAGEMENT_STORES}/${storeId}/take-types`, {
    data: { take_type: takeType },
  })
}

/**
 * 웹주문 배너 수정
 * PUT /v1/b/management/stores/:storeId/banner
 */
export async function updateBranchBanner(
  storeId: string,
  payload: UpdateBranchBannerPayload,
): Promise<void> {
  await axiosInstance.put(`${MANAGEMENT_STORES}/${storeId}/banner`, payload)
}

/**
 * 웹주문 팝업 모달 수정
 * PUT /v1/b/management/stores/:storeId/modal
 */
export async function updateBranchModal(
  storeId: string,
  payload: UpdateBranchModalPayload,
): Promise<void> {
  await axiosInstance.put(`${MANAGEMENT_STORES}/${storeId}/modal`, payload)
}

/**
 * 쿠폰 코드 중복 확인
 * 레거시: store/stores/actions.ts validateCouponCode
 * POST /v1/b/management/stores/coupon-code/validate
 */
export async function validateCouponCode(
  couponCode: string,
  storeId: string,
): Promise<{ is_valid: boolean; message?: string }> {
  const response = await axiosInstance.post<{ is_valid: boolean; message?: string }>(
    `${MANAGEMENT_STORES}/coupon-code/validate`,
    { coupon_code: couponCode, store_id: storeId },
  )
  return response.data
}
