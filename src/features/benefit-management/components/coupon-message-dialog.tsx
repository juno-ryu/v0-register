import { useState } from 'react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import {
  usePresetMessages,
  useSendableUsers,
  useSendPresetMessage,
  useSendTestPresetMessage,
} from '@/features/benefit-management/queries'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDate } from '@/utils/date'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { PresetMessage } from '@/features/benefit-management/schema'

// Harmony RCS Center URL (레거시 config/constants.ts HARMONY_RCS_CENTER_URL)
const HARMONY_RCS_CENTER_URL = 'https://rcs.harmonycorp.co.kr'

const STEPS = ['메시지 선택', '발송 확인', '발송 시작'] as const
type StepIndex = 0 | 1 | 2

interface CouponMessageDialogProps {
  couponId: number
  issuedSession?: string
  open: boolean
  onClose: () => void
}

// 예상 소요 시간 (레거시 SendStart.vue expectedTime)
function getExpectedTime(count: number): string {
  if (count <= 99) return '~ 1분'
  if (count <= 499) return '~ 3분'
  if (count <= 999) return '~ 5분'
  if (count <= 4999) return '~ 10분'
  return '~ 15분'
}

// 예상 발송 건수 계산 (레거시 SendConfirm.vue)
function calcExpectedCounts(total: number, hasLegacy: boolean) {
  if (!hasLegacy) return { rcs: total, legacy: 0 }
  if (total === 1) return { rcs: 1, legacy: 0 }
  const rcs = Math.floor(total * 0.6)
  return { rcs, legacy: total - rcs }
}

