import { useState, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import { Trash2, Copy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FilterSection } from '@/components/common/filter-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OperationModeFilter } from '@/components/common/filter/operation-mode-filter/operation-mode-filter'
import {
  type OperationModeFilterValues,
  OPERATION_MODE_FILTER_DEFAULTS,
  filterOperationModes,
} from '@/components/common/filter/operation-mode-filter/constants'
import { Textarea } from '@/components/ui/textarea'
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
  useOperationProfiles,
  useCreateOperationProfile,
  useUpdateOperationProfile,
  useDeleteOperationProfile,
  useSyncMenu,
  useUpdateOperationProfileOrdering,
  useStorePosType,
} from '@/features/menu-management/queries'
import { OrderChangeDialog } from '@/features/menu-management/components/menu/order-change-dialog'
import { TabToolbar } from '@/features/menu-management/components/shared/tab-toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  OperationProfile,
  MenuCategoryItem,
} from '@/features/menu-management/schema'
import type { OperationProfileForm } from '@/features/menu-management/schema'
import { TAB_SORT_OPTIONS } from '@/features/menu-management/constants'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'
import { OperationModeCardMobile } from '@/features/menu-management/components/operation/operation-mode-card-mobile'

// ─────────────────────────────────────────────
// 타입 & 상수
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 폼 스키마: name(필수) + description(필수) + menu_categories(필수 1개 이상)
// 레거시: 3개 필드 모두 입력 시 등록 버튼 활성화
// ─────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, '운영모드명을 입력해주세요.'),
  description: z.string().min(1, '운영모드 설명을 입력해주세요.'),
  menu_categories: z
    .array(z.number())
    .min(1, '상품 카테고리를 1개 이상 선택해주세요.'),
})

type FormSchemaValues = z.infer<typeof formSchema>

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').slice(0, 19).replace(/-/g, '/')
}

