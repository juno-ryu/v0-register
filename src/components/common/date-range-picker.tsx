import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  maxDate?: Date
  placeholder?: string
  className?: string
}

// 레거시 DateFilter → DatePicker 포팅
// 날짜 범위를 Popover + Calendar로 표시
export function DateRangePicker({
  value,
  onChange,
  maxDate,
  placeholder = '기간 선택',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const displayText = React.useMemo(() => {
    if (!value?.from) return placeholder
    if (!value.to) return format(value.from, 'yyyy/MM/dd')
    return `${format(value.from, 'yyyy/MM/dd')} ~ ${format(value.to, 'yyyy/MM/dd')}`
  }, [value, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex h-10 w-full max-w-[335px] items-center gap-2 border border-border bg-background px-4 typo-body3 weight-400 text-foreground cursor-pointer transition-colors hover:bg-accent data-[state=open]:border-key-blue',
            !value?.from && 'text-neutral-400',
            className,
          )}
        >
          <CalendarIcon size={14} className="shrink-0" />
          <span>{displayText}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            onChange(range)
            // 시작/종료 모두 선택되면 닫기
            if (range?.from && range?.to) {
              setOpen(false)
            }
          }}
          disabled={maxDate ? { after: maxDate } : undefined}
          numberOfMonths={2}
          defaultMonth={value?.from}
        />
      </PopoverContent>
    </Popover>
  )
}
