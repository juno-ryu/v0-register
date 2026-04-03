import { createLazyFileRoute } from '@tanstack/react-router'
import { useBranchDetail, useBranchOpeningHours } from '@/features/branch-management/queries'
import { BranchInformationTab } from '@/features/branch-management/components/branch-information-tab'
import { BranchSettingsDialog } from '@/features/branch-management/components/branch-settings-dialog'
import { BranchAccountDialog } from '@/features/branch-management/components/branch-account-dialog'
import { BranchOpeningHoursDialog } from '@/features/branch-management/components/branch-opening-hours-dialog'
import { OrderServiceTab } from '@/features/branch-management/components/order-service-tab'
import { WebOrderSettingsTab } from '@/features/branch-management/components/web-order-settings-tab'
import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useDialogKey } from '@/hooks/useDialogKey'

export const Route = createLazyFileRoute('/_authenticated/branch-management/$storeId')({
  component: BranchDetailPage,
})

// ─────────────────────────────────────────────
// 탭 정의 (레거시 subMenus 포팅)
// ─────────────────────────────────────────────
type TabKey = 'branchInformation' | 'orderService' | 'webOrderSettings'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'branchInformation', label: '매장 정보' },
  { key: 'orderService', label: '주문 서비스' },
  { key: 'webOrderSettings', label: '웹주문 화면 설정 (QR/NFC)' },
]

// ─────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────
function BranchDetailPage() {
  const { storeId } = Route.useParams()
  const [activeTab, setActiveTab] = useState<TabKey>('branchInformation')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [openingHoursOpen, setOpeningHoursOpen] = useState(false)
  const settingsDialogKey = useDialogKey(settingsOpen, storeId)
  const accountDialogKey = useDialogKey(accountOpen, storeId)
  const openingHoursDialogKey = useDialogKey(openingHoursOpen, storeId)

  const { data: detail, isLoading: isDetailLoading } = useBranchDetail(storeId)
  const { data: openingHours, isLoading: isHoursLoading } = useBranchOpeningHours(storeId)

  const isLoading = isDetailLoading || isHoursLoading

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-0">
      <PageLayout className="p-0 max-w-full">
        {detail && (
          <div className="my-4 typo-body3 weight-700 flex flex-col items-center gap-1 md:flex-row md:gap-0 md:w-max md:mx-auto md:rounded-full md:border md:border-border md:px-6 md:py-2">
            <span>브랜드: {detail.brand?.name ?? detail.brand_name ?? '-'}</span>
            <span className="hidden md:block mx-4 h-4 w-px bg-border" />
            <span>매장: {detail.name}</span>
            <span className="hidden md:block mx-4 h-4 w-px bg-border" />
            <span>매장ID: {storeId}</span>
          </div>
        )}
        <TabsList variant="segment" className="w-full overflow-x-auto justify-start">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="min-w-[180px]">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </PageLayout>
      <PageLayout className="p-0">
        <TabsContent value="branchInformation">
          <BranchInformationTab
            detail={detail ?? ({} as NonNullable<typeof detail>)}
            openingHours={openingHours}
            isLoading={isLoading}
            onEditBasic={() => setSettingsOpen(true)}
            onEditOpeningHours={() => setOpeningHoursOpen(true)}
            onEditAccount={() => setAccountOpen(true)}
          />
        </TabsContent>
        <TabsContent value="orderService">
          {detail && <OrderServiceTab storeId={storeId} detail={detail} />}
        </TabsContent>
        <TabsContent value="webOrderSettings">
          {detail && <WebOrderSettingsTab storeId={storeId} detail={detail} />}
        </TabsContent>
      </PageLayout>
      {detail && (
        <BranchSettingsDialog
          key={settingsDialogKey}
          storeId={storeId}
          detail={detail}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <BranchOpeningHoursDialog
        key={openingHoursDialogKey}
        storeId={storeId}
        open={openingHoursOpen}
        onClose={() => setOpeningHoursOpen(false)}
      />

      {detail && (
        <BranchAccountDialog
          key={accountDialogKey}
          storeId={storeId}
          detail={detail}
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
        />
      )}
    </Tabs>
  )
}
