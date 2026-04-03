import { useRouterState } from '@tanstack/react-router'
import { ChevronDown, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  selectIsStoreAccount,
  useAuthStore,
} from '@/store/useAuthStore'
import { useStoreSelectionStore } from '@/store/useStoreSelectionStore'

import { NavMenu, useMenus } from '@/components/layout/nav-menu'
import { MyAccountTriggerButton } from '@/features/auth/components/my-account-dialog'

interface HeaderProps {
  onMenuClick: () => void
  onAccountClick: () => void
}

export function Header({ onMenuClick, onAccountClick }: HeaderProps) {
  const routerState = useRouterState()
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const { selectedStoreName, setStoreSelectionOpen } = useStoreSelectionStore()
  const menus = useMenus()

  // 모바일 페이지 타이틀 — 현재 경로에 해당하는 메뉴 label 사용
  const pageTitle = menus.find((m) => routerState.location.pathname.startsWith(m.to))?.label ?? ''
  // menu-management 페이지에서는 하단 border 제거 (StoreSelectionBar가 시각적으로 헤더와 연결되도록)
  const isMenuManagement = routerState.location.pathname.startsWith('/menu-management')

  return (
    <header className={isMenuManagement ? 'bg-background' : 'border-b border-border bg-background'}>
      {/* 데스크탑: 수평 네비 + 내 계정 */}
      <div className="hidden items-center justify-between px-8 lg:flex">
        <NavMenu />
        <div className="flex items-center gap-2">
          {/* <ModeToggle /> */}
          <MyAccountTriggerButton onClick={onAccountClick} />
        </div>
      </div>

      {/* 모바일: 햄버거 + 타이틀 + (menu-management에서 매장 선택 트리거) */}
      <div className="flex h-12 items-center gap-2 px-4 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-8 w-8 shrink-0 text-muted-foreground"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </Button>
        <span className="typo-body3 weight-500 flex-1">{pageTitle}</span>
        {isMenuManagement && !isStoreAccount && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStoreSelectionOpen(true)}
            className="flex items-center gap-1 typo-body3 weight-500 h-auto px-2 py-1"
          >
            <span className={`max-w-[140px] truncate ${selectedStoreName ? 'text-foreground' : 'text-key-pink'}`}>
              {selectedStoreName ?? '매장선택'}
            </span>
            <ChevronDown size={14} className={selectedStoreName ? 'text-foreground' : 'text-key-pink'} />
          </Button>
        )}
        {(!isMenuManagement || isStoreAccount) && <div className="w-8" />}
      </div>
    </header>
  )
}
