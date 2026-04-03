import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createLazyFileRoute } from '@tanstack/react-router'
import { TermSelector } from '@/features/dashboard/components/term-selector'
import { PageLayout } from '@/components/layout/page-layout'
import { SummaryBoxes } from '@/features/dashboard/components/summary-boxes'
import { RevenueChart } from '@/features/dashboard/components/revenue-chart'
import { FilterSection } from '@/components/common/filter-section'
import { DashboardFilter } from '@/components/common/filter/dashboard-filter/dashboard-filter'
import { type DashboardFilterValues, DASHBOARD_FILTER_DEFAULTS } from '@/components/common/filter/dashboard-filter/constants'
import { useDashboardData, useDashboardChart, getDefaultDashboardParams } from '@/features/dashboard/queries'
import { useAuthStore, selectIsStoreAccount } from '@/store/useAuthStore'
import type { DashboardParams, TermType } from '@/features/dashboard/schema'

export const Route = createLazyFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const form = useForm<DashboardFilterValues>({ defaultValues: DASHBOARD_FILTER_DEFAULTS })
  const [params, setParams] = useState<DashboardParams>(getDefaultDashboardParams)

  const { data: dashboardData, isLoading: isDataLoading } = useDashboardData(params)
  const { data: chartData, isLoading: isChartLoading } = useDashboardChart(params)

  const handleDateChange = (payload: { startDate: string; endDate: string; term: TermType }) => {
    setParams((prev) => ({ ...prev, ...payload }))
  }

  const handleFilterSubmit = (values: DashboardFilterValues) => {
    setParams((prev) => ({
      ...prev,
      brandId: values.brand_id__in.length > 0 ? values.brand_id__in.join(',') : null,
      storeId: values.store_id__in.length > 0 ? values.store_id__in.join(',') : null,
    }))
  }

  const handleFilterReset = () => {
    setParams((prev) => ({ ...prev, brandId: null, storeId: null }))
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        {!isStoreAccount && (
          <FilterSection
            form={form}
            defaultValues={DASHBOARD_FILTER_DEFAULTS}
            onSubmit={handleFilterSubmit}
            onReset={handleFilterReset}
          >
            <DashboardFilter />
          </FilterSection>
        )}
      </PageLayout>
      <PageLayout className="py-0">

        <TermSelector isTodayIncluded={false} onChange={handleDateChange} />

        <h1 className="px-2.5 typo-headline4 weight-700">데이터 브리핑</h1>

        <SummaryBoxes
          data={dashboardData}
          term={params.term}
          isLoading={isDataLoading}
        />

        <RevenueChart
          data={chartData ?? []}
          term={params.term}
          isLoading={isChartLoading}
        />
      </PageLayout>
    </Fragment>
  )
}
