import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createLazyFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useAuthStore, selectIsStoreAccount, selectUserStoreId } from '@/store/useAuthStore'
import { FilterSection } from '@/components/common/filter-section'
import { StatisticsFilter } from '@/components/common/filter/statistics-filter/statistics-filter'
import { type StatisticsFilterValues, getStatisticsFilterDefaults } from '@/components/common/filter/statistics-filter/constants'
import { StatisticsTable } from '@/features/statistics/components/statistics-table'
import { useStatistics } from '@/features/statistics/queries'
import {
  fetchAggregatedOrderMenusExcelData,
  fetchAggregatedOrderMenuOptionsExcelData,
} from '@/features/statistics/api'
import { STATISTICS_TYPE } from '@/features/statistics/schema'
import type { StatisticsType, StatisticsParams } from '@/features/statistics/schema'
import { PageLayout } from '@/components/layout/page-layout'
import { downloadStatisticsExcel } from '@/utils/excel'
import { useStoreList } from '@/hooks/useCommonQueries'

export const Route = createLazyFileRoute('/_authenticated/statistics')({
  component: StatisticsPage,
})

function StatisticsPage() {
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const userStoreId = useAuthStore(selectUserStoreId)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  const { data: storeList = [] } = useStoreList(userBrandId)

  const form = useForm<StatisticsFilterValues>({ defaultValues: getStatisticsFilterDefaults() })

  const [searchParams, setSearchParams] = useState<
    (StatisticsParams & { statisticsType: StatisticsType }) | null
  >(null)
  const [isSearched, setIsSearched] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data = [], isLoading } = useStatistics(
    searchParams ?? {
      storeId: isStoreAccount ? (userStoreId ?? '') : '',
      from_date: '',
      to_date: '',
      statisticsType: STATISTICS_TYPE.PRODUCT_SALES,
    },
    isSearched && !!searchParams,
  )

  const handleFilterSubmit = (values: StatisticsFilterValues) => {
    const storeId = isStoreAccount ? (userStoreId ?? '') : (values.store_id[0] ?? '')
    if (!storeId) {
      toast.error('매장을 선택해주세요.')
      return
    }
    setSearchParams({
      storeId,
      from_date: values.from_date,
      to_date: values.to_date,
      statisticsType: values.statistics_type as StatisticsType,
    })
    setIsSearched(true)
  }

  const handleFilterReset = () => {
    setSearchParams(null)
    setIsSearched(false)
  }

  const handleDownloadExcel = async () => {
    if (!searchParams || isDownloading) return
    setIsDownloading(true)
    try {
      const isProductSales = searchParams.statisticsType === STATISTICS_TYPE.PRODUCT_SALES
      const apiData = isProductSales
        ? await fetchAggregatedOrderMenusExcelData(searchParams)
        : await fetchAggregatedOrderMenuOptionsExcelData(searchParams)

      const storeName = storeList.find((s) => s.id === searchParams.storeId)?.name ?? ''
      const dateFormat = 'yyMMdd'
      const from = format(new Date(searchParams.from_date), dateFormat)
      const to = format(new Date(searchParams.to_date), dateFormat)
      const typeLabel = isProductSales ? '상품매출통계' : '상품옵션매출통계'
      await downloadStatisticsExcel({
        apiData,
        fileName: `${typeLabel}_${storeName}_${from}~${to}.xlsx`,
      })
    } catch {
      toast.error('파일 다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        {/* 필터 */}
        <FilterSection
          form={form}
          defaultValues={getStatisticsFilterDefaults()}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <StatisticsFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-4">
        <StatisticsTable
          data={data}
          statisticsType={searchParams?.statisticsType ?? STATISTICS_TYPE.PRODUCT_SALES}
          fromDate={searchParams?.from_date ?? ''}
          toDate={searchParams?.to_date ?? ''}
          isLoading={isLoading}
          onDownloadExcel={handleDownloadExcel}
        />
      </PageLayout>
    </Fragment>
  )
}
