import { priceFormat } from '@/utils/price'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardData, TermType } from '@/features/dashboard/schema'

interface SummaryBoxContentProps {
  title: string
  mainNumber: number
  changedRate: number
  unit: string
  // 기간 단위 텍스트 (전일대비 / 전주대비 / 전월대비)
  termLabel: string
  bgColor: string
}

function SummaryBoxContent({
  title,
  mainNumber,
  changedRate,
  unit,
  termLabel,
  bgColor,
}: SummaryBoxContentProps) {
  const isNegative = changedRate < 0

  return (
    <div className={`${bgColor} rounded h-full p-4 text-white text-center flex flex-col justify-between dark:brightness-75`}>
      {/* 전기 대비 변화율 */}
      <div className="typo-micro1">
        전{termLabel}대비{' '}
        <span
          className="inline-block"
          style={{ transform: isNegative ? 'rotate(180deg)' : 'none' }}
        >
          ▲
        </span>{' '}
        {Math.abs(changedRate)}%
      </div>

      {/* 수치 */}
      <div className="typo-headline2 weight-700 my-2">
        {priceFormat(mainNumber)}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>

      {/* 제목 */}
      <div className="text-sm">{title}</div>
    </div>
  )
}

// 기간 유형 → 한글 레이블 (전일 / 전주 / 전월)
const TERM_LABELS: Record<TermType, string> = {
  daily: '일',
  weekly: '주',
  monthly: '월',
  custom: '기간',
}

interface SummaryBoxesProps {
  data: DashboardData | undefined
  term: TermType
  isLoading: boolean
}

export function SummaryBoxes({ data, term, isLoading }: SummaryBoxesProps) {
  const termLabel = TERM_LABELS[term] ?? '일'

  if (isLoading) {
    return (
      <div className="px-2.5 py-3">
        <div className="flex gap-3">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-2.5 py-3">
      <div className="flex gap-3 mb-3">
        {/* 주문건수 */}
        <div className="w-full">
          <SummaryBoxContent
            title="주문건수"
            mainNumber={data?.total_order_count ?? 0}
            changedRate={data?.total_order_count_change_rate ?? 0}
            unit="건"
            termLabel={termLabel}
            bgColor="bg-[#f9b900]"
          />
        </div>

        {/* 전체 매출 */}
        <div className="w-full">
          <SummaryBoxContent
            title={`전체 매출(${termLabel})`}
            mainNumber={data?.total_sales_amount ?? 0}
            changedRate={data?.total_sales_amount_change_rate ?? 0}
            unit="원"
            termLabel={termLabel}
            bgColor="bg-[#ff6a67]"
          />
        </div>
      </div>
    </div>
  )
}
