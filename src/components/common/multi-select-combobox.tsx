import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, ChevronUpIcon, X } from 'lucide-react'

export interface MultiSelectItem {
  id: string | number
  name: string
}

interface MultiSelectComboboxProps {
  /** 트리거 버튼 placeholder */
  placeholder: string
  /** 선택 가능한 항목 목록 */
  items: MultiSelectItem[]
  /** 현재 선택된 값 (id를 string으로 변환한 배열) */
  selectedValues: string[]
  /** 선택 변경 콜백 */
  onSelectionChange: (values: string[]) => void
  /** 'multi': 복수 선택 (체크박스), 'single': 단일 선택 (라디오) (기본: 'multi') */
  mode?: 'multi' | 'single'
  /** 선택된 항목을 칩으로 표시할지 여부 (기본: true) */
  showChips?: boolean
  /** "전체" 토글 표시 여부 — multi 모드에서만 동작 (기본: true) */
  showSelectAll?: boolean
  /** 검색 placeholder (기본: "검색") */
  searchPlaceholder?: string
}

export function MultiSelectCombobox({
  placeholder,
  items,
  selectedValues,
  onSelectionChange,
  mode = 'multi',
  showChips = true,
  showSelectAll = true,
  searchPlaceholder = '검색',
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)

  const isAllChecked = selectedValues.length === items.length && items.length > 0

  const toggleAll = () => {
    if (isAllChecked) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map((item) => String(item.id)))
    }
  }

  const handleItemSelect = (itemId: string) => {
    if (mode === 'single') {
      // 단일 선택: 같은 항목 클릭 시 해제, 다른 항목 클릭 시 교체
      if (selectedValues.includes(itemId)) {
        onSelectionChange([])
      } else {
        onSelectionChange([itemId])
      }
      setOpen(false)
      return
    }
    // 멀티 선택: 토글
    if (selectedValues.includes(itemId)) {
      onSelectionChange(selectedValues.filter((v) => v !== itemId))
    } else {
      onSelectionChange([...selectedValues, itemId])
    }
  }

  const removeItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedValues.filter((v) => v !== itemId))
  }

  const triggerText = (() => {
    if (selectedValues.length === 0) return placeholder
    if (mode === 'single') {
      const item = items.find((i) => String(i.id) === selectedValues[0])
      return item?.name ?? placeholder
    }
    if (isAllChecked) return `전체 (${items.length}개)`
    return `${selectedValues.length}개 선택됨`
  })()

  const selectedItems = items.filter((item) => selectedValues.includes(String(item.id)))

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full flex items-center justify-between border border-border bg-background px-4 typo-body3 weight-400 text-foreground outline-none transition-colors focus-visible:border-key-blue focus-visible:ring-1 focus-visible:ring-key-blue aria-[expanded=true]:border-key-blue disabled:cursor-not-allowed disabled:bg-accent disabled:text-neutral-400"
          >
            <span className="truncate">
              {triggerText}
            </span>
            {open
              ? <ChevronUpIcon className="size-6 shrink-0 text-foreground" />
              : <ChevronDownIcon className="size-6 shrink-0 text-foreground" />
            }
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none shadow-none border-border"
          align="start"
          sideOffset={0}
        >
          <Command
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const selected = e.currentTarget.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]')
                selected?.click()
              }
            }}
          >
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>결과가 없습니다.</CommandEmpty>
              <CommandGroup>
                {mode === 'multi' ? (
                  <>
                    {showSelectAll && (
                      <CommandItem
                        value="__all__"
                        onSelect={toggleAll}
                        className="flex items-center gap-2 cursor-pointer data-[selected=true]:bg-key-blue/10"
                      >
                        <Checkbox
                          checked={isAllChecked}
                          onCheckedChange={toggleAll}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>전체</span>
                      </CommandItem>
                    )}
                    {items.map((item) => {
                      const id = String(item.id)
                      return (
                        <CommandItem
                          key={id}
                          value={item.name}
                          onSelect={() => handleItemSelect(id)}
                          className="flex items-center gap-2 cursor-pointer data-[selected=true]:bg-key-blue/10"
                        >
                          <Checkbox
                            checked={selectedValues.includes(id)}
                            onCheckedChange={() => handleItemSelect(id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{item.name}</span>
                        </CommandItem>
                      )
                    })}
                  </>
                ) : (
                  <RadioGroup value={selectedValues[0] ?? ''} onValueChange={handleItemSelect}>
                    {items.map((item) => {
                      const id = String(item.id)
                      return (
                        <CommandItem
                          key={id}
                          value={item.name}
                          onSelect={() => handleItemSelect(id)}
                          className="flex items-center gap-2 cursor-pointer data-[selected=true]:bg-key-blue/10"
                        >
                          <RadioGroupItem
                            value={id}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{item.name}</span>
                        </CommandItem>
                      )
                    })}
                  </RadioGroup>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 선택된 항목 칩 */}
      {showChips && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-background p-2 mt-2">
          {selectedItems.map((item) => {
            const id = String(item.id)
            return (
              <Badge
                key={id}
                size="sm"
                className="bg-accent text-foreground gap-1 px-2.5 cursor-default"
              >
                {item.name}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 rounded-full text-muted-foreground hover:bg-border/50 hover:text-neutral-600"
                  onClick={(e) => removeItem(id, e)}
                  aria-label={`${item.name} 제거`}
                >
                  <X className="size-3.5" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
