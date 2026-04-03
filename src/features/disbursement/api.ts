import { axiosInstance } from '@/lib/axios'
import type {
  DisbursementSetsParams,
  DisbursementSetsResponse,
  TransactionListParams,
  TransactionListResponse,
  DisbursementSetSummary,
} from '@/features/disbursement/schema'
import { MENU_TYPE } from '@/features/disbursement/schema'

// 레거시: api/modules/disbursement.ts
// /operator-customer-company-disbursement-sets
// /meal/operator-customer-company-disbursements/excel (급식 엑셀)
// /operator-customer-company-disbursements/excel (식음료 엑셀)

/**
 * 지급 세트 목록 조회
 * 레거시: store/disbursement actions fetchDisbursementSets
 */
export async function fetchDisbursementSets(
  params: DisbursementSetsParams,
): Promise<DisbursementSetsResponse> {
  const response = await axiosInstance.get<DisbursementSetsResponse>(
    '/v1/b/operator-customer-company-disbursement-sets',
    { params },
  )
  return response.data
}

/**
 * 식음료 지급 엑셀 데이터 조회
 * 레거시: fetchDisbursementsExcel — JSON 2차원 배열 반환
 */
export async function fetchDisbursementExcelData(params: {
  disbursement_period_start: string
  disbursement_period_end: string
}): Promise<unknown[][]> {
  const { data } = await axiosInstance.get<unknown[][]>(
    '/v1/b/operator-customer-company-disbursements/excel',
    { params, timeout: 60000 },
  )
  return data
}

/**
 * 급식 지급 엑셀 데이터 조회
 * 레거시: fetchDisbursementsExcelForMeal — JSON 2차원 배열 반환
 */
export async function fetchDisbursementExcelDataForMeal(params: {
  disbursement_period_start: string
  disbursement_period_end: string
}): Promise<unknown[][]> {
  const { data } = await axiosInstance.get<unknown[][]>(
    '/v1/b/meal/operator-customer-company-disbursements/excel',
    { params, timeout: 60000 },
  )
  return data
}

/**
 * 식음료 거래 내역 목록 조회
 * 레거시: fetchDisbursementsDetail
 */
export async function fetchTransactions(
  params: TransactionListParams,
): Promise<TransactionListResponse> {
  const { data } = await axiosInstance.get<TransactionListResponse>(
    '/v1/b/operator-customer-company-disbursements',
    { params },
  )
  return data
}

/**
 * 급식 거래 내역 목록 조회
 * 레거시: fetchDisbursementsDetailForMeal
 */
export async function fetchTransactionsForMeal(
  params: TransactionListParams,
): Promise<TransactionListResponse> {
  const { data } = await axiosInstance.get<TransactionListResponse>(
    '/v1/b/meal/operator-customer-company-disbursements',
    { params },
  )
  return data
}

/**
 * menuType에 따라 올바른 거래 목록 조회 함수 호출
 */
export async function fetchTransactionsByMenuType(
  menuType: string,
  params: TransactionListParams,
): Promise<TransactionListResponse> {
  if (menuType === MENU_TYPE.MEAL) {
    return fetchTransactionsForMeal(params)
  }
  return fetchTransactions(params)
}

/**
 * 지급 세트 요약 조회 (거래 내역 상단 요약 바)
 * 레거시: fetchDisbursementSetsSummary
 */
export async function fetchDisbursementSetSummary(
  setId: number,
): Promise<DisbursementSetSummary> {
  const { data } = await axiosInstance.get<DisbursementSetSummary>(
    `/v1/b/operator-customer-company-disbursement-sets/${setId}`,
  )
  return data
}

/**
 * 거래 내역 엑셀 데이터 조회 (식음료)
 * 레거시: fetchDisbursementsExcel — JSON 2차원 배열 반환
 */
export async function fetchTransactionExcelData(params: {
  operator_customer_company_disbursement_set: number
}): Promise<unknown[][]> {
  const { data } = await axiosInstance.get<unknown[][]>(
    '/v1/b/operator-customer-company-disbursements/excel',
    { params, timeout: 60000 },
  )
  return data
}

/**
 * 거래 내역 엑셀 데이터 조회 (급식)
 * 레거시: fetchDisbursementsExcelForMeal — JSON 2차원 배열 반환
 */
export async function fetchTransactionExcelDataForMeal(params: {
  operator_customer_company_disbursement_set: number
}): Promise<unknown[][]> {
  const { data } = await axiosInstance.get<unknown[][]>(
    '/v1/b/meal/operator-customer-company-disbursements/excel',
    { params, timeout: 60000 },
  )
  return data
}

/**
 * menuType에 따라 올바른 엑셀 데이터 조회 함수 호출
 */
export async function fetchDisbursementExcelDataByMenuType(
  menuType: string,
  params: { disbursement_period_start: string; disbursement_period_end: string },
): Promise<unknown[][]> {
  if (menuType === MENU_TYPE.MEAL) {
    return fetchDisbursementExcelDataForMeal(params)
  }
  return fetchDisbursementExcelData(params)
}

/**
 * 급식 거래취소
 * 레거시: store/disbursement actions refundDisbursement
 * PATCH /v1/b/meal/operator-customer-company-disbursements/{id}/refund
 */
export async function cancelMealTransaction(disbursementId: number): Promise<void> {
  await axiosInstance.patch(
    `/v1/b/meal/operator-customer-company-disbursements/${disbursementId}/refund`,
  )
}
