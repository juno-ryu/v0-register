import { ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { priceFormat } from '@/utils/price'
import { formatDate } from '@/utils/date'
import type { MenuItem } from '@/features/menu-management/schema'

interface MenuCardProps {
  menu: MenuItem
  onClick?: (menu: MenuItem) => void
  className?: string
}

export function MenuCard({ menu, onClick, className }: MenuCardProps) {
  const categoryText = menu.menu_categories.length
    ? menu.menu_categories.map((c) => c.operation_name ?? c.name).join(', ')
    : '-'

  const optionText = menu.option_categories.length
    ? menu.option_categories.map((o) => o.name).join(', ')
    : '-'

  return (
    <button
      type="button"
      className={`flex w-full text-left cursor-pointer items-center gap-4 rounded border border-border bg-background p-4 hover:bg-muted ${className ?? ''}`}
      onClick={() => onClick?.(menu)}
    >
      {/* 썸네일 (126x126 고정) */}
      <div className="relative h-[126px] w-[126px] shrink-0 overflow-hidden rounded-lg">
        {menu.thumbnail_url || menu.image_url ? (
          <img
            src={menu.thumbnail_url ?? menu.image_url ?? ''}
            alt={menu.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ImageOff size={40} className="text-neutral-400" />
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* 뱃지 + 가격 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-status-positive px-3 py-1 typo-body1 weight-600 text-white hover:bg-status-positive">
              사용
            </Badge>
            {menu.membership_discount_allowed && (
              <Badge className="bg-key-blue px-3 py-1 typo-body1 weight-600 text-white hover:bg-key-blue">
                고객사할인
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {menu.origin_price != null && menu.origin_price > menu.base_price && (
              <span className="typo-headline4 weight-400 text-status-destructive line-through">
                {priceFormat(menu.origin_price)}원
              </span>
            )}
            <span className="typo-headline4 weight-700 text-foreground">
              {priceFormat(menu.base_price)}원
            </span>
          </div>
        </div>

        {/* (sn) 운영명 | 노출명 */}
        <div className="flex items-center gap-2 min-w-0">
          {menu.sn && (
            <span className="shrink-0 typo-headline3 weight-700 text-muted-foreground">({menu.sn})</span>
          )}
          <span className="truncate typo-headline3 weight-700 text-foreground">
            {menu.operation_name || menu.name}
          </span>
          {menu.operation_name && menu.name && (
            <>
              <div className="h-5 w-[2px] bg-border shrink-0" />
              <span className="truncate typo-headline4 weight-700 text-foreground">
                노출명: {menu.name}
              </span>
            </>
          )}
        </div>

        {/* 카테고리 / 옵션 카테고리 + 날짜 */}
        <div className="flex items-end gap-4">
          <div className="flex flex-1 flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 typo-body1 text-foreground min-w-0">
              <span className="shrink-0">상품 카테고리:</span>
              <span className="truncate">{categoryText}</span>
            </div>
            <div className="flex items-center gap-2 typo-body1 text-foreground min-w-0">
              <span className="shrink-0">옵션 카테고리:</span>
              <span className="truncate">{optionText}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-0.5 typo-micro1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-[45px]">업데이트:</span>
              <span>{formatDate(menu.update_dt, 'yyyy/MM/dd HH:mm:ss')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[45px]">등록:</span>
              <span>{formatDate(menu.create_dt, 'yyyy/MM/dd HH:mm:ss')}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
