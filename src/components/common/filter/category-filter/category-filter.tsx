import { useFormContext } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledRadioGroup } from '@/components/common/hook-form/controlled-radio-group'
import type { CategoryFilterValues } from './constants'
import { STATUS_OPTIONS, OPERATION_MODE_OPTIONS } from './constants'

export function CategoryFilter() {
  const { control } = useFormContext<CategoryFilterValues>()

  return (
    <>
      {/* 검색 */}
      <FilterItem label="검색">
        <ControlledInput
          name="q"
          control={control}
          placeholder="상품 카테고리명 입력"
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

      {/* 운영모드 상태 */}
      <FilterItem label="운영모드 상태">
        <ControlledRadioGroup
          name="operation_mode_applied"
          control={control}
          options={OPERATION_MODE_OPTIONS}
          className="flex items-center gap-4"
        />
      </FilterItem>
    </>
  )
}
