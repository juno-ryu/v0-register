import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { ControlledDateRangePicker } from '@/components/common/hook-form/controlled-date-range-picker'
import { useAuthStore, selectIsManagementAccount, selectIsStoreAccount } from '@/store/useAuthStore'
import { useBrandList, useStoreList } from '@/hooks/useCommonQueries'
import type { IssuanceHistoryFilterValues } from './constants'
import { ISSUED_STATUS_OPTIONS } from './constants'

export function IssuanceHistoryFilter() {
  const { control, setValue } = useFormContext<IssuanceHistoryFilterValues>()
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isStore = useAuthStore(selectIsStoreAccount)

  const brandIds = useWatch({ control, name: 'brand_id__in' })

  const { data: brandList = [] } = useBrandList(isManagement)
  const { data: storeList = [] } = useStoreList(
    brandIds.length === 1 ? brandIds[0] : undefined,
  )

  // 브랜드 변경 시 매장 선택 초기화
  useEffect(() => {
    setValue('store_id__in', [])
  }, [brandIds, setValue])

  return (
    <>
      {/* 브랜드 — 운영사 계정만 */}
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

      {/* 매장 — 매장 계정 제외 */}
      {!isStore && (
        <FilterItem label="매장">
          <ControlledMultiSelectCombobox
            name="store_id__in"
            control={control}
            items={storeList}
            placeholder="매장 선택"
            searchPlaceholder="매장 검색"
          />
        </FilterItem>
      )}

      {/* 쿠폰명 */}
      <FilterItem label="쿠폰명">
        <ControlledInput
          name="search"
          control={control}
          placeholder="쿠폰명 입력"
          className="flex-1 bg-background typo-body3"
        />
      </FilterItem>

      {/* 발행쿠폰 상태 */}
      <FilterItem label="발행쿠폰 상태">
        <ControlledCheckboxGroup
          name="status__in"
          control={control}
          options={ISSUED_STATUS_OPTIONS}
        />
      </FilterItem>

      {/* 발행일 범위 */}
      <FilterItem label="발행일">
        <ControlledDateRangePicker
          startName="startDate"
          endName="endDate"
          control={control}
          maxDate={new Date()}
        />
      </FilterItem>
    </>
  )
}
