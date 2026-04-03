import { useState, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useStoreSelectionStore } from '@/store/useStoreSelectionStore'
import {
  useBrandListForSelection,
  useStoreListForSelection,
} from '@/features/menu-management/queries'

interface StoreSelectionBarProps {
  isManagementAccount: boolean
  isBrandAccount: boolean
  isStoreAccount: boolean
  userBrandId: string | null
  onSelect: (storeId: string, storeName: string, brandId: string, brandName: string) => void
}

export function StoreSelectionBar({
  isManagementAccount,
  isBrandAccount,
  isStoreAccount,
  userBrandId,
  onSelect,
}: StoreSelectionBarProps) {
  const {
    selectedStoreId,
    selectedStoreName,
    selectedBrandId,
    selectedBrandName,
    isStoreSelectionOpen,
    setStoreSelectionOpen,
  } = useStoreSelectionStore()
  const storeSelectionId = useId()

  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null)
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 다이얼로그 열릴 때 현재 선택된 브랜드/매장으로 preselect
      if (isManagementAccount) {
        setPendingBrandId(selectedBrandId)
      }
      setPendingStoreId(selectedStoreId)
    }
    setStoreSelectionOpen(open)
  }

  // 운영사/브랜드 계정에서 brands 패치 (브랜드명 표시 및 선택에 필요)
  const { data: brandList = [] } = useBrandListForSelection(isManagementAccount || isBrandAccount)
  const { data: storeList = [] } = useStoreListForSelection(
    isManagementAccount ? pendingBrandId : (userBrandId ?? null),
  )

  // 적용 버튼: 매장 미선택이거나, 현재 선택된 매장과 동일하면 disabled
  const isApplyDisabled = !pendingStoreId || pendingStoreId === selectedStoreId

  const handleApply = () => {
    if (!pendingStoreId) return
    const store = storeList.find((s) => String(s.id) === pendingStoreId)
    if (!store) return

    // 브랜드명 결정
    const activeBrandId = isManagementAccount ? pendingBrandId : (userBrandId ?? null)
    const brand = brandList.find((b) => String(b.id) === activeBrandId)
    const brandName = brand?.name ?? ''

    onSelect(String(store.id), store.name, activeBrandId ?? '', brandName)
    handleOpenChange(false)
  }

  if (isStoreAccount) return null

  const activeBrandId = isManagementAccount ? pendingBrandId : (userBrandId ?? null)

  // 바 표시 텍스트: 운영사 → [브랜드명]  매장명 / 브랜드 계정 → 매장명만
  const barDisplayText = selectedStoreName
    ? (isManagementAccount && selectedBrandName
      ? (
        <>
          <span className="text-neutral-400">[{selectedBrandName}]</span>
          {'  '}{selectedStoreName}
        </>
      )
      : selectedStoreName)
    : '매장 선택'

  const formBody = (
    <div className="space-y-4">
      {isManagementAccount && (
        <div className="space-y-1.5">
          <p className="typo-body3 weight-500 text-muted-foreground">브랜드</p>
          <Select
            value={pendingBrandId ?? ''}
            onValueChange={(v) => {
              setPendingBrandId(v)
              setPendingStoreId(null)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="브랜드 선택" />
            </SelectTrigger>
            <SelectContent>
              {brandList.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="typo-body3 weight-500 text-muted-foreground">매장</p>
        <Select
          value={pendingStoreId ?? ''}
          onValueChange={(v) => setPendingStoreId(v)}
          disabled={isManagementAccount && !activeBrandId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="매장 선택" />
          </SelectTrigger>
          <SelectContent>
            {storeList.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const actionButtons = (
    <>
      <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
        취소
      </Button>
      <Button className="flex-1" disabled={isApplyDisabled} onClick={handleApply}>
        적용
      </Button>
    </>
  )

  return (
    <>
      {/* 데스크탑 전용 매장 선택 바 */}
      <div className="hidden lg:block px-8 border-b border-border pb-4">
        <div className="flex items-center py-2 px-4 gap-4 bg-neutral-750 dark:bg-neutral-850">
          <span className="shrink-0 typo-body1 weight-600 text-white w-[80px]">매장</span>
          <Button
            type="button"
            variant="ghost"
            className="flex flex-1 items-center justify-between bg-background px-4 py-2 typo-body1 text-foreground hover:bg-muted h-10 rounded-none"
            onClick={() => handleOpenChange(true)}
          >
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{barDisplayText}</span>
            <ChevronDown size={24} />
          </Button>
        </div>
      </div>

      {/* 데스크탑: 중앙 모달 / 모바일: 바텀시트 */}
      <Sheet open={isStoreSelectionOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          key={`${storeSelectionId}-${isStoreSelectionOpen ? 'open' : 'closed'}`}
          side="bottom"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          className="gap-0 rounded-t-2xl lg:inset-x-auto lg:inset-y-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:w-[28rem] lg:rounded-2xl lg:border"
        >
          <SheetHeader className="px-4 py-4">
            <SheetTitle className="text-center typo-body1 weight-600">매장 선택</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <SheetFooter className="flex-row gap-3 px-4 pb-4">
            {actionButtons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
