import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/useAuthStore'
import {
  getDefaultDashboardParams,
  dashboardDataQueryOptions,
  dashboardChartQueryOptions,
} from '@/features/dashboard/queries'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: () => {
    const { userStoreId, userBrandId } = useAuthStore.getState()
    const params = getDefaultDashboardParams()
    const effectiveStoreId = userStoreId ?? null
    const brandId = userBrandId ?? null
    return Promise.all([
      queryClient.prefetchQuery(dashboardDataQueryOptions(params, effectiveStoreId, brandId)),
      queryClient.prefetchQuery(dashboardChartQueryOptions(params, effectiveStoreId, brandId)),
    ])
  },
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
