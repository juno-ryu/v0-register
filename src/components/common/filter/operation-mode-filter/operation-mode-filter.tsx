import { useFormContext } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import type { OperationModeFilterValues } from './constants'
import { STATUS_OPTIONS } from './constants'

export function OperationModeFilter() {
  const { control } = useFormContext<OperationModeFilterValues>()

  return (
    <>
      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledCheckboxGroup
          name="is_active"
          control={control}
          options={STATUS_OPTIONS}
        />
      </FilterItem>
    </>
  )
}
