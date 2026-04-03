import React, { useState, useMemo, Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FilterSection } from '@/components/common/filter-section'
import { MenuFilter } from '@/components/common/filter/menu-filter/menu-filter'
import {
  MENU_FILTER_DEFAULTS,
  filterMenus,
  type MenuFilterValues,
} from '@/components/common/filter/menu-filter/constants'
import {
  useMenuList,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useMenuCategories,
  useOptionCategories,
  useSyncMenu,
  useUpdateMenuOrdering,
  useStorePosType,
} from '@/features/menu-management/queries'
import { SORT_OPTIONS } from '@/features/menu-management/constants'
import { TabToolbar } from '@/features/menu-management/components/shared/tab-toolbar'
import {
  OrderChangeDialog,
  type OrderChangeItem,
} from '@/features/menu-management/components/menu/order-change-dialog'
import { MenuCard } from '@/features/menu-management/components/menu/menu-card'
import { MenuCardMobile } from '@/features/menu-management/components/menu/menu-card-mobile'
import { MenuViewDialog } from '@/features/menu-management/components/menu/menu-view-dialog'
import { MenuFormDialog } from '@/features/menu-management/components/menu/menu-form-dialog'
import type { MenuItem, MenuForm } from '@/features/menu-management/schema'
import { PageLayout } from '@/components/layout/page-layout'
import { useDialogKey } from '@/hooks/useDialogKey'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface MenuTabProps {
  storeId: string | null
}

