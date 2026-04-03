import { useFormContext, useWatch } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledSelect } from '@/components/common/hook-form/controlled-select'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledRadioGroup } from '@/components/common/hook-form/controlled-radio-group'
import type { MenuFilterValues } from './constants'
import { SEARCH_KEY_OPTIONS, STATUS_OPTIONS, IMAGE_OPTIONS } from './constants'

export function MenuFilter() {
  const { control } = useFormContext<MenuFilterValues>()
  const searchKey = useWatch({ control, name: 'search_key' })

  return (
    <>
      {/* 검색 */}
      <FilterItem label="검색">
        <div className="flex items-center gap-2 max-md:flex-col">
          <ControlledSelect
            name="search_key"
            control={control}
            options={SEARCH_KEY_OPTIONS}
            className="w-40 shrink-0 bg-background typo-body3 max-md:w-full"
          />
          <ControlledInput
            name="q"
            control={control}
            placeholder={searchKey === 'sn' ? 'SN 입력' : '상품명 입력'}
            className="md:flex-1 bg-background typo-body3"
          />
        </div>
      </FilterItem>

      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledCheckboxGroup
          name="is_active"
          control={control}
          options={STATUS_OPTIONS}
        />
      </FilterItem>

      {/* 이미지 상태 */}
      <FilterItem label="이미지 상태">
        <ControlledRadioGroup
          name="has_image"
          control={control}
          options={IMAGE_OPTIONS}
          className="flex items-center gap-4"
        />
      </FilterItem>
    </>
  )
}
