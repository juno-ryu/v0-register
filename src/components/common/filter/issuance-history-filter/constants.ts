import { z } from 'zod'
import { format, sub } from 'date-fns'
import { ISSUED_COUPON_STATUS } from '@/features/benefit-management/schema'

export const issuanceHistoryFilterSchema = z.object({
  search: z.string(),
  brand_id__in: z.array(z.string()),
  store_id__in: z.array(z.string()),
  status__in: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
})

export type IssuanceHistoryFilterValues = z.infer<typeof issuanceHistoryFilterSchema>

// ─────────────────────────────────────────────
// 초기값
// ─────────────────────────────────────────────

export function getDefaultIssuanceHistoryFilter(): IssuanceHistoryFilterValues {
  return {
    search: '',
    brand_id__in: [],
    store_id__in: [],
    status__in: [],
    startDate: format(sub(new Date(), { days: 6 }), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  }
}

// ─────────────────────────────────────────────
// 옵션 상수
// ─────────────────────────────────────────────

export const ISSUED_STATUS_OPTIONS = [
  { value: String(ISSUED_COUPON_STATUS.USED), label: '사용' },
  { value: String(ISSUED_COUPON_STATUS.UNUSED), label: '미사용' },
  { value: String(ISSUED_COUPON_STATUS.EXPIRED), label: '만료' },
]
