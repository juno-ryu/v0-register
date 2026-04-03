import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from '@/components/ui/input'

interface ControlledInputProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  placeholder?: string
  className?: string
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  placeholder,
  className,
}: ControlledInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input {...field} placeholder={placeholder} className={className} />
      )}
    />
  )
}
