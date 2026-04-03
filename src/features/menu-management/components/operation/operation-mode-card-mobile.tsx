import type { OperationProfile } from '@/features/menu-management/schema'

interface OperationModeCardMobileProps {
  profile: OperationProfile
  onClick?: (profile: OperationProfile) => void
  className?: string
}

export function OperationModeCardMobile({ profile, onClick, className }: OperationModeCardMobileProps) {
  const categoryText = profile.menu_categories.length
    ? profile.menu_categories.map((c) => c.operation_name ?? c.name).join(', ')
    : '-'

  return (
    <button
      type="button"
      className={`w-full text-left cursor-pointer ${className ?? ''}`}
      onClick={() => onClick?.(profile)}
    >
      {/* 카드 본체 — 운영모드는 뱃지 없음 */}
      <div className="flex flex-col gap-2 rounded border border-border bg-background p-2 hover:bg-muted">
        {/* 운영모드명 */}
        <p className="typo-body2 weight-800 text-foreground truncate">
          {profile.name}
        </p>

        {/* 카테고리 목록 */}
        <div className="flex items-start gap-2 min-w-0 typo-body3 text-neutral-800">
          <span className="shrink-0">카테고리:</span>
          <span className="line-clamp-2">{categoryText}</span>
        </div>
      </div>
    </button>
  )
}
