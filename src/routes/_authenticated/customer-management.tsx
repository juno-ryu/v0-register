import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/useAuthStore'
import { commonBrandListQueryOptions } from '@/hooks/useCommonQueries'
import { normalCustomersQueryOptions, membershipCustomersQueryOptions } from '@/features/customers/queries'
import { MEMBER_STATUS } from '@/features/customers/schema'

export const Route = createFileRoute('/_authenticated/customer-management')({
  loader: () => {
    const { managementId, userBrandId } = useAuthStore.getState()

    // 운영사 계정: 브랜드 목록 prefetch (브랜드 선택 드롭다운용)
    if (managementId) {
      return queryClient.prefetchQuery(commonBrandListQueryOptions())
    }

    // 브랜드·매장 계정: userBrandId로 일반+멤버십 고객 목록 prefetch
    if (userBrandId) {
      const defaultStatus = [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.STOPPED, MEMBER_STATUS.PASSWORD_SET_REQUIRED].join(',')
      return Promise.all([
        queryClient.prefetchQuery(normalCustomersQueryOptions({ brandId: userBrandId, page: 1, per_page: 20 })),
        queryClient.prefetchQuery(membershipCustomersQueryOptions({ brandId: userBrandId, page: 1, per_page: 20, status: defaultStatus })),
      ])
    }
  },
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
