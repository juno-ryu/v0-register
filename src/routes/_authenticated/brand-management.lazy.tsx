import { useState } from 'react'
import { toast } from 'sonner'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { TableToolbar } from '@/components/common/table-toolbar'
import { BrandTable } from '@/features/brand-management/components/brand-table'
import { BrandDetailDialog } from '@/features/brand-management/components/brand-detail-dialog'
import { BrandFormDialog } from '@/features/brand-management/components/brand-form-dialog'
import {
  useBrandList,
  useBrandDetail,
  useCreateBrand,
  useUpdateBrand,
} from '@/features/brand-management/queries'
import type { BrandListItem, BrandForm } from '@/features/brand-management/schema'
import { useDialogKey } from '@/hooks/useDialogKey'

export const Route = createLazyFileRoute('/_authenticated/brand-management')({
  component: BrandManagementPage,
})

function BrandManagementPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 정보 모달
  const [detailBrandId, setDetailBrandId] = useState<string | number | null>(null)
  const detailOpen = detailBrandId !== null

  // 등록/수정 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editBrandId, setEditBrandId] = useState<string | number | null>(null)
  const brandFormDialogKey = useDialogKey(formOpen, editBrandId ?? 'new')

  const { data, isLoading } = useBrandList({ page, per_page: pageSize })
  const { data: brandDetail } = useBrandDetail(detailBrandId ?? editBrandId)
  const { mutate: createBrand, isPending: isCreating } = useCreateBrand()
  const { mutate: updateBrand, isPending: isUpdating } = useUpdateBrand()

  const totalCount = data?.count ?? 0
  const isSubmitting = isCreating || isUpdating

  // 행 클릭 → 정보 모달
  const handleRowClick = (brand: BrandListItem) => {
    setDetailBrandId(brand.id)
  }

  const handleDetailClose = () => {
    setDetailBrandId(null)
  }

  // 정보 모달 → 수정 모달 전환
  const handleDetailEdit = () => {
    const id = detailBrandId
    setDetailBrandId(null)
    setEditBrandId(id)
    setFormOpen(true)
  }

  // + 브랜드 등록
  const handleOpenCreate = () => {
    setEditBrandId(null)
    setFormOpen(true)
  }

  const handleViewStores = (brandId: string | number) => {
    navigate({ to: '/branch-management', search: { brandId: String(brandId) } })
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditBrandId(null)
  }

  const handleSubmit = (formData: BrandForm) => {
    if (editBrandId) {
      updateBrand(
        { brandId: Number(editBrandId), payload: formData },
        {
          onSuccess: () => {
            handleFormClose()
            toast.success('브랜드가 수정되었습니다.')
          },
          onError: () => {
            toast.error('브랜드 수정에 실패했습니다.')
          },
        },
      )
    } else {
      createBrand(formData, {
        onSuccess: () => {
          handleFormClose()
          setPage(1)
          toast.success('브랜드가 생성되었습니다.')
        },
        onError: () => {
          toast.error('브랜드 생성에 실패했습니다.')
        },
      })
    }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return (
    <PageLayout>
      <TableToolbar
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        actions={[
          { label: '+ 브랜드 등록', onClick: handleOpenCreate },
        ]}
      />

      {/* 테이블 */}
      <BrandTable
        data={data?.results ?? []}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={handleRowClick}
        onViewStores={handleViewStores}
      />

      {/* 브랜드 정보 모달 (읽기 전용) */}
      <BrandDetailDialog
        open={detailOpen}
        brandDetail={detailOpen ? (brandDetail ?? null) : null}
        onClose={handleDetailClose}
        onEdit={handleDetailEdit}
      />

      {/* 등록/수정 다이얼로그 */}
      <BrandFormDialog
        key={brandFormDialogKey}
        open={formOpen}
        brandDetail={editBrandId ? (brandDetail ?? null) : null}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  )
}
