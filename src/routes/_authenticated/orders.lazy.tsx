import { useState, Fragment } from 'react'
import { toast } from 'sonner'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { FilterSection } from '@/components/common/filter-section'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Download } from 'lucide-react'
import { OrdersFilter } from '@/components/common/filter/orders-filter/orders-filter'
import { getDefaultOrdersFilter, type OrdersFilterValues } from '@/components/common/filter/orders-filter/constants'
import { OrdersTable } from '@/features/orders/components/orders-table'
import { OrderDetailDialog } from '@/features/orders/components/order-detail-dialog'
import { useOrdersList, getDefaultOrdersParams } from '@/features/orders/queries'
import { fetchOrdersExcelData } from '@/features/orders/api'
import { downloadOrdersExcel } from '@/utils/excel'
import type { OrdersListParams } from '@/features/orders/schema'
import type { OrderItem } from '@/features/orders/schema'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'
import { useBrandList, useStoreList } from '@/hooks/useCommonQueries'
import { useAuthStore, selectIsBrandAccount, selectIsStoreAccount } from '@/store/useAuthStore'
import { useStoreInformation, useMyBrandDetail } from '@/features/auth/hooks/useMyAccount'
import { ORDER_STATUS_ENUM } from '@/constants/order'
import { ORDER_CHANNEL_OPTIONS } from '@/components/common/filter/orders-filter/constants'

export const Route = createLazyFileRoute('/_authenticated/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const [params, setParams] = useState<OrdersListParams>(getDefaultOrdersParams)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const orderDetailDialogKey = useDialogKey(!!selectedOrder, selectedOrder?.id)
  const [isDownloading, setIsDownloading] = useState(false)
  const userBrandId = useAuthStore((s) => s.userBrandId)
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const isBrandAccount = useAuthStore(selectIsBrandAccount)
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const { data: brandList = [] } = useBrandList()
  const { data: storeList = [] } = useStoreList()
  const { data: brandDetail } = useMyBrandDetail()
  const { data: storeInfo } = useStoreInformation()

  const form = useForm<OrdersFilterValues>({ defaultValues: getDefaultOrdersFilter() })

  const { data, isLoading } = useOrdersList(params)

  const totalCount = data?.count ?? 0

  const handleFilterSubmit = (filter: OrdersFilterValues) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      startDate: filter.startDate,
      endDate: filter.endDate,
      orderSn: filter.search_key === 'orderSn' ? filter.q || undefined : undefined,
      employeeNumber: filter.search_key === 'employeeNumber' ? filter.q || undefined : undefined,
      brandIdIn: filter.brandIdIn.length ? filter.brandIdIn.join(',') : undefined,
      storeIdIn: filter.storeIdIn.length ? filter.storeIdIn.join(',') : undefined,
      takeTypeIn: filter.takeTypeIn.length ? filter.takeTypeIn.map(Number) : undefined,
      orderChannelIn: filter.orderChannelIn.length ? filter.orderChannelIn : undefined,
      statusIn: filter.statusIn.length ? filter.statusIn.join(',') : undefined,
    }))
  }

  const handleReset = () => {
    setParams(getDefaultOrdersParams())
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (per_page: number) => {
    setParams((prev) => ({ ...prev, per_page, page: 1 }))
  }

  const handleOrderClick = (order: OrderItem) => {
    setSelectedOrder(order)
  }

  const handleExcelDownload = async () => {
    if (isDownloading || !totalCount) return
    setIsDownloading(true)
    try {
      const { data: apiData, startDate, endDate } = await fetchOrdersExcelData(params)

      // 계정 타입별 브랜드/매장명 resolve
      let brandName = '전체'
      let storeName = '전체'

      if (isStoreAccount) {
        // 매장 계정: 소속 브랜드 + 본인 매장 고정
        brandName = storeInfo?.brand?.name ?? '전체'
        storeName = storeInfo?.name ?? storeList.find(s => String(s.id) === String(userStoreId))?.name ?? '전체'
      } else if (isBrandAccount) {
        // 브랜드 계정: 본인 브랜드 고정, 매장은 필터값
        brandName = brandDetail?.name ?? brandList.find(b => String(b.id) === String(userBrandId))?.name ?? '전체'
        if (params.storeIdIn) {
          const ids = Array.isArray(params.storeIdIn) ? params.storeIdIn : String(params.storeIdIn).split(',')
          storeName = ids.map((id: string) => storeList.find(s => String(s.id) === String(id))?.name).filter(Boolean).join(', ') || '전체'
        }
      } else {
        // 운영사: 필터값 기반
        if (params.brandIdIn) {
          const ids = Array.isArray(params.brandIdIn) ? params.brandIdIn : String(params.brandIdIn).split(',')
          brandName = ids.map((id: string) => brandList.find(b => String(b.id) === String(id))?.name).filter(Boolean).join(', ') || '전체'
        }
        if (params.storeIdIn) {
          const ids = Array.isArray(params.storeIdIn) ? params.storeIdIn : String(params.storeIdIn).split(',')
          storeName = ids.map((id: string) => storeList.find(s => String(s.id) === String(id))?.name).filter(Boolean).join(', ') || '전체'
        }
      }

      const statusName = params.statusIn
        ? (Array.isArray(params.statusIn) ? params.statusIn : String(params.statusIn).split(',')).map((v: string) => ORDER_STATUS_ENUM[Number(v) as keyof typeof ORDER_STATUS_ENUM]).filter(Boolean).join(', ')
        : '전체'

      const channelName = params.orderChannelIn
        ? (Array.isArray(params.orderChannelIn) ? params.orderChannelIn : [params.orderChannelIn]).map((v: string) => ORDER_CHANNEL_OPTIONS.find(o => o.value === v)?.label).filter(Boolean).join(', ')
        : '전체'

      let searchKeyword = ''
      if (params.orderSn) searchKeyword = `주문ID: ${params.orderSn}`
      else if (params.employeeNumber) searchKeyword = `회원번호: ${params.employeeNumber}`

      await downloadOrdersExcel({
        apiData,
        startDate,
        endDate,
        meta: { searchKeyword, brandName, storeName, statusName, channelName },
      })
    } catch {
      toast.error('파일 다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleOrderCancelled = () => {
    setSelectedOrder(null)
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={getDefaultOrdersFilter()}
          onSubmit={handleFilterSubmit}
          onReset={handleReset}
        >
          <OrdersFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="pt-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.per_page}
          onPageSizeChange={handlePageSizeChange}
          actions={[
            { icon: Download, label: isDownloading ? '다운로드 중...' : '엑셀 저장', onClick: handleExcelDownload, disabled: !totalCount || isDownloading },
          ]}
        />

        <OrdersTable
          data={data?.results ?? []}
          totalCount={totalCount}
          page={params.page}
          pageSize={params.per_page}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onRowClick={handleOrderClick}
        />

        <OrderDetailDialog
          key={orderDetailDialogKey}
          orderId={selectedOrder?.id ?? null}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderCancelled={handleOrderCancelled}
        />
      </PageLayout>
    </Fragment>
  )
}
