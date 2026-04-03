import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { MultiSelectCombobox, type MultiSelectItem } from '@/components/common/multi-select-combobox'

interface ControlledMultiSelectComboboxProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  items: MultiSelectItem[]
  placeholder: string
  searchPlaceholder?: string
  mode?: 'multi' | 'single'
  showChips?: boolean
}

export function ControlledMultiSelectCombobox<T extends FieldValues>({
  name,
  control,
  items,
  placeholder,
  searchPlaceholder,
  mode,
  showChips,
}: ControlledMultiSelectComboboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <MultiSelectCombobox
          placeholder={placeholder}
          items={items}
          selectedValues={field.value ?? []}
          onSelectionChange={field.onChange}
          searchPlaceholder={searchPlaceholder}
          mode={mode}
          showChips={showChips}
        />
      )}
    />
  )
}
