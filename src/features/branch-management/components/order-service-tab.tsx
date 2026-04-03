import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import type { BranchDetail } from '@/features/branch-management/schema'
import { OrderServiceDialog } from '@/features/branch-management/components/order-service-dialog'
import { StoreSettingsDialog } from '@/features/branch-management/components/store-settings-dialog'
import { useDialogKey } from '@/hooks/useDialogKey'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const POS_SYSTEM_MAP: Record<string, string> = {
  smartro_pos: '스마일 POS',
  harmony_pos: '하모니 POS',
  did_only: '미연동',
}

const PG_MAP: Record<string, string> = {
  smartro_pay: '스마트로 PG',
}

const KDS_MODE_MAP: Record<string, string> = {
  MASTER: '마스터',
  KDS1: 'KDS1',
  KDS2: 'KDS2',
}

// 레거시: TAKE_TYPE_ENUM (take-type-constants.ts)
const TAKE_TYPE_ENUM: Record<number, string> = {
  0: '일반배달',
  1: '테이블오더',
  2: '테이크아웃',
  3: '카운터픽업',
  4: '로봇배달',
  5: '사무실배달',
  6: '키오스크주문',
  7: '매장내식사',
  8: '스마트로KDS',
  9: '제3자배달',
  10: '픽업예약',
  11: '객실주문',
}

// ─────────────────────────────────────────────
// 섹션 타이틀 (branch-information-tab.tsx 패턴 동일)
// ─────────────────────────────────────────────
function SectionTitle({ title, onEdit }: { title: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="typo-body2 weight-700 text-foreground">{title}</h2>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-0.5 typo-micro1 text-key-blue cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          설정
        </button>
      )}
    </div>
  )
}

