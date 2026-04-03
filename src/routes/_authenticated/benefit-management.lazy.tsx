import { useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { useAuthStore, selectIsStoreAccount } from '@/store/useAuthStore'
import { CouponManagementTab } from '@/features/benefit-management/components/coupon-management-tab'
import { IssuanceHistoryTab } from '@/features/benefit-management/components/issuance-history-tab'

export const Route = createLazyFileRoute('/_authenticated/benefit-management')({
  component: BenefitManagementPage,
})

type TabKey = 'coupon-management' | 'issuance-history'

const TAB_LABELS: Record<TabKey, string> = {
  'coupon-management': '쿠폰 관리',
  'issuance-history': '발행 내역',
}

function BenefitManagementPage() {
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const [activeTab, setActiveTab] = useState<TabKey>(isStoreAccount ? 'issuance-history' : 'coupon-management')

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-0">
      <PageLayout className="max-md:p-0 max-w-full pb-0">
        <TabsList variant="segment" className="w-full overflow-x-auto justify-start">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              disabled={key === 'coupon-management' && isStoreAccount}
            >
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </PageLayout>

      <TabsContent value="coupon-management">
        <CouponManagementTab />
      </TabsContent>
      <TabsContent value="issuance-history">
        <IssuanceHistoryTab />
      </TabsContent>
    </Tabs>
  )
}
