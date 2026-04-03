import { useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  BarChart2,
  BookOpen,
  Building2,
  Clipboard,
  Gift,
  LayoutDashboard,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  selectIsBrandAccount,
  selectIsManagementAccount,
  selectIsSettlementAccount,
  selectIsStoreAccount,
  selectUseMembershipUser,
  useAuthStore,
} from '@/store/useAuthStore'

interface MenuItem {
  icon: React.ElementType
  label: string
  to: string
}

// 레거시 MenuNavigator computed menus 포팅
export function useMenus(): MenuItem[] {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  const isBrandAccount = useAuthStore(selectIsBrandAccount)
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const isSettlementAccount = useAuthStore(selectIsSettlementAccount)
  // 레거시 brandDetail.use_membership_user: 비운영사 계정에서 고객관리/지급관리 노출 조건
  const useMembershipUser = useAuthStore(selectUseMembershipUser)

  return [
    { icon: LayoutDashboard, label: '대시보드', to: '/dashboard' },
    // 브랜드관리: 운영사 계정만
    ...(isManagementAccount
      ? [{ icon: Tag, label: '브랜드관리', to: '/brand-management' }]
      : []),
    { icon: Building2, label: '매장관리', to: '/branch-management' },
    { icon: Gift, label: '혜택관리', to: '/benefit-management' },
    { icon: Clipboard, label: '주문내역', to: '/orders' },
    // 통계: 브랜드/매장 계정만
    ...((isBrandAccount || isStoreAccount)
      ? [{ icon: BarChart2, label: '통계', to: '/statistics' }]
      : []),
    // 상품관리: 정산 계정 제외
    ...(!isSettlementAccount
      ? [{ icon: BookOpen, label: '상품관리', to: '/menu-management' }]
      : []),
    // 지급관리/회원관리: 운영사 제외 + use_membership_user === true인 경우만
    // 레거시 MenuNavigator: !isManagementAccount && brandDetail.use_membership_user
    ...(!isManagementAccount && useMembershipUser
      ? [
        { icon: Clipboard, label: '고객사정산', to: '/disbursement-customers' },
        { icon: Users, label: '회원관리', to: '/customer-management' },
      ]
      : []),
  ]
}

// 데스크탑 수평 네비게이션 (레거시 desktop-header > MenuNavigator)
export function NavMenu() {
  const menus = useMenus()
  const routerState = useRouterState()

  return (
    <nav className="flex items-center py-2">
      {menus.map((menu) => {
        const isActive = routerState.location.pathname.startsWith(menu.to)
        const Icon = menu.icon

        return (
          <Link
            key={menu.to}
            to={menu.to}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 typo-body3 weight-500 transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-neutral-300 dark:text-neutral-600 hover:text-foreground',
            )}
          >
            <Icon size={24} />
            <span>{menu.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// 모바일 드로어 (레거시 v-navigation-drawer + MenuNavigator 하단 내 계정 버튼)
export function MobileDrawer({ onClose, onAccountClick }: { onClose: () => void; onAccountClick: () => void }) {
  const menus = useMenus()
  const routerState = useRouterState()

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAccountClick = () => {
    onClose()
    onAccountClick()
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-background shadow-xl">
        {/* 닫기 버튼 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="typo-body3 weight-600">메뉴</span>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        {/* 메뉴 목록 */}
        <ul className="flex flex-1 flex-col overflow-y-auto p-2">
          {menus.map((menu) => {
            const isActive = routerState.location.pathname.startsWith(menu.to)
            const Icon = menu.icon

            return (
              <li key={menu.to}>
                <Link
                  to={menu.to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 typo-body3 weight-600',
                    isActive ? 'text-foreground' : 'text-neutral-300 dark:text-neutral-600',
                  )}
                >
                  <Icon size={20} />
                  <span>{menu.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 하단 고정: 내 계정 버튼 (레거시 MenuNavigator bottom-account-wrapper) */}
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            className="w-full gap-1 border-key-blue text-key-blue hover:bg-key-blue hover:text-white typo-body3 weight-800"
            onClick={handleAccountClick}
          >
            <User size={16} />
            내 계정
          </Button>
        </div>
      </div>
    </div>
  )
}
