import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TableToolbar } from '@/components/common/table-toolbar'
import { FilterSection } from '@/components/common/filter-section'
import { IssuanceHistoryFilter } from '@/components/common/filter/issuance-history-filter/issuance-history-filter'
import { getDefaultIssuanceHistoryFilter, type IssuanceHistoryFilterValues } from '@/components/common/filter/issuance-history-filter/constants'
import { IssuanceHistoryTable } from '@/features/benefit-management/components/issuance-history-table'
import { useIssuedCoupons } from '@/features/benefit-management/queries'
import type { IssuedCouponListParams } from '@/features/benefit-management/schema'
import { PageLayout } from '@/components/layout/page-layout'

function getDefaultIssuedParams(): IssuedCouponListParams {
  const defaults = getDefaultIssuanceHistoryFilter()
  return { startDate: defaults.startDate, endDate: defaults.endDate, page: 1, page_size: 20 }
}

export function IssuanceHistoryTab() {
  const [params, setParams] = useState<IssuedCouponListParams>(getDefaultIssuedParams)
  const form = useForm<IssuanceHistoryFilterValues>({ defaultValues: getDefaultIssuanceHistoryFilter() })

  const { data, isLoading } = useIssuedCoupons(params)
  const totalCount = data?.count ?? 0
  const issuedCoupons = data?.results ?? []

  const handleFilterSubmit = (filter: IssuanceHistoryFilterValues) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      startDate: filter.startDate,
      endDate: filter.endDate,
      search: filter.search || undefined,
      brand_id__in: filter.brand_id__in.length ? filter.brand_id__in.join(',') : undefined,
      store_id__in: filter.store_id__in.length ? filter.store_id__in.join(',') : undefined,
      status__in: filter.status__in.length ? filter.status__in.join(',') : undefined,
    }))
  }

  const handleReset = () => setParams(getDefaultIssuedParams())

  const handlePageChange = (page: number) => setParams((prev) => ({ ...prev, page }))

  const handlePageSizeChange = (page_size: number) =>
    setParams((prev) => ({ ...prev, page_size, page: 1 }))

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={getDefaultIssuanceHistoryFilter()}
          onSubmit={handleFilterSubmit}
          onReset={handleReset}
        >
          <IssuanceHistoryFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.page_size ?? 20}
          onPageSizeChange={handlePageSizeChange}
        />
        <IssuanceHistoryTable
          data={issuedCoupons}
          totalCount={totalCount}
          page={params.page ?? 1}
          pageSize={params.page_size ?? 20}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </PageLayout>
    </Fragment>
  )
}
