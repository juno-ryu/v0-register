import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DisbursementSetsParams, TransactionListParams } from '@/features/disbursement/schema'
import { fetchDisbursementSets, fetchTransactionsByMenuType, fetchDisbursementSetSummary, cancelMealTransaction } from '@/features/disbursement/api'

export const disbursementKeys = {
  all: ['disbursement'] as const,
  sets: (params: DisbursementSetsParams) => ['disbursement', 'sets', params] as const,
  transactions: (menuType: string, params: TransactionListParams) =>
    ['disbursement', 'transactions', menuType, params] as const,
  setSummary: (setId: number) => ['disbursement', 'set-summary', setId] as const,
}

/**
 * 지급 세트 목록 조회
 * 레거시: store/disbursement actions fetchDisbursementSets
 */
export function useDisbursementSets(params: DisbursementSetsParams) {
  return useQuery({
    queryKey: disbursementKeys.sets(params),
    queryFn: () => fetchDisbursementSets(params),
    enabled:
      !!params.disbursement_period_start && !!params.disbursement_period_end,
  })
}

/**
 * 거래 내역 목록 조회
 * 레거시: TransactionListTable.vue handleSearchClick
 */
export function useTransactions(menuType: string, params: TransactionListParams) {
  return useQuery({
    queryKey: disbursementKeys.transactions(menuType, params),
    queryFn: () => fetchTransactionsByMenuType(menuType, params),
    enabled: !!params.operator_customer_company_disbursement_set,
  })
}

/**
 * 지급 세트 요약 조회
 * 레거시: DisbursementSummary.vue fetchDisbursementSetsSummary
 */
export function useDisbursementSetSummary(setId: number) {
  return useQuery({
    queryKey: disbursementKeys.setSummary(setId),
    queryFn: () => fetchDisbursementSetSummary(setId),
    enabled: !!setId,
  })
}

/**
 * 급식 거래취소
 * 레거시: refundDisbursement action → 성공 시 목록 재조회
 */
export function useCancelMealTransaction(menuType: string, params: TransactionListParams) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (disbursementId: number) => cancelMealTransaction(disbursementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: disbursementKeys.transactions(menuType, params),
      })
    },
    onError: (error: unknown) => {
      console.error('급식 거래 취소 실패:', error)
    },
  })
}
