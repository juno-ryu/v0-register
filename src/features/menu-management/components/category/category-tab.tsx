import { useState, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import { Trash2, Copy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { typedZodResolver } from '@/lib/form'
import { z } from 'zod'
import { FilterSection } from '@/components/common/filter-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CategoryFilter } from '@/components/common/filter/category-filter/category-filter'
import {
  type CategoryFilterValues,
  CATEGORY_FILTER_DEFAULTS,
  filterCategories,
} from '@/components/common/filter/category-filter/constants'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useMenuCategoriesDetail,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useUpdateMenuCategoryOrdering,
  useSyncMenu,
  useMenusForDropdown,
  useStorePosType,
} from '@/features/menu-management/queries'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  MenuCategory,
  MenuCategoryMenu,
} from '@/features/menu-management/schema'
import {
  OrderChangeDialog,
  type OrderChangeItem,
} from '@/features/menu-management/components/menu/order-change-dialog'
import { TabToolbar } from '@/features/menu-management/components/shared/tab-toolbar'
import { TAB_SORT_OPTIONS } from '@/features/menu-management/constants'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'
import { CategoryCardMobile } from '@/features/menu-management/components/category/category-card-mobile'

// ─────────────────────────────────────────────
// 타입 & 상수
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 폼 스키마: 관리명(필수) + 노출명(필수) + 상품(optional)
// 레거시: 카테고리명(관리전용) + 카테고리명(노출용) 입력 시 버튼 활성화
// ─────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, '카테고리명(관리전용)을 입력해주세요.'),
  operation_name: z.string().min(1, '카테고리명(노출용)을 입력해주세요.'),
  menus: z.array(z.union([z.string(), z.number()])).default([]),
})

type FormSchemaValues = z.infer<typeof formSchema>

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').slice(0, 19).replace(/-/g, '/')
}

function getOperationModesText(
  operationCategories: MenuCategory['operation_categories'],
): string {
  if (!operationCategories || operationCategories.length === 0)
    return '운영모드가 없습니다.'
  return operationCategories.map((c) => c.name).join(', ')
}

