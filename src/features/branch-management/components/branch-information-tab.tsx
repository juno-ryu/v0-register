import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { DAYS } from '@/utils/date'
import type { BranchDetail, OpeningHours } from '@/features/branch-management/schema'

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '-'
  try {
    const d = new Date(dt)
    if (isNaN(d.getTime())) return '-'
    return format(d, 'yyyy/MM/dd HH:mm:ss')
  } catch {
    return '-'
  }
}

// 시간값 포매터 (레거시 포팅)
function formatTimeValue(time: unknown): string {
  if (!time) return '00:00'
  if (typeof time === 'object' && time !== null) {
    const t = time as { hour?: string | number; minute?: string | number }
    return `${String(t.hour ?? '00').padStart(2, '0')}:${String(t.minute ?? '00').padStart(2, '0')}`
  }
  if (typeof time === 'string') return time.substring(0, 5) // "HH:MM:SS" → "HH:MM"
  return '00:00'
}

// 영업시간 텍스트 계산 (레거시 businessHoursText computed 포팅)
interface BusinessHourRow {
  dayLabel: string
  timeText: string
}

function buildBusinessHoursText(openingHours: OpeningHours): BusinessHourRow[] {
  const businessHours = openingHours.business_hours
  const breakTimes = openingHours.break_times

  if (!businessHours || businessHours.length === 0) {
    // fallback: business_hours_text 배열을 그대로 row로 변환
    // API가 빈 문자열 ""을 반환하는 경우 방어
    const raw = openingHours.business_hours_text ?? []
    const textArr = Array.isArray(raw) ? raw : []
    return textArr.map((t, i) => ({ dayLabel: DAYS[i] ?? String(i), timeText: t }))
  }

  return DAYS.map((dayLabel, dayIndex) => {
    const hourEntry = businessHours.find((e) => e.days?.includes(dayIndex))
    if (!hourEntry) return { dayLabel, timeText: '휴무' }

    const breakEntry = breakTimes?.find((e) => e.days?.includes(dayIndex))

    if (hourEntry.is_24_hours) {
      let timeText = '24시간'
      if (breakEntry) {
        timeText += ` (휴게시간 ${formatTimeValue(breakEntry.start_time)} ~ ${formatTimeValue(breakEntry.end_time)})`
      }
      return { dayLabel, timeText }
    }

    const start = formatTimeValue(hourEntry.start_time)
    const end = formatTimeValue(hourEntry.end_time)
    let timeText = `${start} ~ ${end}`
    if (breakEntry) {
      timeText += ` (휴게시간 ${formatTimeValue(breakEntry.start_time)} ~ ${formatTimeValue(breakEntry.end_time)})`
    }
    return { dayLabel, timeText }
  })
}

// 주차/요일 인덱스 → 한글 변환용 상수
const WEEK_LABELS = ['첫째 주', '둘째 주', '셋째 주', '넷째 주', '다섯째 주'] as const
const DAY_LABELS_MAP = ['월', '화', '수', '목', '금', '토', '일'] as const

// 정기 휴무 텍스트 (복수 항목은 줄바꿈으로 구분)
function buildRegularClosingLabels(openingHours: OpeningHours): string[] {
  const regularDates = openingHours.regular_closing_dates ?? []
  if (regularDates.length === 0) return []

  return regularDates.map((d) => {
    const weeks = d.weeks ?? []
    const days = d.days ?? []
    if (weeks.length === 0 || days.length === 0) return ''

    const weekLabel = weeks.length === WEEK_LABELS.length
      ? '매주'
      : weeks.map((w) => WEEK_LABELS[w] ?? `${w + 1}째 주`).join(', ')
    const dayLabel = days.map((di) => DAY_LABELS_MAP[di] ?? `${di}`).join(', ')
    return `${weekLabel} - ${dayLabel}`
  }).filter(Boolean)
}

// 공휴일 휴무 텍스트
function buildHolidayText(openingHours: OpeningHours): string {
  return openingHours.is_closed_in_holiday ? '공휴일 휴무' : '공휴일 정상 운영'
}

// 임시 휴무 텍스트
function buildTemporaryClosingText(openingHours: OpeningHours): string {
  const tempDates = openingHours.temporary_closing_dates ?? []
  if (tempDates.length === 0) return '-'

  const labels = tempDates.map((d) => {
    const start = d.start_date?.replaceAll('-', '/') ?? ''
    const end = d.end_date?.replaceAll('-', '/') ?? ''
    if (!start && !end) return ''
    if (start === end) return start
    return `${start} ~ ${end}`
  }).filter(Boolean)

  return labels.join(', ') || '-'
}

