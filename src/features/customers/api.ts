import { axiosInstance } from '@/lib/axios'
import type {
  NormalCustomersParams,
  NormalCustomersResponse,
  MembershipCustomersParams,
  MembershipCustomersResponse,
  CustomerCompany,
  MembershipCustomerDetail,
  DiscountPolicyItem,
} from '@/features/customers/schema'

const BRANDS_PREFIX = '/v1/b/brands'
const CUSTOMER_COMPANIES_PREFIX = '/v1/b/customer-companies'

/**
 * 일반 고객 목록 조회
 * 레거시: store/customers/actions.js fetchNormalCustomers
 * GET /v1/b/brands/{brandId}/normal-customers
 */
export async function fetchNormalCustomers(
  params: NormalCustomersParams,
): Promise<NormalCustomersResponse> {
  const { brandId, ...rest } = params
  const response = await axiosInstance.get<NormalCustomersResponse>(
    `${BRANDS_PREFIX}/${brandId}/normal-customers`,
    { params: rest },
  )
  return response.data
}

/**
 * 일반 고객 엑셀 다운로드
 * 레거시: store/customers/actions.js fetchNormalCustomersExcelDownload
 * GET /v1/b/brands/{brandId}/normal-customers-excel-download
 */
export async function fetchNormalCustomersExcelDownload(
  params: NormalCustomersParams,
): Promise<unknown> {
  const { brandId, ...rest } = params
  const response = await axiosInstance.get(
    `${BRANDS_PREFIX}/${brandId}/normal-customers-excel-download`,
    { params: rest },
  )
  return response.data
}

/**
 * 멤버십 고객 목록 조회
 * 레거시: store/customers/actions.js fetchMembershipCustomers
 * GET /v1/b/brands/{brandId}/membership-customers
 */
export async function fetchMembershipCustomers(
  params: MembershipCustomersParams,
): Promise<MembershipCustomersResponse> {
  const { brandId, ...rest } = params
  const response = await axiosInstance.get<MembershipCustomersResponse>(
    `${BRANDS_PREFIX}/${brandId}/membership-customers`,
    { params: rest },
  )
  return response.data
}

/**
 * 멤버십 고객 상세 조회
 * 레거시: store/customers/actions.js fetchMembershipCustomerDetail
 * GET /v1/b/brands/{brandId}/membership-customers/{customerId}
 */
export async function fetchMembershipCustomerDetail(
  brandId: string | number,
  customerId: number,
): Promise<MembershipCustomerDetail> {
  const response = await axiosInstance.get<MembershipCustomerDetail>(
    `${BRANDS_PREFIX}/${brandId}/membership-customers/${customerId}`,
  )
  return response.data
}


/**
 * 멤버십 고객 할인 정책 조회
 * 레거시: store/customers/actions.js fetchMembershipCustomerDiscountPolicies
 * GET /v1/b/brands/{brandId}/membership-customers/{customerId}/discount-policies
 */
export async function fetchMembershipCustomerDiscountPolicies(
  brandId: string | number,
  customerId: number,
): Promise<DiscountPolicyItem[]> {
  const response = await axiosInstance.get<DiscountPolicyItem[]>(
    `${BRANDS_PREFIX}/${brandId}/membership-customers/${customerId}/discount-policies`,
  )
  return response.data
}

/**
 * 고객사(소속) 목록 조회
 * 레거시: store/customers/actions.js fetchMembershipCustomerCompanies
 * GET /v1/b/brands/{brandId}/customer-companies
 */
export async function fetchCustomerCompanies(
  brandId: number,
): Promise<CustomerCompany[]> {
  const response = await axiosInstance.get<CustomerCompany[]>(
    `${BRANDS_PREFIX}/${brandId}/customer-companies`,
  )
  return response.data
}

