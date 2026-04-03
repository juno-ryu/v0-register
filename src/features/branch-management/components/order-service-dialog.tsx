import React, { useState } from 'react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useUpsertStoreTakeType, useDeleteStoreTakeType } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { BranchDetail, UpsertTakeTypePayload } from '@/features/branch-management/schema'

// ─────────────────────────────────────────────
// 상수 (레거시 take-type-constants + branch-constants 포팅)
// ─────────────────────────────────────────────

// 레거시 ServiceTypeSelect.vue의 serviceTypeOptions (5개 카드)
const SERVICE_TYPE_OPTIONS = [
  { value: 1, title: '테이블오더', description: '지정테이블(테이블번호) 주문' },
  { value: 3, title: '카운터픽업', description: '매장이용/테이크아웃 구분이 없는\n카운터픽업 주문 (예: 카페)' },
  { value: 7, title: '매장내식사', description: '지정석 없이 매장을 이용하는\n카운터픽업 주문 (예: 카페 매장이용)' },
  { value: 2, title: '테이크아웃', description: '포장 및 테이크아웃 주문\n(예: 카페 테이크아웃)' },
  { value: 11, title: '객실주문', description: '숙박 전용 지정객실(객실번호) 주문' },
]

// 전체 take_type → 이름 매핑 (view 모드 서비스명 표시용)
const TAKE_TYPE_LABEL: Record<number, string> = {
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

const PAYMENT_METHOD_OPTIONS = [
  { value: 'creditcard', label: '신용카드' },
  { value: 'naverpay', label: '네이버페이' },
  { value: 'toss', label: '토스페이' },
  { value: 'samsungpay', label: '삼성페이' },
  { value: 'kakaopay', label: '카카오페이' },
  { value: 'payco', label: '페이코' },
  { value: 'cellphone', label: '휴대폰결제' },
  { value: 'bank', label: '계좌이체' },
  { value: 'vbank', label: '가상계좌' },
]

const DISPLAY_VALUE = { SHOW: 'SHOW', HIDE: 'HIDE' } as const
type DisplayValue = typeof DISPLAY_VALUE[keyof typeof DISPLAY_VALUE]

const DISPLAY_OPTIONS = [
  { value: DISPLAY_VALUE.SHOW, label: '표시' },
  { value: DISPLAY_VALUE.HIDE, label: '미표시' },
]

// 주문 표시 시간 옵션: 1~5분 (레거시 timeOptions)
const TIME_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}분`,
}))

// 금액/수량 설정 상태 (레거시 SETTING_STATUS)
const SETTING_STATUS = { ENABLED: '설정', DISABLED: '미설정' } as const
type SettingStatus = typeof SETTING_STATUS[keyof typeof SETTING_STATUS]

// 기본 폼 값 (레거시 ADD_SERVICE_FORM_DEFAULTS)
const DEFAULT_FORM = {
  paymentMethods: PAYMENT_METHOD_OPTIONS.map((m) => m.value),
  contactDisplay: DISPLAY_VALUE.HIDE as DisplayValue,
  disposableDisplay: DISPLAY_VALUE.HIDE as DisplayValue,
  requestDisplay: DISPLAY_VALUE.HIDE as DisplayValue,
  minOrderAmount: null as number | null,
  maxOrderAmount: null as number | null,
  minOrderCount: null as number | null,
  maxOrderCount: null as number | null,
  orderDisplayTime: 3,
}

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface FormData {
  paymentMethods: string[]
  contactDisplay: DisplayValue
  disposableDisplay: DisplayValue
  requestDisplay: DisplayValue
  minOrderAmount: number | null
  maxOrderAmount: number | null
  minOrderCount: number | null
  maxOrderCount: number | null
  orderDisplayTime: number
}

interface OrderServiceDialogProps {
  storeId: string
  detail: BranchDetail
  /** null이면 + 추가(등록) 모드, 숫자면 해당 서비스 view 모드 */
  initialTakeType: number | null
  open: boolean
  onClose: () => void
}

// ─────────────────────────────────────────────
// 금액/수량 한도 필드 (레거시 설정/미설정 패턴)
// ─────────────────────────────────────────────
function LimitField({
  label,
  value,
  onChange,
  helpText,
  unit,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  helpText: string
  unit: string
}) {
  const setting: SettingStatus = value != null ? SETTING_STATUS.ENABLED : SETTING_STATUS.DISABLED

  return (
    <div className="py-2">
      <BaseRow label={label} direction="column">
        <Select
          value={setting}
          onValueChange={(v) => {
            if (v === SETTING_STATUS.ENABLED) onChange(0)
            else onChange(null)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SETTING_STATUS.DISABLED}>
              <span className="text-neutral-400 weight-600">{SETTING_STATUS.DISABLED}</span>
            </SelectItem>
            <SelectItem value={SETTING_STATUS.ENABLED}>
              <span className="text-status-positive weight-600">{SETTING_STATUS.ENABLED}</span>
            </SelectItem>
          </SelectContent>
        </Select>
        {setting === SETTING_STATUS.ENABLED && (
          <div className="relative">
            <Input
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value !== '' ? Number(e.target.value) : null)}
              placeholder={`${label} 입력`}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-body3 text-muted-foreground pointer-events-none">{unit}</span>
          </div>
        )}
        <p className="mt-1 text-xs text-neutral-400">{helpText}</p>
      </BaseRow>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 0 — 서비스 선택 카드 목록 (레거시 ServiceTypeSelect.vue 포팅)
// ─────────────────────────────────────────────
function ServiceTypeSelect({
  registeredTypes,
  selectedType,
  onSelect,
}: {
  registeredTypes: number[]
  selectedType: number | null
  onSelect: (v: number) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
      {SERVICE_TYPE_OPTIONS.map((opt) => {
        const isDisabled = registeredTypes.includes(opt.value)
        const isSelected = selectedType === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(opt.value)}
            className={[
              'flex items-stretch rounded-lg border text-left transition-all',
              isDisabled
                ? 'bg-muted border-border cursor-not-allowed'
                : isSelected
                ? 'border-primary shadow-[inset_0_0_0_1px] shadow-primary cursor-pointer'
                : 'border-border cursor-pointer hover:border-neutral-400',
            ].join(' ')}
          >
            {/* 텍스트 영역 */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <p
                className={[
                  'typo-body3 weight-700 mb-1',
                  isDisabled ? 'text-neutral-400' : isSelected ? 'text-primary' : 'text-foreground',
                ].join(' ')}
              >
                {opt.title}
                {isDisabled && ' (사용중)'}
              </p>
              <span
                className={[
                  'text-xs leading-snug whitespace-pre-line',
                  isDisabled ? 'text-neutral-400' : 'text-muted-foreground',
                ].join(' ')}
              >
                {opt.description}
              </span>
            </div>
            {/* 체크 아이콘 영역 */}
            <div
              className={[
                'flex items-center justify-center px-3 border-l border-dashed',
                isSelected ? 'border-primary text-primary' : 'border-border text-neutral-300',
              ].join(' ')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 1 — 서비스 편집 폼 (레거시 ServiceEditMode.vue 포팅)
// ─────────────────────────────────────────────
function ServiceEditForm({
  takeType,
  formData,
  setFormData,
}: {
  takeType: number | null
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
}) {
  const allPaymentsSelected = PAYMENT_METHOD_OPTIONS.every((m) =>
    formData.paymentMethods.includes(m.value),
  )

  function togglePaymentMethod(value: string) {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(value)
        ? prev.paymentMethods.filter((m) => m !== value)
        : [...prev.paymentMethods, value],
    }))
  }

  function toggleAllPayments(checked: boolean) {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: checked ? PAYMENT_METHOD_OPTIONS.map((m) => m.value) : [],
    }))
  }

  const selectedServiceLabel =
    takeType !== null
      ? (SERVICE_TYPE_OPTIONS.find((o) => o.value === takeType)?.title ?? TAKE_TYPE_LABEL[takeType] ?? `서비스 ${takeType}`)
      : ''

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-0">
      {/* 서비스 타입 — disabled 표시 (레거시 edit 모드 동일) */}
      {takeType !== null && (
        <>
          <div className="py-2">
            <BaseRow label="서비스" direction="column">
              <Select value={String(takeType)} disabled>
                <SelectTrigger>
                  <SelectValue>{selectedServiceLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(takeType)}>{selectedServiceLabel}</SelectItem>
                </SelectContent>
              </Select>
            </BaseRow>
          </div>
          <hr className="my-3 border-border" />
        </>
      )}

      {/* 결제 수단 — 세로 1열 + 전체 체크박스 */}
      <div className="py-2">
        <BaseRow label={<>결제 수단 <span className="text-status-destructive typo-micro1">(필수)</span></>} direction="column">
          <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
            {/* 전체 선택 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="pay-all"
                checked={allPaymentsSelected}
                onCheckedChange={(checked) => toggleAllPayments(!!checked)}
              />
              <Label htmlFor="pay-all" className="weight-400 cursor-pointer typo-body3">
                전체
              </Label>
            </div>
            <hr className="border-border" />
            {/* 개별 결제수단 */}
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <div key={method.value} className="flex items-center gap-2">
                <Checkbox
                  id={`pm-${method.value}`}
                  checked={formData.paymentMethods.includes(method.value)}
                  onCheckedChange={() => togglePaymentMethod(method.value)}
                />
                <Label htmlFor={`pm-${method.value}`} className="weight-400 cursor-pointer typo-body3">
                  {method.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-400">결제수단 1개 이상 필수 선택사항입니다.</p>
        </BaseRow>
      </div>

      <hr className="my-3 border-border" />

      {/* 표시 설정 — Select 드롭다운 */}
      <div className="flex flex-col">
        {/* 연락처 입력 */}
        <div className="py-2">
          <BaseRow label="연락처 입력" direction="column">
            <Select
              value={formData.contactDisplay}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, contactDisplay: v as DisplayValue }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPLAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-1 text-xs text-neutral-400 space-y-0.5">
              <p>[고객 연락처] 입력 란 표시/미표시</p>
              <p>*메시지 발송하는 매장 → [표시] 선택</p>
              <p>참고: [표시] 선택 → 주문 시 연락처 입력 필수</p>
            </div>
          </BaseRow>
        </div>

        {/* 요청사항 입력 */}
        <div className="py-2">
          <BaseRow label="요청사항 입력" direction="column">
            <Select
              value={formData.requestDisplay}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, requestDisplay: v as DisplayValue }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPLAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-neutral-400">[요청사항] 입력 란 표시/미표시</p>
          </BaseRow>
        </div>

        {/* 일회용품 받기 */}
        <div className="py-2">
          <BaseRow label="일회용품 받기" direction="column">
            <Select
              value={formData.disposableDisplay}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, disposableDisplay: v as DisplayValue }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPLAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-neutral-400">[일회용품 받기] 체크박스 표시/미표시</p>
          </BaseRow>
        </div>
      </div>

      <hr className="my-3 border-border" />

      {/* 주문 금액/수량 한도 */}
      <LimitField
        label="최소 주문 금액"
        value={formData.minOrderAmount}
        onChange={(v) => setFormData((prev) => ({ ...prev, minOrderAmount: v }))}
        helpText="주문 건별 최소 상품 금액을 설정합니다."
        unit="원"
      />
      <LimitField
        label="최대 주문 금액"
        value={formData.maxOrderAmount}
        onChange={(v) => setFormData((prev) => ({ ...prev, maxOrderAmount: v }))}
        helpText="주문 건별 최대 상품 금액을 설정합니다."
        unit="원"
      />
      <LimitField
        label="최소 주문 수량"
        value={formData.minOrderCount}
        onChange={(v) => setFormData((prev) => ({ ...prev, minOrderCount: v }))}
        helpText="주문 건별 최소 상품 수량을 설정합니다."
        unit="개"
      />
      <LimitField
        label="최대 주문 수량"
        value={formData.maxOrderCount}
        onChange={(v) => setFormData((prev) => ({ ...prev, maxOrderCount: v }))}
        helpText="주문 건별 최대 상품 수량을 설정합니다."
        unit="개"
      />

      <hr className="my-3 border-border" />

      {/* 주문 표시 시간 (DID 화면) */}
      <div className="py-2">
        <BaseRow label="주문 표시 시간 (DID 화면)" direction="column">
          <Select
            value={String(formData.orderDisplayTime)}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, orderDisplayTime: Number(v) }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-neutral-400">
            DID 화면에서 주문번호 표시가 유지되는 시간을 설정합니다. (권장: 2~5분)
          </p>
        </BaseRow>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 뷰 모드 서브 컴포넌트 (ServiceViewMode 내부에서 사용)
// ─────────────────────────────────────────────
function DisplayText({ value }: { value: DisplayValue }) {
  return value === DISPLAY_VALUE.SHOW ? (
    <span className="weight-600 text-status-positive">• 표시</span>
  ) : (
    <span className="text-neutral-400">• 미표시</span>
  )
}


// ─────────────────────────────────────────────
// 뷰 모드 (레거시 ServiceViewMode.vue 포팅)
// 레거시와 동일하게 서비스 타입을 Select 드롭다운으로 변경 가능
// ─────────────────────────────────────────────
function ServiceViewMode({
  takeType,
  onTakeTypeChange,
  registeredTypes,
  formData,
  onDelete,
  isPending,
}: {
  takeType: number
  onTakeTypeChange: (v: number) => void
  registeredTypes: number[]
  formData: FormData
  onDelete: () => void
  isPending: boolean
}) {
  const paymentMethodsText =
    formData.paymentMethods.length === PAYMENT_METHOD_OPTIONS.length
      ? '전체'
      : formData.paymentMethods
          .map((v) => PAYMENT_METHOD_OPTIONS.find((m) => m.value === v)?.label ?? v)
          .join(', ')

  // 서비스 타입 Select 옵션: 등록된 모든 서비스 표시 (레거시 serviceTypeOptions 동일)
  const serviceSelectOptions = SERVICE_TYPE_OPTIONS.filter(
    (opt) => registeredTypes.includes(opt.value),
  )

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 서비스 타입 — 레거시와 동일하게 Select 드롭다운으로 변경 가능 */}
      <div className="py-2">
        <Label className="typo-body3 weight-600 text-foreground mb-2 block">서비스</Label>
        <Select
          value={String(takeType)}
          onValueChange={(v) => onTakeTypeChange(Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serviceSelectOptions.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <hr className="my-1 border-border" />

      <BaseRow label="결제 수단" className="py-2">{paymentMethodsText || '-'}</BaseRow>

      <hr className="my-1 border-border" />

      <BaseRow label="일회용품 받기" className="py-2"><DisplayText value={formData.disposableDisplay} /></BaseRow>
      <BaseRow label="요청사항 입력" className="py-2"><DisplayText value={formData.requestDisplay} /></BaseRow>

      <hr className="my-1 border-border" />

      <BaseRow
        label="최소 주문 금액"
        value={formData.minOrderAmount != null ? `${formData.minOrderAmount.toLocaleString()} 원` : '-'}
        className="py-2"
      />
      <BaseRow
        label="최대 주문 금액"
        value={formData.maxOrderAmount != null ? `${formData.maxOrderAmount.toLocaleString()} 원` : '-'}
        className="py-2"
      />
      <BaseRow
        label="최소 주문 수량"
        value={formData.minOrderCount != null ? String(formData.minOrderCount) : '-'}
        className="py-2"
      />
      <BaseRow
        label="최대 주문 수량"
        value={formData.maxOrderCount != null ? String(formData.maxOrderCount) : '-'}
        className="py-2"
      />

      <hr className="my-1 border-border" />

      <BaseRow label="주문 표시 시간 (DID 화면)" value={`${formData.orderDisplayTime}분`} className="py-2" />

      <hr className="my-1 border-border" />

      <BaseRow label="서비스 삭제" className="py-2">
        <Button
          variant="outline"
          size="sm"
          className="text-status-destructive border-status-destructive/40 hover:bg-status-destructive/5"
          onClick={onDelete}
          disabled={isPending}
        >
          삭제
        </Button>
      </BaseRow>
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

// 화면 모드:
//   'type-select' — 등록 Step 0: 서비스 선택 카드 목록
//   'edit-form'   — 등록 Step 1 / 수정: ServiceEditMode 폼
//   'view'        — 기존 서비스 클릭 시: ServiceViewMode
type DialogMode = 'type-select' | 'edit-form' | 'view'

export function OrderServiceDialog({
  storeId,
  detail,
  initialTakeType,
  open,
  onClose,
}: OrderServiceDialogProps) {
  const upsertMutation = useUpsertStoreTakeType(storeId)
  const deleteMutation = useDeleteStoreTakeType(storeId)

  const takeTypesPolicy = detail.take_types_policy ?? []
  const registeredTypes = takeTypesPolicy.map((p) => p.take_type)

  // key 변경으로 마운트 시 초기값 자동 계산
  function getInitialFormData(takeType: number | null): FormData {
    if (takeType === null) return DEFAULT_FORM
    const policy = takeTypesPolicy.find((p) => p.take_type === takeType)
    if (!policy) return DEFAULT_FORM
    return {
      paymentMethods: policy.payment_methods ?? DEFAULT_FORM.paymentMethods,
      contactDisplay: (policy.contact_display as DisplayValue) ?? DISPLAY_VALUE.HIDE,
      disposableDisplay: (policy.disposable_display as DisplayValue) ?? DISPLAY_VALUE.HIDE,
      requestDisplay: (policy.request_display as DisplayValue) ?? DISPLAY_VALUE.HIDE,
      minOrderAmount: policy.min_order_amount ?? null,
      maxOrderAmount: policy.max_order_amount ?? null,
      minOrderCount: policy.min_order_count ?? null,
      maxOrderCount: policy.max_order_count ?? null,
      orderDisplayTime: policy.order_display_time ?? 3,
    }
  }

  const [dialogMode, setDialogMode] = useState<DialogMode>(
    initialTakeType !== null ? 'view' : 'type-select',
  )
  const [selectedTakeType, setSelectedTakeType] = useState<number | null>(initialTakeType)
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(initialTakeType))

  // Step 0에서 서비스 선택 → Step 1으로 이동
  function handleTypeSelect(takeType: number) {
    setSelectedTakeType(takeType)
  }

  // Step 1로 전진 (다음 버튼)
  function handleNext() {
    setFormData(DEFAULT_FORM)
    setDialogMode('edit-form')
  }

  // Step 1에서 이전으로 돌아가기
  function handleBack() {
    setDialogMode('type-select')
  }

  // 저장 (등록/수정)
  async function handleSave() {
    if (selectedTakeType === null) return

    const payload: UpsertTakeTypePayload = {
      take_type: selectedTakeType,
      policy: {
        take_type: selectedTakeType,
        phone_number_required: formData.contactDisplay === 'SHOW',
        available_payment_codes: formData.paymentMethods,
        request_notes_required: formData.requestDisplay === 'SHOW',
        disposable_item_required: formData.disposableDisplay === 'SHOW',
        minimum_order_amount: formData.minOrderAmount ?? 0,
        maximum_order_amount: formData.maxOrderAmount ?? 0,
        minimum_order_quantity: formData.minOrderCount ?? 0,
        maximum_order_quantity: formData.maxOrderCount ?? 0,
        delivery_time_buffer: formData.orderDisplayTime ?? 0,
        special_request_required: false,
      },
      auto_pickup_complete_setup_time: formData.orderDisplayTime ?? 0,
    }

    try {
      await upsertMutation.mutateAsync(payload)
      toast.success('저장되었습니다.')
      onClose()
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  // 삭제
  async function handleDelete() {
    if (selectedTakeType === null) return
    if (!window.confirm('서비스를 삭제하시겠습니까?')) return

    try {
      await deleteMutation.mutateAsync(selectedTakeType)
      toast.success('삭제되었습니다.')
      onClose()
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const isPending = upsertMutation.isPending || deleteMutation.isPending

  // 다이얼로그 타이틀 (레거시 dialogTitle computed)
  // create 모드(+추가): '주문 서비스 등록' / view·수정 모드: '주문 서비스 설정'
  const isCreateMode = initialTakeType === null
  const dialogTitle = isCreateMode ? '주문 서비스 등록' : '주문 서비스 설정'

  // ── 푸터 버튼 ──
  function renderFooter() {
    if (dialogMode === 'type-select') {
      // Step 0: [취소] [다음 (선택 시 활성)]
      return (
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
          <Button
            className="flex-1"
            onClick={handleNext}
            disabled={selectedTakeType === null}
          >
            다음
          </Button>
        </>
      )
    }
    if (dialogMode === 'edit-form') {
      // Step 1 (등록): [이전] [설정 완료]
      return (
        <>
          <Button variant="outline" className="flex-1" onClick={handleBack} disabled={isPending}>
            이전
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isPending || formData.paymentMethods.length === 0}
          >
            설정 완료
          </Button>
        </>
      )
    }
    // view 모드: [닫기] [수정]
    return (
      <>
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
          닫기
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            setDialogMode('edit-form')
          }}
          disabled={isPending}
        >
          수정
        </Button>
      </>
    )
  }

  // view 모드에서 수정 버튼 → edit-form 모드 진입 시 기존 데이터 유지 (loadPolicyData 이미 됨)

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      footer={renderFooter()}
    >
      <LoadingOverlay show={isPending} />

        {dialogMode === 'type-select' && (
          <ServiceTypeSelect
            registeredTypes={registeredTypes}
            selectedType={selectedTakeType}
            onSelect={handleTypeSelect}
          />
        )}

        {dialogMode === 'edit-form' && (
          <ServiceEditForm
            takeType={selectedTakeType}
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {dialogMode === 'view' && selectedTakeType !== null && (
          <ServiceViewMode
            takeType={selectedTakeType}
            onTakeTypeChange={(v) => setSelectedTakeType(v)}
            registeredTypes={registeredTypes}
            formData={formData}
            onDelete={handleDelete}
            isPending={isPending}
          />
        )}
    </BaseDialog>
  )
}