function getMenusText(menus: MenuCategory['menus']): string {
  if (!menus || menus.length === 0) return '상품을 추가해 주세요'
  return menus.map((m) => m.operation_name ?? m.name).join(', ')
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface CategoryTabProps {
  storeId: string | null
}

// ─────────────────────────────────────────────
// 카테고리 탭 메인 컴포넌트
// ─────────────────────────────────────────────
export function CategoryTab({ storeId }: CategoryTabProps) {
  // 다이얼로그 상태
  const [viewCategory, setViewCategory] = useState<MenuCategory | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null,
  )
  const [deleteTargetCategory, setDeleteTargetCategory] =
    useState<MenuCategory | null>(null)

  // 데이터
  const { data: categories = [], isLoading } = useMenuCategoriesDetail(storeId)
  const { data: menuDropdown = [] } = useMenusForDropdown(storeId)
  const { data: posType } = useStorePosType(storeId)

  // posType 로딩 완료 전엔 두 버튼 모두 숨김 (로딩 중 null → isDidOnly=false → 포스 동기화 잠깐 노출 방지)
  const isPosTypeLoaded = posType !== undefined
  const isDidOnly = posType === 'did_only'

  // 필터 form 소유
  const form = useForm<CategoryFilterValues>({
    defaultValues: CATEGORY_FILTER_DEFAULTS,
  })

  // null = 필터 미적용 (전체 목록 표시)
  const [filteredCategories, setFilteredCategories] = useState<
    MenuCategory[] | null
  >(null)
  const displayedCategories = filteredCategories ?? categories

  // 정렬
  const [sortKey, setSortKey] = useState(0)

  const sortedCategories = useMemo(() => {
    const opt = TAB_SORT_OPTIONS[sortKey]
    if (!opt) return displayedCategories
    const { order_by, order_direction } = opt
    const sorted = [...displayedCategories].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[order_by] ?? ''
      const bVal = (b as Record<string, unknown>)[order_by] ?? ''
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
    return order_direction === 'desc' ? sorted.reverse() : sorted
  }, [displayedCategories, sortKey])

  // 진열 순서 다이얼로그
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const orderDialogKey = useDialogKey(isOrderDialogOpen)
  const formDialogKey = useDialogKey(formMode !== null, editingCategory?.id ?? 'new')

  // 뮤테이션
  const createMutation = useCreateMenuCategory(storeId)
  const updateMutation = useUpdateMenuCategory(storeId)
  const deleteMutation = useDeleteMenuCategory(storeId)
  const orderingMutation = useUpdateMenuCategoryOrdering(storeId)
  const syncMutation = useSyncMenu(storeId)

  const categoryOrderItems: OrderChangeItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    operation_name: c.operation_name,
    sn: c.sn,
    connected_label: c.menus.length
      ? `상품: ${c.menus.map((m) => m.operation_name ?? m.name).join(', ')}`
      : undefined,
  }))

  const handleOrderSave = async (
    orderedItems: Array<{ id: string | number; ordering: number }>,
  ) => {
    await orderingMutation.mutateAsync(
      orderedItems.map((item) => ({
        id: Number(item.id),
        ordering: item.ordering,
        parent_object_id: storeId!,
      })),
    )
    setIsOrderDialogOpen(false)
    toast.success('진열 순서가 변경되었습니다.')
  }

  // ── 필터 핸들러 ──
  const handleFilterSubmit = (values: CategoryFilterValues) => {
    setFilteredCategories(filterCategories(categories, values))
  }

  const handleFilterReset = () => {
    setFilteredCategories(null)
  }

  // ── 신규 등록 ──
  const handleNewClick = () => {
    setEditingCategory(null)
    setFormMode('create')
  }

  // ── 포스 동기화 ──
  const handleSyncClick = async () => {
    if (!storeId) return
    if (!confirm('포스에서 메뉴를 동기화하시겠습니까?')) return
    await syncMutation.mutateAsync()
  }

  // ── 카드 클릭 → View 다이얼로그 ──
  const handleCardClick = (category: MenuCategory) => {
    setViewCategory(category)
  }

  // ── 상세에서 수정 ──
  const handleEditFromView = () => {
    setEditingCategory(viewCategory)
    setViewCategory(null)
    setFormMode('edit')
  }

  // ── 상세에서 삭제 ──
  const handleDeleteFromView = () => {
    if (!viewCategory) return
    setDeleteTargetCategory(viewCategory)
    setViewCategory(null)
  }

  // 삭제 확인 → API 호출 후 다이얼로그 닫기
  const handleDeleteConfirm = async () => {
    if (!deleteTargetCategory) return
    await deleteMutation.mutateAsync(deleteTargetCategory.id)
    setDeleteTargetCategory(null)
    toast.success('삭제 완료되었습니다.')
  }

  // 삭제 취소 → 상세 보기 다이얼로그로 복귀
  const handleDeleteCancel = () => {
    setViewCategory(deleteTargetCategory)
    setDeleteTargetCategory(null)
  }

  // ── 폼 제출 ──
  const handleFormSubmit = async (data: FormSchemaValues) => {
    if (!storeId) return
    if (formMode === 'edit' && editingCategory) {
      await updateMutation.mutateAsync({
        categoryId: editingCategory.id,
        payload: {
          name: data.name,
          operation_name: data.operation_name,
          menus: data.menus,
          ordering: editingCategory.ordering,
        },
      })
      toast.success('수정 완료되었습니다.')
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        operation_name: data.operation_name,
        menus: data.menus,
        ordering: categories.length,
      })
      toast.success('등록 완료되었습니다.')
    }
    setFormMode(null)
    setEditingCategory(null)
  }

  const isFormSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={CATEGORY_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <CategoryFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        {/* 헤더 툴바 */}
        <TabToolbar
          storeId={storeId}
          isDidOnly={isDidOnly}
          isPosTypeLoaded={isPosTypeLoaded}
          isOrderDisabled={categories.length === 0}
          isSyncPending={syncMutation.isPending}
          sortKey={sortKey}
          sortOptions={TAB_SORT_OPTIONS}
          onOrderClick={() => setIsOrderDialogOpen(true)}
          onSyncClick={handleSyncClick}
          onNewClick={handleNewClick}
          onSortChange={setSortKey}
        />

        {/* 카드 목록 */}
        {!storeId && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            매장을 선택해주세요.
          </div>
        )}
        {storeId && isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}
        {storeId && !isLoading && sortedCategories.length === 0 && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            조회된 카테고리가 없습니다.
          </div>
        )}
        {storeId && !isLoading && sortedCategories.length > 0 && (
          <div className="flex flex-col gap-3 md:gap-2">
            {sortedCategories.map((category) => (
              <Fragment key={category.id}>
                <CategoryCard
                  category={category}
                  onClick={() => handleCardClick(category)}
                  className="hidden md:flex"
                />
                <CategoryCardMobile
                  category={category}
                  onClick={() => handleCardClick(category)}
                  className="md:hidden"
                />
              </Fragment>
            ))}
          </div>
        )}

        {/* View 다이얼로그 */}
        <CategoryViewDialog
          open={!!viewCategory}
          category={viewCategory}
          onClose={() => setViewCategory(null)}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
          isDeleting={deleteMutation.isPending}
        />

        {/* 등록/수정 폼 다이얼로그 */}
        <CategoryFormDialog
          key={formDialogKey}
          open={formMode !== null}
          mode={formMode ?? 'create'}
          initialData={editingCategory}
          menuDropdown={menuDropdown}
          isSubmitting={isFormSubmitting}
          onClose={() => {
            setFormMode(null)
            setEditingCategory(null)
          }}
          onSubmit={handleFormSubmit}
        />

        {/* 진열 순서 변경 다이얼로그 */}
        <OrderChangeDialog
          key={orderDialogKey}
          open={isOrderDialogOpen}
          type="category"
          items={categoryOrderItems}
          isSaving={orderingMutation.isPending}
          onClose={() => setIsOrderDialogOpen(false)}
          onSave={handleOrderSave}
        />

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={!!deleteTargetCategory}
          title="상품 카테고리 삭제"
          description={
            <>
              <p>이름: {deleteTargetCategory?.name}</p>
              <p>ID: {deleteTargetCategory?.id}</p>
              {deleteTargetCategory?.sn && <p>SN: {deleteTargetCategory.sn}</p>}
              <p>&nbsp;</p>
              <p>항목을 삭제하시겠습니까?</p>
              <p>이 작업은 되돌릴 수 없습니다.</p>
            </>
          }
          confirmLabel="삭제"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </PageLayout>
    </Fragment>
  )
}

