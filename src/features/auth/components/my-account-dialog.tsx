import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BaseDialog } from '@/components/common/base-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/useAuthStore'
import { MyAccountContent } from '@/features/auth/components/my-account-content'

// lg 브레이크포인트 (1024px) 기준 모바일 감지
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

// 모바일 시트 스크롤 영역 고정 높이
const SCROLL_AREA_STYLE = { maxHeight: '60vh' } as const

interface MyAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MyAccountDialog({ open, onOpenChange }: MyAccountDialogProps) {
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)
  const isMobile = useIsMobile()

  const handleLogout = () => {
    onOpenChange(false)
    signOut()
    navigate({ to: '/login' })
  }

  const handleClose = () => onOpenChange(false)

  const footerButtons = (
    <>
      <Button
        variant="outline"
        className="flex-1 border-key-blue text-key-blue hover:bg-key-blue hover:text-white"
        onClick={handleClose}
      >
        닫기
      </Button>
      <Button
        className="flex-1 bg-key-blue text-white hover:bg-key-blue/90"
        onClick={handleLogout}
      >
        로그아웃
      </Button>
    </>
  )

  // 모바일: Sheet (bottom)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton
          onInteractOutside={(e) => e.preventDefault()}
          className="rounded-t-2xl p-0 gap-0"
        >
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="text-center typo-body1 weight-600">내 계정</SheetTitle>
            <SheetDescription className="sr-only">내 계정 정보</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-4" style={SCROLL_AREA_STYLE}>
            <MyAccountContent />
          </div>
          <SheetFooter className="flex-row gap-4 p-4 border-t">
            {footerButtons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // 데스크탑: BaseDialog (공용 컴포넌트)
  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="내 계정"
      footer={footerButtons}
    >
      <div className="p-4">
        <MyAccountContent />
      </div>
    </BaseDialog>
  )
}

// 데스크탑 헤더용 "내 계정" 트리거 버튼
export function MyAccountTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-1.5 typo-body3 weight-700"
    >
      <User size={14} />
      내 계정
    </Button>
  )
}
