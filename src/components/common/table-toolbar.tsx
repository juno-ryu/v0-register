import { useState, type ReactNode } from 'react'
import { MoreVertical, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export interface ToolbarAction {
  icon?: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  /** 데스크톱 버튼 variant (기본: default) */
  variant?: 'default' | 'outline'
}

interface TableToolbarProps {
  totalCount?: number
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  /** 데스크톱: 버튼으로 렌더, 모바일: 더보기 바텀시트 */
  actions?: ToolbarAction[]
  /** 데스크톱 좌측 요약 텍스트 커스텀 (기본: "총 N건이 검색되었습니다.") */
  summarySlot?: ReactNode
  /** 모바일 상단 행 (통계 요약 등) */
  topSlot?: ReactNode
  /** 데스크톱/모바일 공용 중간 영역 (정렬 셀렉트 등) */
  children?: ReactNode
}

export function TableToolbar({
  totalCount,
  pageSize,
  onPageSizeChange,
  actions,
  summarySlot,
  topSlot,
  children,
}: TableToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const hasActions = actions && actions.length > 0

  return (
    <>
      {/* ── 데스크톱 ── */}
      <div className="flex items-center justify-between my-4 max-md:hidden">
        {summarySlot ?? (totalCount != null && (
          <p className="typo-body3 weight-400 text-foreground">
            총 <span className="weight-700 text-key-blue">{totalCount.toLocaleString()}</span>건이 검색되었습니다.
          </p>
        ))}
        <div className="flex items-center gap-2">
          {children}
          {hasActions && actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant={action.variant ?? 'default'}
                disabled={action.disabled}
                onClick={action.onClick}
                className={Icon ? 'gap-1.5' : ''}
              >
                {Icon && <Icon size={14} />}
                {action.label}
              </Button>
            )
          })}
          {pageSize != null && onPageSizeChange && (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}개씩 보기
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── 모바일 ── */}
      <div className="hidden max-md:block my-3">
        {topSlot && (
          <div className="mb-2">{topSlot}</div>
        )}

        <div className="flex items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {totalCount != null && (
              <p className="typo-body3 weight-400 text-foreground whitespace-nowrap shrink-0">
                총 <span className="weight-700 text-key-blue">{totalCount.toLocaleString()}</span>건
              </p>
            )}
            {children}
            {pageSize != null && onPageSizeChange && (
              <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                <SelectTrigger className="w-[100px] border-0 shadow-none px-2 typo-micro1 text-foreground gap-0.5 [&_svg]:size-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="typo-micro1 h-8 whitespace-nowrap">
                      {size}개씩 보기
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {hasActions && (
            <Button
              variant="ghost"
              size="sm"
              className="px-2 shrink-0"
              onClick={() => setMoreOpen(true)}
            >
              <MoreVertical size={18} />
            </Button>
          )}
        </div>

        {hasActions && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl gap-0">
              <SheetHeader>
                <SheetTitle className="text-center typo-body3 weight-700">
                  더보기
                </SheetTitle>
              </SheetHeader>
              <ul className="px-4">
                {actions.map((action, idx) => {
                  const Icon = action.icon
                  return (
                    <li key={action.label}>
                      <Button
                        variant="ghost"
                        className={`w-full h-13 justify-start rounded-none gap-3 ${idx < actions.length - 1 ? 'border-b' : ''}`}
                        disabled={action.disabled}
                        onClick={() => {
                          action.onClick()
                          setMoreOpen(false)
                        }}
                      >
                        {Icon && <Icon size={16} />}
                        {action.label}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </>
  )
}
