import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PageLayout } from '@/components/layout/page-layout'
import { FilterSection } from '@/components/common/filter-section'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Upload, History } from 'lucide-react'
import { MembershipCustomerFilter } from '@/components/common/filter/membership-customer-filter/membership-customer-filter'
import { getDefaultMembershipCustomerFilter, type MembershipCustomerFilterValues } from '@/components/common/filter/membership-customer-filter/constants'
import { MembershipCustomerTable } from './membership-customer-table'
import { CustomerDetailModal } from './customer-detail-modal'
import { ExcelUploadDialog } from './excel-upload-dialog'
import { UpdateHistoryDialog } from './update-history-dialog'
import { useMembershipCustomers, useChangeMembershipCustomerStatus } from '@/features/customers/queries'
import { MEMBER_STATUS } from '@/features/customers/schema'
import type { MembershipCustomersParams, MembershipCustomerItem } from '@/features/customers/schema'
import { useDialogKey } from '@/hooks/useDialogKey'

interface MembershipCustomerTabProps {
  brandId: string
}

export function MembershipCustomerTab({ brandId }: MembershipCustomerTabProps) {
  const [params, setParams] = useState<MembershipCustomersParams>({
    brandId,
    page: 1,
    per_page: 20,
    status: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.STOPPED, MEMBER_STATUS.PASSWORD_SET_REQUIRED].join(','),
  })

  const form = useForm<MembershipCustomerFilterValues>({ defaultValues: getDefaultMembershipCustomerFilter() })

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [detailModalOpen, setDetailSheetOpen] = useState(false)
  const [excelUploadOpen, setExcelUploadOpen] = useState(false)
  const [updateHistoryOpen, setUpdateHistoryOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<MembershipCustomerItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const customerDetailModalKey = useDialogKey(detailModalOpen, selectedCustomerId)
  const excelUploadDialogKey = useDialogKey(excelUploadOpen)
  const updateHistoryDialogKey = useDialogKey(updateHistoryOpen)

  const { data, isLoading } = useMembershipCustomers(params)
  const { mutate: changeStatus } = useChangeMembershipCustomerStatus()

  const totalCount = data?.count ?? 0

  const handleFilterSubmit = (filter: MembershipCustomerFilterValues) => {
    // 연락처 검색 시 숫자만 추출 (레거시 동일)
    const processedQ =
      filter.search_key === 'phone_number'
        ? filter.q.replace(/[^0-9]/g, '')
        : filter.q

    setParams((prev) => ({
      ...prev,
      page: 1,
      customer_company_ids: filter.customer_company_ids.length
        ? filter.customer_company_ids.map(Number)
        : undefined,
      search_key: processedQ ? filter.search_key : undefined,
      search_val: processedQ || undefined,
      status: filter.status.length ? filter.status.join(',') : undefined,
    }))
  }

  const handleFilterReset = () => {
    setParams({
      brandId,
      page: 1,
      per_page: 20,
      status: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.STOPPED, MEMBER_STATUS.PASSWORD_SET_REQUIRED].join(','),
    })
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (per_page: number) => {
    setParams((prev) => ({ ...prev, per_page, page: 1 }))
  }

  const handleRowClick = (customer: MembershipCustomerItem) => {
    setSelectedCustomerId(customer.id)
    setDetailSheetOpen(true)
  }

  const handleDeleteClick = (customer: MembershipCustomerItem) => {
    if (customer.status === MEMBER_STATUS.DELETED) {
      toast.info('이미 삭제된 회원입니다.')
      return
    }
    setCustomerToDelete(customer)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!customerToDelete) return
    changeStatus(
      { brandId: Number(brandId), customerId: customerToDelete.id, status: MEMBER_STATUS.DELETED },
      {
        onSuccess: () => {
          setDeleteConfirmOpen(false)
          setCustomerToDelete(null)
          toast.success('회원이 삭제되었습니다.')
        },
      },
    )
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={getDefaultMembershipCustomerFilter()}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <MembershipCustomerFilter brandId={brandId} />
        </FilterSection>
      </PageLayout>

      <PageLayout className="py-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.per_page}
          onPageSizeChange={handlePageSizeChange}
          actions={[
            { icon: Upload, label: '엑셀 업로드', onClick: () => setExcelUploadOpen(true), variant: 'outline' },
            { icon: History, label: '회원 업데이트 내역', onClick: () => setUpdateHistoryOpen(true), variant: 'outline' },
          ]}
        />

        <MembershipCustomerTable
          data={data?.results ?? []}
          totalCount={totalCount}
          page={params.page}
          pageSize={params.per_page}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onDeleteClick={handleDeleteClick}
        />
      </PageLayout>

      <CustomerDetailModal
        key={customerDetailModalKey}
        brandId={brandId}
        customerId={selectedCustomerId}
        open={detailModalOpen}
        onClose={() => setDetailSheetOpen(false)}
      />

      <ExcelUploadDialog
        key={excelUploadDialogKey}
        open={excelUploadOpen}
        onOpenChange={setExcelUploadOpen}
        brandId={brandId}
      />

      <UpdateHistoryDialog
        key={updateHistoryDialogKey}
        open={updateHistoryOpen}
        onOpenChange={setUpdateHistoryOpen}
        brandId={brandId}
        onExcelUploadClick={() => setExcelUploadOpen(true)}
      />

      <ConfirmDialog
        open={deleteConfirmOpen && !!customerToDelete}
        variant="success"
        title="회원 삭제"
        description={
          <div className="space-y-4">
            <p>
              선택한 회원을 삭제하시겠습니까?
              <br />
              이 작업은 취소하거나 되돌릴 수 없습니다.
            </p>
            <div className="space-y-1">
              <p><span className="weight-700">회원번호:</span> {customerToDelete?.employee_number}</p>
              <p><span className="weight-700">회원:</span> {customerToDelete?.name ?? '-'}</p>
              <p><span className="weight-700">소속:</span> {customerToDelete?.customer_company_name ?? '-'}</p>
            </div>
          </div>
        }
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

    </Fragment>
  )
}
