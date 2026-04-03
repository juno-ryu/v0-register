import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import type { MenuItem } from '@/features/menu-management/schema'

interface MenuViewDialogProps {
  open: boolean
  menu: MenuItem | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function formatPrice(price: number | null | undefined): string {
  if (price == null || price === 0) return '-'
  return `${price.toLocaleString('ko-KR')}원`
}

function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').slice(0, 19).replace(/-/g, '/')
}

function getImageFilename(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1] ?? ''
}

export function MenuViewDialog({ open, menu, onClose, onEdit, onDelete }: MenuViewDialogProps) {
  const idRef = useRef<HTMLSpanElement>(null)

  if (!menu) return null

  const handleCopy = () => {
    if (menu.id) navigator.clipboard.writeText(menu.id)
  }

  const discountPrice =
    menu.base_price != null &&
    menu.origin_price != null &&
    menu.base_price !== menu.origin_price
      ? menu.base_price
      : null


  const footer = (
    <>
      <Button variant="outline" className="flex-1" onClick={onClose}>
        닫기
      </Button>
      <Button className="flex-1" onClick={onEdit}>
        수정
      </Button>
    </>
  )

  return (
    <BaseDialog open={open} onClose={onClose} title="상품 정보" footer={footer}>
      {/* 섹션 1: 기본 정보 */}
      <div className="p-4 space-y-3">
        <BaseRow label="상품 ID">
          <div className="flex flex-col items-end gap-1">
            <span ref={idRef} className="typo-body3 text-right break-all">{menu.id}</span>
            <Button variant="outline" size="sm" className="h-6 px-2 typo-micro1" onClick={handleCopy}>
              복사
            </Button>
          </div>
        </BaseRow>

        <BaseRow label="상태" value="사용" />
        <BaseRow label="상품명(관리용)" value={menu.operation_name ?? '-'} />
        <BaseRow label="상품명(노출용)" value={menu.name} />
        <BaseRow label="정상가" value={formatPrice(menu.origin_price)} />
        <BaseRow label="판매가" value={formatPrice(discountPrice)} />

        <BaseRow label="상품 이미지">
          {menu.image_url ? (
            <div className="flex flex-col items-end gap-1">
              <img
                src={menu.image_url}
                alt="상품 이미지"
                className="w-[100px] h-[100px] rounded-lg object-contain bg-muted p-3"
              />
              <span className="typo-micro1 text-neutral-400 max-w-[120px] text-right break-all">
                {getImageFilename(menu.image_url)}
              </span>
            </div>
          ) : (
            <span className="typo-body3 text-foreground">-</span>
          )}
        </BaseRow>

        <BaseRow label="메뉴 설명(강조)" value={menu.highlight_description ?? '-'} />
        <BaseRow label="메뉴 설명" value={menu.description ?? '-'} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 2: 카테고리/옵션 */}
      <div className="p-4 space-y-3">
        <BaseRow label="카테고리" direction="column">
          {menu.menu_categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {menu.menu_categories.map((c) => (
                <span key={c.id} className="rounded-full bg-accent px-3 py-1 typo-body3 text-foreground">
                  {c.operation_name ?? c.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="typo-body3 text-foreground">-</span>
          )}
        </BaseRow>
        <BaseRow label="옵션" direction="column">
          {menu.option_categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {menu.option_categories.map((o) => (
                <span key={o.id} className="rounded-full bg-accent px-3 py-1 typo-body3 text-foreground">
                  {o.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="typo-body3 text-foreground">-</span>
          )}
        </BaseRow>
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 3: 추가 설정 */}
      <div className="p-4 space-y-3">
        <BaseRow
          label="고객사 멤버십 할인"
          value={menu.membership_discount_allowed ? '할인 적용' : '할인 미적용'}
        />
        <BaseRow label="최소 주문 단위" value={String(menu.min_available_quantity ?? 1)} />
        <BaseRow
          label="최대 주문 제한"
          value={menu.max_available_quantity ? String(menu.max_available_quantity) : '제한 없음'}
        />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 4: 메타데이터 + 삭제 */}
      <div className="p-4 space-y-3">
        <BaseRow label="마지막 업데이트 일시" value={formatDate(menu.update_dt)} />
        <BaseRow label="등록 일시" value={formatDate(menu.create_dt)} />

        <BaseRow label="삭제">
          <Button
            variant="outline"
            size="sm"
            className="border-status-destructive text-status-destructive hover:bg-status-destructive/5 gap-1"
            onClick={onDelete}
          >
            <Trash2 size={14} />
            삭제
          </Button>
        </BaseRow>
      </div>
    </BaseDialog>
  )
}
