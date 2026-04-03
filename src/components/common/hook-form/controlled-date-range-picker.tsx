import { useMemo } from 'react'
import { parseISO } from 'date-fns'
import { useFormContext, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/common/date-range-picker'

interface ControlledDateRangePickerProps<T extends FieldValues> {
  startName: Path<T>
  endName: Path<T>
  control: Control<T>
  maxDate?: Date
  className?: string
}

export function ControlledDateRangePicker<T extends FieldValues>({
  startName,
  endName,
  control,
  maxDate,
  className,
}: ControlledDateRangePickerProps<T>) {
  const { setValue } = useFormContext<T>()
  const startValue = useWatch({ control, name: startName })
  const endValue = useWatch({ control, name: endName })

  const dateRange = useMemo<DateRange | undefined>(() => {
    if (!startValue) return undefined
    return {
      from: parseISO(startValue),
      to: endValue ? parseISO(endValue) : undefined,
    }
  }, [startValue, endValue])

  const handleChange = (range: DateRange | undefined) => {
    setValue(startName, (range?.from ? format(range.from, 'yyyy-MM-dd') : '') as never)
    setValue(endName, (range?.to ? format(range.to, 'yyyy-MM-dd') : '') as never)
  }

  return (
    <DateRangePicker
      value={dateRange}
      onChange={handleChange}
      maxDate={maxDate}
      className={className}
    />
  )
}
