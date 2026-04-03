import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledSelect } from '@/components/common/hook-form/controlled-select'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { ControlledDateRangePicker } from '@/components/common/hook-form/controlled-date-range-picker'
import { useAuthStore, selectIsManagementAccount, selectIsStoreAccount } from '@/store/useAuthStore'
import { useBrandList, useStoreList } from '@/hooks/useCommonQueries'
import { ORDER_STATUS } from '@/constants/order'
import type { OrdersFilterValues } from './constants'
import { SEARCH_KEY_OPTIONS, TAKE_TYPE_OPTIONS, ORDER_CHANNEL_OPTIONS } from './constants'

export function OrdersFilter() {
  const { control, setValue } = useFormContext<OrdersFilterValues>()
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isStore = useAuthStore(selectIsStoreAccount)

  const searchKey = useWatch({ control, name: 'search_key' })
  const brandIds = useWatch({ control, name: 'brandIdIn' })

  const { data: brandList = [] } = useBrandList(isManagement)
  const { data: storeList = [] } = useStoreList(
    brandIds.length === 1 ? brandIds[0] : undefined,
  )

  // 브랜드 변경 시 매장 선택 초기화
  useEffect(() => {
    setValue('storeIdIn', [])
  }, [brandIds, setValue])

  const statusItems = ORDER_STATUS.map((s) => ({ id: s.value, name: s.name }))

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
            placeholder={searchKey === 'orderSn' ? '주문ID 입력' : '회원번호 입력'}
            className="md:flex-1 bg-background typo-body3"
          />
        </div>
      </FilterItem>

      {/* 브랜드 — 운영사 계정만 */}
      {isManagement && (
        <FilterItem label="브랜드">
          <ControlledMultiSelectCombobox
            name="brandIdIn"
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
            name="storeIdIn"
            control={control}
            items={storeList}
            placeholder="매장 선택"
            searchPlaceholder="매장 검색"
          />
        </FilterItem>
      )}

      {/* 주문분류 */}
      <FilterItem label="주문분류">
        <ControlledCheckboxGroup
          name="takeTypeIn"
          control={control}
          options={TAKE_TYPE_OPTIONS}
        />
      </FilterItem>

      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledMultiSelectCombobox
          name="statusIn"
          control={control}
          items={statusItems}
          placeholder="상태 선택"
          searchPlaceholder="상태 검색"
        />
      </FilterItem>

      {/* 채널 */}
      <FilterItem label="채널">
        <ControlledCheckboxGroup
          name="orderChannelIn"
          control={control}
          options={ORDER_CHANNEL_OPTIONS}
        />
      </FilterItem>

      {/* 기간 */}
      <FilterItem label="기간">
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
