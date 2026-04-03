import { useState, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import { Trash2, Copy, GripVertical } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { typedZodResolver } from '@/lib/form'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FilterSection } from '@/components/common/filter-section'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OptionFilter } from '@/components/common/filter/option-filter/option-filter'
import {
  type OptionFilterValues,
  OPTION_FILTER_DEFAULTS,
  filterOptions,
} from '@/components/common/filter/option-filter/constants'
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
  useOptionCategoriesDetail,
  useCreateOptionCategory,
  useUpdateOptionCategory,
  useDeleteOptionCategory,
  useUpdateOptionCategoryOrdering,
  useSyncMenu,
  useMenusForDropdown,
  useStorePosType,
} from '@/features/menu-management/queries'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  OptionCategory,
  OptionCategoryForm,
} from '@/features/menu-management/schema'
import {
  OrderChangeDialog,
  type OrderChangeItem,
} from '@/features/menu-management/components/menu/order-change-dialog'
import { TabToolbar } from '@/features/menu-management/components/shared/tab-toolbar'
import { TAB_SORT_OPTIONS } from '@/features/menu-management/constants'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'
import { OptionCardMobile } from '@/features/menu-management/components/option/option-card-mobile'

// ─────────────────────────────────────────────
// 타입 & 상수
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 폼 스키마
// 레거시: 옵션 카테고리명(필수) + 필수여부 + 선택방식 + 옵션항목 + 선택가능개수 + 연결상품
// ─────────────────────────────────────────────
const optionItemSchema = z.object({
  name: z.string().min(1, '옵션명을 입력해주세요.'),
  price: z.number().min(0),
})

const formSchema = z.object({
  name: z.string().min(1, '옵션 카테고리명을 입력해주세요.'),
  is_required: z.boolean().default(false),
  is_multiple_selectable: z.boolean().default(false),
  max_select_count: z.number().nullable().optional(),
  menus: z.array(z.string()).default([]),
  options: z.array(optionItemSchema).default([]),
})

type FormSchemaValues = z.infer<typeof formSchema>

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').slice(0, 19).replace(/-/g, '/')
}

function getOptionsText(options: OptionCategory['options']): string {
  if (!options || options.length === 0) return '옵션이 없습니다.'
  return options.map((o) => o.name).join(', ')
}