// ─────────────────────────────────────────────
// 상품 탭 메인 컴포넌트
// ─────────────────────────────────────────────
export function MenuTab({ storeId }: MenuTabProps) {
  // ── 다이얼로그 상태 ──
  const [viewMenu, setViewMenu] = useState<MenuItem | null>(null)
  const [deleteTargetMenu, setDeleteTargetMenu] = useState<MenuItem | null>(
    null,
  )
  const [editMenu, setEditMenu] = useState<MenuItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const orderDialogKey = useDialogKey(isOrderDialogOpen)
  const menuFormDialogKey = useDialogKey(isFormOpen, editMenu?.id ?? 'new')

  // ── 데이터 조회 ──
  const { data, isLoading } = useMenuList(storeId)
  const { data: categoriesData = [] } = useMenuCategories(storeId)
  const { data: optionsData = [] } = useOptionCategories(storeId)
  const allMenus = useMemo(() => data?.results ?? [], [data])

  // ── POS 타입 (포스 동기화 / 신규등록 버튼 분기용) ──
  const { data: posType, isLoading: isPosTypeLoading } =
    useStorePosType(storeId)
  const isPosTypeLoaded = !isPosTypeLoading && posType !== undefined
  const isDidOnly = posType === 'did_only'

  // ── 뮤테이션 ──
  const createMenuMutation = useCreateMenu(storeId)
  const updateMenuMutation = useUpdateMenu()
  const deleteMenuMutation = useDeleteMenu()
  const syncMutation = useSyncMenu(storeId)
  const updateOrderingMutation = useUpdateMenuOrdering()

  // form은 MenuTab이 소유 — FilterSection에 prop으로 전달
  const form = useForm<MenuFilterValues>({
    defaultValues: MENU_FILTER_DEFAULTS,
  })

  // 현재 선택된 정렬 옵션 인덱스 (SORT_OPTIONS 기준)
  const [sortKey, setSortKey] = useState(0)

  // null = 필터 미적용 상태 (전체 목록 표시)
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[] | null>(null)
  const displayedMenus = filteredMenus ?? allMenus

  const handleFilterSubmit = (values: MenuFilterValues) => {
    setFilteredMenus(filterMenus(allMenus, values))
  }

  const handleFilterReset = () => {
    setFilteredMenus(null)
  }

  // 2단계: 정렬 — filteredMenus를 SORT_OPTIONS[sortKey] 기준으로 정렬한 최종 렌더링 데이터
  const sortedMenus = useMemo(() => {
    const opt = SORT_OPTIONS[sortKey]
    if (!opt) return displayedMenus
    const { order_by, order_direction } = opt
    const sorted = [...displayedMenus].sort((a, b) => {
      const aVal = a[order_by as keyof MenuItem] ?? ''
      const bVal = b[order_by as keyof MenuItem] ?? ''
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
    return order_direction === 'desc' ? sorted.reverse() : sorted
  }, [displayedMenus, sortKey])

  // ── 진열 순서 변경용 아이템 목록 ──
  const menuOrderItems = useMemo<OrderChangeItem[]>(
    () =>
      allMenus.map((m) => ({
        id: m.id,
        name: m.name,
        operation_name: m.operation_name,
        sn: m.sn,
        image_url: m.image_url ?? m.thumbnail_url,
        connected_label: m.menu_categories.length
          ? `카테고리: ${m.menu_categories.map((c) => c.operation_name ?? c.name).join(', ')}`
          : undefined,
      })),
    [allMenus],
  )

  // ── 핸들러 ──

  // 상품 카드 클릭 → 상세 보기 다이얼로그 열기
  const handleCardClick = (menu: MenuItem) => {
    setViewMenu(menu)
  }

  // 상세 보기에서 "수정" 클릭 → 상세 닫고 수정 폼 열기
  const handleEditFromView = () => {
    setEditMenu(viewMenu)
    setViewMenu(null)
    setIsFormOpen(true)
  }

  // 신규 등록 버튼 클릭 → 빈 폼으로 열기
  const handleNewClick = () => {
    setEditMenu(null)
    setIsFormOpen(true)
  }

  // 포스 동기화 버튼 클릭 → confirm 후 API 호출
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
    } catch {
      toast.error('포스 동기화에 실패했습니다.')
    }
  }

  // 레거시 postMenu/putMenu 포팅 — hasImage 플래그로 FormData/JSON 분기
  const handleFormSubmit = async (
    data: MenuForm,
    imageFile: File | null,
    removeImage: boolean,
  ) => {
    if (!storeId) return

    const menuPayload: Record<string, unknown> = {
      ...data,
      parent_object_id: storeId,
    }

    // 이미지 처리 (레거시 ProductRegistrationForm.handleSubmit 동일 로직)
    let hasImage = false
    if (imageFile) {
      menuPayload.image_url = imageFile
      hasImage = true
    } else if (!removeImage && data.image_url) {
      menuPayload.image_url = data.image_url
      hasImage = true
    } else {
      menuPayload.image_url = null
    }

    try {
      // hasImage일 때 FormData, 아닐 때 JSON (레거시 postMenu/putMenu 동일)
      if (hasImage) {
        const formData = new FormData()
        for (const [key, val] of Object.entries(menuPayload)) {
          if (val === undefined) continue
          if (val === null) {
            formData.append(key, '')
            continue
          }
          if (val instanceof File) {
            formData.append(key, val)
          } else if (key === 'menu_categories' || key === 'option_categories') {
            formData.append(key, JSON.stringify(val))
          } else {
            formData.append(key, String(val))
          }
        }

        if (editMenu) {
          await updateMenuMutation.mutateAsync({ menuId: editMenu.id, payload: formData })
        } else {
          await createMenuMutation.mutateAsync(formData)
        }
      } else {
        const payload = menuPayload as MenuForm
        if (editMenu) {
          await updateMenuMutation.mutateAsync({ menuId: editMenu.id, payload })
        } else {
          await createMenuMutation.mutateAsync(payload)
        }
      }

      toast.success(editMenu ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.')
      setIsFormOpen(false)
      setEditMenu(null)
    } catch {
      toast.error('상품 저장에 실패했습니다.')
    }
  }

  // 상세 보기에서 "삭제" 클릭 → 삭제 확인 다이얼로그로 전환
  const handleDeleteFromView = () => {
    if (!viewMenu) return
    setDeleteTargetMenu(viewMenu)
    setViewMenu(null)
  }

  // 삭제 확인 → API 호출 후 다이얼로그 닫기
  const handleDeleteConfirm = async () => {
    if (!deleteTargetMenu) return
    await deleteMenuMutation.mutateAsync(deleteTargetMenu.id)
    setDeleteTargetMenu(null)
    toast.success('삭제 완료되었습니다.')
  }

  // 삭제 취소 → 상세 보기 다이얼로그로 복귀
  const handleDeleteCancel = () => {
    setViewMenu(deleteTargetMenu)
    setDeleteTargetMenu(null)
  }

  // 진열 순서 저장
  const handleMenuOrderSave = async (
    orderedItems: Array<{ id: string | number; ordering: number }>,
  ) => {
    await updateOrderingMutation.mutateAsync({
      menus: orderedItems.map((item) => ({
        id: String(item.id),
        ordering: item.ordering,
        parent_object_id: storeId!,
      })),
    })
    setIsOrderDialogOpen(false)
    toast.success('진열 순서가 변경되었습니다.')
  }

  const isFormSubmitting =
    createMenuMutation.isPending || updateMenuMutation.isPending

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        {/* 필터 — MenuTab의 form 전달, 조회/초기화 시 스냅샷 갱신 */}
        <FilterSection
          form={form}
          defaultValues={MENU_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <MenuFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout className="py-0">
        {/* 툴바: 정렬 / 진열순서 / 동기화 / 신규등록 */}
        <TabToolbar
          storeId={storeId}
          isDidOnly={isDidOnly}
          isPosTypeLoaded={isPosTypeLoaded}
          isOrderDisabled={allMenus.length === 0}
          isSyncPending={syncMutation.isPending}
          sortKey={sortKey}
          sortOptions={SORT_OPTIONS}
          onOrderClick={() => setIsOrderDialogOpen(true)}
          onSyncClick={handleSyncClick}
          onNewClick={handleNewClick}
          onSortChange={(key) => setSortKey(key)}
        />

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 flex gap-4">
                <Skeleton className="h-20 w-20 shrink-0 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && sortedMenus.length === 0 && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            조회된 상품이 없습니다.
          </div>
        )}

        {/* 상품 카드 목록 */}
        {!isLoading && sortedMenus.length > 0 && (
          <div className="flex flex-col gap-3 md:gap-2">
            {sortedMenus.map((menu: MenuItem) => (
              <React.Fragment key={menu.id}>
                <MenuCard
                  menu={menu}
                  onClick={() => handleCardClick(menu)}
                  className="hidden md:flex"
                />
                <MenuCardMobile
                  menu={menu}
                  onClick={() => handleCardClick(menu)}
                  className="md:hidden"
                />
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 상세 보기 다이얼로그 */}
        <MenuViewDialog
          open={!!viewMenu}
          menu={viewMenu}
          onClose={() => setViewMenu(null)}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
        />

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={!!deleteTargetMenu}
          title="상품 삭제"
          description={
            <>
              <p>
                이름:{' '}
                {deleteTargetMenu?.operation_name ?? deleteTargetMenu?.name}
              </p>
              <p>ID: {deleteTargetMenu?.id}</p>
              {deleteTargetMenu?.sn && <p>SN: {deleteTargetMenu.sn}</p>}
              <p>&nbsp;</p>
              <p>항목을 삭제하시겠습니까?</p>
              <p>이 작업은 되돌릴 수 없습니다.</p>
            </>
          }
          confirmLabel="삭제"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />

        {/* 진열 순서 변경 다이얼로그 */}
        <OrderChangeDialog
          key={orderDialogKey}
          open={isOrderDialogOpen}
          type="menu"
          items={menuOrderItems}
          isSaving={updateOrderingMutation.isPending}
          onClose={() => setIsOrderDialogOpen(false)}
          onSave={handleMenuOrderSave}
        />

        {/* 등록/수정 폼 다이얼로그 */}
        <MenuFormDialog
          key={menuFormDialogKey}
          open={isFormOpen}
          initialData={editMenu}
          storeId={storeId}
          ordering={allMenus.length}
          isSubmitting={isFormSubmitting}
          categories={categoriesData}
          options={optionsData}
          onClose={() => {
            setIsFormOpen(false)
            setEditMenu(null)
          }}
          onSubmit={handleFormSubmit}
        />
      </PageLayout>
    </Fragment>
  )
}
