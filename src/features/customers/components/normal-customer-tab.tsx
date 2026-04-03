import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { PageLayout } from '@/components/layout/page-layout'
import { FilterSection } from '@/components/common/filter-section'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Download } from 'lucide-react'
import { NormalCustomerFilter } from '@/components/common/filter/normal-customer-filter/normal-customer-filter'
import { getDefaultNormalCustomerFilter, type NormalCustomerFilterValues } from '@/components/common/filter/normal-customer-filter/constants'
import { downloadNormalCustomersExcel } from '@/utils/excel'
import { NormalCustomerTable } from './normal-customer-table'
import { useNormalCustomers, useNormalCustomersExcelDownload } from '@/features/customers/queries'
import type { NormalCustomersParams } from '@/features/customers/schema'
import { useAuthStore } from '@/store/useAuthStore'
import { useBrandList } from '@/hooks/useCommonQueries'

interface NormalCustomerTabProps {
  brandId: string
}

export function NormalCustomerTab({ brandId }: NormalCustomerTabProps) {
  const userBrandId = useAuthStore((s) => s.userBrandId)
  const { data: brandList = [] } = useBrandList()
  const brandName = brandList.find((b) => b.id === userBrandId)?.name ?? ''

  const [params, setParams] = useState<NormalCustomersParams>({
    brandId,
    page: 1,
    per_page: 20,
  })

  const form = useForm<NormalCustomerFilterValues>({ defaultValues: getDefaultNormalCustomerFilter() })

  const { data, isLoading } = useNormalCustomers(params)
  const { mutate: downloadExcel, isPending: isDownloading } = useNormalCustomersExcelDownload()

  const totalCount = data?.count ?? 0

  const handleFilterSubmit = (filter: NormalCustomerFilterValues) => {
    // 광고수신동의: 1개만 선택 = 해당 값, 0개 or 2개 = 전체(undefined)
    const is_subscribed: boolean | undefined =
      filter.is_subscribed.length === 1
        ? filter.is_subscribed[0] === 'true'
        : undefined

    setParams((prev) => ({
      ...prev,
      page: 1,
      registered_store_ids: filter.registered_store_ids.length
        ? filter.registered_store_ids.map(Number)
        : undefined,
      search_key: filter.q ? filter.search_key : undefined,
      search_value: filter.q || undefined,
      is_subscribed,
    }))
  }

  const handleFilterReset = () => {
    setParams({ brandId, page: 1, per_page: 20 })
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (per_page: number) => {
    setParams((prev) => ({ ...prev, per_page, page: 1 }))
  }

  const handleExcelDownload = () => {
    downloadExcel(params, {
      onSuccess: (rawData) => {
        const apiData = rawData as unknown[][]
        if (!apiData?.length) return

        downloadNormalCustomersExcel({
          apiData,
          fileName: `${brandName}_일반고객_${format(new Date(), 'yyMMdd')}.xlsx`,
        })
      },
    })
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={getDefaultNormalCustomerFilter()}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <NormalCustomerFilter brandId={brandId} />
        </FilterSection>
      </PageLayout>

      <PageLayout className="py-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.per_page}
          onPageSizeChange={handlePageSizeChange}
          actions={[
            { icon: Download, label: isDownloading ? '다운로드 중...' : '엑셀 저장', onClick: handleExcelDownload, disabled: !totalCount || isDownloading },
          ]}
        />

        <NormalCustomerTable
          data={data?.results ?? []}
          totalCount={totalCount}
          page={params.page}
          pageSize={params.per_page}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </PageLayout>
    </Fragment>
  )
}
