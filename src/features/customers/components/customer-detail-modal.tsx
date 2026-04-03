import { useState } from 'react'
import { toast } from 'sonner'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useMembershipCustomerDetail,
  useMembershipCustomerDiscountPolicies,
  useChangeMembershipCustomerStatus,
} from '@/features/customers/queries'
import {
  fetchMembershipCustomerSmilebizUserMediaInfo,
  updateMembershipCustomerSmilebizUserMediaInfo,
} from '@/features/customers/api'
import { MEMBER_STATUS, MEMBER_STATUS_TEXT } from '@/features/customers/schema'
import type { MemberStatusValue, DiscountPolicyItem } from '@/features/customers/schema'
import { formatDate } from '@/utils/date'
import { priceFormat } from '@/utils/price'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingOverlay } from '@/components/common/loading-overlay'

interface CustomerDetailModalProps {
  brandId: string | number
  customerId: number | null
  open: boolean
  onClose: () => void
}

// ─────────────────────────────────────────────
// 유틸: 할인 값 포맷 (레거시 formatValue 포팅)
// ─────────────────────────────────────────────
function formatBurdenValue(value: number | string | undefined, type: string): string {
  if (value === undefined || value === null) return '-'
  if (type === 'percentage') return `${value}%`
  return `${priceFormat(Number(value))}원`
}

// ─────────────────────────────────────────────
// InfoRow: BaseRow 래퍼 (null/빈 값이면 렌더링하지 않음)
// ─────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <BaseRow
      label={label}
      value={value}
      className="py-1.5"
    />
  )
}

