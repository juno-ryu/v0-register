import { useState, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { typedZodResolver } from '@/lib/form'
import { Check } from 'lucide-react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,

  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload, type ImageItem } from '@/components/common/image-upload'
import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import { couponFormSchema, COUPON_TYPE, DISCOUNT_TYPE } from '@/features/benefit-management/schema'
import type { CouponForm, CouponDetail } from '@/features/benefit-management/schema'

// ─────────────────────────────────────────────
// 스텝 상수
// 레거시: COUPON_MODAL_STEPS
// ─────────────────────────────────────────────
const STEPS = ['쿠폰타입 선택', '쿠폰정보', '쿠폰설정', '매장 선택'] as const
const STEP_COUPON_TYPE = 0
const STEP_COUPON_INFO = 1
const STEP_COUPON_SETTING = 2
const STEP_STORE_SELECT = 3

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface CouponFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  couponDetail?: CouponDetail | null
  isSubmitting?: boolean
  // 특정 스텝으로 바로 열기 (예: 매장 선택 탭으로 열기 = STEP_STORE_SELECT)
  initialStep?: number
  onClose: () => void
  onSubmit: (
    data: Omit<CouponForm, 'hasMinimumOrderAmount' | 'isSamePeriod'>,
  ) => void
}

// ─────────────────────────────────────────────
// 매장 목록 훅
// ─────────────────────────────────────────────
interface StoreItem {
  id: number
  name: string
  sn: string
}

function useStoreListForDialog(brandId?: string | number) {
  return useQuery({
    queryKey: ['stores', 'list-for-dialog', brandId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ results: StoreItem[] }>(
        'backoffice/stores',
        {
          params: brandId ? { brand_id: brandId } : undefined,
        },
      )
      return data?.results ?? []
    },
  })
}

