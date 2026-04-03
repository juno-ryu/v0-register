import { z } from 'zod'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { STATISTICS_TYPE } from '@/features/statistics/schema'

export const statisticsFilterSchema = z.object({
  store_id: z.array(z.string()),
  from_date: z.string(),
  to_date: z.string(),
  statistics_type: z.string(),
})

export type StatisticsFilterValues = z.infer<typeof statisticsFilterSchema>

export const getStatisticsFilterDefaults = (): StatisticsFilterValues => {
  const now = new Date()
  return {
    store_id: [],
    from_date: format(startOfMonth(now), 'yyyy-MM-dd'),
    to_date: format(endOfMonth(now), 'yyyy-MM-dd'),
    statistics_type: STATISTICS_TYPE.PRODUCT_SALES,
  }
}
