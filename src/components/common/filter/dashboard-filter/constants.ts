import { z } from 'zod'

export const dashboardFilterSchema = z.object({
  brand_id__in: z.array(z.string()),
  store_id__in: z.array(z.string()),
})

export type DashboardFilterValues = z.infer<typeof dashboardFilterSchema>

export const DASHBOARD_FILTER_DEFAULTS: DashboardFilterValues = {
  brand_id__in: [],
  store_id__in: [],
}
