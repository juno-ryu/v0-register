import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { branchListQueryOptions, getDefaultBranchListParams } from '@/features/branch-management/queries'

const branchManagementSearchSchema = z.object({
  brandId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/branch-management/')({
  validateSearch: branchManagementSearchSchema,
  loader: () => queryClient.prefetchQuery(branchListQueryOptions(getDefaultBranchListParams())),
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
