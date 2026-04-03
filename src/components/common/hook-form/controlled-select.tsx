import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SelectOption } from '@/components/common/filter/constants'

interface ControlledSelectProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  options: SelectOption[]
  className?: string
}

export function ControlledSelect<T extends FieldValues>({
  name,
  control,
  options,
  className,
}: ControlledSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className={className}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}
