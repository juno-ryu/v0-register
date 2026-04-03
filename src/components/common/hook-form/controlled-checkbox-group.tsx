import { useId } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { SelectOption } from '@/components/common/filter/constants'

interface ControlledCheckboxGroupProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  /** 체크박스 옵션 목록 — value: 'all'이면 전체 선택/해제 처리 */
  options: SelectOption[]
}

export function ControlledCheckboxGroup<T extends FieldValues>({
  name,
  control,
  options,
}: ControlledCheckboxGroupProps<T>) {
  const uid = useId()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const values: string[] = field.value ?? []
        const allValues = options.filter((o) => o.value !== 'all').map((o) => o.value as string)
        const isAllChecked = allValues.every((v) => values.includes(v))

        const toggle = (value: string) => {
          if (value === 'all') {
            field.onChange(isAllChecked ? [] : allValues)
            return
          }
          field.onChange(
            values.includes(value)
              ? values.filter((v) => v !== value)
              : [...values, value],
          )
        }

        return (
          <div className="flex items-center gap-4 max-md:flex-wrap">
            {options.map(({ value, label }) => {
              const checked = value === 'all' ? isAllChecked : values.includes(value)
              const id = `${uid}-${name}-${value}`
              return (
                <div key={value} className="flex items-center gap-1.5">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() => toggle(value)}
                    className="bg-background"
                  />
                  <Label htmlFor={id} className="cursor-pointer typo-body3 weight-400 whitespace-pre">
                    {label}
                  </Label>
                </div>
              )
            })}
          </div>
        )
      }}
    />
  )
}
