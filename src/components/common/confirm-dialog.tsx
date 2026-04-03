import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const VARIANT_STYLES = {
  error: {
    cancel: 'border-key-pink text-key-pink hover:bg-key-pink/5',
    confirm: 'bg-key-pink text-white hover:bg-key-pink/90',
  },
  success: {
    cancel: 'border-key-blue text-key-blue hover:bg-key-blue/5',
    confirm: 'bg-key-blue text-white hover:bg-key-blue/90',
  },
} as const

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: keyof typeof VARIANT_STYLES
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'error',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <AlertDialogContent className="w-[360px] max-w-[360px] p-0 gap-0 rounded-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-center p-4">
          <AlertDialogTitle className="typo-body1 weight-600 text-foreground">{title}</AlertDialogTitle>
        </div>
        {/* 본문 */}
        <AlertDialogDescription asChild>
          <div className="p-4 text-center typo-body1 weight-400 text-foreground">
            {description}
          </div>
        </AlertDialogDescription>
        {/* 푸터 */}
        <div className="flex gap-4 p-4">
          <AlertDialogCancel
            className={`flex-1 h-12 rounded-lg typo-body1 weight-800 ${styles.cancel}`}
            onClick={onCancel}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`flex-1 h-12 rounded-lg typo-body1 weight-800 ${styles.confirm}`}
            onClick={(e) => { e.preventDefault(); onConfirm() }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