// ─────────────────────────────────────────────
// MediValRow: MEDI_VAL(스마트로) 조회 행
// ─────────────────────────────────────────────
function MediValRow({
  brandId,
  customerId,
  storeId,
  cardNumber,
}: {
  brandId: string | number
  customerId: number | null
  storeId: number
  cardNumber?: string | null
}) {
  const [isSearched, setIsSearched] = useState(false)
  const [searchedDate, setSearchedDate] = useState<string | null>(null)
  const [mediVal, setMediVal] = useState<string | null>(null)
  const [memberCardNumber, setMemberCardNumber] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncedVal, setSyncedVal] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!brandId || !storeId || !customerId) return
    setIsFetching(true)
    setSearchedDate(formatDate(new Date().toISOString(), 'yyyy/MM/dd HH:mm:ss'))
    try {
      const data = await fetchMembershipCustomerSmilebizUserMediaInfo({ brandId, storeId, customerId })
      setMediVal(data.medi_val ?? null)
      setMemberCardNumber(data.member_card_number ?? null)
      setSyncedVal(null)
      setErrorMessage(null)
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } }).response
      setErrorMessage(res?.data?.message ?? '오류가 발생했습니다.')
    } finally {
      setIsSearched(true)
      setIsFetching(false)
    }
  }

  const handleSync = async () => {
    if (!mediVal || !cardNumber) return
    if (!confirm(`한 번 진행하면 되돌릴 수 없습니다.\n현재 카드번호로 동기화하시겠습니까?\n\n카드번호: ${cardNumber}`)) return
    setIsSyncing(true)
    try {
      const data = await updateMembershipCustomerSmilebizUserMediaInfo({ brandId, storeId, customerId: customerId!, mediVal })
      if (data.code === '0000') {
        setSyncedVal(data.medi_val_new ?? null)
        setMediVal(data.medi_val_new ?? mediVal)
        setSearchedDate(formatDate(new Date().toISOString(), 'yyyy/MM/dd HH:mm:ss'))
      } else {
        toast.error('알 수 없는 오류가 발생했습니다.')
      }
    } catch {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsSyncing(false)
    }
  }

  const isMatch = !!mediVal && mediVal === memberCardNumber

  return (
    <div className="pl-3 py-1">
      <BaseRow
        label="MEDI_VAL(스마트로)"
        className="py-0"
        labelClassName="text-xs"
      >
        <div className="flex items-center gap-2">
          {isSearched ? (
            <span className="text-xs text-right text-foreground">{mediVal ?? '-'}</span>
          ) : (
            <span className="text-xs text-right text-neutral-400">-</span>
          )}
          {!isSearched && (
            <Button size="sm" variant="outline" className="h-5 px-2 text-[11px]" disabled={isFetching} onClick={handleSearch}>
              {isFetching ? '조회 중...' : '조회'}
            </Button>
          )}
        </div>
      </BaseRow>

      {/* 조회 후 상세: 일치 여부, 조회일시, 동기화/재조회 버튼 */}
      {isSearched && (
        <div className="flex flex-col items-end mt-1 gap-0.5">
          {errorMessage && (
            <p className="text-[11px] text-status-destructive"><strong>(!)</strong> {errorMessage}</p>
          )}
          {!errorMessage && mediVal && !isMatch && (
            <p className="text-[11px] text-status-destructive">
              <strong>(!)</strong> 카드번호({memberCardNumber})와 다릅니다.
            </p>
          )}
          {!errorMessage && isMatch && (
            <p className="text-[11px] text-status-positive">
              <strong>(✓)</strong> {syncedVal ? `카드번호(${syncedVal})로 동기화가 완료되었습니다.` : '카드번호와 일치합니다.'}
            </p>
          )}
          {!errorMessage && searchedDate && (
            <p className="text-[11px] text-neutral-400">조회일시: {searchedDate}</p>
          )}
          {!errorMessage && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-5 px-2 text-[11px]"
                disabled={isMatch || !!syncedVal || isSyncing}
                onClick={handleSync}
              >
                카드번호로 동기화
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-5 px-2 text-[11px]"
                disabled={isFetching}
                onClick={handleSearch}
              >
                재조회
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 매장 이용 정보 (discountPolicies 기반)
// ─────────────────────────────────────────────
function StoreInfo({
  policies,
  customerTier,
  brandId,
  customerId,
  cardNumber,
}: {
  policies: DiscountPolicyItem[]
  customerTier?: string | null
  brandId: string | number
  customerId: number | null
  cardNumber?: string | null
}) {
  if (policies.length === 0) return null

  return (
    <>
      <Separator className="my-3" />
      <h3 className="typo-body3 weight-700 text-foreground mb-2">매장 이용 정보</h3>
      {policies.map((policy) => (
        <div key={policy.store_id} className="mb-3">
          <p className="typo-body3 weight-600 text-foreground mb-1">{policy.store_name}</p>
          {/* MEDI_VAL(스마트로) — 스마트로 POS 연동 카드 정보, 별도 API 조회 필요 */}
          <MediValRow brandId={brandId} customerId={customerId} storeId={policy.store_id} cardNumber={cardNumber} />
          {Object.entries(policy.policy.meals ?? {}).map(([mealKey, meal]) => (
            <BaseRow
              key={mealKey}
              label={`${meal.meal_name} - 법인부담`}
              value={formatBurdenValue(
                customerTier ? meal.customer_company_burden[customerTier] : undefined,
                meal.customer_company_burden_type,
              )}
              className="py-1 pl-3"
              labelClassName="text-xs"
              valueClassName="text-xs"
            />
          ))}
          {policy.policy.food && Object.keys(policy.policy.food).length > 0 && (
            <>
              <BaseRow
                label="식음료 - 법인부담"
                value={formatBurdenValue(
                  customerTier ? policy.policy.food.customer_company_burden?.[customerTier] : undefined,
                  policy.policy.food.customer_company_burden_type ?? '',
                )}
                className="py-1 pl-3"
                labelClassName="text-xs"
                valueClassName="text-xs"
              />
              <BaseRow
                label="식음료 - 운영사부담"
                value={formatBurdenValue(
                  customerTier ? policy.policy.food.operator_burden?.[customerTier] : undefined,
                  policy.policy.food.operator_burden_type ?? '',
                )}
                className="py-1 pl-3"
                labelClassName="text-xs"
                valueClassName="text-xs"
              />
            </>
          )}
        </div>
      ))}
    </>
  )
}

const CHANGEABLE_STATUSES: MemberStatusValue[] = [
  MEMBER_STATUS.ACTIVE,
  MEMBER_STATUS.STOPPED,
  MEMBER_STATUS.PASSWORD_SET_REQUIRED,
]

export function CustomerDetailModal({
  brandId,
  customerId,
  open,
  onClose,
}: CustomerDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<MemberStatusValue | ''>('')
  const [statusChanged, setStatusChanged] = useState(false)
  const { data: customer, isLoading } = useMembershipCustomerDetail(
    brandId,
    customerId,
    { enabled: open && !!customerId },
  )

  const { data: discountPolicies = [] } = useMembershipCustomerDiscountPolicies(
    brandId,
    customerId,
  )

  const { mutate: changeStatus, isPending: isChangingStatus } = useChangeMembershipCustomerStatus()

  const isDeleted = customer?.status === MEMBER_STATUS.DELETED

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedStatus('')
      setStatusChanged(false)
      onClose()
    }
  }

  const handleStatusSelect = (value: string) => {
    setSelectedStatus(value as MemberStatusValue)
    setStatusChanged(value !== customer?.status)
  }

  const handleStatusChange = () => {
    if (!customerId || !selectedStatus) return
    changeStatus(
      { brandId: Number(brandId), customerId, status: selectedStatus },
      {
        onSuccess: () => {
          toast.success('회원의 상태가 변경되었습니다.')
          setStatusChanged(false)
        },
      },
    )
  }

  return (
    <>
      <BaseDialog
        open={open}
        onClose={() => handleOpenChange(false)}
        title="사용자 상세 정보"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              닫기
            </Button>
            <Button
              className="flex-1"
              disabled={!statusChanged || isChangingStatus}
              onClick={handleStatusChange}
            >
              {isChangingStatus ? '변경 중...' : '정보 수정'}
            </Button>
          </>
        }
      >
        <LoadingOverlay show={isChangingStatus} />
        {/* 스크롤 바디 */}
        <div className="p-4">
            {isLoading || !customer ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 gap-4">
                    <Skeleton className="h-4 w-28 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* 상태 */}
                <BaseRow
                  label="상태"
                  className="py-1.5"
                  labelClassName="weight-700"
                >
                  <Select
                    value={selectedStatus || customer.status || ''}
                    onValueChange={handleStatusSelect}
                    disabled={isDeleted}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANGEABLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {MEMBER_STATUS_TEXT[s]}
                        </SelectItem>
                      ))}
                      {isDeleted && (
                        <SelectItem value={MEMBER_STATUS.DELETED} className="text-xs">
                          {MEMBER_STATUS_TEXT[MEMBER_STATUS.DELETED]}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </BaseRow>

                <Separator className="my-3" />

                {/* 회원 정보 */}
                <h3 className="typo-body3 weight-700 text-foreground mb-1">회원 정보</h3>
                <InfoRow label="사용자 유형" value="고객사 회원" />
                <InfoRow label="회원번호" value={customer.employee_number} />
                <InfoRow label="이름" value={customer.name} />
                <InfoRow label="연락처" value={customer.phone_number} />
                <InfoRow label="소속" value={customer.customer_company_name} />
                <InfoRow label="부서" value={customer.customer_department_name} />
                <InfoRow label="카드번호" value={customer.card_number} />
                <InfoRow label="RFID" value={customer.sn} />

                {!isDeleted && (
                  <StoreInfo
                    policies={discountPolicies}
                    customerTier={customer.tier}
                    brandId={brandId}
                    customerId={customerId}
                    cardNumber={customer.card_number}
                  />
                )}

                <Separator className="my-3" />

                {/* 날짜 정보 */}
                {!!customer.deleted_at && (
                  <InfoRow
                    label="삭제 일시"
                    value={formatDate(customer.deleted_at, 'yyyy/MM/dd HH:mm:ss')}
                  />
                )}
                <InfoRow
                  label="마지막 업데이트 일시"
                  value={customer.update_dt ? formatDate(customer.update_dt, 'yyyy/MM/dd HH:mm:ss') : '-'}
                />
                <InfoRow
                  label="생성 일시"
                  value={customer.create_dt ? formatDate(customer.create_dt, 'yyyy/MM/dd HH:mm:ss') : '-'}
                />
              </div>
            )}
          </div>
      </BaseDialog>

    </>
  )
}