export function CouponMessageDialog({
  couponId,
  issuedSession,
  open,
  onClose,
}: CouponMessageDialogProps) {
  const brandId = useAuthStore((s) => s.userBrandId)
  const [activeStep, setActiveStep] = useState<StepIndex>(0)
  const [selectedMessage, setSelectedMessage] = useState<PresetMessage | null>(null)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { data: presetMessages = [], isLoading: isMessagesLoading } = usePresetMessages(
    open ? brandId : null,
  )
  const { data: sendableUsersInfo } = useSendableUsers(
    open ? brandId : null,
    open ? couponId : null,
    issuedSession,
  )
  const sendMessage = useSendPresetMessage()
  const sendTestMessage = useSendTestPresetMessage()

  const numberOfSendingMessages = sendableUsersInfo?.number_of_sending_messages ?? 0

  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === 2

  const handleClose = () => {
    setActiveStep(0)
    setSelectedMessage(null)
    setTestPhoneNumber('')
    setHasError(false)
    setErrorMessage('')
    onClose()
  }

  const handlePrev = () => {
    if (isLastStep || hasError) {
      handleClose()
    } else {
      setActiveStep((prev) => (prev - 1) as StepIndex)
    }
  }

  const handleNext = () => {
    if (activeStep === 1) {
      // 발송 시작 API 호출
      if (!selectedMessage || !brandId) return
      sendMessage.mutate(
        {
          brandId,
          couponId,
          presetMessageId: Number(selectedMessage.key),
          issuedSession,
        },
        {
          onSettled: () => {
            setActiveStep(2)
          },
          onError: (error) => {
            setHasError(true)
            const err = error as { response?: { data?: { code?: string; message?: string; detail?: { msg: string }[] } } }
            const detail = err?.response?.data?.detail
            if (detail?.[0]?.msg) {
              setErrorMessage(detail[0].msg)
            } else {
              const code = err?.response?.data?.code ?? ''
              const message = err?.response?.data?.message ?? ''
              setErrorMessage(`[${code}] ${message}`)
            }
          },
        },
      )
    } else {
      setActiveStep((prev) => (prev + 1) as StepIndex)
    }
  }

  const handleSendTest = () => {
    if (!selectedMessage || !brandId || !testPhoneNumber) return
    sendTestMessage.mutate({
      brandId,
      couponId,
      presetMessageId: Number(selectedMessage.key),
      testPhoneNumber,
    })
  }

  const prevButtonText = hasError
    ? '닫기'
    : isFirstStep
      ? '취소'
      : isLastStep
        ? '닫기'
        : '뒤로'

  const nextButtonText =
    activeStep === 0 ? '다음' : activeStep === 1 ? '메시지 발송 시작' : ''

  const isNextDisabled = activeStep === 0 && !selectedMessage

  // 예상 발송 계산 (SendConfirm용)
  const hasLegacy = !!selectedMessage?.legacy_message_type
  const { rcs: expectedRcs, legacy: expectedLegacy } = selectedMessage
    ? calcExpectedCounts(numberOfSendingMessages, hasLegacy)
    : { rcs: 0, legacy: 0 }
  const expectedTotal = expectedRcs + expectedLegacy
  const expectedPrice = Math.floor(
    expectedRcs * (selectedMessage?.rcs_price ?? 0) +
    expectedLegacy * (selectedMessage?.legacy_price ?? 0),
  )

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="쿠폰 메시지 발송"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={handlePrev}>
            {prevButtonText}
          </Button>
          {!isLastStep && !hasError && (
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={isNextDisabled || sendMessage.isPending}
            >
              {sendMessage.isPending ? '처리 중...' : nextButtonText}
            </Button>
          )}
        </>
      }
    >
      <LoadingOverlay show={sendMessage.isPending} />
      <div className="p-4">
          {/* Stepper */}
          {!hasError && (
            <StepperBar activeStep={activeStep} />
          )}

          {/* Step 1: 메시지 선택 */}
          {activeStep === 0 && (
            <MessageSelectStep
              presetMessages={presetMessages}
              isLoading={isMessagesLoading}
              hasError={hasError}
              errorMessage={errorMessage}
              numberOfSendingMessages={numberOfSendingMessages}
              selectedMessage={selectedMessage}
              onSelect={setSelectedMessage}
            />
          )}

          {/* Step 2: 발송 확인 */}
          {activeStep === 1 && selectedMessage && (
            <SendConfirmStep
              selectedMessage={selectedMessage}
              testPhoneNumber={testPhoneNumber}
              onTestPhoneNumberChange={setTestPhoneNumber}
              onSendTest={handleSendTest}
              isSendingTest={sendTestMessage.isPending}
              expectedTotal={expectedTotal}
              expectedPrice={expectedPrice}
              hasLegacy={hasLegacy}
              selectedMessageLegacyPrice={selectedMessage.legacy_price}
              selectedMessageLegacyMessageType={selectedMessage.legacy_message_type}
            />
          )}

          {/* Step 3: 발송 시작 */}
          {activeStep === 2 && (
            <SendStartStep
              hasError={hasError}
              errorMessage={errorMessage}
              numberOfSendingMessages={numberOfSendingMessages}
            />
          )}
      </div>
    </BaseDialog>
  )
}