/**
 * 멤버십 고객 상태 변경 (삭제 포함)
 * 레거시: store/customers/actions.js changeMembershipCustomerStatus
 * PATCH /v1/b/brands/{brandId}/membership-customers/{customerId}/status
 */
export async function changeMembershipCustomerStatus(
  brandId: number,
  customerId: number,
  status: string,
): Promise<void> {
  await axiosInstance.patch(
    `${BRANDS_PREFIX}/${brandId}/membership-customers/${customerId}/status`,
    { status },
  )
}

/**
 * 멤버십 고객 비밀번호 초기화
 * 레거시: store/customers/actions.js resetMembershipCustomerPassword
 * POST /v1/b/brands/{brandId}/membership-customers/{customerId}/password/reset
 */
export async function resetMembershipCustomerPassword(
  brandId: number,
  customerId: number,
): Promise<void> {
  await axiosInstance.post(
    `${BRANDS_PREFIX}/${brandId}/membership-customers/${customerId}/password/reset`,
  )
}

/**
 * 멤버십 고객 일괄 업로드
 * 레거시: store/customers/actions.js membershipCustomerBulkUpload
 * POST /v1/b/brands/{brandId}/membership-customer-bulk-upload?store_id={storeId}
 */
export async function membershipCustomerBulkUpload(
  brandId: string | number,
  storeId: string | number,
  data: { total_data_count: number; data: unknown[][] },
): Promise<unknown> {
  const response = await axiosInstance.post(
    `${BRANDS_PREFIX}/${brandId}/membership-customer-bulk-upload?store_id=${storeId}`,
    data,
  )
  return response.data
}

/**
 * 멤버십 고객 스마일비즈 미디어 정보 조회
 * 레거시: store/customers/actions.js fetchMembershipCustomerSmilebizUserMediaInfo
 * GET /v1/b/brands/{brandId}/stores/{storeId}/membership-customers/{customerId}/smilebiz-user-media-info
 */
export async function fetchMembershipCustomerSmilebizUserMediaInfo(params: {
  brandId: string | number
  storeId: number
  customerId: number
}): Promise<{ medi_val?: string | null; member_card_number?: string | null }> {
  const { brandId, storeId, customerId } = params
  const response = await axiosInstance.get(
    `${BRANDS_PREFIX}/${brandId}/stores/${storeId}/membership-customers/${customerId}/smilebiz-user-media-info`,
  )
  return response.data
}

/**
 * 멤버십 고객 스마일비즈 미디어 정보 동기화
 * 레거시: store/customers/actions.js updateMembershipCustomerSmilebizUserMediaInfo
 * PUT /v1/b/brands/{brandId}/stores/{storeId}/membership-customers/{customerId}/smilebiz-user-media-info
 */
export async function updateMembershipCustomerSmilebizUserMediaInfo(params: {
  brandId: string | number
  storeId: number
  customerId: number
  mediVal: string
}): Promise<{ code: string; medi_val_new?: string | null; occupied_medi_val_member_info?: Record<string, unknown> }> {
  const { brandId, storeId, customerId, mediVal } = params
  const response = await axiosInstance.put(
    `${BRANDS_PREFIX}/${brandId}/stores/${storeId}/membership-customers/${customerId}/smilebiz-user-media-info`,
    { medi_val: mediVal },
  )
  return response.data
}

/**
 * 멤버십 동기화 로그 조회
 * 레거시: store/customers/actions.js fetchMembershipSyncLogs
 * GET /v1/b/brands/{brandId}/membership-sync-logs
 */
export async function fetchMembershipSyncLogs(
  brandId: string | number,
  params?: Record<string, unknown>,
): Promise<{ results: unknown[]; count: number }> {
  const response = await axiosInstance.get(
    `${BRANDS_PREFIX}/${brandId}/membership-sync-logs`,
    { params },
  )
  return response.data
}

// CUSTOMER_COMPANIES_PREFIX 사용 참조 (미래 확장용)
export { CUSTOMER_COMPANIES_PREFIX }
