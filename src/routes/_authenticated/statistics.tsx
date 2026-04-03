import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/useAuthStore'
import { commonStoreListQueryOptions } from '@/hooks/useCommonQueries'

export const Route = createFileRoute('/_authenticated/statistics')({
  loader: () => {
    const { userBrandId, managementId } = useAuthStore.getState()
    // 브랜드 계정: userBrandId로 매장 목록 prefetch (매장 선택 드롭다운용)
    // 운영사/매장 계정은 매장 목록 불필요 (통계 데이터 자체는 검색 후에만 조회)
    if (userBrandId && !managementId) {
      return queryClient.prefetchQuery(commonStoreListQueryOptions(userBrandId))
    }
  },
  pendingComponent: () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin text-foreground" size={32} />
    </div>
  ),
})
