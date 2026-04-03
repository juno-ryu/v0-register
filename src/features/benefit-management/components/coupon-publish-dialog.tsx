import { useState } from 'react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIssuableInformation, useIssueToAllEligibleUsers } from '@/features/benefit-management/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { IssueResult } from '@/features/benefit-management/schema'

interface CouponPublishDialogProps {
  couponId: number
  open: boolean
  onClose: () => void
  // 발행 완료 후 메시지 발송 모달로 연결
  onMessageSendOpen: (issuedSession: string) => void
}

// 예상 소요 시간 계산 (레거시 publish-modal/index.vue expectedTime)
function getExpectedTime(count: number): string {
  if (count < 100) return '~ 1분'
  if (count < 1000) return '약 1~2분'
  return '약 2~5분'
}

export function CouponPublishDialog({
  couponId,
  open,
  onClose,
  onMessageSendOpen,
}: CouponPublishDialogProps) {
  const [isBeforePublish, setIsBeforePublish] = useState(true)
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null)

  const { data: info, isLoading } = useIssuableInformation(open ? couponId : null)
  const issueToAll = useIssueToAllEligibleUsers()

  // 잔여 수량 = 최대 발행 수량 - 발행된 수량
  const remainingCount = info
    ? info.total_issuable_quantity - info.issued_quantity
    : 0

  // 예정 발행 수 = min(발급 가능 사용자 수, 잔여 수량)
  const expectedPublishCount = info
    ? Math.min(info.issue_available_users_count, remainingCount)
    : 0

  const handlePublish = () => {
    if (isBeforePublish) {
      issueToAll.mutate(couponId, {
        onSuccess: (result) => {
          setIssueResult(result)
          setIsBeforePublish(false)
        },
      })
    } else {
      // 메시지 발송으로 이동
      onClose()
      if (issueResult?.issued_session) {
        onMessageSendOpen(issueResult.issued_session)
      }
    }
  }

  const handleClose = () => {
    setIsBeforePublish(true)
    setIssueResult(null)
    onClose()
  }

  const title = isBeforePublish ? '쿠폰 발행' : '쿠폰 발행 완료'
  const closeButtonText = isBeforePublish ? '취소' : '발송하지 않고 닫기'
  const confirmButtonText = isBeforePublish ? '쿠폰 발행하기' : '메시지 발송'
  const isConfirmDisabled = isBeforePublish && expectedPublishCount <= 0

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            {closeButtonText}
          </Button>
          <Button
            className="flex-1"
            onClick={handlePublish}
            disabled={isConfirmDisabled || issueToAll.isPending}
          >
            {issueToAll.isPending ? '처리 중...' : confirmButtonText}
          </Button>
        </>
      }
    >
      <LoadingOverlay show={issueToAll.isPending} />
      <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : isBeforePublish && info ? (
            <div className="flex flex-col gap-6">
              {/* 쿠폰 섹션 */}
              <div className="flex flex-col gap-3">
                <h3 className="typo-body2 weight-600">쿠폰</h3>
                <Input
                  disabled
                  value={info.coupon_name}
                  className="bg-muted"
                />
              </div>

              {/* 발행 현황 섹션 */}
              <div className="flex flex-col gap-3">
                <h3 className="typo-body2 weight-600">발행 현황</h3>
                <div className="flex flex-col gap-2">
                  <BaseRow label="최대 발행 수량" value={info.total_issuable_quantity} valueClassName="weight-400" />
                  <BaseRow label="발행된 수량" value={info.issued_quantity} valueClassName="weight-400" />
                  <BaseRow label="현재 잔여 수량" value={remainingCount} valueClassName="weight-400" />
                </div>
              </div>

              {/* 발행대상 섹션 */}
              <div className="flex flex-col gap-3">
                <h3 className="typo-body2 weight-600">발행대상</h3>
                <Input
                  disabled
                  value={`광고 수신 동의 고객 (총 ${info.eligible_users_count}명)`}
                  className="bg-muted"
                />
                <BaseRow
                  label="발급 가능 사용자 수"
                  value={info.issue_available_users_count}
                  labelClassName={info.issue_available_users_count === 0 ? 'weight-700 text-status-destructive' : ''}
                  valueClassName={info.issue_available_users_count === 0 ? 'weight-400 text-status-destructive' : 'weight-400'}
                />
                <p
                  className={`typo-micro1 ${info.issue_available_users_count === 0 ? 'text-status-destructive' : 'text-muted-foreground'}`}
                >
                  *사용하지 않은 동일 쿠폰이 있거나, 발급 제한 수량을 초과한 고객에게는 쿠폰이 발급되지 않습니다.
                </p>
                {info.issue_available_users_count > 0 && (
                  <>
                    <BaseRow label="예정 발행 수" value={expectedPublishCount} labelClassName="weight-700 text-key-blue" valueClassName="weight-700 text-key-blue" />
                    {expectedPublishCount > 0 && (
                      <BaseRow
                        label="예정 소요 시간"
                        value={getExpectedTime(expectedPublishCount)}
                        labelClassName="weight-700 text-key-blue"
                        valueClassName="weight-700 text-key-blue"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ) : !isBeforePublish && issueResult ? (
            // 발행 완료 화면
            <div className="flex flex-col gap-4 pt-8 pb-4">
              <p className="typo-body3 text-muted-foreground">쿠폰 발행이 완료되었습니다.</p>
              <BaseRow label="발행 성공" value={`${issueResult.issue_success_count} 건`} labelClassName="weight-700 text-key-blue" valueClassName="weight-700 text-key-blue" />
              <BaseRow label="발행 실패" value={`${issueResult.issue_failed_count} 건`} labelClassName="weight-700 text-key-blue" valueClassName="weight-700 text-key-blue" />
              <p className="typo-body3 text-muted-foreground mt-4">
                발급받은 고객에게 쿠폰발행에 대한 알림 메시지를 발송 하려면{' '}
                <strong>메시지 발송</strong> 버튼을 클릭해 주세요.
              </p>
            </div>
          ) : null}
      </div>
    </BaseDialog>
  )
}