// ─────────────────────────────────────────────
// 스텝 인디케이터
// ─────────────────────────────────────────────
function StepIndicator({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((label, index) => {
        const isDone = index < activeStep
        const isActive = index === activeStep

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full typo-micro1 weight-700',
                  isDone
                    ? 'bg-key-blue text-white'
                    : isActive
                      ? 'bg-key-blue text-white'
                      : 'border-2 border-border bg-background text-neutral-400',
                ].join(' ')}
              >
                {isDone ? <Check size={14} /> : index + 1}
              </div>
              <span
                className={[
                  'text-[10px] whitespace-nowrap',
                  isActive ? 'weight-600 text-key-blue' : 'text-neutral-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={[
                  'mx-1 mb-4 h-px w-8',
                  index < activeStep ? 'bg-key-blue' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 1: 쿠폰 타입 선택
// 레거시: CouponType.vue
// ─────────────────────────────────────────────
interface CouponTypeStepProps {
  value: string
  onChange: (type: string) => void
}

function CouponTypeStep({ value, onChange }: CouponTypeStepProps) {
  const types = [
    {
      type: COUPON_TYPE.DISCOUNT,
      title: '주문 할인 쿠폰',
      description: '메뉴 주문에 할인을\n적용할 수 있는 쿠폰을 등록합니다.',
    },
    {
      type: COUPON_TYPE.BONUS,
      title: '추가 혜택 쿠폰',
      description:
        '메뉴 주문에 적용하는 쿠폰이 아닌 추가 혜택을\n제공하는 쿠폰입니다 (예: 무료 음료)',
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {types.map(({ type, title, description }) => {
        const isSelected = value === type
        return (
          <Button
            key={type}
            type="button"
            variant="outline"
            className={[
              'flex h-auto items-center rounded border text-left transition-all p-0',
              isSelected
                ? 'border-status-destructive shadow-[inset_0_0_0_1px_var(--color-status-destructive)]'
                : 'border-border',
            ].join(' ')}
            onClick={() => onChange(type)}
          >
            <div className="flex flex-1 flex-col items-center px-4 py-3 text-center">
              <p
                className={[
                  'typo-micro1 weight-700',
                  isSelected ? 'text-status-destructive' : 'text-black',
                ].join(' ')}
              >
                {title}
              </p>
              <span className="mt-1 whitespace-pre-line typo-micro1 weight-400 text-muted-foreground">
                {description}
              </span>
            </div>
            <div
              className={[
                'flex h-full items-center border-l px-3 py-4',
                isSelected
                  ? 'border-status-destructive/40'
                  : 'border-dashed border-border',
              ].join(' ')}
            >
              <Check
                size={14}
                className={isSelected ? 'text-status-destructive' : 'text-neutral-300'}
              />
            </div>
          </Button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2: 쿠폰 정보 입력
// 레거시: CouponInfo.vue
// ─────────────────────────────────────────────
interface CouponInfoStepProps {
  form: UseFormReturn<CouponForm>
  isManagementAccount: boolean
  isDiscountCoupon: boolean
  couponImages: ImageItem[]
  onCouponImagesChange: (images: ImageItem[]) => void
}

function CouponInfoStep({
  form,
  isManagementAccount,
  isDiscountCoupon,
  couponImages,
  onCouponImagesChange,
}: CouponInfoStepProps) {
  const MAX_NAME = 24
  const MAX_DESC = 500
  const nameValue = form.watch('name') ?? ''
  const descValue = form.watch('description') ?? ''
  const notesValue = form.watch('usage_notes') ?? ''
  const discountType = form.watch('discount_type')
  const isAmountCoupon = discountType === DISCOUNT_TYPE.AMOUNT
  const minOrderOption = form.watch('hasMinimumOrderAmount')
  const maxDiscountOption = form.watch('max_discount_amount')

  // 최소 주문금액 / 최대 할인금액 계산 (정률일 때)
  const discountAmount = Number(form.watch('discount_amount') ?? 0)
  const minPayment = Number(form.watch('min_payment_amount') ?? 0)
  const minMaxPrice = Math.ceil((minPayment * discountAmount) / 100 / 10) * 10

  return (
    <div className="flex flex-col gap-3">
      {/* 쿠폰명 */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <BaseRow label={<>쿠폰명 <span className="text-status-destructive">(필수)</span></>} direction="column">
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    disabled={isManagementAccount}
                    maxLength={MAX_NAME}
                    placeholder="쿠폰명을 입력해 주세요."
                    className="pr-14 typo-body3"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
                    {nameValue.length}/{MAX_NAME}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </BaseRow>
          </FormItem>
        )}
      />

      {/* 쿠폰 설명 */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <BaseRow label={<>쿠폰 설명{!isDiscountCoupon && <span className="text-status-destructive"> (필수)</span>}</>} direction="column">
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    disabled={isManagementAccount}
                    maxLength={MAX_DESC}
                    placeholder={`예:\n1. 중복사용 불가\n2. 전 메뉴에 사용 가능`}
                    className="h-[100px] resize-none pb-5 typo-body3 weight-400"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] text-neutral-400">
                    {descValue.length}/{MAX_DESC}
                  </span>
                </div>
              </FormControl>
            </BaseRow>
          </FormItem>
        )}
      />

      {/* 유의 사항 */}
      <FormField
        control={form.control}
        name="usage_notes"
        render={({ field }) => (
          <FormItem>
            <BaseRow label="유의 사항" direction="column">
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    disabled={isManagementAccount}
                    maxLength={MAX_DESC}
                    placeholder={`예:\n1. 쿠폰 중복사용 불가합니다.\n2. 쿠폰 이벤트가 조기종료될 수 있습니다.`}
                    className="h-[100px] resize-none pb-5 typo-body3 weight-400"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] text-neutral-400">
                    {notesValue.length}/{MAX_DESC}
                  </span>
                </div>
              </FormControl>
            </BaseRow>
          </FormItem>
        )}
      />

      {/* 쿠폰 이미지 */}
      <BaseRow label="쿠폰 이미지" direction="column">
        <ImageUpload
          location="media"
          value={couponImages}
          onChange={(images) => {
            onCouponImagesChange(images)
            form.setValue('image_url', images[0]?.url ?? null)
          }}
          maxImages={1}
          maxFileSizeMB={3}
          recommendedSize="3:2 비율"
          immediateUpload
        />
      </BaseRow>

      {/* 사용 채널 — 현재 오프라인 고정(레거시와 동일) */}
      <BaseRow label={<>사용 채널 <span className="text-status-destructive">(필수)</span></>} direction="column">
        <Input value="오프라인" disabled className="typo-body3" />
      </BaseRow>

      {/* 할인 설정 (할인쿠폰만) */}
      {isDiscountCoupon && (
        <>
          {/* 할인 유형 */}
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <BaseRow label={<>할인설정 <span className="text-status-destructive">(필수)</span></>} direction="column">
                  <Select
                    disabled={isManagementAccount}
                    value={String(field.value)}
                    onValueChange={(v) => {
                      field.onChange(Number(v))
                      form.setValue('discount_amount', null)
                    }}
                  >
                    <SelectTrigger className="typo-body3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(DISCOUNT_TYPE.AMOUNT)}>
                        정액(₩) 할인
                      </SelectItem>
                      <SelectItem value={String(DISCOUNT_TYPE.PERCENTAGE)}>
                        정률(%) 할인
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </BaseRow>
              </FormItem>
            )}
          />

          {/* 할인 금액/율 */}
          <FormField
            control={form.control}
            name="discount_amount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Label className="w-28 shrink-0 typo-body3 text-foreground">
                    {isAmountCoupon ? '할인금액' : '할인율'}
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      min={0}
                      disabled={isManagementAccount}
                      placeholder={isAmountCoupon ? '예) 20,000' : '예) 15'}
                      className="text-right typo-body3"
                    />
                  </FormControl>
                  <span className="shrink-0 typo-body3 text-muted-foreground">
                    {isAmountCoupon ? '원' : '%'}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 최소 주문금액 */}
          <BaseRow label="최소 주문금액" direction="column">
            <RadioGroup
              disabled={isManagementAccount}
              value={minOrderOption ? 'input' : 'none'}
              onValueChange={(v) => {
                form.setValue('hasMinimumOrderAmount', v === 'input')
                if (v === 'none') form.setValue('min_payment_amount', null)
              }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="input" id="min-order-input" />
                <Label
                  htmlFor="min-order-input"
                  className="cursor-pointer typo-body3 weight-400"
                >
                  입력
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="none" id="min-order-none" />
                <Label
                  htmlFor="min-order-none"
                  className="cursor-pointer typo-body3 weight-400"
                >
                  없음
                </Label>
              </div>
            </RadioGroup>
            {minOrderOption && (
              <div className="flex items-center gap-2">
                <div className="w-28 shrink-0" />
                <FormField
                  control={form.control}
                  name="min_payment_amount"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        type="number"
                        min={0}
                        disabled={isManagementAccount}
                        placeholder="예) 20,000"
                        className="text-right typo-body3"
                      />
                    </FormControl>
                  )}
                />
                <span className="shrink-0 typo-body3 text-muted-foreground">원</span>
              </div>
            )}
          </BaseRow>

          {/* 최대 할인금액 (정률 쿠폰만) */}
          {!isAmountCoupon && (
            <BaseRow label="최대 할인금액" direction="column">
              <RadioGroup
                disabled={
                  isManagementAccount || !(discountAmount && minPayment)
                }
                value={
                  maxDiscountOption && maxDiscountOption > 0
                    ? 'input'
                    : 'unlimited'
                }
                onValueChange={(v) => {
                  if (v === 'unlimited') form.setValue('max_discount_amount', 0)
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="input" id="max-discount-input" />
                  <Label
                    htmlFor="max-discount-input"
                    className="cursor-pointer typo-body3 weight-400"
                  >
                    입력
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value="unlimited"
                    id="max-discount-unlimited"
                  />
                  <Label
                    htmlFor="max-discount-unlimited"
                    className="cursor-pointer typo-body3 weight-400"
                  >
                    무제한
                  </Label>
                </div>
              </RadioGroup>
              {maxDiscountOption != null && maxDiscountOption > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-28 shrink-0" />
                  <FormField
                    control={form.control}
                    name="max_discount_amount"
                    render={({ field }) => (
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          min={0}
                          disabled={isManagementAccount}
                          placeholder="예) 5,000"
                          className="text-right typo-body3"
                        />
                      </FormControl>
                    )}
                  />
                  <span className="shrink-0 typo-body3 text-muted-foreground">원</span>
                </div>
              )}
              {/* 최소 최대 할인금액 안내 */}
              {minPayment > 0 &&
                maxDiscountOption != null &&
                maxDiscountOption > 0 && (
                  <p
                    className={[
                      'typo-micro1',
                      maxDiscountOption < minMaxPrice
                        ? 'text-status-destructive'
                        : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {"'최대 할인금액'은 최소 주문금액에 할인율을 곱한 금액, "}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 typo-micro1 text-key-blue"
                      onClick={() =>
                        !isManagementAccount &&
                        form.setValue('max_discount_amount', minMaxPrice)
                      }
                    >
                      {minMaxPrice.toLocaleString()} 원(선택)
                    </Button>
                    {' 이상으로 설정 가능합니다.'}
                  </p>
                )}
            </BaseRow>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 3: 쿠폰 설정
// 레거시: CouponSetting.vue
// ─────────────────────────────────────────────
interface CouponSettingStepProps {
  form: UseFormReturn<CouponForm>
  isManagementAccount: boolean
}

function CouponSettingStep({
  form,
  isManagementAccount,
}: CouponSettingStepProps) {
  const isSamePeriod = form.watch('isSamePeriod')

  const handleSamePeriodChange = (checked: boolean) => {
    form.setValue('isSamePeriod', checked)
    if (checked) {
      form.setValue('usable_start_date', form.getValues('issuable_start_date'))
      form.setValue('usable_end_date', form.getValues('issuable_end_date'))
    }
  }

  const handleIssuableDateChange = (
    field: 'issuable_start_date' | 'issuable_end_date',
    value: string,
  ) => {
    form.setValue(field, value)
    if (isSamePeriod) {
      if (field === 'issuable_start_date')
        form.setValue('usable_start_date', value)
      if (field === 'issuable_end_date') form.setValue('usable_end_date', value)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 발급수량 */}
      <FormField
        control={form.control}
        name="total_quantity"
        render={({ field }) => (
          <FormItem>
            <BaseRow label="발급수량" direction="column">
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="number"
                  min={0}
                  disabled={isManagementAccount}
                  placeholder="발급수량을 입력해 주세요."
                  className="typo-body3"
                />
              </FormControl>
            </BaseRow>
          </FormItem>
        )}
      />

      {/* 발급제한 */}
      <FormField
        control={form.control}
        name="each_user_max_quantity"
        render={({ field }) => (
          <FormItem>
            <BaseRow label="발급제한" direction="column">
              <Select
                disabled={isManagementAccount}
                value={
                  field.value == null ? '' : String(field.value === 1 ? 1 : 999)
                }
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger className="typo-body3">
                  <SelectValue placeholder="발급제한을 설정해 주세요." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1인 1회 발급</SelectItem>
                  <SelectItem value="999">사용 후 재발급</SelectItem>
                </SelectContent>
              </Select>
            </BaseRow>
          </FormItem>
        )}
      />

      {/* 기간 설정 */}
      <BaseRow label="기간설정" direction="column">
        {/* 발급 기간 */}
        <div className="flex flex-col justify-start gap-2">
          <span className="w-12 shrink-0 typo-micro1 text-muted-foreground">
            발급{'\n'}기간
          </span>
          <div className="flex flex-1 items-center gap-1">
            <Input
              type="date"
              disabled={isManagementAccount}
              value={form.watch('issuable_start_date') ?? ''}
              onChange={(e) =>
                handleIssuableDateChange('issuable_start_date', e.target.value)
              }
              className="typo-micro1"
            />
            <span className="text-neutral-400">~</span>
            <Input
              type="date"
              disabled={isManagementAccount}
              value={form.watch('issuable_end_date') ?? ''}
              onChange={(e) =>
                handleIssuableDateChange('issuable_end_date', e.target.value)
              }
              className="typo-micro1"
            />
          </div>
        </div>

        {/* 사용 기간 */}
        <div className="flex flex-col justify-start gap-2">
          <span className="w-12 shrink-0 typo-micro1 text-muted-foreground">
            사용{'\n'}기간
          </span>
          <div className="flex flex-1 items-center gap-1">
            <Input
              type="date"
              disabled={isManagementAccount || isSamePeriod}
              value={form.watch('usable_start_date') ?? ''}
              onChange={(e) =>
                form.setValue('usable_start_date', e.target.value)
              }
              className="typo-micro1"
            />
            <span className="text-neutral-400">~</span>
            <Input
              type="date"
              disabled={isManagementAccount || isSamePeriod}
              value={form.watch('usable_end_date') ?? ''}
              onChange={(e) => form.setValue('usable_end_date', e.target.value)}
              className="typo-micro1"
            />
          </div>
        </div>

        {/* 발급기간과 동일 체크박스 */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="same-period"
              disabled={isManagementAccount}
              checked={isSamePeriod}
              onCheckedChange={(checked) => handleSamePeriodChange(!!checked)}
            />
            <Label
              htmlFor="same-period"
              className="cursor-pointer typo-micro1 weight-400 text-muted-foreground"
            >
              발급기간과 동일
            </Label>
          </div>
        </div>
      </BaseRow>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 4: 매장 선택
// 레거시: StoreSelect.vue
// ─────────────────────────────────────────────
interface StoreSelectStepProps {
  form: UseFormReturn<CouponForm>
  isManagementAccount: boolean
}

function StoreSelectStep({ form, isManagementAccount }: StoreSelectStepProps) {
  const { data: stores = [] } = useStoreListForDialog()
  const selectedStores = form.watch('stores') ?? []

  const isAllSelected =
    stores.length > 0 && selectedStores.length === stores.length

  const handleToggleAll = (checked: boolean) => {
    form.setValue('stores', checked ? stores.map((s) => s.id) : [])
  }

  const handleToggleStore = (storeId: number, checked: boolean) => {
    const current = form.getValues('stores') ?? []
    if (checked) {
      form.setValue('stores', [...current, storeId])
    } else {
      form.setValue(
        'stores',
        current.filter((id) => id !== storeId),
      )
    }
  }

  return (
    <div className="rounded border border-border p-4">
      {/* 전체 선택 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="store-all"
          disabled={isManagementAccount}
          checked={isAllSelected}
          onCheckedChange={handleToggleAll}
        />
        <Label
          htmlFor="store-all"
          className="cursor-pointer typo-body3 weight-400"
        >
          전체매장
        </Label>
      </div>

      <hr className="my-2 border-border" />

      {/* 매장 목록 */}
      <div className="ml-2 flex max-h-60 flex-col gap-2 overflow-y-auto">
        {stores.length === 0 && (
          <p className="typo-micro1 text-neutral-400">매장 정보가 없습니다.</p>
        )}
        {stores.map((store) => (
          <div key={store.id} className="flex items-center gap-2">
            <Checkbox
              id={`store-${store.id}`}
              disabled={isManagementAccount}
              checked={selectedStores.includes(store.id)}
              onCheckedChange={(checked) =>
                handleToggleStore(store.id, !!checked)
              }
            />
            <Label
              htmlFor={`store-${store.id}`}
              className="cursor-pointer typo-body3 weight-400"
            >
              {store.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

const initialValues: CouponForm = {
  name: '',
  description: '',
  usage_notes: '',
  image_url: null,
  usage_channel: 'OFFLINE',
  coupon_type: COUPON_TYPE.DISCOUNT,
  discount_type: DISCOUNT_TYPE.AMOUNT,
  discount_amount: null,
  max_discount_amount: 0,
  min_payment_amount: null,
  hasMinimumOrderAmount: false,
  total_quantity: null,
  each_user_max_quantity: null,
  issuable_start_date: null,
  issuable_end_date: null,
  usable_start_date: null,
  usable_end_date: null,
  isSamePeriod: true,
  stores: [],
  issue_type: 0,
}

function resolveValues(data: CouponDetail): CouponForm {
  return {
    name: data.name ?? '',
    description: data.description ?? '',
    usage_notes: data.usage_notes ?? '',
    image_url: data.image_url ?? null,
    usage_channel: data.usage_channel ?? 'OFFLINE',
    coupon_type: data.coupon_type ?? COUPON_TYPE.DISCOUNT,
    discount_type: data.discount_type ?? DISCOUNT_TYPE.AMOUNT,
    discount_amount: data.discount_amount ?? null,
    max_discount_amount: data.max_discount_amount ?? 0,
    min_payment_amount: data.min_payment_amount ?? null,
    hasMinimumOrderAmount: (data.min_payment_amount ?? 0) > 0,
    total_quantity: data.total_quantity ?? null,
    each_user_max_quantity: data.each_user_max_quantity ?? null,
    issuable_start_date: data.issuable_start_date ?? null,
    issuable_end_date: data.issuable_end_date ?? null,
    usable_start_date: data.usable_start_date ?? null,
    usable_end_date: data.usable_end_date ?? null,
    isSamePeriod:
      data.issuable_start_date === data.usable_start_date &&
      data.issuable_end_date === data.usable_end_date,
    stores: data.stores ?? [],
    issue_type: data.issue_type ?? 0,
  }
}
export function CouponFormDialog({
  open,
  mode,
  couponDetail,
  isSubmitting = false,
  initialStep: initialStepProp,
  onClose,
  onSubmit,
}: CouponFormDialogProps) {
  const isManagementAccount = useAuthStore(selectIsManagementAccount)
  // 수정 모드: Step 2부터 시작 / 생성 모드: Step 1부터 / initialStepProp 지정 시 해당 스텝으로
  const defaultStep =
    initialStepProp ?? (mode === 'edit' ? STEP_COUPON_INFO : STEP_COUPON_TYPE)
  const [activeStep, setActiveStep] = useState(defaultStep)

  const defaultValues = useMemo(
    () => mode === 'edit' && couponDetail ? resolveValues(couponDetail) : initialValues,
    [mode, couponDetail],
  )

  const form = useForm<CouponForm>({
    resolver: typedZodResolver(couponFormSchema),
    defaultValues,
  })

  // 쿠폰 이미지 상태 (RHF 밖에서 관리)
  const [couponImages, setCouponImages] = useState<ImageItem[]>(() => {
    if (couponDetail?.image_url) {
      const url = couponDetail.image_url
      return [{ url, fileName: url.split('/').pop() ?? '', order: 0 }]
    }
    return []
  })

  const couponType = form.watch('coupon_type')
  const isDiscountCoupon = couponType === COUPON_TYPE.DISCOUNT
  const isFirstStep = activeStep === STEP_COUPON_TYPE
  const isLastStep = activeStep === STEP_STORE_SELECT

  // 수정 모드에서 쿠폰정보 탭은 이전 버튼 disabled
  const isPrevDisabled = mode === 'edit' && activeStep === STEP_COUPON_INFO

  // 다음 버튼 활성화 조건
  const isNextDisabled = (() => {
    if (activeStep === STEP_COUPON_TYPE) return !couponType
    if (activeStep === STEP_COUPON_INFO) {
      const name = form.watch('name')
      if (!name) return true
      if (isDiscountCoupon && !form.watch('discount_amount')) return true
    }
    if (activeStep === STEP_COUPON_SETTING) {
      const total = form.watch('total_quantity')
      const eachUser = form.watch('each_user_max_quantity')
      const start = form.watch('issuable_start_date')
      const end = form.watch('issuable_end_date')
      if (!total || !eachUser || !start || !end) return true
    }
    return false
  })()

  const dialogTitle = mode === 'create' ? '쿠폰 등록' : '쿠폰 수정'
  const nextButtonLabel = isLastStep
    ? mode === 'edit'
      ? '수정'
      : '등록'
    : '다음'

  const handleNext = () => {
    if (isLastStep) {
      // 최종 제출
      const values = form.getValues()
      const { hasMinimumOrderAmount, isSamePeriod: _isSamePeriod, ...payload } = values
      // 최소 주문금액 없음 선택 시 null 처리
      if (!hasMinimumOrderAmount) payload.min_payment_amount = null
      onSubmit(payload)
      return
    }
    setActiveStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (isFirstStep) {
      onClose()
      return
    }
    setActiveStep((s) => s - 1)
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      noScrollBody
    >
      <div className="px-5 pt-3">
        <StepIndicator activeStep={activeStep} />
        <hr className="mb-4 border-border" />
      </div>

      {/* 콘텐츠 영역 */}
      <Form {...form}>
        <form className="flex-1 overflow-y-auto px-5 pb-2">
          {activeStep === STEP_COUPON_TYPE && (
            <CouponTypeStep
              value={couponType}
              onChange={(type) =>
                form.setValue('coupon_type', type as typeof couponType)
              }
            />
          )}
          {activeStep === STEP_COUPON_INFO && (
            <CouponInfoStep
              form={form}
              isManagementAccount={isManagementAccount}
              isDiscountCoupon={isDiscountCoupon}
              couponImages={couponImages}
              onCouponImagesChange={setCouponImages}
            />
          )}
          {activeStep === STEP_COUPON_SETTING && (
            <CouponSettingStep
              form={form}
              isManagementAccount={isManagementAccount}
            />
          )}
          {activeStep === STEP_STORE_SELECT && (
            <StoreSelectStep
              form={form}
              isManagementAccount={isManagementAccount}
            />
          )}
        </form>
      </Form>

      <div className="p-4 border-t shrink-0 flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPrevDisabled}
          onClick={handlePrev}
          className="flex-1"
        >
          {isFirstStep ? '취소' : '이전'}
        </Button>
        <Button
          type="button"
          disabled={
            isNextDisabled ||
            isSubmitting ||
            (isLastStep && isManagementAccount)
          }
          onClick={handleNext}
          className="flex-1"
        >
          {isSubmitting ? '저장 중...' : nextButtonLabel}
        </Button>
      </div>
    </BaseDialog>
  )
}
