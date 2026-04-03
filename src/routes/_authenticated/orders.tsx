import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { ordersListQueryOptions, getDefaultOrdersParams } from '@/features/orders/queries'

export const Route = createFileRoute('/_authenticated/orders')({
  loader: () => queryClient.prefetchQuery(ordersListQueryOptions(getDefaultOrdersParams())),
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
