import { useState, useEffect, useRef } from 'react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useUpdateStoreConfig, useValidateCouponCode } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { BranchDetail, StoreConfigPayload } from '@/features/branch-management/schema'

// ─────────────────────────────────────────────
// 상수 (레거시 payment-constants.ts 포팅)
// ─────────────────────────────────────────────
const POS_OPTIONS = [
  { value: 'smartro_pos', label: '스마일 POS' },
  { value: 'did_only', label: '미연동' },
]

const PG_OPTIONS = [
  { value: 'smartro_pay', label: '스마트로 PG' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'PREPAID', label: '선불' },
  { value: 'POSTPAID', label: '후불' },
]

const KDS_MODE_OPTIONS = [
  { value: 'MASTER', label: '마스터' },
  { value: 'KDS1', label: 'KDS1' },
  { value: 'KDS2', label: 'KDS2' },
]

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface FormData {
  pos: string
  externalSn: string
  paymentType: string   // 'PREPAID' | 'POSTPAID'
  pg: string
  paymentId: string
  secretKey: string
  cancelPassword: string
  kdsModes: string[]
  couponCode: string
}

interface StoreSettingsDialogProps {
  storeId: string
  detail: BranchDetail
  scrollToSection: 'pos' | 'pg' | 'kds'
  open: boolean
  onClose: () => void
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export function StoreSettingsDialog({
  storeId,
  detail,
  scrollToSection,
  open,
  onClose,
}: StoreSettingsDialogProps) {
  const updateMutation = useUpdateStoreConfig(storeId)
  const validateMutation = useValidateCouponCode()

  const posRef = useRef<HTMLDivElement>(null)
  const pgRef = useRef<HTMLDivElement>(null)
  const kdsRef = useRef<HTMLDivElement>(null)

  const paymentType =
    detail.use_pre_pay && detail.use_post_pay
      ? 'PREPAID'
      : detail.use_post_pay
      ? 'POSTPAID'
      : 'PREPAID'

  const [formData, setFormData] = useState<FormData>({
    pos: detail.pos ?? 'did_only',
    externalSn: detail.external_sn ?? '',
    paymentType,
    pg: detail.pg ?? 'smartro_pay',
    paymentId: detail.payment_id ?? '',
    secretKey: detail.secret_key ?? '',
    cancelPassword: detail.cancel_password ?? '',
    kdsModes: (detail.did_order_mgmt_available_mode ?? []).filter((m) => m !== '전체'),
    couponCode: detail.coupon_validation_code ?? '',
  })
  const [couponValidated, setCouponValidated] = useState(false)

  // 마운트 시 1회 — 지정 섹션으로 스크롤
  useEffect(() => {
    const timer = setTimeout(() => {
      const refMap = { pos: posRef, pg: pgRef, kds: kdsRef }
      refMap[scrollToSection]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleKdsMode(value: string) {
    setFormData((prev) => ({
      ...prev,
      kdsModes: prev.kdsModes.includes(value)
        ? prev.kdsModes.filter((m) => m !== value)
        : [...prev.kdsModes, value],
    }))
  }

  function toggleAllKdsModes(checked: boolean) {
    setFormData((prev) => ({
      ...prev,
      kdsModes: checked ? KDS_MODE_OPTIONS.map((o) => o.value) : [],
    }))
  }

  async function handleValidateCoupon() {
    if (!formData.couponCode) return
    try {
      const result = await validateMutation.mutateAsync({
        couponCode: formData.couponCode,
        storeId,
      })
      if (result.is_valid) {
        setCouponValidated(true)
        toast.success('사용 가능한 코드입니다.')
      } else {
        setCouponValidated(false)
        toast.error(result.message ?? '이미 사용 중인 코드입니다.')
      }
    } catch {
      toast.error('코드 확인에 실패했습니다.')
    }
  }

  async function handleSave() {
    const payload: StoreConfigPayload = {
      pos: formData.pos,
      ...(formData.pos === 'smartro_pos' && { external_sn: formData.externalSn }),
      use_pre_pay: formData.paymentType === 'PREPAID',
      use_post_pay: formData.paymentType === 'POSTPAID',
      pg: formData.pg,
      payment_id: formData.paymentId,
      secret_key: formData.secretKey,
      cancel_password: formData.cancelPassword,
      did_order_mgmt_available_mode: formData.kdsModes,
      coupon_validation_code: formData.couponCode,
    }

    try {
      await updateMutation.mutateAsync(payload)
      toast.success('저장되었습니다.')
      onClose()
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const isPending = updateMutation.isPending || validateMutation.isPending
  const allKdsChecked = KDS_MODE_OPTIONS.every((o) => formData.kdsModes.includes(o.value))

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="매장 설정"
      widthClass="w-[480px] max-w-[480px]"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isPending}>
            저장
          </Button>
        </>
      }
    >
      <LoadingOverlay show={isPending} />
      <div className="p-4 space-y-6">
          {/* ── 포스 및 연동 설정 ── */}
          <div ref={posRef} className="space-y-3">
            <h3 className="typo-body3 weight-600 text-foreground border-b pb-2">포스 및 연동 설정</h3>

            <BaseRow label="포스 연동" direction="column">
              <Select
                value={formData.pos}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, pos: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="포스 선택" />
                </SelectTrigger>
                <SelectContent>
                  {POS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </BaseRow>

            {formData.pos === 'smartro_pos' && (
              <BaseRow label="스마트로 가맹점 번호" direction="column">
                <Input
                  value={formData.externalSn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, externalSn: e.target.value }))}
                  placeholder="가맹점 번호 입력"
                />
              </BaseRow>
            )}

            <BaseRow label="선불 / 후불 결제" direction="column">
              <RadioGroup
                value={formData.paymentType}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, paymentType: v }))}
                className="flex gap-4"
              >
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-1.5">
                    <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} />
                    <Label htmlFor={`pay-${opt.value}`} className="weight-400 cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </BaseRow>
          </div>

          {/* ── PG 및 결제 설정 (후불 시 감추기) ── */}
          {formData.paymentType !== 'POSTPAID' && (
          <div ref={pgRef} className="space-y-3">
            <h3 className="typo-body3 weight-600 text-foreground border-b pb-2">PG 및 결제 설정</h3>

            <BaseRow label="PG" direction="column">
              <Select
                value={formData.pg}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, pg: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="PG 선택" />
                </SelectTrigger>
                <SelectContent>
                  {PG_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </BaseRow>

            <BaseRow label="Payment ID" direction="column">
              <Input
                value={formData.paymentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentId: e.target.value }))}
                placeholder="Payment ID 입력"
              />
            </BaseRow>

            <BaseRow label="시크릿 키" direction="column">
              <Input
                value={formData.secretKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, secretKey: e.target.value }))}
                placeholder="시크릿 키 입력"
              />
            </BaseRow>

            <BaseRow label="결제 취소 비밀번호" direction="column">
              <Input
                value={formData.cancelPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, cancelPassword: e.target.value }))}
                placeholder="결제 취소 비밀번호 입력"
              />
            </BaseRow>
          </div>
          )}

          {/* ── KDS 설정 ── */}
          <div ref={kdsRef} className="space-y-3">
            <h3 className="typo-body3 weight-600 text-foreground border-b pb-2">KDS 설정</h3>
            <div className="border border-border rounded px-3 py-2 flex flex-col">
              {/* 전체 선택 */}
              <div className="flex items-center gap-2 py-1.5">
                <Checkbox
                  id="kds-all"
                  checked={allKdsChecked}
                  onCheckedChange={(checked) => toggleAllKdsModes(!!checked)}
                />
                <Label htmlFor="kds-all" className="weight-400 cursor-pointer typo-body3">전체</Label>
              </div>
              <hr className="border-border my-1" />
              {KDS_MODE_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2 py-1.5">
                  <Checkbox
                    id={`kds-${opt.value}`}
                    checked={formData.kdsModes.includes(opt.value)}
                    onCheckedChange={() => toggleKdsMode(opt.value)}
                  />
                  <Label htmlFor={`kds-${opt.value}`} className="weight-400 cursor-pointer typo-body3">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* ── 쿠폰 사용처리 코드 ── */}
          <div className="space-y-3">
            <h3 className="typo-body3 weight-600 text-foreground border-b pb-2">쿠폰 사용처리 코드</h3>
            <div className="flex gap-2">
              <Input
                value={formData.couponCode}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, couponCode: e.target.value }))
                  setCouponValidated(false)
                }}
                placeholder="쿠폰 코드 입력"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidateCoupon}
                disabled={!formData.couponCode || validateMutation.isPending}
              >
                중복확인
              </Button>
            </div>
            {couponValidated && (
              <p className="typo-micro1 text-status-positive">사용 가능한 코드입니다.</p>
            )}
          </div>
      </div>
    </BaseDialog>
  )
}
