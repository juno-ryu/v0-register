import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from '@/components/ui/input'

interface ControlledDateInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  min?: string
  max?: string
  className?: string
}

export function ControlledDateInput<T extends FieldValues>({
  name,
  control,
  min,
  max,
  className,
}: ControlledDateInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input type="date" {...field} min={min} max={max} className={className} />
      )}
    />
  )
}
