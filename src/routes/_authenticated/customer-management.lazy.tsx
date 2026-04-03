import { useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/useAuthStore'
import { NormalCustomerTab } from '@/features/customers/components/normal-customer-tab'
import { MembershipCustomerTab } from '@/features/customers/components/membership-customer-tab'

export const Route = createLazyFileRoute('/_authenticated/customer-management')({
  component: CustomersPage,
})

type TabKey = 'normal' | 'membership'

const TAB_LABELS: Record<TabKey, string> = {
  normal: '일반 회원',
  membership: '고객사 회원',
}

function CustomersPage() {
  const brandId = useAuthStore((s) => s.userBrandId)
  const [activeTab, setActiveTab] = useState<TabKey>('membership')

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="gap-0">
      <PageLayout className="max-md:p-0 max-w-full pb-0">
        <TabsList variant="segment" className="w-full overflow-x-auto justify-start">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </PageLayout>

      <TabsContent value="normal">
        <NormalCustomerTab brandId={brandId ?? ''} />
      </TabsContent>
      <TabsContent value="membership">
        <MembershipCustomerTab brandId={brandId ?? ''} />
      </TabsContent>
    </Tabs>
  )
}
