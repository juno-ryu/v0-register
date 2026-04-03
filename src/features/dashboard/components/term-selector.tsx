import { useState, useEffect } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  lastDayOfMonth,
  setDate,
  startOfWeek,
  isMonday,
} from 'date-fns'
import { TermSelector as TermSelectorUI } from '@/components/common/term-selector'
import { TERM_TYPE, type TermType } from '@/features/dashboard/schema'

interface TermSelectorProps {
  // 오늘 포함 여부 (Dashboard는 false — 어제까지만)
  isTodayIncluded?: boolean
  onChange: (payload: { startDate: string; endDate: string; term: TermType }) => void
}

const TERM_LABELS: Record<TermType, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
  custom: '기간 선택',
}

const TERM_OPTIONS: TermType[] = [TERM_TYPE.DAILY, TERM_TYPE.WEEKLY, TERM_TYPE.MONTHLY]

// 레거시 TermSelector.vue calculateWeeklyTermStartDate 포팅
function calculateWeeklyStartDate(baseDate: Date): Date {
  let date = baseDate
  if (isMonday(date)) return addDays(date, -7)
  for (let i = 1; i < 7; i++) {
    date = addDays(date, -1)
    if (isMonday(date)) break
  }
  return date
}

function calculateEndDate(term: TermType, startDate: Date, today: Date, isTodayIncluded: boolean): Date {
  switch (term) {
    case TERM_TYPE.DAILY:
      return startDate
    case TERM_TYPE.WEEKLY: {
      const endDate = addDays(startDate, 6)
      if (today <= endDate) {
        return isTodayIncluded
          ? addDays(addWeeks(startDate, 1), -1)
          : addDays(today, -1)
      }
      return endDate
    }
    case TERM_TYPE.MONTHLY:
      return lastDayOfMonth(startDate)
    default:
      return startDate
  }
}

function getInitialDates(
  term: TermType,
  isTodayIncluded: boolean,
): { start: Date; end: Date } {
  const today = new Date()
  const yesterday = addDays(today, -1)

  let start: Date
  switch (term) {
    case TERM_TYPE.DAILY:
      start = isTodayIncluded ? today : yesterday
      break
    case TERM_TYPE.WEEKLY:
      start = isTodayIncluded
        ? addDays(startOfWeek(today, { weekStartsOn: 1 }), 0)
        : calculateWeeklyStartDate(yesterday)
      break
    case TERM_TYPE.MONTHLY:
      start = isTodayIncluded
        ? setDate(today, 1)
        : setDate(addMonths(today, -1), 1)
      break
    default:
      start = yesterday
  }

  const end = calculateEndDate(term, start, today, isTodayIncluded)
  return { start, end }
}

function getDisplayDate(term: TermType, start: Date, end: Date): string {
  const today = new Date()
  const yesterday = addDays(today, -1)

  switch (term) {
    case TERM_TYPE.DAILY: {
      const dateStr = format(start, 'yyyy/MM/dd')
      const todayStr = format(today, 'yyyy/MM/dd')
      const yesterdayStr = format(yesterday, 'yyyy/MM/dd')
      if (dateStr === todayStr) return '오늘'
      if (dateStr === yesterdayStr) return '어제'
      return dateStr
    }
    case TERM_TYPE.WEEKLY:
      return `${format(start, 'yyyy/MM/dd')} ~ ${format(end, 'yyyy/MM/dd')}`
    case TERM_TYPE.MONTHLY:
      return format(start, 'yyyy/M')
    default:
      return `${format(start, 'yyyy/MM/dd')} ~ ${format(end, 'yyyy/MM/dd')}`
  }
}

function isRightArrowDisabled(
  term: TermType,
  start: Date,
  isTodayIncluded: boolean,
): boolean {
  if (isTodayIncluded) return false
  const today = new Date()
  switch (term) {
    case TERM_TYPE.DAILY:
      return isSameDay(start, addDays(today, -1))
    case TERM_TYPE.WEEKLY:
      return isSameWeek(start, addWeeks(today, -1))
    case TERM_TYPE.MONTHLY:
      return isSameMonth(start, addMonths(today, -1))
    default:
      return false
  }
}

export function TermSelector({ isTodayIncluded = false, onChange }: TermSelectorProps) {
  const [term, setTerm] = useState<TermType>(TERM_TYPE.DAILY)
  const [startDate, setStartDate] = useState<Date>(() => getInitialDates(TERM_TYPE.DAILY, isTodayIncluded).start)
  const [endDate, setEndDate] = useState<Date>(() => getInitialDates(TERM_TYPE.DAILY, isTodayIncluded).end)

  // 마운트 시 초기 이벤트 emit
  useEffect(() => {
    onChange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      term,
    })
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = (newStart: Date, newEnd: Date, newTerm: TermType) => {
    onChange({
      startDate: format(newStart, 'yyyy-MM-dd'),
      endDate: format(newEnd, 'yyyy-MM-dd'),
      term: newTerm,
    })
  }

  const handleTermSelect = (newTerm: TermType) => {
    if (newTerm === term) return
    const { start, end } = getInitialDates(newTerm, isTodayIncluded)
    setTerm(newTerm)
    setStartDate(start)
    setEndDate(end)
    emit(start, end, newTerm)
  }

  const handleArrowClick = (direction: 'left' | 'right') => {
    if (direction === 'right' && isRightArrowDisabled(term, startDate, isTodayIncluded)) return

    const today = new Date()
    const multiplier = direction === 'right' ? 1 : -1
    let newStart: Date

    switch (term) {
      case TERM_TYPE.DAILY:
        newStart = addDays(startDate, multiplier)
        break
      case TERM_TYPE.WEEKLY:
        newStart = addDays(startDate, 7 * multiplier)
        break
      case TERM_TYPE.MONTHLY:
        newStart = addMonths(setDate(startDate, 1), multiplier)
        break
      default:
        return
    }

    const newEnd = calculateEndDate(term, newStart, today, isTodayIncluded)

    // 월 첫날이 오늘인 경우 이번 달 데이터 요청 불가 (레거시 예외처리 동일)
    if (
      term === TERM_TYPE.MONTHLY &&
      today.getDate() === 1 &&
      newStart.getMonth() === today.getMonth()
    ) {
      return
    }

    setStartDate(newStart)
    setEndDate(newEnd)
    emit(newStart, newEnd, term)
  }

  const rightDisabled = isRightArrowDisabled(term, startDate, isTodayIncluded)

  return (
    <div className="px-2.5 my-4">
      <TermSelectorUI
        termOptions={TERM_OPTIONS.map((t) => ({ value: t, label: TERM_LABELS[t] }))}
        term={term}
        onTermChange={(v) => handleTermSelect(v as TermType)}
        displayText={getDisplayDate(term, startDate, endDate)}
        onPrev={() => handleArrowClick('left')}
        onNext={() => handleArrowClick('right')}
        isNextDisabled={rightDisabled}
      />
    </div>
  )
}
