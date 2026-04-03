import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 다이얼로그 내부 mutation 로딩 오버레이.
 * DialogContent (fixed) 의 직접 자식으로 배치하면
 * absolute inset-0 이 DialogContent 기준으로 전체를 덮는다.
 */
function LoadingOverlay({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center',
        'bg-background/70 rounded-[inherit]',
        className,
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  )
}

export { LoadingOverlay }
