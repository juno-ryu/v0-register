import { useState, useEffect, Fragment } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { PageLayout } from '@/components/layout/page-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableToolbar } from '@/components/common/table-toolbar'
import { Plus } from 'lucide-react'
import { FilterSection } from '@/components/common/filter-section'
import { BranchFilter } from '@/components/common/filter/branch-filter/branch-filter'
import {
  type BranchFilterValues,
  BRANCH_FILTER_DEFAULTS,
} from '@/components/common/filter/branch-filter/constants'
import { useAuthStore, selectIsManagementAccount, selectIsBrandAccount, selectIsStoreAccount, selectUserStoreId } from '@/store/useAuthStore'
import { useBranchList } from '@/features/branch-management/queries'
import { BranchTable } from '@/features/branch-management/components/branch-table'
import { BranchCreateDialog } from '@/features/branch-management/components/branch-create-dialog'
import type { BranchListParams } from '@/features/branch-management/schema'
import { SORT_OPTIONS, SORT_OPTIONS_BRAND } from '@/features/branch-management/constants'
import { useDialogKey } from '@/hooks/useDialogKey'

export const Route = createLazyFileRoute('/_authenticated/branch-management/')({
  component: BranchesPage,
})


// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
function BranchesPage() {
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isBrand = useAuthStore(selectIsBrandAccount)
  const isStore = useAuthStore(selectIsStoreAccount)
  const userStoreId = useAuthStore(selectUserStoreId)
  const navigate = useNavigate()
  const { brandId: queryBrandId } = Route.useSearch()

  useEffect(() => {
    if (isStore && userStoreId) {
      navigate({ to: '/branch-management/$storeId', params: { storeId: userStoreId }, replace: true })
    }
  }, [isStore, userStoreId, navigate])

  const initialBrandIds = queryBrandId ? [queryBrandId] : []
  const initialFilterDefaults: BranchFilterValues = {
    ...BRANCH_FILTER_DEFAULTS,
    brand_id__in: initialBrandIds,
  }

  const form = useForm<BranchFilterValues>({ defaultValues: initialFilterDefaults })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const createDialogKey = useDialogKey(isCreateOpen)
  const [sortValue, setSortValue] = useState('name_asc')
  const [params, setParams] = useState<BranchListParams>({
    page: 1,
    per_page: 20,
    order_by: 'name',
    order_direction: 'asc',
    ...(initialBrandIds.length > 0 ? { brand_id__in: initialBrandIds } : {}),
  })

  const { data, isLoading } = useBranchList(params)
  const totalCount = data?.count ?? 0
  const branches = data?.results ?? []

  const allSortOptions = isManagement
    ? [...SORT_OPTIONS, ...SORT_OPTIONS_BRAND]
    : SORT_OPTIONS

  const handleFilterSubmit = (filter: BranchFilterValues) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search_key: filter.q ? filter.search_key : undefined,
      q: filter.q || undefined,
      is_active: filter.is_active !== 'all' ? filter.is_active === 'true' : undefined,
      brand_id__in: filter.brand_id__in.length > 0 ? filter.brand_id__in : undefined,
      available_take_types: filter.available_take_types.length > 0 ? filter.available_take_types.join(',') : undefined,
    }))
  }

  const handleReset = () => {
    setParams({ page: 1, per_page: 20, order_by: 'name', order_direction: 'asc' })
    setSortValue('name_asc')
  }

  const handleSortChange = (value: string) => {
    setSortValue(value)
    const opt = allSortOptions.find((o) => o.value === value)
    if (!opt) return
    setParams((prev) => ({ ...prev, page: 1, order_by: opt.order_by, order_direction: opt.order_direction }))
  }

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (perPage: number) => {
    setParams((prev) => ({ ...prev, per_page: perPage, page: 1 }))
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={BRANCH_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleReset}
        >
          <BranchFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        <TableToolbar
          totalCount={totalCount}
          pageSize={params.per_page}
          onPageSizeChange={handlePageSizeChange}
          actions={(isManagement || isBrand) ? [
            { icon: Plus, label: '매장 등록', onClick: () => setIsCreateOpen(true) },
          ] : undefined}
        >
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="max-md:w-auto max-md:border-0 max-md:shadow-none max-md:px-1 max-md:typo-micro1 max-md:gap-0.5 max-md:[&_svg]:size-4 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allSortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="max-md:typo-micro1 max-md:h-8 whitespace-nowrap">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableToolbar>

        <BranchTable
          data={branches}
          isManagement={isManagement}
          totalCount={totalCount}
          page={params.page}
          pageSize={params.per_page}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
        {(isManagement || isBrand) && (
          <BranchCreateDialog
            key={createDialogKey}
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />
        )}
      </PageLayout>
    </Fragment>
  )
}
