import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'

interface TermOption {
  value: string
  label: string
}

interface TermSelectorProps {
  termOptions: TermOption[]
  term: string
  onTermChange: (term: string) => void
  displayText: string
  onPrev?: () => void
  onNext?: () => void
  isNextDisabled?: boolean
  /** 기간선택 모드 — 화살표 대신 편집 아이콘 + 달력 */
  isCustomMode?: boolean
  customRange?: DateRange
  onCustomRangeChange?: (range: DateRange | undefined) => void
}

export function TermSelector({
  termOptions,
  term,
  onTermChange,
  displayText,
  onPrev,
  onNext,
  isNextDisabled,
  isCustomMode,
  customRange,
  onCustomRangeChange,
}: TermSelectorProps) {
  return (
    <>
      {/* 데스크톱: 탭 + 날짜 네비게이션 */}
      <div className="max-md:hidden">
        <div className="flex items-center gap-2">
          {termOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              className={`typo-body3 ${term === opt.value ? 'weight-700 text-foreground' : 'weight-400 text-muted-foreground'}`}
              onClick={() => onTermChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isCustomMode ? (
            <>
              <span className="typo-headline4 weight-700">{displayText}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4 text-key-blue" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={(range) => onCustomRangeChange?.(range)}
                    disabled={{ after: new Date() }}
                    numberOfMonths={2}
                    defaultMonth={customRange?.from}
                  />
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="typo-headline4 weight-700">{displayText}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isNextDisabled} onClick={onNext}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 모바일: 셀렉트 + 날짜 네비게이션 */}
      <div className="hidden max-md:flex items-center gap-4">
        <Select value={term} onValueChange={onTermChange}>
          <SelectTrigger className="w-[112px] shrink-0 typo-body3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {termOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isCustomMode ? (
          <div className="flex flex-1 items-center justify-center gap-2">
            <span className="typo-headline4 weight-700 text-foreground">{displayText}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <Pencil className="h-4 w-4 text-key-blue" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={(range) => onCustomRangeChange?.(range)}
                  disabled={{ after: new Date() }}
                  numberOfMonths={2}
                  defaultMonth={customRange?.from}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onPrev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="typo-headline4 weight-700 text-foreground text-center flex-1">
              {displayText}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              disabled={isNextDisabled}
              onClick={onNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
