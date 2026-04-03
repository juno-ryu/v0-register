import { useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/page-layout'
import { DisbursementTab } from '@/features/disbursement/components/disbursement-tab'
import { MENU_TYPE } from '@/features/disbursement/schema'
import type { MenuType } from '@/features/disbursement/schema'

export const Route = createLazyFileRoute('/_authenticated/disbursement-customers/')({
  component: DisbursementCustomersPage,
})

const MENU_TYPE_TABS: { label: string; value: MenuType }[] = [
  { label: '급식', value: MENU_TYPE.MEAL },
  { label: '식음료', value: MENU_TYPE.FOOD },
]

function DisbursementCustomersPage() {
  const [menuType, setMenuType] = useState<MenuType>(MENU_TYPE.MEAL)

  return (
    <Tabs value={menuType} onValueChange={(v) => setMenuType(v as MenuType)} className="gap-0">
      <PageLayout className="max-md:p-0 max-w-full pb-0">
        <TabsList variant="segment" className="w-full rounded-none">
          {MENU_TYPE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </PageLayout>
      <DisbursementTab key={menuType} menuType={menuType} />
    </Tabs>
  )
}
