import { ImageOff } from 'lucide-react'
import { priceFormat } from '@/utils/price'
import type { MenuItem } from '@/features/menu-management/schema'

interface MenuCardMobileProps {
  menu: MenuItem
  onClick?: (menu: MenuItem) => void
  className?: string
}

export function MenuCardMobile({ menu, onClick, className }: MenuCardMobileProps) {
  const categoryText = menu.menu_categories.length
    ? menu.menu_categories.map((c) => c.operation_name ?? c.name).join(', ')
    : '-'

  return (
    <button type="button" className={`w-full text-left cursor-pointer ${className ?? ''}`} onClick={() => onClick?.(menu)}>
      {/* 탭바: 뱃지(좌) + 가격(우) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="rounded-t px-2 typo-body3 weight-600 bg-accent text-status-positive">
            사용
          </span>
          {menu.membership_discount_allowed && (
            <span className="rounded-t px-2 typo-body3 weight-600 bg-neutral-250 text-key-blue">
              고객사할인
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-t bg-border px-2">
          {menu.origin_price != null && menu.origin_price > menu.base_price && (
            <span className="typo-micro2 weight-400 text-status-destructive line-through">
              {priceFormat(menu.origin_price)}원
            </span>
          )}
          <span className="typo-body3 weight-800 text-foreground">
            {priceFormat(menu.base_price)}원
          </span>
        </div>
      </div>

      {/* 카드 본체 */}
      <div className="flex flex-col gap-2 rounded-b border border-border bg-background p-2 hover:bg-muted">
        {/* 이미지 + sn/관리명/노출명 */}
        <div className="flex gap-2 items-start">
          {/* 썸네일 56x56 */}
          <div className="relative size-[56px] shrink-0 overflow-hidden rounded">
            {menu.thumbnail_url || menu.image_url ? (
              <img
                src={menu.thumbnail_url ?? menu.image_url ?? ''}
                alt={menu.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <ImageOff size={20} className="text-neutral-400" />
              </div>
            )}
          </div>

          {/* sn + 관리명 + 노출명 */}
          <div className="flex flex-1 flex-col gap-1 min-w-0 typo-body2 weight-800">
            {/* sn + 관리명 */}
            <div className="flex items-center gap-1 min-w-0">
              {menu.sn && (
                <span className="shrink-0 text-muted-foreground">({menu.sn})</span>
              )}
              <span className="truncate text-foreground">
                {menu.operation_name || menu.name}
              </span>
            </div>
            {/* 노출명 */}
            {menu.operation_name && menu.name && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0 text-muted-foreground">노출명:</span>
                <span className="truncate text-foreground">{menu.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 카테고리 — 전체 폭 */}
        <div className="flex items-center gap-2 min-w-0 typo-body3 text-foreground">
          <span className="shrink-0">카테고리:</span>
          <span className="truncate">{categoryText}</span>
        </div>
      </div>
    </button>
  )
}
