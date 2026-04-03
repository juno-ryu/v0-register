import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// BaseDialog
// ─────────────────────────────────────────────

interface BaseDialogProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  /**
   * DialogContent 너비. 기본값 360px.
   * Tailwind arbitrary value 그대로 전달: 'w-[360px]', 'max-w-2xl' 등
   */
  widthClass?: string
  /**
   * true면 스크롤 바디 div 미렌더링.
   * <form> 등이 직접 flex layout을 관리해야 할 때 사용.
   */
  noScrollBody?: boolean
}

export function BaseDialog({
  open,
  onClose,
  title,
  footer,
  children,
  widthClass = 'w-[360px] max-w-[360px]',
  noScrollBody = false,
}: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        className={`${widthClass} flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0`}
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader className="p-4 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {noScrollBody ? children : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        )}

        {footer && (
          <DialogFooter className="flex-row p-4 shrink-0 gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// BaseRow — label / value 행
// ─────────────────────────────────────────────

interface BaseRowProps {
  label: React.ReactNode
  /** 단순 텍스트 값 — children과 동시 사용 시 children 우선 */
  value?: React.ReactNode
  /** 커스텀 콘텐츠 (복사 버튼, 이미지, 칩 리스트 등) */
  children?: React.ReactNode
  /** label/value 가로 배치(기본) vs 세로 배치 */
  direction?: 'row' | 'column'
  /** 행 wrapper 추가 클래스 (py 조절 등) */
  className?: string
  /** label 추가 클래스 (색상 override 등) */
  labelClassName?: string
  /** value 추가 클래스 (색상 override 등) */
  valueClassName?: string
}

export function BaseRow({
  label, value, children, direction = 'row',
  className, labelClassName, valueClassName,
}: BaseRowProps) {
  if (direction === 'column') {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <span className={cn("typo-body3 weight-600 text-foreground", labelClassName)}>{label}</span>
        {children ?? <span className={cn("typo-body3 text-foreground", valueClassName)}>{value}</span>}
      </div>
    )
  }

  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <span className={cn("typo-body3 weight-600 text-foreground shrink-0 min-w-[120px]", labelClassName)}>{label}</span>
      {children ?? (
        <span className={cn("typo-body3 text-foreground text-right whitespace-pre-line", valueClassName)}>{value}</span>
      )}
    </div>
  )
}
