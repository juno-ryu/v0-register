import type { MenuCategory } from '@/features/menu-management/schema'

interface CategoryCardMobileProps {
  category: MenuCategory
  onClick?: (category: MenuCategory) => void
  className?: string
}

export function CategoryCardMobile({ category, onClick, className }: CategoryCardMobileProps) {
  const isActive = category.is_active !== false
  const menusText = category.menus.length
    ? category.menus.map((m) => m.operation_name ?? m.name).join(', ')
    : '-'

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
        {/* (sn) 관리명 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 min-w-0 typo-body2 weight-800">
            {category.sn && (
              <span className="shrink-0 text-muted-foreground">({category.sn})</span>
            )}
            <span className="truncate text-foreground">
              {category.name}
            </span>
          </div>
          {/* 노출명 — Figma: "노출명:" 라벨도 text/strong(검정) */}
          <div className="flex items-center gap-1 min-w-0 typo-body2 weight-800 text-foreground">
            <span className="shrink-0">노출명:</span>
            <span className="truncate">
              {category.operation_name ?? '-'}
            </span>
          </div>
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
