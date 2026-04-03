import { z } from 'zod'
import { format, sub } from 'date-fns'
import { COUPON_STATUS } from '@/features/benefit-management/schema'

export const benefitsFilterSchema = z.object({
  search: z.string(),
  brand_id__in: z.array(z.string()),
  store_id__in: z.array(z.string()),
  status__in: z.array(z.string()),
  issuable_start_date: z.string(),
  issuable_end_date: z.string(),
})

export type BenefitsFilterValues = z.infer<typeof benefitsFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

function getDefaultDates() {
  return {
    issuable_start_date: format(sub(new Date(), { days: 6 }), 'yyyy-MM-dd'),
    issuable_end_date: format(new Date(), 'yyyy-MM-dd'),
  }
}

export function getDefaultBenefitsFilter(): BenefitsFilterValues {
  return {
    search: '',
    brand_id__in: [],
    store_id__in: [],
    status__in: [],
    ...getDefaultDates(),
  }
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const COUPON_STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: String(COUPON_STATUS.IN_PROGRESS), label: '진행' },
  { value: String(COUPON_STATUS.RESERVED), label: '예약' },
  { value: String(COUPON_STATUS.TERMINATED), label: '종료' },
]
