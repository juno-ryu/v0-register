import { useFormContext } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { ControlledDateRangePicker } from '@/components/common/hook-form/controlled-date-range-picker'
import { ControlledRadioGroup } from '@/components/common/hook-form/controlled-radio-group'
import { useAuthStore, selectIsBrandAccount } from '@/store/useAuthStore'
import { useStoreList } from '@/hooks/useCommonQueries'
import { STATISTICS_TYPE_OPTIONS } from '@/features/statistics/schema'
import type { StatisticsFilterValues } from './constants'

export function StatisticsFilter() {
  const { control } = useFormContext<StatisticsFilterValues>()
  const isBrandAccount = useAuthStore(selectIsBrandAccount)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  const { data: storeList = [] } = useStoreList(isBrandAccount ? userBrandId : null)

  return (
    <>
      {/* 매장 — 브랜드 계정만 표시 */}
      {isBrandAccount && (
        <FilterItem label="매장">
          <ControlledMultiSelectCombobox
            name="store_id"
            control={control}
            items={storeList}
            placeholder="매장 선택"
            searchPlaceholder="매장 검색"
            mode="single"
            showChips={false}
          />
        </FilterItem>
      )}

      {/* 기간 */}
      <FilterItem label="기간">
        <ControlledDateRangePicker
          startName="from_date"
          endName="to_date"
          control={control}
          maxDate={new Date()}
        />
      </FilterItem>

      {/* 통계 타입 */}
      <FilterItem label="통계">
        <ControlledRadioGroup
          name="statistics_type"
          control={control}
          options={STATISTICS_TYPE_OPTIONS}
          className="flex items-center gap-4"
        />
      </FilterItem>
    </>
  )
}
