import { useFormContext, useWatch } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledSelect } from '@/components/common/hook-form/controlled-select'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { useAuthStore, selectIsManagementAccount, selectIsBrandAccount } from '@/store/useAuthStore'
import { useStoreList } from '@/hooks/useCommonQueries'
import type { NormalCustomerFilterValues } from './constants'
import { SEARCH_KEY_OPTIONS, IS_SUBSCRIBED_OPTIONS } from './constants'

const SEARCH_PLACEHOLDER: Record<string, string> = {
  phone_number: '연락처 입력',
  name: '이름 입력',
  user_id: '고객번호 입력',
}

interface NormalCustomerFilterProps {
  brandId: string
}

export function NormalCustomerFilter({ brandId }: NormalCustomerFilterProps) {
  const { control } = useFormContext<NormalCustomerFilterValues>()
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isBrand = useAuthStore(selectIsBrandAccount)

  const searchKey = useWatch({ control, name: 'search_key' })
  const { data: storeList = [] } = useStoreList(brandId)

  return (
    <>
      {/* 가입경로(매장) — 운영사/브랜드 계정만 */}
      {(isManagement || isBrand) && (
        <FilterItem label="가입경로">
          <ControlledMultiSelectCombobox
            name="registered_store_ids"
            control={control}
            items={storeList}
            placeholder="가입경로 선택"
            searchPlaceholder="매장 검색"
          />
        </FilterItem>
      )}

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
            placeholder={SEARCH_PLACEHOLDER[searchKey] ?? '검색어 입력'}
            className="md:flex-1 bg-background typo-body3"
          />
        </div>
      </FilterItem>

      {/* 광고수신동의 */}
      <FilterItem label="광고수신동의">
        <ControlledCheckboxGroup
          name="is_subscribed"
          control={control}
          options={IS_SUBSCRIBED_OPTIONS}
        />
      </FilterItem>
    </>
  )
}
