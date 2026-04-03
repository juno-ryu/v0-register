import { useState } from 'react'
import {
  ArrowUpDown,
  Plus,
  RefreshCw,
  ChevronDown,
  MoreVertical,
  Check,
} from 'lucide-react'
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

interface SortOption {
  label: string
  order_by: string
  order_direction: 'asc' | 'desc'
}

interface TabToolbarProps {
  storeId: string | null
  isDidOnly: boolean
  isPosTypeLoaded: boolean
  /** 진열 순서 변경 버튼 비활성화 조건 (예: 아이템 없을 때) */
  isOrderDisabled?: boolean
  isSyncPending: boolean
  sortKey: number
  sortOptions: SortOption[]
  onOrderClick: () => void
  onSyncClick: () => void
  onNewClick: () => void
  onSortChange: (key: number) => void
}

// ─────────────────────────────────────────────
// 탭 공통 툴바
// isDidOnly: 진열 순서 변경 + 신규 등록
// !isDidOnly: 포스 동기화
// 모바일: 정렬 바텀시트 + 더보기 바텀시트
// ─────────────────────────────────────────────
export function TabToolbar({
  storeId,
  isDidOnly,
  isPosTypeLoaded,
  isOrderDisabled = false,
  isSyncPending,
  sortKey,
  sortOptions,
  onOrderClick,
  onSyncClick,
  onNewClick,
  onSortChange,
}: TabToolbarProps) {
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)

  const currentSortLabel = sortOptions[sortKey]?.label ?? ''

  return (
    <div className="flex items-center justify-between my-4">
      {/* ── 데스크탑 좌측 ── */}
      <div className="hidden md:block">
        {isDidOnly && (
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={!storeId || isOrderDisabled}
            onClick={onOrderClick}
          >
            <ArrowUpDown size={14} />
            진열 순서 변경
          </Button>
        )}
      </div>

      {/* ── 모바일 좌측: 정렬 버튼 ── */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 typo-body3 text-muted-foreground px-2"
          onClick={() => setIsSortSheetOpen(true)}
        >
          {currentSortLabel}
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* ── 데스크탑 우측 ── */}
      <div className="hidden md:flex items-center gap-2">
        {isDidOnly && (
          <Button className="gap-1.5" disabled={!storeId} onClick={onNewClick}>
            <Plus size={14} />
            신규 등록
          </Button>
        )}
        {isPosTypeLoaded && !isDidOnly && storeId && (
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={isSyncPending}
            onClick={onSyncClick}
          >
            <RefreshCw
              size={14}
              className={isSyncPending ? 'animate-spin' : ''}
            />
            포스 동기화
          </Button>
        )}
        <Select
          value={String(sortKey)}
          onValueChange={(v) => onSortChange(Number(v))}
        >
          <SelectTrigger className="w-[200px] bg-background typo-body3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt, i) => (
              <SelectItem key={i} value={String(i)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── 모바일 우측: 더보기 버튼 ── */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => setIsMoreSheetOpen(true)}
        >
          <MoreVertical size={18} />
        </Button>
      </div>

      {/* ── 정렬 바텀시트 ── */}
      <Sheet open={isSortSheetOpen} onOpenChange={setIsSortSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-center typo-body3 weight-700">
              정렬
            </SheetTitle>
          </SheetHeader>
          <ul className="px-4">
            {sortOptions.map((opt, i) => (
              <li key={opt.order_by}>
                <Button
                  variant="ghost"
                  className="w-full h-13 justify-start rounded-none gap-3 border-b"
                  onClick={() => {
                    onSortChange(i)
                    setIsSortSheetOpen(false)
                  }}
                >
                  {opt.label}
                  {sortKey === i && (
                    <Check size={16} className="text-key-blue" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {/* ── 더보기 바텀시트 ── */}
      <Sheet open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl gap-0">
          <SheetHeader>
            <SheetTitle className="text-center typo-body3 weight-700">
              더보기
            </SheetTitle>
          </SheetHeader>
          <ul className="px-4">
            {isDidOnly && (
              <li>
                <Button
                  variant="ghost"
                  className="w-full h-13 justify-start rounded-none gap-3 border-b"
                  disabled={!storeId}
                  onClick={() => {
                    onNewClick()
                    setIsMoreSheetOpen(false)
                  }}
                >
                  <Plus size={16} />
                  신규 등록
                </Button>
              </li>
            )}
            {isDidOnly && (
              <li>
                <Button
                  variant="ghost"
                  className="w-full h-13 justify-start rounded-none gap-3"
                  disabled={!storeId || isOrderDisabled}
                  onClick={() => {
                    onOrderClick()
                    setIsMoreSheetOpen(false)
                  }}
                >
                  <ArrowUpDown size={16} />
                  진열 순서 설정
                </Button>
              </li>
            )}
            {isPosTypeLoaded && !isDidOnly && storeId && (
              <li>
                <Button
                  variant="ghost"
                  className="w-full h-13 justify-start rounded-none gap-3"
                  disabled={isSyncPending}
                  onClick={() => {
                    onSyncClick()
                    setIsMoreSheetOpen(false)
                  }}
                >
                  <RefreshCw
                    size={16}
                    className={isSyncPending ? 'animate-spin' : ''}
                  />
                  포스 동기화
                </Button>
              </li>
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}
