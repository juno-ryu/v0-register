import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { tryAutoLogin } from '@/features/auth/hooks/useAuth'
import { fetchBrandDetail } from '@/features/brand-management/api'
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsBrandAccount,
  selectIsStoreAccount,
  selectIsSettlementAccount,
} from '@/store/useAuthStore'

export const Route = createFileRoute('/_authenticated')({
  // beforeLoad: 인증 확인 → 미인증 시 자동 로그인 시도 → 실패 시 /login 리디렉트
  // 레거시 auto-login middleware + with-menu.vue fetchBrandDetail 포팅
  beforeLoad: async () => {
    const state = useAuthStore.getState()
    const isAuthenticated = selectIsAuthenticated(state)

    if (!isAuthenticated) {
      const autoLoginSuccess = await tryAutoLogin()
      if (!autoLoginSuccess) {
        throw redirect({ to: '/login' })
      }
    }

    // 레거시 with-menu.vue: isBrandAccount일 때 fetchBrandDetail → use_membership_user 저장
    // 브랜드/매장/정산 계정(비운영사)이 brandId를 가지면 brandDetail 조회
    const freshState = useAuthStore.getState()
    const isBrand = selectIsBrandAccount(freshState)
    const isStore = selectIsStoreAccount(freshState)
    const isSettlement = selectIsSettlementAccount(freshState)
    const brandId = freshState.userBrandId

    if ((isBrand || isStore || isSettlement) && brandId) {
      try {
        const brandDetail = await fetchBrandDetail(brandId)
        freshState.setUseMembershipUser(brandDetail.use_membership_user ?? false)
        freshState.setBrandDomain(brandDetail.domain ?? null)
      } catch {
        // brandDetail 조회 실패 시 기본값 false 유지 (메뉴 숨김)
      }
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
