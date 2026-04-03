import { useCallback } from 'react'
import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/utils/clipboard'
import {
  useAuthStore,
  selectIsBrandAccount,
  selectIsStoreAccount,
} from '@/store/useAuthStore'
import {
  useAccountTypeLabel,
  useStoreInformation,
  useManagementStoreDetail,
  useMyBrandDetail,
} from '@/features/auth/hooks/useMyAccount'

// 상태 표시 (운영 중/운영 중지)
function StatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[var(--color-status-positive)]' : 'bg-neutral-400'}`}
      />
      <span
        className={`typo-body3 weight-600 ${isActive ? 'text-[var(--color-status-positive)]' : 'text-neutral-400'}`}
      >
        {isActive ? '운영 중' : '운영 중지'}
      </span>
    </div>
  )
}

// 행: 라벨 + 값
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 typo-body3 weight-600 leading-6 text-foreground">
        {label}
      </span>
      <span className="typo-body3 weight-400 leading-6 text-foreground text-right break-keep [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
  )
}

// 행: 라벨 + 값 + 복사 버튼 (값 아래에 복사 버튼)
function InfoRowWithCopy({ label, value }: { label: string; value: string | number }) {
  const handleCopy = useCallback(() => {
    copyToClipboard(String(value))
  }, [value])

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 typo-body3 weight-600 leading-6 text-foreground">
        {label}
      </span>
      <div className="flex flex-col items-end gap-1">
        <span className="typo-body3 weight-400 leading-6 text-foreground text-right break-keep [overflow-wrap:anywhere]">
          {value}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-[26px] gap-1 px-3 typo-body3 weight-800 text-key-blue border-key-blue hover:bg-key-blue hover:text-white"
        >
          <Copy size={12} />
          복사
        </Button>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="my-1 border-t border-border" />
}

export function MyAccountContent() {
  const userName = useAuthStore((s) => s.userName)
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const accountTypeLabel = useAccountTypeLabel()
  const isStoreAccount = useAuthStore(selectIsStoreAccount)
  const isBrandAccount = useAuthStore(selectIsBrandAccount)

  // 매장 계정: 매장 정보 + management store (brand 정보)
  const { data: storeInfo } = useStoreInformation()
  const { data: managementStore } = useManagementStoreDetail()

  // 브랜드 계정: 브랜드 상세
  const { data: brandDetail } = useMyBrandDetail()

  // 매장 계정용 파생 데이터 (레거시 MyAccountContent computed 포팅)
  const brandId = managementStore?.brand?.id ?? ''
  const brandName = managementStore?.brand?.name ?? storeInfo?.brand?.name ?? ''
  const brandDomain = managementStore?.brand?.domain ?? brandDetail?.domain ?? ''
  const brandIsActive = managementStore?.brand?.is_active ?? null
  const storeDomain = brandDomain && userStoreId ? `${brandDomain}/stores/${userStoreId}` : ''

  return (
    <div className="flex flex-col">
      {/* 공통: 로그인 ID, 계정 분류 */}
      <InfoRow label="로그인 ID" value={userName} />
      <InfoRow label="계정 분류" value={accountTypeLabel} />

      {/* 매장 계정: 매장 + 브랜드 정보 */}
      {isStoreAccount && storeInfo && (
        <>
          <Divider />
          <InfoRowWithCopy label="매장 ID" value={userStoreId ?? ''} />
          <InfoRow label="매장명" value={storeInfo.name} />
          {storeDomain && <InfoRow label="도메인" value={storeDomain} />}
          <InfoRow label="매장 상태" value={<StatusIndicator isActive={storeInfo.is_open ?? false} />} />
          <Divider />
          <InfoRowWithCopy label="브랜드 ID" value={brandId} />
          <InfoRow label="브랜드명" value={brandName} />
          {brandDomain && <InfoRow label="도메인" value={brandDomain} />}
          {brandIsActive != null && (
            <InfoRow label="브랜드 상태" value={<StatusIndicator isActive={brandIsActive} />} />
          )}
        </>
      )}

      {/* 브랜드 계정: 브랜드 정보 */}
      {isBrandAccount && brandDetail && (
        <>
          <Divider />
          <InfoRowWithCopy label="브랜드 ID" value={brandDetail.id} />
          <InfoRow label="브랜드명" value={brandDetail.name} />
          <InfoRow label="도메인" value={brandDetail.domain ?? ''} />
          <InfoRow label="브랜드 상태" value={<StatusIndicator isActive={brandDetail.is_active ?? false} />} />
        </>
      )}
    </div>
  )
}