// ─────────────────────────────────────────────
// 내부: Stepper 바
// ─────────────────────────────────────────────
function StepperBar({ activeStep }: { activeStep: StepIndex }) {
  return (
    <div className="flex items-center justify-between mb-4">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center typo-micro1 weight-700 border-2 ${
                i < activeStep
                  ? 'bg-key-blue border-key-blue text-white'
                  : i === activeStep
                    ? 'border-key-blue text-key-blue'
                    : 'border-border text-neutral-400'
              }`}
            >
              {i < activeStep ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`typo-micro1 ${
                i <= activeStep ? 'text-key-blue weight-600' : 'text-neutral-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px flex-1 mb-4 ${i < activeStep ? 'bg-key-blue' : 'bg-accent'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// 내부: Step 1 — 메시지 선택
// ─────────────────────────────────────────────
function MessageSelectStep({
  presetMessages,
  isLoading,
  hasError,
  errorMessage,
  numberOfSendingMessages,
  selectedMessage,
  onSelect,
}: {
  presetMessages: PresetMessage[]
  isLoading: boolean
  hasError: boolean
  errorMessage: string
  numberOfSendingMessages: number
  selectedMessage: PresetMessage | null
  onSelect: (msg: PresetMessage) => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 typo-body3 text-neutral-400">
        불러오는 중...
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col gap-4 mt-8 typo-body3 text-foreground">
        {errorMessage ? (
          <>
            <p>
              이 계정은{' '}
              <a
                href={HARMONY_RCS_CENTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-key-blue underline weight-500"
              >
                Harmony RCS Center
              </a>
              와 연동되지 않아 메시지 발송 서비스를 이용할 수 없습니다.
            </p>
            <p>운영 담당자에게 문의해 주세요.</p>
          </>
        ) : (
          <>
            <p>발송 가능한 프리셋 메시지가 등록되어 있지 않습니다.</p>
            <p>
              <a
                href={HARMONY_RCS_CENTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-key-blue underline weight-500"
              >
                Harmony RCS Center
              </a>
              에서 프리셋 메시지를 등록하고 다시 시도하거나 운영 담당자에게 문의해 주세요.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 헤더 */}
      <div className="mt-4 mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="typo-body3 weight-600 text-key-blue">메시지 발신 대상</span>
          <span className="typo-body3 weight-600 text-key-blue">{numberOfSendingMessages} 명</span>
        </div>
        <p className="typo-body3 text-muted-foreground mb-2">
          쿠폰을 발급받은 고객에게 메시지를 발송합니다.
          <br />
          발송할 메시지를 선택해 주세요.
        </p>
        <p className="typo-micro1 text-neutral-400">
          안내: 메시지 등록 또는 수정은{' '}
          <a
            href={HARMONY_RCS_CENTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-key-blue underline weight-500"
          >
            Harmony RCS Center
          </a>
          에서 직접 하거나 운영 담당자에게 문의해 주세요.
        </p>
      </div>

      {/* 메시지 카드 목록 */}
      {presetMessages.map((msg) => {
        const isSelected = selectedMessage?.key === msg.key
        const priceText = msg.legacy_message_type
          ? ` RCS-${msg.rcs_price}원, 문자-${msg.legacy_price ?? 0}원`
          : ` RCS-${msg.rcs_price}원, 문자-미설정`

        return (
          <button
            key={msg.key}
            type="button"
            onClick={() => onSelect(msg)}
            className={`flex items-stretch rounded border cursor-pointer transition-all text-left w-full ${
              isSelected
                ? 'border-red-500 shadow-[inset_0_0_0_1px_theme(colors.red.500)]'
                : 'border-border'
            } ${msg.isDisabled ? 'bg-muted opacity-70 cursor-not-allowed' : ''}`}
            disabled={msg.isDisabled}
          >
            <div className="flex-1 p-4 flex flex-col items-center text-center gap-1">
              <p className={`typo-body3 weight-700 ${isSelected ? 'text-status-destructive' : 'text-foreground'}`}>
                {msg.name}
              </p>
              <span className="typo-micro1 text-neutral-400">
                <strong className="weight-700">메시지ID:</strong> {msg.key}
              </span>
              <span className="typo-micro1 text-neutral-400">
                <strong className="weight-700">건별 금액:</strong>{priceText}
              </span>
              <span className="typo-micro1 text-neutral-400">
                <strong className="weight-700">등록일:</strong>{' '}
                {formatDate(msg.create_dt, 'yyyy/MM/dd HH:mm:ss')}
              </span>
            </div>
            <div
              className={`flex items-center px-3 border-l border-dashed ${
                isSelected ? 'border-red-500' : 'border-border'
              }`}
            >
              <Check size={16} className={isSelected ? 'text-status-destructive' : 'text-neutral-300'} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// 내부: Step 2 — 발송 확인
// ─────────────────────────────────────────────
function SendConfirmStep({
  selectedMessage,
  testPhoneNumber,
  onTestPhoneNumberChange,
  onSendTest,
  isSendingTest,
  expectedTotal,
  expectedPrice,
  hasLegacy,
  selectedMessageLegacyPrice,
  selectedMessageLegacyMessageType,
}: {
  selectedMessage: PresetMessage
  testPhoneNumber: string
  onTestPhoneNumberChange: (v: string) => void
  onSendTest: () => void
  isSendingTest: boolean
  expectedTotal: number
  expectedPrice: number
  hasLegacy: boolean
  selectedMessageLegacyPrice?: number | null
  selectedMessageLegacyMessageType?: string | null
}) {
  return (
    <div className="flex flex-col gap-7 mt-4 typo-body3 text-foreground">
      {/* 선택한 메시지 */}
      <section className="flex flex-col gap-2">
        <h4 className="typo-body3 weight-600 text-foreground">선택한 메시지</h4>
        <BaseRow label="메시지 명" value={selectedMessage.name} />
        <BaseRow label="메시지 ID" value={selectedMessage.key} />
      </section>

      {/* 테스트 발송 */}
      <section className="flex flex-col gap-2">
        <h4 className="typo-body3 weight-600 text-foreground">테스트 발송</h4>
        <div className="flex gap-2">
          <Input
            placeholder="수신번호 입력"
            value={testPhoneNumber}
            onChange={(e) => onTestPhoneNumberChange(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            className="w-14 shrink-0"
            disabled={!testPhoneNumber || isSendingTest}
            onClick={onSendTest}
          >
            발송
          </Button>
        </div>
      </section>

      {/* 발송 단가 */}
      <section className="flex flex-col gap-2">
        <h4 className="typo-body3 weight-600 text-foreground">발송 단가 (VAT 별도)</h4>
        <BaseRow label="RCS메시지 단가 (건별)" value={`${selectedMessage.rcs_price} 원`} />
        <BaseRow
          label="대체메시지 단가 (건별)"
          value={
            hasLegacy && selectedMessageLegacyMessageType
              ? `${selectedMessageLegacyPrice} 원`
              : '미설정'
          }
        />
      </section>

      {/* 예상 발송 정보 */}
      <section className="flex flex-col gap-2 mt-4">
        <BaseRow label="예상 발송 건 수" value={`${expectedTotal} 건`} labelClassName="weight-600 text-key-blue" valueClassName="weight-600 text-key-blue" />
        <BaseRow label="예상 발송 금액 (VAT 별도)" value={`${expectedPrice} 원`} labelClassName="weight-600 text-key-blue" valueClassName="weight-600 text-key-blue" />
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// 내부: Step 3 — 발송 시작
// ─────────────────────────────────────────────
function SendStartStep({
  hasError,
  errorMessage,
  numberOfSendingMessages,
}: {
  hasError: boolean
  errorMessage: string
  numberOfSendingMessages: number
}) {
  if (hasError) {
    return (
      <div className="mt-4 typo-body3 text-foreground whitespace-pre-line">
        {`오류가 발생했습니다.\n\n메시지 발송을 다시 시도하거나 운영 담당자에게 문의해 주세요.\n\n사유: ${errorMessage}`}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mt-4 typo-body3 text-foreground">
      <p className="mb-4">
        메시지 발송이 시작되었습니다.
        <br />
        발송 내역은{' '}
        <a
          href={HARMONY_RCS_CENTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-key-blue underline weight-500"
        >
          Harmony RCS Center
        </a>
        에서 확인 해주세요.
      </p>
      <BaseRow label="예상 발송 건 수" value={`${numberOfSendingMessages} 건`} labelClassName="weight-600 text-key-blue" valueClassName="weight-600 text-key-blue" />
      <BaseRow label="예상 소요 시간" value={getExpectedTime(numberOfSendingMessages)} labelClassName="weight-600 text-key-blue" valueClassName="weight-600 text-key-blue" />
    </div>
  )
}

