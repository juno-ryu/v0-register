import { useState, useMemo } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import type {
  MenuFilterState,
  MenuSearchType,
  MenuStatusFilter,
  MenuImageFilter,
} from '@/features/menu-management/schema'

// ─────────────────────────────────────────────
// 모바일 전용 상품 필터 Sheet
// 데스크탑(MenuManagementFilter)과 별도 컴포넌트로 분리
// ─────────────────────────────────────────────

interface MenuFilterSheetProps {
  open: boolean
  onClose: () => void
  filter: MenuFilterState
  onApply: (filter: MenuFilterState) => void
  onReset: () => void
}

type SectionKey = 'search' | 'status' | 'image' | null

interface AccordionSectionProps {
  label: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ label, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div>
      <button
        type="button"
        className="flex h-[50px] w-full items-center justify-between bg-background px-4 py-[13px]"
        onClick={onToggle}
      >
        <span className="typo-body1 weight-600 text-foreground">{label}</span>
        {isOpen
          ? <Minus size={24} className="shrink-0 text-muted-foreground" />
          : <Plus size={24} className="shrink-0 text-muted-foreground" />
        }
      </button>
      {isOpen && (
        <div className="bg-muted px-4 py-3">
          {children}
        </div>
      )}
    </div>
  )
}

const STATUS_OPTIONS: { value: MenuStatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '사용' },
  { value: 'inactive', label: '미사용' },
]

const IMAGE_OPTIONS: { value: MenuImageFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'with', label: '이미지 있음' },
  { value: 'without', label: '이미지 없음' },
]

export function MenuFilterSheet({ open, onClose, filter, onApply, onReset }: MenuFilterSheetProps) {
  const [keyword, setKeyword] = useState(filter.keyword)
  const [searchType, setSearchType] = useState<MenuSearchType>(filter.searchType)
  const [statusFilter, setStatusFilter] = useState<MenuStatusFilter[]>(filter.statusFilter)
  const [imageFilter, setImageFilter] = useState<MenuImageFilter>(filter.imageFilter)
  const [openSection, setOpenSection] = useState<SectionKey>('search')

  const toggleSection = (section: SectionKey) =>
    setOpenSection((prev) => (prev === section ? null : section))

  const isAllChecked = statusFilter.includes('active') && statusFilter.includes('inactive')

  const toggleStatus = (value: MenuStatusFilter) => {
    if (value === 'all') {
      setStatusFilter(isAllChecked ? [] : ['active', 'inactive'])
      return
    }
    setStatusFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleApply = () => {
    onApply({ keyword, searchType, statusFilter, imageFilter })
    onClose()
  }

  const handleReset = () => {
    setKeyword('')
    setSearchType('name')
    setStatusFilter(['active'])
    setImageFilter('all')
    setOpenSection('search')
    onReset()
    onClose()
  }

  // 시트 내부 편집 상태 기반 chip 목록
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = []

    if (keyword) {
      const typeLabel = searchType === 'sn' ? '상품 SN' : '상품명'
      chips.push({
        id: 'search',
        label: `${typeLabel}: ${keyword}`,
        onRemove: () => setKeyword(''),
      })
    }

    const isDefaultStatus = statusFilter.length === 1 && statusFilter[0] === 'active'
    if (!isDefaultStatus) {
      if (statusFilter.includes('all')) {
        chips.push({
          id: 'status-all',
          label: '상태: 전체',
          onRemove: () => setStatusFilter(['active']),
        })
      } else {
        statusFilter.forEach((s) => {
          chips.push({
            id: `status-${s}`,
            label: `상태: ${s === 'active' ? '사용' : '미사용'}`,
            onRemove: () =>
              setStatusFilter((prev) => {
                const next = prev.filter((v) => v !== s)
                return next.length > 0 ? next : ['active']
              }),
          })
        })
      }
    }

    if (imageFilter !== 'all') {
      chips.push({
        id: 'image',
        label: `이미지: ${imageFilter === 'with' ? '있음' : '없음'}`,
        onRemove: () => setImageFilter('all'),
      })
    }

    return chips
  }, [keyword, searchType, statusFilter, imageFilter])

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" showCloseButton={false} className="flex h-screen flex-col p-0">
        {/* ── 헤더 ── */}
        <SheetHeader className="flex h-[50px] shrink-0 flex-row items-center border-b border-border px-4 py-0">
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={20} />
          </Button>
          <SheetTitle className="flex-1 text-center typo-body1 weight-600 text-foreground">
            상품 필터
          </SheetTitle>
          {/* 타이틀 중앙 정렬용 spacer */}
          <div className="size-8" />
        </SheetHeader>

        {/* ── 적용된 필터 chip list ── */}
        {activeChips.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-background p-4">
            {activeChips.map((chip) => (
              <div
                key={chip.id}
                className="flex items-center gap-1 rounded-full bg-accent px-[10px] py-1"
              >
                <span className="typo-micro1 weight-600 text-foreground whitespace-nowrap">
                  {chip.label}
                </span>
                <Button variant="ghost" size="icon-xs" onClick={chip.onRemove}>
                  <X size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ── 스크롤 영역 ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-line-normal)]">
          {/* 검색 섹션 */}
          <AccordionSection
            label="검색"
            isOpen={openSection === 'search'}
            onToggle={() => toggleSection('search')}
          >
            <div className="flex flex-col gap-2">
              <Select value={searchType} onValueChange={(v) => setSearchType(v as MenuSearchType)}>
                <SelectTrigger className="h-10 border-border bg-background typo-body3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">상품명</SelectItem>
                  <SelectItem value="sn">상품 SN</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-10 bg-background typo-body3"
                placeholder={searchType === 'sn' ? 'SN 입력' : '상품명 입력'}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </AccordionSection>

          {/* 상태 섹션 */}
          <AccordionSection
            label="상태"
            isOpen={openSection === 'status'}
            onToggle={() => toggleSection('status')}
          >
            <div className="flex flex-col gap-4">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`sheet-status-${value}`}
                    checked={value === 'all' ? isAllChecked : statusFilter.includes(value)}
                    onCheckedChange={() => toggleStatus(value)}
                    className="size-5 bg-background"
                  />
                  <Label
                    htmlFor={`sheet-status-${value}`}
                    className="cursor-pointer typo-body1 weight-600 text-foreground"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 이미지 상태 섹션 */}
          <AccordionSection
            label="이미지 상태"
            isOpen={openSection === 'image'}
            onToggle={() => toggleSection('image')}
          >
            <RadioGroup
              value={imageFilter}
              onValueChange={(v) => setImageFilter(v as MenuImageFilter)}
              className="flex flex-col gap-4"
            >
              {IMAGE_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={value}
                    id={`sheet-image-${value}`}
                    className="size-5 bg-background"
                  />
                  <Label
                    htmlFor={`sheet-image-${value}`}
                    className="cursor-pointer typo-body1 weight-600 text-foreground"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionSection>
        </div>

        {/* ── 하단 버튼 ── */}
        <div className="flex items-center gap-4 border-t border-border p-4">
          <Button variant="link" className="shrink-0 text-key-blue" onClick={handleReset}>
            초기화
          </Button>
          <Button variant="default" size="xl" className="flex-1" onClick={handleApply}>
            적용
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
