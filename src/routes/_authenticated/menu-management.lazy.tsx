import React, { useEffect, useRef } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  useAuthStore,
  selectIsManagementAccount,
  selectIsBrandAccount,
  selectIsStoreAccount,
} from '@/store/useAuthStore'
import { useStoreSelectionStore } from '@/store/useStoreSelectionStore'
import { TABS, type TabKey } from '@/features/menu-management/constants'
import { StoreSelectionBar } from '@/features/menu-management/components/shared/store-selection-bar'
import { MenuTab } from '@/features/menu-management/components/menu/menu-tab'
import { OperationModeTab } from '@/features/menu-management/components/operation/operation-mode-tab'
import { CategoryTab } from '@/features/menu-management/components/category/category-tab'
import { OptionTab } from '@/features/menu-management/components/option/option-tab'
import { OriginTab } from '@/features/menu-management/components/origin/origin-tab'
import { useMenuCategories } from '@/features/menu-management/queries'
import { PageLayout } from '@/components/layout/page-layout'

export const Route = createLazyFileRoute('/_authenticated/menu-management')({
  component: MenuManagementPage,
})

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
function MenuManagementPage() {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  const isBrandAccount = useAuthStore(selectIsBrandAccount)
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  const {
    selectedStoreId,
    setSelectedStore,
    setStoreSelectionOpen,
  } = useStoreSelectionStore()

  const activeStoreId = isStoreAccount ? userStoreId : selectedStoreId

  const navigate = useNavigate()
  const { tab: activeTab } = Route.useSearch()
  const tabsListRef = useRef<HTMLDivElement>(null)

  // 운영모드 탭에서 사용하는 카테고리 데이터
  const { data: categoriesData = [] } = useMenuCategories(activeStoreId)

  // 페이지 진입 시 매장 미선택이면 첫 페인트 이후 모달 오픈
  // requestAnimationFrame으로 지연 → LCP 요소 측정 후 오픈 (NO_LCP 방지)
  useEffect(() => {
    if (!isStoreAccount && !activeStoreId) {
      const raf = requestAnimationFrame(() => {
        setStoreSelectionOpen(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [])

  // 탭 전환 시 활성 탭이 보이도록 스크롤
  useEffect(() => {
    const el = tabsListRef.current?.querySelector<HTMLElement>(
      '[data-state="active"]',
    )
    el?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeTab, activeStoreId])

  return (
    <div className="flex flex-col">
      {/* 매장 선택 바 */}
      <StoreSelectionBar
        isManagementAccount={isManagementAccount}
        isBrandAccount={isBrandAccount}
        isStoreAccount={isStoreAccount}
        userBrandId={userBrandId}
        onSelect={setSelectedStore}
      />

      {/* 콘텐츠 영역 */}
      {!activeStoreId ? (
        <div className="flex items-center justify-center py-20 text-neutral-400">
          매장을 선택해주세요.
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            navigate({ to: '/menu-management', search: { tab: v as TabKey } })
          }
          className="gap-0"
        >
          <PageLayout className="max-md:p-0 max-w-full ">
            <TabsList
              ref={tabsListRef}
              className="w-full overflow-x-auto justify-start"
              variant="segment"
            >
              {TABS.map((tab, i) => (
                <React.Fragment key={tab.key}>
                  {i > 0 && (
                    <Separator
                      orientation="vertical"
                      className="data-[orientation=vertical]:h-[70%] self-center shrink-0"
                    />
                  )}
                  <TabsTrigger className="min-w-[140px]" value={tab.key}>
                    {tab.label}
                  </TabsTrigger>
                </React.Fragment>
              ))}
            </TabsList>
          </PageLayout>
          <TabsContent value="menuManagement">
            <MenuTab storeId={activeStoreId} />
          </TabsContent>

          <TabsContent value="operationProfileManagement">
            <OperationModeTab
              storeId={activeStoreId}
              categories={categoriesData}
            />
          </TabsContent>

          <TabsContent value="categoryManagement">
            <CategoryTab storeId={activeStoreId} />
          </TabsContent>

          <TabsContent value="optionManagement">
            <OptionTab storeId={activeStoreId} />
          </TabsContent>

          <TabsContent value="originManagement">
            <OriginTab storeId={activeStoreId} />
          </TabsContent>

          {TABS.filter(
            (t) =>
              ![
                'menuManagement',
                'operationProfileManagement',
                'categoryManagement',
                'optionManagement',
                'originManagement',
              ].includes(t.key),
          ).map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="py-4">
              <div className="flex items-center justify-center py-20 text-neutral-400">
                {tab.label} 탭은 준비 중입니다.
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