// ─────────────────────────────────────────────
// 카테고리 카드
// 레거시: MenuEntity (type=CATEGORY)
// — 사용/미사용 뱃지 있음, SN+관리명+노출명, 운영모드 텍스트, 상품 텍스트, 날짜 있음
// ─────────────────────────────────────────────
interface CategoryCardProps {
  category: MenuCategory
  onClick: () => void
  className?: string
}

function CategoryCard({ category, onClick, className }: CategoryCardProps) {
  const isActive = category.is_active !== false
  const operationModesText = getOperationModesText(
    category.operation_categories,
  )
  const menusText = getMenusText(category.menus)

  return (
    <button
      type="button"
      className={`w-full rounded border border-border bg-background p-4 text-left transition-colors hover:bg-muted cursor-pointer flex flex-col gap-1.5 ${className ?? ''}`}
      onClick={onClick}
    >
      {/* 사용/미사용 뱃지 (레거시: is_active 기반) */}
      <Badge
        className={`px-3 py-1 typo-body1 weight-600 text-white ${isActive ? 'bg-[var(--color-status-positive)] hover:bg-[var(--color-status-positive)]' : 'bg-neutral-400 hover:bg-neutral-400'}`}
      >
        {isActive ? '사용' : '미사용'}
      </Badge>

      {/* (SN) 관리명 | 노출명 */}
      <div className="flex items-center gap-2">
        {category.sn && (
          <span className="typo-headline3 weight-700 text-foreground">
            ({category.sn})
          </span>
        )}
        <span className="typo-headline3 weight-700 text-foreground">
          {category.name}
        </span>
        <div className="h-5 w-[2px] bg-border" />
        <span className="typo-headline4 weight-700 text-foreground">
          노출명: {category.operation_name ?? '-'}
        </span>
      </div>

      {/* 운영모드/상품 + 날짜 */}
      <div className="flex items-end gap-4">
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          {/* 운영모드 텍스트 */}
          <div className="flex items-center gap-2 typo-body1 text-foreground min-w-0">
            <span className="shrink-0">운영모드:</span>
            <span className="truncate">{operationModesText}</span>
          </div>
          {/* 상품 텍스트 */}
          <div className="flex items-center gap-2 typo-body1 text-foreground min-w-0">
            <span className="shrink-0">상품:</span>
            <span className="truncate">{menusText}</span>
          </div>
        </div>
        {/* 날짜 */}
        <div className="shrink-0 flex flex-col gap-0.5 typo-micro1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-[45px]">업데이트:</span>
            <span>{formatDate(category.update_dt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[45px]">등록:</span>
            <span>{formatDate(category.create_dt)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// View 다이얼로그
// 레거시: CategoryViewDialog.vue
// ─────────────────────────────────────────────
interface CategoryViewDialogProps {
  open: boolean
  category: MenuCategory | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function CategoryViewDialog({
  open,
  category,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: CategoryViewDialogProps) {
  if (!category) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(String(category.id))
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="상품 카테고리 정보"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            닫기
          </Button>
          <Button className="flex-1" onClick={onEdit}>
            수정
          </Button>
        </>
      }
    >
      <div className="p-4 space-y-3">
        {/* ID + 복사 */}
        <BaseRow label="ID">
          <div className="flex flex-col items-end gap-1">
            <span className="typo-body3 text-right break-all">{category.id}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 typo-micro1 gap-1"
              onClick={handleCopy}
            >
              <Copy size={10} />
              복사
            </Button>
          </div>
        </BaseRow>

        <BaseRow label="SN" value={category.sn ?? '-'} />
        <BaseRow
          label="상태"
          value={category.is_active !== false ? '활성' : '비활성'}
        />
        <BaseRow label="카테고리명 (관리전용)" value={category.name} />
        <BaseRow
          label="카테고리명 (노출용)"
          value={category.operation_name ?? '-'}
        />
      </div>

      <div className="h-2 bg-accent" />

      {/* 상품 (칩) */}
      <div className="p-4 space-y-2">
        <BaseRow label="상품" direction="column">
          {category.menus.length === 0 ? (
            <span className="typo-body3 text-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {category.menus.map((menu) => (
                <span key={menu.id} className="rounded-full bg-accent px-3 py-1 typo-body3 text-foreground">
                  {menu.sn ? `(${menu.sn}) ` : ''}{menu.operation_name ?? menu.name}
                </span>
              ))}
            </div>
          )}
        </BaseRow>
      </div>

      <div className="h-2 bg-accent" />

      {/* 날짜 + 삭제 */}
      <div className="p-4 space-y-3">
        <BaseRow
          label="마지막 업데이트 일시"
          value={formatDate(category.update_dt)}
        />
        <BaseRow label="등록 일시" value={formatDate(category.create_dt)} />

        <BaseRow label="삭제">
          <Button
            variant="outline"
            size="sm"
            className="border-status-destructive text-status-destructive hover:bg-status-destructive/5 gap-1"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
            삭제
          </Button>
        </BaseRow>
      </div>
    </BaseDialog>
  )
}

const categoryInitialValues: FormSchemaValues = {
  name: '',
  operation_name: '',
  menus: [],
}

function resolveCategoryValues(data: MenuCategory): FormSchemaValues {
  return {
    name: data.name ?? '',
    operation_name: data.operation_name ?? '',
    menus: data.menus.map((m) => m.id),
  }
}

interface CategoryFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialData: MenuCategory | null
  menuDropdown: MenuCategoryMenu[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: FormSchemaValues) => void
}

function CategoryFormDialog({
  open,
  mode,
  initialData,
  menuDropdown,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const isEditMode = mode === 'edit'

  const initialMenuIds = initialData ? initialData.menus.map((m) => m.id) : []
  const [selectedMenuIds, setSelectedMenuIds] =
    useState<number[]>(initialMenuIds)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const defaultValues = useMemo(
    () =>
      initialData ? resolveCategoryValues(initialData) : categoryInitialValues,
    [initialData],
  )

  const form = useForm<FormSchemaValues>({
    resolver: typedZodResolver(formSchema),
    defaultValues,
  })

  const toggleMenu = (id: number) => {
    const next = selectedMenuIds.includes(id)
      ? selectedMenuIds.filter((i) => i !== id)
      : [...selectedMenuIds, id]
    setSelectedMenuIds(next)
    form.setValue('menus', next, { shouldValidate: true })
  }

  const removeMenu = (id: number) => {
    const next = selectedMenuIds.filter((i) => i !== id)
    setSelectedMenuIds(next)
    form.setValue('menus', next, { shouldValidate: true })
  }

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data)
  })

  const selectedMenus = menuDropdown.filter((m) =>
    selectedMenuIds.includes(m.id),
  )

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? '상품 카테고리 수정' : '상품 카테고리 등록'}
      noScrollBody
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 카테고리명 (관리전용) (필수) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      카테고리명 (관리전용){' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="카테고리명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 카테고리명 (노출용) (필수) */}
              <FormField
                control={form.control}
                name="operation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      카테고리명 (노출용){' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="노출용 카테고리명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* 상품 MultiSelect */}
              <FormField
                control={form.control}
                name="menus"
                render={() => (
                  <FormItem>
                    <FormLabel>상품</FormLabel>

                    {/* 드롭다운 트리거 */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-between px-3 py-2 text-sm h-auto"
                        onClick={() => setDropdownOpen((v) => !v)}
                      >
                        <span className="text-muted-foreground">상품 선택</span>
                        <span className="typo-micro1 text-muted-foreground">▼</span>
                      </Button>

                      {/* 드롭다운 목록 */}
                      {dropdownOpen && (
                        <div className="absolute z-50 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto bottom-full mb-1">
                          {menuDropdown.length === 0 ? (
                            <p className="p-3 typo-body3 text-muted-foreground">
                              상품이 없습니다.
                            </p>
                          ) : (
                            menuDropdown.map((menu) => {
                              const isSelected = selectedMenuIds.includes(
                                menu.id,
                              )
                              return (
                                <Button
                                  key={menu.id}
                                  type="button"
                                  variant="ghost"
                                  className={`flex w-full items-center justify-start px-3 py-2 text-sm h-auto rounded-none overflow-hidden ${isSelected ? 'bg-accent/50 weight-500' : ''}`}
                                  onClick={() => toggleMenu(menu.id)}
                                >
                                  <span className="mr-2 shrink-0">
                                    {isSelected ? '✓' : '\u00a0'}
                                  </span>
                                  <span className="truncate">{menu.sn ? `(${menu.sn}) ` : ''}{menu.operation_name ?? menu.name}</span>
                                </Button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* 선택된 상품 칩 (레거시: (SN) operation_name 형식) */}
                    {selectedMenus.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 overflow-hidden">
                        {selectedMenus.map((menu) => (
                          <span
                            key={menu.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary max-w-full min-w-0"
                          >
                            <span className="truncate">{menu.sn ? `(${menu.sn}) ` : ''}{menu.operation_name ?? menu.name}</span>
                            <button
                              type="button"
                              className="shrink-0 ml-0.5 text-primary hover:text-primary/70 leading-none"
                              onClick={() => removeMenu(menu.id)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 푸터 */}
          <div className="p-4 border-t shrink-0 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </Form>
    </BaseDialog>
  )
}