function getMenusText(menus: OptionCategory['menus']): string {
  if (!menus || menus.length === 0) return '상품이 없습니다.'
  return menus
    .map((m) => {
      if (typeof m === 'object' && m !== null && 'operation_name' in m) {
        return (
          (m as { operation_name?: string; name: string }).operation_name ??
          (m as { name: string }).name
        )
      }
      return String(m)
    })
    .join(', ')
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface OptionTabProps {
  storeId: string | null
}

// ─────────────────────────────────────────────
// 상품 옵션 탭 메인 컴포넌트
// 레거시: option-management/index.vue
// ─────────────────────────────────────────────
export function OptionTab({ storeId }: OptionTabProps) {
  // 다이얼로그 상태
  const [viewCategory, setViewCategory] = useState<OptionCategory | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingCategory, setEditingCategory] = useState<OptionCategory | null>(
    null,
  )
  const [deleteTargetCategory, setDeleteTargetCategory] =
    useState<OptionCategory | null>(null)

  // 데이터
  const { data: categories = [], isLoading } =
    useOptionCategoriesDetail(storeId)
  const { data: menuDropdown = [] } = useMenusForDropdown(storeId)
  const { data: posType } = useStorePosType(storeId)

  // 필터 form 소유
  const form = useForm<OptionFilterValues>({
    defaultValues: OPTION_FILTER_DEFAULTS,
  })

  // null = 필터 미적용 (전체 목록 표시)
  const [filteredCategories, setFilteredCategories] = useState<
    OptionCategory[] | null
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

  // posType 로딩 완료 전엔 두 버튼 모두 숨김 (로딩 중 null → isDidOnly=false → 포스 동기화 잠깐 노출 방지)
  const isPosTypeLoaded = posType !== undefined
  const isDidOnly = posType === 'did_only'

  // 진열 순서 다이얼로그
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const orderDialogKey = useDialogKey(isOrderDialogOpen)
  const formDialogKey = useDialogKey(formMode !== null, editingCategory?.id ?? 'new')

  // 뮤테이션
  const createMutation = useCreateOptionCategory(storeId)
  const updateMutation = useUpdateOptionCategory(storeId)
  const deleteMutation = useDeleteOptionCategory(storeId)
  const orderingMutation = useUpdateOptionCategoryOrdering(storeId)
  const syncMutation = useSyncMenu(storeId)

  const optionOrderItems: OrderChangeItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    operation_name: c.operation_name,
    sn: c.sn,
    connected_label:
      c.menus && c.menus.length > 0
        ? `연결 상품: ${c.menus
          .map((m) => {
            if (typeof m === 'object' && m !== null && 'name' in m) {
              return (
                (m as { operation_name?: string; name: string })
                  .operation_name ?? (m as { name: string }).name
              )
            }
            return String(m)
          })
          .join(', ')}`
        : undefined,
  }))

  const handleOrderSave = async (
    orderedItems: Array<{ id: string | number; ordering: number }>,
  ) => {
    await orderingMutation.mutateAsync(
      orderedItems.map((item) => ({
        id: String(item.id),
        ordering: item.ordering,
        parent_object_id: storeId!,
      })),
    )
    setIsOrderDialogOpen(false)
    toast.success('진열 순서가 변경되었습니다.')
  }

  // ── 필터 핸들러 ──
  const handleFilterSubmit = (values: OptionFilterValues) => {
    setFilteredCategories(filterOptions(categories, values))
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
  const handleCardClick = (category: OptionCategory) => {
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
  // form 내부 필드명(is_required 등)과 API 필드명(is_mandatory 등)이 다르므로 여기서 매핑
  const handleFormSubmit = async (data: FormSchemaValues) => {
    if (!storeId) return
    const payload: OptionCategoryForm = {
      name: data.name,
      operation_name: '',
      is_mandatory: data.is_required,
      is_multiple_selectable: data.is_multiple_selectable,
      selectable_count: data.max_select_count ?? null,
      menu_ids: data.menus,
      options: data.options.map((o) => ({ name: o.name, base_price: o.price })),
      ordering:
        formMode === 'edit'
          ? (editingCategory?.ordering ?? 0)
          : categories.length,
    }
    if (formMode === 'edit' && editingCategory) {
      await updateMutation.mutateAsync({
        categoryId: editingCategory.id,
        payload,
      })
      toast.success('수정 완료되었습니다.')
    } else {
      await createMutation.mutateAsync(payload)
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
          defaultValues={OPTION_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <OptionFilter />
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
            조회된 상품 옵션이 없습니다.
          </div>
        )}
        {storeId && !isLoading && sortedCategories.length > 0 && (
          <div className="flex flex-col gap-3 md:gap-2">
            {sortedCategories.map((category) => (
              <Fragment key={category.id}>
                <OptionCard
                  category={category}
                  onClick={() => handleCardClick(category)}
                  className="hidden md:flex"
                />
                <OptionCardMobile
                  category={category}
                  onClick={() => handleCardClick(category)}
                  className="md:hidden"
                />
              </Fragment>
            ))}
          </div>
        )}

        {/* View 다이얼로그 */}
        <OptionViewDialog
          open={!!viewCategory}
          category={viewCategory}
          onClose={() => setViewCategory(null)}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
          isDeleting={deleteMutation.isPending}
        />

        {/* 등록/수정 폼 다이얼로그 */}
        <OptionFormDialog
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
          type="option"
          items={optionOrderItems}
          isSaving={orderingMutation.isPending}
          onClose={() => setIsOrderDialogOpen(false)}
          onSave={handleOrderSave}
        />

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={!!deleteTargetCategory}
          title="상품 옵션 삭제"
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
// 옵션 카드
// 레거시: MenuEntity (type=OPTION)
// — 사용/미사용 뱃지, SN + 관리명, 옵션 텍스트, 연결 상품 텍스트, 날짜
// ─────────────────────────────────────────────
interface OptionCardProps {
  category: OptionCategory
  onClick: () => void
  className?: string
}

function OptionCard({ category, onClick, className }: OptionCardProps) {
  const isActive = category.is_active !== false
  const optionsText = getOptionsText(category.options)
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

      {/* (SN) 노출명: {name} */}
      <div className="flex items-center gap-2">
        {category.sn && (
          <span className="typo-headline3 weight-700 text-muted-foreground">
            ({category.sn})
          </span>
        )}
        <span className="typo-headline3 weight-700 text-foreground">
          노출명: {category.name}
        </span>
      </div>

      {/* 옵션/상품 + 날짜 영역 */}
      <div className="flex items-end gap-4">
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          {/* 옵션 텍스트 */}
          <div className="flex items-center gap-2 typo-body1 text-foreground min-w-0">
            <span className="shrink-0">옵션:</span>
            <span className="truncate">{optionsText}</span>
          </div>
          {/* 연결 상품 텍스트 */}
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
// 레거시: OptionViewDialog.vue
// ─────────────────────────────────────────────
interface OptionViewDialogProps {
  open: boolean
  category: OptionCategory | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function OptionViewDialog({
  open,
  category,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: OptionViewDialogProps) {
  if (!category) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(String(category.id))
  }

  const selectionTypeText = category.is_multiple_selectable
    ? '다중 선택'
    : '단일 선택'

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="상품 옵션 정보"
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
        {/* #1: 옵션 ID → ID */}
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

        {category.sn && <BaseRow label="SN" value={category.sn} />}
        <BaseRow
          label="상태"
          value={category.is_active !== false ? '활성' : '비활성'}
          valueClassName={category.is_active !== false ? 'text-[var(--color-status-positive)]' : 'text-neutral-400'}
        />
        <BaseRow label="옵션 카테고리명 (노출용)" value={category.name} />
        <BaseRow
          label="필수 여부"
          value={category.is_required ? '필수 옵션' : '선택 옵션'}
        />
      </div>

      <div className="h-2 bg-accent" />

      {/* #6: 상품 섹션 (기획 기준 상품 → 옵션 순서) */}
      <div className="p-4 space-y-2">
        <BaseRow label="상품" direction="column">
          {!category.menus || category.menus.length === 0 ? (
            <span className="typo-body3 text-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {category.menus.map((menu) => {
                const menuKey = typeof menu === 'object' ? (menu.id ?? menu.name) : String(menu)
                const name =
                  typeof menu === 'object'
                    ? `${menu.sn ? `(${menu.sn}) ` : ''}${menu.name}`
                    : String(menu)
                return (
                  <span
                    key={menuKey}
                    className="rounded-full bg-accent px-3 py-1 typo-body3 text-foreground"
                  >
                    {name}
                  </span>
                )
              })}
            </div>
          )}
        </BaseRow>
      </div>

      <div className="h-2 bg-accent" />

      {/* 옵션 항목 (#7: 들여쓰기 적용) */}
      <div className="p-4 space-y-2">
        <BaseRow label="옵션" direction="column">
          {category.options.length === 0 ? (
            <span className="typo-body3 text-foreground">-</span>
          ) : (
            <div className="flex flex-col gap-1 pl-3">
              {category.options.map((opt) => (
                <div key={opt.id ?? opt.name} className="flex justify-between items-center py-1 gap-2">
                  <span className="typo-body3 text-foreground truncate min-w-0">{opt.name}</span>
                  <span className="typo-body3 text-muted-foreground shrink-0">
                    {(opt.base_price ?? opt.price ?? 0).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )}
        </BaseRow>
      </div>

      <div className="h-2 bg-accent" />

      <div className="p-4 space-y-3">
        <BaseRow label="선택 방식" value={selectionTypeText} />
        <BaseRow
          label="선택 가능 개수"
          value={
            category.max_select_count != null
              ? String(category.max_select_count)
              : '제한 없음'
          }
        />
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

// ─────────────────────────────────────────────
// 등록/수정 폼 다이얼로그
// 레거시: OptionRegistrationForm.vue (실제 사용 폼)
// 필드: 옵션 카테고리명(필수) + 필수여부 라디오 + 선택방식 라디오 + 옵션항목 + 선택가능개수 + 연결상품 MultiSelect
const optionInitialValues: FormSchemaValues = {
  name: '',
  is_required: false,
  is_multiple_selectable: false,
  max_select_count: null,
  menus: [],
  options: [],
}

function resolveOptionValues(
  data: OptionCategory,
  menuIds: string[],
): FormSchemaValues {
  return {
    name: data.name ?? '',
    is_required: data.is_required ?? false,
    is_multiple_selectable: data.is_multiple_selectable ?? false,
    max_select_count: data.max_select_count ?? null,
    menus: menuIds,
    options: (data.options ?? []).map((o) => ({
      name: o.name,
      price: o.base_price ?? o.price ?? 0,
    })),
  }
}

interface MenuDropdownItem {
  id: number
  name: string
  operation_name?: string | null
  sn?: string | null
}

interface OptionFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialData: OptionCategory | null
  menuDropdown: MenuDropdownItem[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: FormSchemaValues) => void
}

function OptionFormDialog({
  open,
  mode,
  initialData,
  menuDropdown,
  isSubmitting,
  onClose,
  onSubmit,
}: OptionFormDialogProps) {
  const isEditMode = mode === 'edit'
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // 위치 변경 모드
  const [isReordering, setIsReordering] = useState(false)
  const [reorderItems, setReorderItems] = useState<Array<{ name: string; price: number }>>([])
  const sensors = useSensors(useSensor(PointerSensor))

  const initialMenuIds = initialData
    ? (initialData.menus ?? []).map((m) => {
      if (typeof m === 'string') return m
      if (typeof m === 'number') return String(m)
      if (typeof m === 'object' && m !== null && 'id' in m)
        return String((m as { id: string | number }).id)
      return String(m)
    })
    : []
  const [selectedMenuIds, setSelectedMenuIds] =
    useState<string[]>(initialMenuIds)

  const defaultValues = useMemo(
    () =>
      initialData
        ? resolveOptionValues(initialData, initialMenuIds)
        : optionInitialValues,
    [initialData, initialMenuIds],
  )

  const form = useForm<FormSchemaValues>({
    resolver: typedZodResolver(formSchema),
    defaultValues,
  })

  const toggleMenu = (id: string) => {
    const next = selectedMenuIds.includes(id)
      ? selectedMenuIds.filter((i) => i !== id)
      : [...selectedMenuIds, id]
    setSelectedMenuIds(next)
    form.setValue('menus', next, { shouldValidate: true })
  }

  const removeMenu = (id: string) => {
    const next = selectedMenuIds.filter((i) => i !== id)
    setSelectedMenuIds(next)
    form.setValue('menus', next, { shouldValidate: true })
  }

  const addOptionItem = () => {
    const current = form.getValues('options')
    form.setValue('options', [...current, { name: '', price: 0 }])
  }

  const removeOptionItem = (index: number) => {
    const current = form.getValues('options')
    form.setValue(
      'options',
      current.filter((_, i) => i !== index),
    )
  }

  // 위치 변경 모드 시작
  const startReordering = () => {
    setReorderItems([...form.getValues('options')])
    setIsReordering(true)
  }

  // 위치 변경 취소 — 원래 순서로 복귀
  const cancelReordering = () => {
    setReorderItems([])
    setIsReordering(false)
  }

  // 위치 변경 완료 — 순서 반영
  const completeReordering = () => {
    form.setValue('options', reorderItems)
    setReorderItems([])
    setIsReordering(false)
  }

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = reorderItems.findIndex((_, i) => `reorder-${i}` === active.id)
    const newIndex = reorderItems.findIndex((_, i) => `reorder-${i}` === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setReorderItems(arrayMove(reorderItems, oldIndex, newIndex))
  }

  const handleSubmit = form.handleSubmit((data: FormSchemaValues) => {
    onSubmit(data)
  })

  const selectedMenus = menuDropdown.filter((m) =>
    selectedMenuIds.includes(String(m.id)),
  )
  const optionItems = form.watch('options')
  const isRequired = form.watch('is_required')
  const isMultiple = form.watch('is_multiple_selectable')

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? '상품 옵션 수정' : '상품 옵션 등록'}
      noScrollBody
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 옵션 카테고리명 (필수) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      옵션 카테고리명 (노출용){' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="예) 사이드 메뉴" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 필수 여부 (Figma: 세로 배치, 필수 옵션 / 선택 옵션) */}
              <FormItem>
                <FormLabel>필수 여부</FormLabel>
                <RadioGroup
                  value={isRequired ? 'required' : 'optional'}
                  onValueChange={(v) =>
                    form.setValue('is_required', v === 'required')
                  }
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="required" id="opt-required" />
                    <Label
                      htmlFor="opt-required"
                      className="cursor-pointer typo-body3 weight-400"
                    >
                      필수 옵션
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="optional" id="opt-optional" />
                    <Label
                      htmlFor="opt-optional"
                      className="cursor-pointer typo-body3 weight-400"
                    >
                      선택 옵션
                    </Label>
                  </div>
                </RadioGroup>
              </FormItem>

              <div className="h-2 bg-accent" />

              {/* 상품 (레거시 순서: 필수여부 다음, 옵션 항목 위) */}
              <FormItem>
                <FormLabel>상품</FormLabel>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex w-full items-center justify-between px-3 py-2 text-sm h-auto"
                    onClick={() => setDropdownOpen((v) => !v)}
                  >
                    <span className="text-foreground">
                      상품을 선택해 주세요.
                    </span>
                    <span className="typo-micro1 text-foreground">▼</span>
                  </Button>

                  {dropdownOpen && (
                    <div className="absolute z-50 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto bottom-full mb-1">
                      {menuDropdown.length === 0 ? (
                        <p className="p-3 typo-body3 text-foreground">
                          상품이 없습니다.
                        </p>
                      ) : (
                        menuDropdown.map((menu) => {
                          const id = String(menu.id)
                          const isSelected = selectedMenuIds.includes(id)
                          return (
                            <Button
                              key={menu.id}
                              type="button"
                              variant="ghost"
                              className={`flex w-full items-center justify-start px-3 py-2 text-sm h-auto rounded-none overflow-hidden ${isSelected ? 'bg-accent/50 weight-500' : ''}`}
                              onClick={() => toggleMenu(id)}
                            >
                              <span className="mr-2 shrink-0">
                                {isSelected ? '✓' : '\u00a0'}
                              </span>
                              <span className="truncate">
                                {menu.sn ? `(${menu.sn}) ` : ''}
                                {menu.operation_name ?? menu.name}
                              </span>
                            </Button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* 선택된 상품 칩 */}
                {selectedMenus.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 overflow-hidden">
                    {selectedMenus.map((menu) => (
                      <span
                        key={menu.id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary max-w-full min-w-0"
                      >
                        <span className="truncate">
                          {menu.sn ? `(${menu.sn}) ` : ''}
                          {menu.operation_name ?? menu.name}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 ml-0.5 text-primary hover:text-primary/70 leading-none"
                          onClick={() => removeMenu(String(menu.id))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </FormItem>

              <div className="h-2 bg-accent" />

              {/* 옵션 항목 (Figma: 위치 변경 + 추가 버튼, 옵션명 + 가격(원) + 휴지통) */}
              <FormItem>
                <FormLabel>옵션</FormLabel>

                {/* 위치 변경 모드 */}
                {isReordering ? (
                  <>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={cancelReordering}
                      >
                        취소
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 gap-1"
                        onClick={completeReordering}
                      >
                        위치 변경 완료
                      </Button>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={reorderItems.map((_, i) => `reorder-${i}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-2 mt-2">
                          {reorderItems.map((item, index) => (
                            <SortableOptionItem key={`reorder-${index}`} id={`reorder-${index}`} index={index} item={item} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2 mt-1">
                      {optionItems.length >= 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={startReordering}
                        >
                          ↕ 위치 변경
                        </Button>
                      )}
                      <Button
                        type="button"
                        className="flex-1 gap-1"
                        onClick={addOptionItem}
                      >
                        + 추가
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      {optionItems.map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <Input
                            placeholder="옵션명 입력"
                            className="flex-1 typo-body3"
                            {...form.register(`options.${index}.name`)}
                          />
                          <div className="relative w-28 shrink-0">
                            <Input
                              placeholder="가격 입력"
                              type="number"
                              min={0}
                              className="typo-body3 text-right pr-7"
                              {...form.register(`options.${index}.price`, {
                                valueAsNumber: true,
                              })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">원</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0 rounded-none bg-neutral-800 border-neutral-800 text-white hover:bg-neutral-700 hover:border-neutral-700"
                            onClick={() => removeOptionItem(index)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="typo-micro1 text-muted-foreground mt-1">가격 예: 1,000원 / 무료는 0원</p>
                  </>
                )}
              </FormItem>

              {/* 선택 방식 (Figma: 세로 배치, 단일 선택 / 다중 선택) */}
              <FormItem>
                <FormLabel>선택 방식</FormLabel>
                <RadioGroup
                  value={isMultiple ? 'multiple' : 'single'}
                  onValueChange={(v) =>
                    form.setValue('is_multiple_selectable', v === 'multiple')
                  }
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="single" id="opt-single" />
                    <Label
                      htmlFor="opt-single"
                      className="cursor-pointer typo-body3 weight-400"
                    >
                      단일 선택
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="multiple" id="opt-multiple" />
                    <Label
                      htmlFor="opt-multiple"
                      className="cursor-pointer typo-body3 weight-400"
                    >
                      다중 선택
                    </Label>
                  </div>
                </RadioGroup>
              </FormItem>

              {/* 선택 가능 개수 (Figma: Select 드롭다운) */}
              <FormField
                control={form.control}
                name="max_select_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      선택 가능 개수{' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <Select
                      value={field.value == null ? 'unlimited' : String(field.value)}
                      onValueChange={(v) => {
                        field.onChange(v === 'unlimited' ? null : Number(v))
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="선택해주세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unlimited">제한 없음</SelectItem>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

// ─────────────────────────────────────────────
// 위치 변경 모드용 정렬 가능 항목
// ─────────────────────────────────────────────
function SortableOptionItem({
  id,
  index,
  item,
}: {
  id: string
  index: number
  item: { name: string; price: number }
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-md border bg-background p-3 transition-shadow ${isDragging ? 'shadow-lg opacity-50' : ''
        }`}
    >
      {/* 드래그 핸들 */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab items-center text-neutral-400 active:cursor-grabbing touch-none"
      >
        <GripVertical size={20} />
      </div>

      {/* 번호 배지 */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-800 text-[11px] font-bold text-white">
        {index + 1}
      </span>

      {/* 옵션명 (읽기전용) */}
      <span className="flex-1 truncate typo-body3 text-foreground">
        {item.name || '(이름 없음)'}
      </span>

      {/* 가격 (읽기전용) */}
      <span className="shrink-0 typo-body3 text-muted-foreground">
        {item.price.toLocaleString()}원
      </span>
    </div>
  )
}
