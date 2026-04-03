import { z } from 'zod'
import { DISBURSEMENT_STATUS, DISBURSEMENT_STATUS_LABEL } from '@/features/disbursement/schema'

export const disbursementFilterSchema = z.object({
  store_ids: z.array(z.string()),
  customer_company_ids: z.array(z.string()),
  disbursement_status: z.array(z.string()),
})

export type DisbursementFilterValues = z.infer<typeof disbursementFilterSchema>

export const DISBURSEMENT_FILTER_DEFAULTS: DisbursementFilterValues = {
  store_ids: [],
  customer_company_ids: [],
  // 전체 선택 상태 — ControlledCheckboxGroup의 'all' 체크 기준
  disbursement_status: [DISBURSEMENT_STATUS.COMPLETED, DISBURSEMENT_STATUS.PENDING],
}

export const DISBURSEMENT_STATUS_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: DISBURSEMENT_STATUS_LABEL[DISBURSEMENT_STATUS.COMPLETED].slice(2), value: DISBURSEMENT_STATUS.COMPLETED },
  { label: DISBURSEMENT_STATUS_LABEL[DISBURSEMENT_STATUS.PENDING].slice(2), value: DISBURSEMENT_STATUS.PENDING },
]
