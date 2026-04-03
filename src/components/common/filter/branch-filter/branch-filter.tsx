import { useFormContext, useWatch } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledSelect } from '@/components/common/hook-form/controlled-select'
import { ControlledRadioGroup } from '@/components/common/hook-form/controlled-radio-group'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import { useBrandList } from '@/hooks/useCommonQueries'
import type { BranchFilterValues } from './constants'
import { SEARCH_KEY_OPTIONS, STATUS_OPTIONS, TAKE_TYPE_OPTIONS } from './constants'

export function BranchFilter() {
  const { control } = useFormContext<BranchFilterValues>()
  const searchKey = useWatch({ control, name: 'search_key' })
  const isManagement = useAuthStore(selectIsManagementAccount)
  const { data: brandList = [] } = useBrandList(isManagement)

  const placeholder = SEARCH_KEY_OPTIONS.find((o) => o.value === searchKey)?.label ?? '입력'

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
            placeholder={`${placeholder} 입력`}
            className="md:flex-1 bg-background typo-body3"
          />
        </div>
      </FilterItem>

      {/* 브랜드 (운영사 전용) */}
      {isManagement && (
        <FilterItem label="브랜드">
          <ControlledMultiSelectCombobox
            name="brand_id__in"
            control={control}
            items={brandList}
            placeholder="브랜드 선택"
            searchPlaceholder="브랜드 검색"
          />
        </FilterItem>
      )}

      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledRadioGroup
          name="is_active"
          control={control}
          options={STATUS_OPTIONS}
          className="flex items-center gap-4"
        />
      </FilterItem>

      {/* 주문 서비스 */}
      <FilterItem label="주문 서비스">
        <ControlledCheckboxGroup
          name="available_take_types"
          control={control}
          options={TAKE_TYPE_OPTIONS}
        />
      </FilterItem>
    </>
  )
}