function InfoRow({
  label,
  children,
  onClick,
  clickable,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
  clickable?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 py-3 ${clickable ? 'cursor-pointer hover:bg-muted transition-colors' : ''}`}
      onClick={onClick}
    >
      <span className="w-36 shrink-0 typo-body3 weight-600 text-foreground">{label}</span>
      <div className="flex-1 typo-body3 text-foreground">{children}</div>
    </div>
  )
}

function Divider() {
  return <hr className="my-4 border-border" />
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
interface OrderServiceTabProps {
  storeId: string
  detail: BranchDetail
}

// 매장 설정 다이얼로그 열 때 어느 섹션으로 스크롤할지 결정하는 타입
type StoreSettingsSection = 'pos' | 'pg' | 'kds'

export function OrderServiceTab({ storeId, detail }: OrderServiceTabProps) {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  // 서비스 카드 클릭 시 선택된 take_type
  const [selectedTakeType, setSelectedTakeType] = useState<number | null>(null)

  const [storeSettingsOpen, setStoreSettingsOpen] = useState(false)
  const [storeSettingsSection, setStoreSettingsSection] = useState<StoreSettingsSection>('pos')
  const orderServiceDialogKey = useDialogKey(serviceDialogOpen, selectedTakeType ?? 'new')
  const storeSettingsDialogKey = useDialogKey(storeSettingsOpen, `${storeId}-${storeSettingsSection}`)

  const takeTypesPolicy = detail.take_types_policy ?? []

  function openStoreSettings(section: StoreSettingsSection) {
    setStoreSettingsSection(section)
    setStoreSettingsOpen(true)
  }

  function openServiceDialog(takeType?: number) {
    // 레거시 동일: takeType 미지정 시 첫 번째 등록된 서비스로 설정 모드 오픈
    const resolved = takeType ?? takeTypesPolicy[0]?.take_type ?? null
    setSelectedTakeType(resolved)
    setServiceDialogOpen(true)
  }

  // 결제 타입 표시 텍스트
  function getPaymentTypeText() {
    const pre = detail.use_pre_pay
    const post = detail.use_post_pay
    if (pre && post) return '선불 / 후불'
    if (pre) return '선불'
    if (post) return '후불'
    return '-'
  }

  // 시크릿키/비밀번호 표시
  function getSecretStatus(value: string | null | undefined) {
    return value ? (
      <span className="text-status-positive">입력됨</span>
    ) : (
      <span className="text-status-destructive">(설정 필요)</span>
    )
  }

  return (
    <div className="pb-8">
      {/* ── 주문 서비스 섹션 ── */}
      <section className="px-4 pt-4">
        <SectionTitle
          title="주문 서비스"
          onEdit={isManagementAccount ? () => openServiceDialog() : undefined}
        />

        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          {takeTypesPolicy.map((policy) => (
            <InfoRow
              key={policy.take_type}
              label={TAKE_TYPE_ENUM[policy.take_type] ?? `서비스 ${policy.take_type}`}
              onClick={isManagementAccount ? () => openServiceDialog(policy.take_type) : undefined}
              clickable={isManagementAccount}
            >
              <span className="text-status-positive">• 사용중</span>
            </InfoRow>
          ))}
          {isManagementAccount && (
            <InfoRow label="주문 서비스 추가">
              <Button
                size="sm"
                onClick={() => { setSelectedTakeType(null); setServiceDialogOpen(true) }}
              >
                + 추가
              </Button>
            </InfoRow>
          )}
        </div>
      </section>

      <Divider />

      {/* ── 포스 및 연동 설정 섹션 ── */}
      <section className="px-4 pt-2">
        <SectionTitle
          title="포스 및 연동 설정"
          onEdit={isManagementAccount ? () => openStoreSettings('pos') : undefined}
        />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="포스 연동">
            {POS_SYSTEM_MAP[detail.pos ?? ''] ?? detail.pos ?? '-'}
          </InfoRow>
          {detail.pos === 'smartro_pos' && (
            <InfoRow label="스마트로 가맹점 번호">
              {detail.external_sn ?? '-'}
            </InfoRow>
          )}
          <InfoRow label="테이블 / 객실">
            {detail.number_of_tables_or_rooms != null
              ? `${detail.number_of_tables_or_rooms} 개`
              : '-'}
          </InfoRow>
        </div>
      </section>

      <Divider />

      {/* ── PG 및 결제 설정 섹션 ── */}
      <section className="px-4 pt-2">
        <SectionTitle
          title="PG 및 결제 설정"
          onEdit={isManagementAccount ? () => openStoreSettings('pg') : undefined}
        />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="선불 / 후불">{getPaymentTypeText()}</InfoRow>
          {/* 후불 전용이면 PG 관련 필드 숨김 */}
          {!(detail.use_post_pay && !detail.use_pre_pay) && (
            <>
              <InfoRow label="PG">
                {PG_MAP[detail.pg ?? ''] ?? detail.pg ?? '-'}
              </InfoRow>
              <InfoRow label="Payment ID">{detail.payment_id ?? '-'}</InfoRow>
              <InfoRow label="시크릿 키">{getSecretStatus(detail.secret_key)}</InfoRow>
              <InfoRow label="결제 취소 비밀번호">{getSecretStatus(detail.cancel_password)}</InfoRow>
            </>
          )}
        </div>
      </section>

      <Divider />

      {/* ── 이외 설정 섹션 ── */}
      <section className="px-4 pt-2">
        <SectionTitle
          title="이외 설정"
          onEdit={isManagementAccount ? () => openStoreSettings('kds') : undefined}
        />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="KDS 모드">
            {(detail.did_order_mgmt_available_mode ?? [])
              .map((m) => KDS_MODE_MAP[m] ?? m)
              .join(', ') || '-'}
          </InfoRow>
          <InfoRow label="쿠폰 사용처리 코드">
            {detail.coupon_validation_code ?? '-'}
          </InfoRow>
        </div>
      </section>

      {/* ── 서비스 설정 다이얼로그 ── */}
      <OrderServiceDialog
        key={orderServiceDialogKey}
        storeId={storeId}
        detail={detail}
        initialTakeType={selectedTakeType}
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
      />

      {/* ── 매장 설정 다이얼로그 (포스/PG/KDS 통합) ── */}
      <StoreSettingsDialog
        key={storeSettingsDialogKey}
        storeId={storeId}
        detail={detail}
        scrollToSection={storeSettingsSection}
        open={storeSettingsOpen}
        onClose={() => setStoreSettingsOpen(false)}
      />
    </div>
  )
}
