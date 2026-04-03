import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { format } from 'date-fns'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { ControlledDateInput } from '@/components/common/hook-form/controlled-date-input'
import { useAuthStore, selectIsManagementAccount, selectIsStoreAccount } from '@/store/useAuthStore'
import { useBrandList, useStoreList } from '@/hooks/useCommonQueries'
import type { BenefitsFilterValues } from './constants'
import { COUPON_STATUS_OPTIONS } from './constants'

export function BenefitsFilter() {
  const { control, setValue } = useFormContext<BenefitsFilterValues>()
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

  const today = format(new Date(), 'yyyy-MM-dd')

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

      {/* 매장 계정: 발행일 범위 / 그 외: 쿠폰 상태 */}
      {isStore ? (
        <FilterItem label="발행일">
          <div className="flex items-center gap-2">
            <ControlledDateInput name="issuable_start_date" control={control} max={today} />
            <span className="text-neutral-400">~</span>
            <ControlledDateInput name="issuable_end_date" control={control} max={today} />
          </div>
        </FilterItem>
      ) : (
        <FilterItem label="쿠폰 상태">
          <ControlledCheckboxGroup
            name="status__in"
            control={control}
            options={COUPON_STATUS_OPTIONS}
          />
        </FilterItem>
      )}
    </>
  )
}
