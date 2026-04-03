import { useId } from 'react'
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SelectOption } from '@/components/common/filter/constants'

interface ControlledRadioGroupProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  options: SelectOption[]
  className?: string
}

export function ControlledRadioGroup<T extends FieldValues>({
  name,
  control,
  options,
  className,
}: ControlledRadioGroupProps<T>) {
  const uid = useId()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          className={cn('flex flex-wrap items-center', className)}
        >
          {options.map(({ value, label }) => {
            const id = `${uid}-${name}-${value}`
            return (
              <div
                key={value}
                className="flex items-center gap-1.5 flex-nowrap"
              >
                <RadioGroupItem
                  value={value}
                  id={id}
                  className="bg-background shrink-0"
                />
                <Label
                  htmlFor={id}
                  className="cursor-pointer typo-body3 weight-400 whitespace-nowrap"
                >
                  {label}
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      )}
    />
  )
}
