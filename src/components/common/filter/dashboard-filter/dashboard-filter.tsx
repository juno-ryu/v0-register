import { useEffect, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { FilterItem } from '@/components/common/filter-section'
import { ControlledMultiSelectCombobox } from '@/components/common/hook-form/controlled-multi-select-combobox'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import { useBrandList, commonStoreListQueryOptions } from '@/hooks/useCommonQueries'
import type { DashboardFilterValues } from './constants'

export function DashboardFilter() {
  const { control, setValue } = useFormContext<DashboardFilterValues>()
  const isManagementAccount = useAuthStore(selectIsManagementAccount)

  const brandIds = useWatch({ control, name: 'brand_id__in' })

  const { data: brandList = [] } = useBrandList(isManagementAccount)

  // 레거시 동일: brand_id__in=id1,id2,... 로 한 번에 호출
  const { data: storeList = [] } = useQuery(
    commonStoreListQueryOptions(brandIds.length > 0 ? brandIds : undefined),
  )

  // 브랜드 실제 변경 시에만 매장 선택 초기화 (useWatch가 재렌더링마다 새 배열 참조를 반환하므로 값 비교 필요)
  const prevBrandIdsRef = useRef<string>(JSON.stringify(brandIds))
  useEffect(() => {
    const key = JSON.stringify(brandIds)
    if (prevBrandIdsRef.current !== key) {
      prevBrandIdsRef.current = key
      setValue('store_id__in', [])
    }
  }, [brandIds, setValue])

  return (
    <>
      {isManagementAccount && (
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

      <FilterItem label="매장">
        <ControlledMultiSelectCombobox
          name="store_id__in"
          control={control}
          items={storeList}
          placeholder="매장 선택"
          searchPlaceholder="매장 검색"
        />
      </FilterItem>
    </>
  )
}
