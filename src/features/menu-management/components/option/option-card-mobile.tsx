import type { OptionCategory } from '@/features/menu-management/schema'

function getMenusText(menus: OptionCategory['menus']): string {
  if (!menus || menus.length === 0) return '-'
  return menus
    .map((m) => {
      if (typeof m === 'object' && m !== null && 'name' in m) {
        return (m as { name: string; operation_name?: string }).operation_name ?? (m as { name: string }).name
      }
      return String(m)
    })
    .join(', ')
}

interface OptionCardMobileProps {
  category: OptionCategory
  onClick?: (category: OptionCategory) => void
  className?: string
}

export function OptionCardMobile({ category, onClick, className }: OptionCardMobileProps) {
  const isActive = category.is_active !== false
  const menusText = getMenusText(category.menus)

  return (
    <button
      type="button"
      className={`w-full text-left cursor-pointer ${className ?? ''}`}
      onClick={() => onClick?.(category)}
    >
      {/* 탭바: 뱃지 */}
      <div className="flex items-center">
        <span
          className={`rounded-t px-2 typo-body3 weight-600 bg-neutral-150 ${isActive ? 'text-status-positive' : 'text-muted-foreground'}`}
        >
          {isActive ? '사용' : '미사용'}
        </span>
      </div>

      {/* 카드 본체 */}
      <div className="flex flex-col gap-2 rounded-b rounded-tr border border-border bg-background p-2 hover:bg-muted">
        {/* (sn) 노출명: {name} */}
        <div className="flex items-center gap-1 min-w-0 typo-body2 weight-800">
          {category.sn && (
            <span className="shrink-0 text-muted-foreground">({category.sn})</span>
          )}
          <span className="shrink-0 text-foreground">노출명:</span>
          <span className="truncate text-foreground">
            {category.name}
          </span>
        </div>

        {/* 상품 목록 */}
        <div className="flex items-start gap-2 min-w-0 typo-body3 text-neutral-800">
          <span className="shrink-0">상품:</span>
          <span className="line-clamp-2">{menusText}</span>
        </div>
      </div>
    </button>
  )
}
