import { useState, Fragment } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { TableToolbar } from '@/components/common/table-toolbar'
import { FilterSection } from '@/components/common/filter-section'
import { BenefitsFilter } from '@/components/common/filter/benefits-filter/benefits-filter'
import { getDefaultBenefitsFilter, type BenefitsFilterValues } from '@/components/common/filter/benefits-filter/constants'
import { BenefitsTable } from '@/features/benefit-management/components/benefits-table'
import { CouponFormDialog } from '@/features/benefit-management/components/coupon-form-dialog'
import { CouponPublishDialog } from '@/features/benefit-management/components/coupon-publish-dialog'
import { CouponMessageDialog } from '@/features/benefit-management/components/coupon-message-dialog'
import { useCoupons, useCouponDetail, useCreateCoupon, useUpdateCoupon } from '@/features/benefit-management/queries'
import { useAuthStore, selectIsManagementAccount, selectIsStoreAccount, selectBrandDomain } from '@/store/useAuthStore'
import type { CouponListParams, CouponListItem, CouponForm } from '@/features/benefit-management/schema'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'

// coupon-form-dialog.tsx 와 동기화
const STEP_STORE_SELECT = 3

function getDefaultCouponParams(): CouponListParams {
  return { page: 1, page_size: 20 }
}

export function CouponManagementTab() {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const brandDomain = useAuthStore(selectBrandDomain)

  const [params, setParams] = useState<CouponListParams>(getDefaultCouponParams)
  const form = useForm<BenefitsFilterValues>({ defaultValues: getDefaultBenefitsFilter() })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null)
  const [dialogInitialStep, setDialogInitialStep] = useState<number | undefined>(undefined)

  const [publishOpen, setPublishOpen] = useState(false)
  const [publishCouponId, setPublishCouponId] = useState<number | null>(null)

  const [messageOpen, setMessageOpen] = useState(false)
  const [messageCouponId, setMessageCouponId] = useState<number | null>(null)
  const [messageIssuedSession, setMessageIssuedSession] = useState<string | undefined>(undefined)

  const couponFormDialogKey = useDialogKey(dialogOpen, selectedCouponId ?? 'new')
  const couponPublishDialogKey = useDialogKey(publishOpen, publishCouponId)
  const couponMessageDialogKey = useDialogKey(messageOpen, messageCouponId)

  const { data, isLoading } = useCoupons(params)
  const totalCount = data?.count ?? 0
  const coupons = data?.results ?? []

  const { data: couponDetail } = useCouponDetail(selectedCouponId)
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const isSubmitting = createCoupon.isPending || updateCoupon.isPending

  const handleFilterSubmit = (filter: BenefitsFilterValues) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: filter.search || undefined,
      brand_id__in: filter.brand_id__in.length ? filter.brand_id__in.join(',') : undefined,
      store_id__in: filter.store_id__in.length ? filter.store_id__in.join(',') : undefined,
      status__in: filter.status__in.length ? filter.status__in.join(',') : undefined,
      issuable_start_date: isStoreAccount ? filter.issuable_start_date : undefined,
      issuable_end_date: isStoreAccount ? filter.issuable_end_date : undefined,
    }))
  }

  const handleReset = () => setParams(getDefaultCouponParams())

  const handlePageChange = (page: number) => setParams((prev) => ({ ...prev, page }))

  const handlePageSizeChange = (page_size: number) =>
    setParams((prev) => ({ ...prev, page_size, page: 1 }))

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedCouponId(null)
    setDialogInitialStep(undefined)
    setDialogOpen(true)
  }

  const handleRowClick = (coupon: CouponListItem) => {
    setDialogMode('edit')
    setSelectedCouponId(coupon.id)
    setDialogInitialStep(undefined)
    setDialogOpen(true)
  }

  const handleIssueClick = (coupon: CouponListItem) => {
    setPublishCouponId(coupon.id)
    setPublishOpen(true)
  }

  const handleMessageClick = (coupon: CouponListItem) => {
    setMessageCouponId(coupon.id)
    setMessageIssuedSession(undefined)
    setMessageOpen(true)
  }

  const handleCopyUrlClick = (coupon: CouponListItem) => {
    const url = brandDomain
      ? `https://${brandDomain}/coupon/${coupon.id}`
      : `${window.location.origin}/coupon/${coupon.id}`
    navigator.clipboard.writeText(url).catch(() => {
      toast.error('복사에 실패했습니다.')
    })
  }

  const handleStoreCountClick = (coupon: CouponListItem) => {
    setDialogMode('edit')
    setSelectedCouponId(coupon.id)
    setDialogInitialStep(STEP_STORE_SELECT)
    setDialogOpen(true)
  }

  const handlePublishMessageOpen = (issuedSession: string) => {
    if (publishCouponId == null) return
    setMessageCouponId(publishCouponId)
    setMessageIssuedSession(issuedSession)
    setMessageOpen(true)
  }

  const handleDialogSubmit = (formData: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'>) => {
    if (dialogMode === 'create') {
      createCoupon.mutate(formData, { onSuccess: () => setDialogOpen(false) })
    } else if (dialogMode === 'edit' && selectedCouponId != null && couponDetail) {
      updateCoupon.mutate(
        { couponId: selectedCouponId, payload: { ...formData, issuable_quantity: couponDetail.issuable_quantity } },
        { onSuccess: () => setDialogOpen(false) },
      )
    }
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={getDefaultBenefitsFilter()}
          onSubmit={handleFilterSubmit}
          onReset={handleReset}
        >
          <BenefitsFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.page_size ?? 20}
          onPageSizeChange={handlePageSizeChange}
          actions={(!isManagementAccount && !isStoreAccount) ? [
            { icon: Plus, label: '쿠폰 등록', onClick: handleCreateClick },
          ] : undefined}
        />

        <BenefitsTable
          data={coupons}
          totalCount={totalCount}
          page={params.page ?? 1}
          pageSize={params.page_size ?? 20}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onIssueClick={handleIssueClick}
          onMessageClick={handleMessageClick}
          onCopyUrlClick={handleCopyUrlClick}
          onStoreCountClick={handleStoreCountClick}
        />

        <CouponFormDialog
          key={couponFormDialogKey}
          open={dialogOpen}
          mode={dialogMode}
          couponDetail={couponDetail ?? null}
          isSubmitting={isSubmitting}
          initialStep={dialogInitialStep}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleDialogSubmit}
        />

        {publishCouponId != null && (
          <CouponPublishDialog
            key={couponPublishDialogKey}
            couponId={publishCouponId}
            open={publishOpen}
            onClose={() => setPublishOpen(false)}
            onMessageSendOpen={handlePublishMessageOpen}
          />
        )}

        {messageCouponId != null && (
          <CouponMessageDialog
            key={couponMessageDialogKey}
            couponId={messageCouponId}
            issuedSession={messageIssuedSession}
            open={messageOpen}
            onClose={() => setMessageOpen(false)}
          />
        )}
      </PageLayout>
    </Fragment>
  )
}