function getConnectedCategoryText(
  categories: OperationProfile['menu_categories'],
): string {
  if (!categories || categories.length === 0) return '카테고리가 없습니다.'
  return categories.map((c) => c.name).join(', ')
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface OperationModeTabProps {
  storeId: string | null
  categories: MenuCategoryItem[]
}

// ─────────────────────────────────────────────
// 운영모드 탭 메인 컴포넌트
// ─────────────────────────────────────────────
export function OperationModeTab({
  storeId,
  categories,
}: OperationModeTabProps) {
  // 다이얼로그 상태
  const [viewProfile, setViewProfile] = useState<OperationProfile | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingProfile, setEditingProfile] = useState<OperationProfile | null>(
    null,
  )
  const [deleteTargetProfile, setDeleteTargetProfile] =
    useState<OperationProfile | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const orderDialogKey = useDialogKey(isOrderDialogOpen)
  const formDialogKey = useDialogKey(formMode !== null, editingProfile?.id ?? 'new')

  // 데이터
  const { data: profiles = [], isLoading } = useOperationProfiles(storeId)
  const { data: posType, isLoading: isPosTypeLoading } =
    useStorePosType(storeId)

  const isPosTypeLoaded = !isPosTypeLoading && posType !== undefined
  const isDidOnly = posType === 'did_only'

  // 필터 form 소유
  const form = useForm<OperationModeFilterValues>({
    defaultValues: OPERATION_MODE_FILTER_DEFAULTS,
  })

  // null = 필터 미적용 (전체 목록 표시)
  const [filteredProfiles, setFilteredProfiles] = useState<
    OperationProfile[] | null
  >(null)
  const displayedProfiles = filteredProfiles ?? profiles

  // 정렬
  const [sortKey, setSortKey] = useState(0)

  const sortedProfiles = useMemo(() => {
    const opt = TAB_SORT_OPTIONS[sortKey]
    if (!opt) return displayedProfiles
    const { order_by, order_direction } = opt
    const sorted = [...displayedProfiles].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[order_by] ?? ''
      const bVal = (b as Record<string, unknown>)[order_by] ?? ''
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
    return order_direction === 'desc' ? sorted.reverse() : sorted
  }, [displayedProfiles, sortKey])

  // 뮤테이션
  const createMutation = useCreateOperationProfile(storeId)
  const updateMutation = useUpdateOperationProfile(storeId)
  const deleteMutation = useDeleteOperationProfile(storeId)
  const syncMutation = useSyncMenu(storeId)
  const orderingMutation = useUpdateOperationProfileOrdering(storeId)

  // 진열 순서 변경 아이템
  const profileOrderItems = useMemo(
    () =>
      [...profiles]
        .sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))
        .map((p) => ({
          id: p.id,
          name: p.name,
          operation_name: p.operation_name ?? undefined,
          sn: p.sn ?? undefined,
        })),
    [profiles],
  )

  const handleOrderSave = async (
    ordered: { id: number | string; ordering: number }[],
  ) => {
    await orderingMutation.mutateAsync(
      ordered.map((item) => ({ ...item, parent_object_id: storeId! })),
    )
    setIsOrderDialogOpen(false)
    toast.success('진열 순서가 저장되었습니다.')
  }

  // ── 필터 핸들러 ──
  const handleFilterSubmit = (values: OperationModeFilterValues) => {
    setFilteredProfiles(filterOperationModes(profiles, values))
  }

  const handleFilterReset = () => {
    setFilteredProfiles(null)
  }

  // ── 신규 등록 ──
  const handleNewClick = () => {
    setEditingProfile(null)
    setFormMode('create')
  }

  // ── 포스 동기화 (레거시: MenuHeader.vue — !isDidOnly일 때 표시) ──
  const handleSyncClick = async () => {
    if (!storeId) return
    if (
      !confirm(
        '포스 동기화를 진행합니다. 동기화를 완료하는데 10초 이상 소요될 수 있습니다.',
      )
    )
      return
    try {
      await syncMutation.mutateAsync()
      toast.success('포스 동기화가 완료되었습니다.')
    } catch (err: unknown) {
      console.error('포스 동기화 실패:', err)
      toast.error('포스 동기화에 실패했습니다.')
    }
  }

  // ── 카드 클릭 → 상세 다이얼로그 (레거시: 카드 전체가 View 다이얼로그 오픈) ──
  const handleCardClick = (profile: OperationProfile) => {
    setViewProfile(profile)
  }

  // ── 상세에서 수정 ──
  const handleEditFromView = () => {
    setEditingProfile(viewProfile)
    setViewProfile(null)
    setFormMode('edit')
  }

  // ── 상세에서 삭제 ──
  const handleDeleteFromView = () => {
    if (!viewProfile) return
    setDeleteTargetProfile(viewProfile)
    setViewProfile(null)
  }

  // 삭제 확인 → API 호출 후 다이얼로그 닫기
  const handleDeleteConfirm = async () => {
    if (!deleteTargetProfile) return
    await deleteMutation.mutateAsync(deleteTargetProfile.id)
    setDeleteTargetProfile(null)
    toast.success('삭제 완료되었습니다.')
  }

  // 삭제 취소 → 상세 보기 다이얼로그로 복귀
  const handleDeleteCancel = () => {
    setViewProfile(deleteTargetProfile)
    setDeleteTargetProfile(null)
  }

  // ── 폼 제출 ──
  const handleFormSubmit = async (data: FormSchemaValues) => {
    if (!storeId) return
    const payload: OperationProfileForm = {
      name: data.name,
      operation_name: '',
      description: data.description,
      menu_categories: data.menu_categories,
      ordering:
        formMode === 'edit' ? (editingProfile?.ordering ?? 0) : profiles.length,
    }
    if (formMode === 'edit' && editingProfile) {
      await updateMutation.mutateAsync({
        profileId: editingProfile.id,
        payload,
      })
      toast.success('수정 완료되었습니다.')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('등록 완료되었습니다.')
    }
    setFormMode(null)
    setEditingProfile(null)
  }

  const isFormSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={OPERATION_MODE_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <OperationModeFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        {/* 헤더 툴바 */}
        <TabToolbar
          storeId={storeId}
          isDidOnly={isDidOnly}
          isPosTypeLoaded={isPosTypeLoaded}
          isOrderDisabled={profiles.length === 0}
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
        {storeId && !isLoading && sortedProfiles.length === 0 && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            조회된 운영모드가 없습니다.
          </div>
        )}
        {storeId && !isLoading && sortedProfiles.length > 0 && (
          <div className="flex flex-col gap-3 md:gap-2">
            {sortedProfiles.map((profile) => (
              <Fragment key={profile.id}>
                <OperationModeCard
                  profile={profile}
                  onClick={() => handleCardClick(profile)}
                  className="hidden md:flex"
                />
                <OperationModeCardMobile
                  profile={profile}
                  onClick={() => handleCardClick(profile)}
                  className="md:hidden"
                />
              </Fragment>
            ))}
          </div>
        )}

        {/* View 다이얼로그 */}
        <OperationModeViewDialog
          open={!!viewProfile}
          profile={viewProfile}
          onClose={() => setViewProfile(null)}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
          isDeleting={deleteMutation.isPending}
        />

        {/* 등록/수정 폼 다이얼로그 */}
        <OperationModeFormDialog
          key={formDialogKey}
          open={formMode !== null}
          mode={formMode ?? 'create'}
          initialData={editingProfile}
          categories={categories}
          isSubmitting={isFormSubmitting}
          onClose={() => {
            setFormMode(null)
            setEditingProfile(null)
          }}
          onSubmit={handleFormSubmit}
        />

        {/* 진열 순서 변경 다이얼로그 */}
        <OrderChangeDialog
          key={orderDialogKey}
          open={isOrderDialogOpen}
          type="operationProfile"
          items={profileOrderItems}
          isSaving={orderingMutation.isPending}
          onClose={() => setIsOrderDialogOpen(false)}
          onSave={handleOrderSave}
        />

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={!!deleteTargetProfile}
          title="운영모드 삭제"
          description={
            <>
              <p>이름: {deleteTargetProfile?.name}</p>
              <p>ID: {deleteTargetProfile?.id}</p>
              {deleteTargetProfile?.sn && <p>SN: {deleteTargetProfile.sn}</p>}
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
// 운영모드 카드
// 레거시: MenuEntity (type=OPERATION_PROFILE) — 뱃지 없음, 날짜 없음, 카드 전체 클릭
// ─────────────────────────────────────────────
interface OperationModeCardProps {
  profile: OperationProfile
  onClick: () => void
  className?: string
}

function OperationModeCard({ profile, onClick, className }: OperationModeCardProps) {
  const categoryText = getConnectedCategoryText(profile.menu_categories)

  return (
    <button
      type="button"
      className={`w-full rounded border border-border bg-background p-4 text-left transition-colors hover:bg-muted cursor-pointer flex flex-col gap-1.5 ${className ?? ''}`}
      onClick={onClick}
    >
      {/* 운영모드명 (레거시: title = operationProfile.name, 굵게) */}
      <p className="typo-headline3 weight-700 text-foreground">
        {profile.name}
      </p>
      {/* 상품 카테고리 텍스트 (레거시: description = getConnectedCategoryText) */}
      <div className="flex items-center gap-2 typo-body1 text-foreground">
        <span>상품 카테고리:</span>
        <span>{categoryText}</span>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// View 다이얼로그
// 레거시: OperationModeViewDialog.vue
// ─────────────────────────────────────────────
interface OperationModeViewDialogProps {
  open: boolean
  profile: OperationProfile | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function OperationModeViewDialog({
  open,
  profile,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: OperationModeViewDialogProps) {
  if (!profile) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(String(profile.id))
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="운영모드 정보"
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
        {/* 운영모드 ID + 복사 */}
        <BaseRow label="운영모드 ID">
          <div className="flex flex-col items-end gap-1">
            <span className="typo-body3 text-right break-all">{profile.id}</span>
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

        {/* 상태 */}
        <BaseRow
          label="상태"
          value={profile.is_active !== false ? '사용' : '미사용'}
        />

        {/* 운영모드명 */}
        <BaseRow label="운영모드명" value={profile.name} />

        {/* 운영모드 설명 */}
        <BaseRow label="운영모드 설명" value={profile.description ?? '-'} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 연결 카테고리 (칩) */}
      <div className="p-4 space-y-2">
        <BaseRow label="연결 카테고리" direction="column">
          {profile.menu_categories.length === 0 ? (
            <span className="typo-body3 text-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.menu_categories.map((cat) => (
                <span key={cat.id} className="rounded-full bg-accent px-3 py-1 typo-body3 text-foreground">
                  {cat.name}
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
          value={formatDate(profile.update_dt)}
        />
        <BaseRow label="등록 일시" value={formatDate(profile.create_dt)} />

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

const operationInitialValues: FormSchemaValues = {
  name: '',
  description: '',
  menu_categories: [],
}

function resolveOperationValues(data: OperationProfile): FormSchemaValues {
  return {
    name: data.name ?? '',
    description: data.description ?? '',
    menu_categories: data.menu_categories.map((c) => c.id),
  }
}

interface OperationModeFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialData: OperationProfile | null
  categories: MenuCategoryItem[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: FormSchemaValues) => void
}

function OperationModeFormDialog({
  open,
  mode,
  initialData,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: OperationModeFormDialogProps) {
  const isEditMode = mode === 'edit'

  const initialCatIds = initialData
    ? initialData.menu_categories.map((c) => c.id)
    : []
  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<number[]>(initialCatIds)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const defaultValues = useMemo(
    () =>
      initialData
        ? resolveOperationValues(initialData)
        : operationInitialValues,
    [initialData],
  )

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const toggleCategory = (id: number) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((i) => i !== id)
      : [...selectedCategoryIds, id]
    setSelectedCategoryIds(next)
    form.setValue('menu_categories', next, { shouldValidate: true })
  }

  const removeCategory = (id: number) => {
    const next = selectedCategoryIds.filter((i) => i !== id)
    setSelectedCategoryIds(next)
    form.setValue('menu_categories', next, { shouldValidate: true })
  }

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data)
  })

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(c.id),
  )

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? '운영모드 수정' : '운영모드 등록'}
      noScrollBody
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* 운영모드명 (관리전용) (필수) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      운영모드명 (관리전용){' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="운영모드명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 운영모드 설명 (관리전용) (필수) */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      운영모드 설명 (관리전용){' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="운영모드 설명 입력"
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* 상품 카테고리 MultiSelect (필수) */}
              <FormField
                control={form.control}
                name="menu_categories"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      상품 카테고리{' '}
                      <span className="text-status-destructive typo-micro1">
                        (필수)
                      </span>
                    </FormLabel>

                    {/* 드롭다운 트리거 */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-between px-3 py-2 text-sm h-auto"
                        onClick={() => setDropdownOpen((v) => !v)}
                      >
                        <span className="text-muted-foreground">카테고리 선택</span>
                        <span className="typo-micro1 text-muted-foreground">▼</span>
                      </Button>

                      {/* 드롭다운 목록 */}
                      {dropdownOpen && (
                        <div className="absolute z-50 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto bottom-full mb-1">
                          {categories.length === 0 ? (
                            <p className="p-3 typo-body3 text-muted-foreground">
                              카테고리가 없습니다.
                            </p>
                          ) : (
                            categories.map((cat) => {
                              const isSelected = selectedCategoryIds.includes(
                                cat.id,
                              )
                              return (
                                <Button
                                  key={cat.id}
                                  type="button"
                                  variant="ghost"
                                  className={`flex w-full items-center justify-start px-3 py-2 typo-body3 h-auto rounded-none ${isSelected ? 'bg-accent/50 weight-500' : ''}`}
                                  onClick={() => toggleCategory(cat.id)}
                                >
                                  <span className="mr-2">
                                    {isSelected ? '✓' : '\u00a0'}
                                  </span>
                                  {cat.name}
                                </Button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* 선택된 카테고리 칩 */}
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {cat.name}
                            <button
                              type="button"
                              className="ml-0.5 text-primary hover:text-primary/70 leading-none"
                              onClick={() => removeCategory(cat.id)}
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
