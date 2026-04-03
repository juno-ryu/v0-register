import { useFormContext } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import type { OptionFilterValues } from './constants'
import { STATUS_OPTIONS } from './constants'

export function OptionFilter() {
  const { control } = useFormContext<OptionFilterValues>()

  return (
    <>
      {/* 검색 */}
      <FilterItem label="검색">
        <ControlledInput
          name="q"
          control={control}
          placeholder="상품 옵션명 입력"
          className="flex-1 bg-background typo-body3"
        />
      </FilterItem>

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
