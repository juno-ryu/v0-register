import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { priceFormat } from '@/utils/price'
import { Skeleton } from '@/components/ui/skeleton'
import type { RevenueChartData, TermType } from '@/features/dashboard/schema'

const TERM_TITLE: Record<TermType, string> = {
  daily: '일자별',
  weekly: '주별',
  monthly: '월별',
  custom: '사용자 지정 기간',
}

interface RevenueChartProps {
  data: RevenueChartData[]
  term: TermType
  isLoading: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border border-border rounded shadow-md p-3 typo-body3">
      <p className="weight-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="weight-500">
            {entry.name === '매출액'
              ? `${priceFormat(entry.value)}원`
              : `${priceFormat(entry.value)}건`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, term, isLoading }: RevenueChartProps) {
  const subTitle = `${TERM_TITLE[term] ?? ''} 매출액, 주문건수`

  if (isLoading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mt-8 mb-10">
      <p className="text-center weight-700 py-2.5 typo-headline4">판매 추이</p>
      <p className="text-center typo-body3 mb-3">{subTitle}</p>

      <div className="rounded bg-muted flex flex-col h-[253px]">
        {/* 범례 — 우측 상단, 레거시 순서: 매출액(위) / 주문건수(아래) */}
        <div className="flex justify-end pt-3 pr-4">
          <div className="flex flex-col gap-1.5 typo-micro1">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3"
                style={{ backgroundColor: '#0085E5' }}
              />
              <span>매출액</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3"
                style={{ backgroundColor: '#E3211E' }}
              />
              <span>주문건수</span>
            </div>
          </div>
        </div>

        {!data.length ? (
          <div className="flex items-center justify-center h-[300px] text-status-destructive typo-headline4 rounded">
            해당기간 판매데이터가 없습니다.
          </div>
        ) : (
          <div className="flex-1 py-2 px-2 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  yAxisId="revenue"
                  stroke="var(--color-line-stroke)"
                  strokeDasharray=""
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, dy: 15 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="start"
                  height={55}
                  interval={0}
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  width={80}
                  tick={{ fontSize: 11, fill: '#0085E5' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₩ ${priceFormat(v)}`}
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(Math.ceil(dataMax / 10000) * 10000, 10000),
                  ]}
                  tickCount={4}
                />
                <YAxis
                  yAxisId="orderCount"
                  orientation="right"
                  width={30}
                  tick={{ fontSize: 11, fill: '#E3211E' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(v) => String(v)}
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(Math.ceil(dataMax / 2) * 2, 2),
                  ]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="orderCount"
                  type="linear"
                  dataKey="orderCount"
                  name="주문건수"
                  stroke="#E3211E"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#E3211E', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  name="매출액"
                  fill="#0085E5"
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
