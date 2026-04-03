import { useCallback, useEffect, useState } from 'react'

import { Header } from '@/components/layout/header'
import { MobileDrawer } from '@/components/layout/nav-menu'
import { MyAccountDialog } from '@/features/auth/components/my-account-dialog'

interface AppLayoutProps {
  children: React.ReactNode
}

// 레거시 with-menu.vue 레이아웃 포팅
// 데스크탑: 상단 헤더(수평 네비 + 내 계정) + 콘텐츠
// 모바일: 상단 앱바(햄버거 + 타이틀) + 드로어 + 내 계정 바텀시트
export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)

  const handleAccountClick = useCallback(() => setShowAccountDialog(true), [])

  // 모바일 드로어 열릴 때 body 스크롤 차단
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobileDrawerOpen])

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setIsMobileDrawerOpen(true)}
        onAccountClick={handleAccountClick}
      />

      {/* 모바일 드로어 */}
      {isMobileDrawerOpen && (
        <MobileDrawer
          onClose={() => setIsMobileDrawerOpen(false)}
          onAccountClick={handleAccountClick}
        />
      )}

      {/* 내 계정 다이얼로그 — 단일 인스턴스 (데스크탑 Dialog / 모바일 BottomSheet) */}
      <MyAccountDialog open={showAccountDialog} onOpenChange={setShowAccountDialog} />

      {/* 콘텐츠 영역 — 패딩은 각 페이지가 직접 관리 (full-width 섹션 지원) */}
      <main>
        {children}
      </main>
    </div>
  )
}
