import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/useAuthStore'
import {
  brandsForSelectionQueryOptions,
  storesForSelectionQueryOptions,
  operationProfilesQueryOptions,
  menuCategoriesDetailQueryOptions,
  menuListQueryOptions,
  optionCategoriesDetailQueryOptions,
} from '@/features/menu-management/queries'

const tabSearchSchema = z.object({
  tab: z.enum(['operationProfileManagement', 'categoryManagement', 'menuManagement', 'optionManagement', 'originManagement']).optional().default('menuManagement'),
})

export const Route = createFileRoute('/_authenticated/menu-management')({
  validateSearch: tabSearchSchema,
  loader: () => {
    const { userBrandId, userStoreId, managementId } = useAuthStore.getState()

    // 운영사 계정 → brands prefetch
    if (managementId) {
      return queryClient.prefetchQuery(brandsForSelectionQueryOptions())
    }

    // 브랜드 계정 → stores prefetch
    if (userBrandId && !userStoreId) {
      return queryClient.prefetchQuery(storesForSelectionQueryOptions(userBrandId))
    }

    // 매장 계정 → 탭 4개 데이터 prefetch
    if (userStoreId) {
      return Promise.all([
        queryClient.prefetchQuery(operationProfilesQueryOptions(userStoreId)),
        queryClient.prefetchQuery(menuCategoriesDetailQueryOptions(userStoreId)),
        queryClient.prefetchQuery(menuListQueryOptions(userStoreId)),
        queryClient.prefetchQuery(optionCategoriesDetailQueryOptions(userStoreId)),
      ])
    }
  },
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
