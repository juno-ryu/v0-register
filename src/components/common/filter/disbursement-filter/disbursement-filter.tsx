import { useFormContext } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { ControlledCheckboxGroup } from '@/components/common/hook-form/controlled-checkbox-group'
import { useAuthStore, selectIsStoreAccount } from '@/store/useAuthStore'
import { useStoreList } from '@/hooks/useCommonQueries'
import { axiosInstance } from '@/lib/axios'
import { DISBURSEMENT_STATUS_OPTIONS, type DisbursementFilterValues } from './constants'

interface CustomerCompanyItem { id: number; name: string }

function useCustomerCompanyList(brandId?: string | null) {
  return useQuery({
    queryKey: ['customer-companies', 'list', brandId],
    queryFn: async () => {
      if (!brandId) return []
      const { data } = await axiosInstance.get<CustomerCompanyItem[]>(
        `/v1/b/brands/${brandId}/customer-companies`,
      )
      return Array.isArray(data) ? data : []
    },
    enabled: !!brandId,
  })
}

export function DisbursementFilter() {
  const { control } = useFormContext<DisbursementFilterValues>()
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const brandId = useAuthStore((s) => s.userBrandId)

  const { data: storeList = [] } = useStoreList()
  const { data: customerCompanyList = [] } = useCustomerCompanyList(brandId)

  return (
    <>
      {/* 매장 — 매장 계정 제외 */}
      {!isStoreAccount && (
        <FilterItem label="매장">
          <ControlledMultiSelectCombobox
            name="store_ids"
            control={control}
            items={storeList}
            placeholder="매장 선택"
            searchPlaceholder="매장 검색"
          />
        </FilterItem>
      )}

      {/* 고객사 — 매장 계정 제외 */}
      {!isStoreAccount && (
        <FilterItem label="고객사">
          <ControlledMultiSelectCombobox
            name="customer_company_ids"
            control={control}
            items={customerCompanyList}
            placeholder="고객사 선택"
            searchPlaceholder="고객사 검색"
          />
        </FilterItem>
      )}

      {/* 상태 */}
      <FilterItem label="상태">
        <ControlledCheckboxGroup
          name="disbursement_status"
          control={control}
          options={DISBURSEMENT_STATUS_OPTIONS}
        />
      </FilterItem>
    </>
  )
}