// ─────────────────────────────────────────────
// 상태 뱃지 (레거시 StatusChip 포팅)
// ─────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`flex items-center gap-1 typo-body3 weight-600 ${isActive ? 'text-status-positive' : 'text-muted-foreground'}`}>
      <span
        className={`block h-2 w-2 rounded-full ${isActive ? 'bg-status-positive' : 'bg-neutral-550'}`}
      />
      {isActive ? '운영 중' : '운영 중단'}
    </span>
  )
}

// ─────────────────────────────────────────────
// 섹션 래퍼 (레거시 InfoTemplate 포팅)
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

// 행 컴포넌트 (레거시 BranchInfoTemplate 포팅)
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <span className="w-36 shrink-0 typo-body3 weight-600 text-foreground">{label}</span>
      <div className="flex-1 typo-body3 text-foreground">{children}</div>
    </div>
  )
}

// 구분선
function Divider() {
  return <hr className="my-4 border-border" />
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
interface BranchInformationTabProps {
  detail: BranchDetail
  openingHours: OpeningHours | null | undefined
  isLoading: boolean
  onEditBasic?: () => void
  onEditOpeningHours?: () => void
  onEditAccount?: () => void
}

export function BranchInformationTab({
  detail,
  openingHours,
  isLoading,
  onEditBasic,
  onEditOpeningHours,
  onEditAccount,
}: BranchInformationTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  const businessHoursRows = openingHours ? buildBusinessHoursText(openingHours) : []
  const regularClosingLabels = openingHours ? buildRegularClosingLabels(openingHours) : []
  const holidayText = openingHours ? buildHolidayText(openingHours) : '-'
  const temporaryClosingText = openingHours ? buildTemporaryClosingText(openingHours) : '-'

  return (
    <div className="space-y-2 bg-background">
      {/* 매장 정보 */}
      <section className="px-4 pt-4">
        <SectionTitle title="매장 정보" onEdit={onEditBasic} />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="매장 ID">{String(detail.id ?? '-')}</InfoRow>
          <InfoRow label="매장 코드">{detail.sn ?? '-'}</InfoRow>
          <InfoRow label="매장명">{detail.name ?? '-'}</InfoRow>
          <InfoRow label="브랜드">{detail.brand?.name ?? detail.brand_name ?? '-'}</InfoRow>
          <InfoRow label="전화번호">{detail.phone_number ?? '-'}</InfoRow>
          <InfoRow label="주소">{detail.full_address ?? '-'}</InfoRow>
          <InfoRow label="상태">
            <StatusBadge isActive={detail.is_active} />
          </InfoRow>
        </div>
      </section>

      <Divider />

      {/* 영업 정보 */}
      <section className="px-4">
        <SectionTitle title="영업 정보" onEdit={onEditOpeningHours} />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="영업시간">
            {businessHoursRows.length > 0 ? (
              <div className="space-y-0.5">
                {businessHoursRows.map((row) => (
                  <p key={row.dayLabel}>
                    {row.dayLabel} {row.timeText}
                  </p>
                ))}
              </div>
            ) : '-'}
          </InfoRow>
          <InfoRow label="공휴일">{holidayText}</InfoRow>
          <InfoRow label="정기 휴무">
            {regularClosingLabels.length > 0 ? (
              <div className="space-y-0.5">
                {regularClosingLabels.map((label, idx) => (
                  <p key={idx}>{label}</p>
                ))}
              </div>
            ) : '-'}
          </InfoRow>
          <InfoRow label="임시 휴무">{temporaryClosingText}</InfoRow>
        </div>
      </section>

      <Divider />

      {/* 영업/운영 정보 */}
      <section className="px-4">
        <SectionTitle title="영업/운영 정보" onEdit={onEditBasic} />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="상호/법인명">{detail.business_name ?? '-'}</InfoRow>
          <InfoRow label="사업자등록번호">{detail.registration_number ?? '-'}</InfoRow>
          <InfoRow label="대표자">{detail.representative_name ?? '-'}</InfoRow>
        </div>
      </section>

      <Divider />

      {/* 로그인 계정 */}
      <section className="px-4">
        <SectionTitle title="로그인 계정" onEdit={onEditAccount} />
        <div className="mt-2 divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="로그인 ID">{detail.administrator_username ?? '-'}</InfoRow>
          <InfoRow label="마지막 업데이트 일시">{formatDateTime(detail.administrator_update_dt)}</InfoRow>
        </div>
      </section>

      <Divider />

      {/* 타임스탬프 */}
      <section className="px-4 pb-4">
        <div className="divide-y divide-[var(--color-line-normal)]">
          <InfoRow label="업데이트일시">{formatDateTime(detail.update_dt)}</InfoRow>
          <InfoRow label="등록일시">{formatDateTime(detail.create_dt)}</InfoRow>
        </div>
      </section>
    </div>
  )
}
