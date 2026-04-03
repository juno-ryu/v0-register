import { useFormContext } from 'react-hook-form'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledInput } from '@/components/common/hook-form/controlled-input'
import { ControlledSelect } from '@/components/common/hook-form/controlled-select'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { useAuthStore, selectIsManagementAccount, selectIsBrandAccount } from '@/store/useAuthStore'
import { useCustomerCompanies } from '@/features/customers/queries'
import type { MembershipCustomerFilterValues } from './constants'
import { SEARCH_KEY_OPTIONS, STATUS_OPTIONS } from './constants'

interface MembershipCustomerFilterProps {
  brandId: string
}

export function MembershipCustomerFilter({ brandId }: MembershipCustomerFilterProps) {
  const { control } = useFormContext<MembershipCustomerFilterValues>()
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isBrand = useAuthStore(selectIsBrandAccount)

  const { data: companies = [] } = useCustomerCompanies(brandId)

  return (
    <>
      {/* 소속(고객사) — 운영사/브랜드 계정만 */}
      {(isManagement || isBrand) && (
        <FilterItem label="소속">
          <ControlledMultiSelectCombobox
            name="customer_company_ids"
            control={control}
            items={companies}
            placeholder="소속 선택"
            searchPlaceholder="소속 검색"
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
            placeholder="검색어 입력"
            className="md:flex-1 bg-background typo-body3"
          />
        </div>
      </FilterItem>

      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledCheckboxGroup
          name="status"
          control={control}
          options={STATUS_OPTIONS}
        />
      </FilterItem>
    </>
  )
}
