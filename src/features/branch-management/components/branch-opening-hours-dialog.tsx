import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar as CalendarIcon, RotateCcw, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card } from '@/components/ui/card'
import { useBranchOpeningHours, useUpdateBranchOpeningHours } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { useDialogKey } from '@/hooks/useDialogKey'
import type { DateRange } from 'react-day-picker'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
const DAY_LABELS: Record<string, string> = {
  MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
}
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const WEEKENDS = ['SAT', 'SUN']


const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']

// ─────────────────────────────────────────────
// 내부 타입 정의
// ─────────────────────────────────────────────
interface TimeObj { hour: string; minute: string }

interface BusinessHourEntry {
  days: string[]       // ['MON', 'TUE', ...]
  startTime: TimeObj
  endTime: TimeObj
  is24Hours: boolean
}

interface BreakTimeEntry {
  days: string[]
  startTime: TimeObj
  endTime: TimeObj
}

interface RegularClosingDate {
  weeks: number[]      // [0]=첫째주, [1]=둘째주, ... (API 그대로)
  days: number[]       // [0]=월, [1]=화, ... (API 그대로)
}

interface TemporaryClosingDate {
  startDate: string    // 'YYYY-MM-DD'
  endDate: string
}

// ─────────────────────────────────────────────
// 시간 변환 유틸 (레거시 dateTimeHelpers.js 포팅)
// ─────────────────────────────────────────────
/**
 * API 문자열 "HH:MM:SS" → 내부 { hour, minute }
 * over_time이 "HH:MM:SS" 형태이고 "00:00:00"이 아닌 경우 다음날 처리 (hour+24)
 * 레거시에서 over_time은 boolean 또는 "HH:MM:SS" 문자열 모두 가능
 */
function parseApiTime(timeStr: string | null | undefined, overTime?: string | boolean | null): TimeObj {
  if (!timeStr) return { hour: '00', minute: '00' }
  const [h, m] = timeStr.split(':')
  let hour = parseInt(h ?? '0', 10)
  // over_time이 boolean true 이거나, "00:00:00"이 아닌 문자열이면 다음날 처리
  const isOverTime = overTime === true ||
    (typeof overTime === 'string' && overTime !== '00:00:00' && overTime !== '')
  if (isOverTime) hour += 24
  return {
    hour: String(hour).padStart(2, '0'),
    minute: m?.slice(0, 2).padStart(2, '0') ?? '00',
  }
}

/** 내부 { hour, minute } → API 시간 문자열 "HH:MM:00" */
function toTimeStr(t: TimeObj): string {
  const h = parseInt(t.hour, 10)
  // 다음날 표기(24+)인 경우 실제 시간으로 변환
  const actualHour = h >= 24 ? h - 24 : h
  return `${String(actualHour).padStart(2, '0')}:${t.minute}:00`
}

/** 레거시 checkOverTime: start_time >= end_time(분 단위)이면 다음날 */
function checkOverTime(startTime: TimeObj, endTime: TimeObj): boolean {
  const toMinutes = (t: TimeObj) => parseInt(t.minute, 10) + (parseInt(t.hour, 10) * 60)
  return toMinutes(startTime) >= toMinutes(endTime)
}

/** 요일 문자열 배열 → 표시 텍스트 ("매일", "평일", "주말", "월, 화, ..." 등) */
function getDayText(days: string[]): string {
  if (days.length === 7) return '매일'
  const isWeekdays = WEEKDAYS.every(d => days.includes(d)) && days.length === 5
  if (isWeekdays) return '평일'
  const isWeekends = WEEKENDS.every(d => days.includes(d)) && days.length === 2
  if (isWeekends) return '주말'
  return days.map(d => DAY_LABELS[d] ?? d).join(', ')
}

/** 종료 시간 hour 옵션 — 레거시와 동일: 당일 옵션 + (다음날) 접두사 옵션 */
function getEndHourOptions(startHour: string): { value: string; label: string }[] {
  const start = parseInt(startHour, 10)
  const allHours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  // 당일: start+1 ~ 23
  const todayOptions = allHours.slice(start + 1).map(h => ({ value: String(parseInt(h, 10)).padStart(2, '0'), label: h }))
  // 다음날: 00 ~ start (value는 24+h로 내부 저장, label에 "(다음날)" 표시)
  const nextDayOptions = allHours.slice(0, start + 1).map(h => ({
    value: String(parseInt(h, 10) + 24).padStart(2, '0'),
    label: `(다음날)${h}`,
  }))
  return [...todayOptions, ...nextDayOptions]
}

// ─────────────────────────────────────────────
// API 데이터 → 내부 상태 변환
// ─────────────────────────────────────────────
type ApiOpeningHours = {
  business_hours?: Array<{
    days?: number[]
    start_time?: string | null
    end_time?: string | null
    is_24_hours?: boolean
    over_time?: string | boolean | null  // API는 "00:00:00" 문자열 또는 boolean
  }>
  break_times?: Array<{
    days?: number[]
    start_time?: string | null
    end_time?: string | null
    over_time?: string | boolean | null
  }>
  is_closed_in_holiday?: boolean
  regular_closing_dates?: Array<{
    weeks?: number[]     // [0]=첫째주, [1]=둘째주...
    days?: number[]      // [0]=월, [1]=화...
    [key: string]: unknown
  }>
  temporary_closing_dates?: Array<{
    start_date?: string
    end_date?: string
    [key: string]: unknown
  }>
}

/** 요일 숫자(0=월) → 문자 키 */
function dayIndexToKey(idx: number): string {
  return DAY_KEYS[idx] ?? 'MON'
}

function fromApiData(raw: ApiOpeningHours): {
  businessHours: BusinessHourEntry[]
  breakTimes: BreakTimeEntry[]
  isClosedInHoliday: boolean
  regularClosingDates: RegularClosingDate[]
  temporaryClosingDates: TemporaryClosingDate[]
} {
  const businessHours: BusinessHourEntry[] = (raw.business_hours ?? []).map((e) => ({
    days: (e.days ?? []).map(dayIndexToKey),
    startTime: parseApiTime(e.start_time),
    endTime: parseApiTime(e.end_time, e.over_time),
    is24Hours: e.is_24_hours ?? false,
  }))

  if (businessHours.length === 0) {
    businessHours.push({
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      startTime: { hour: '00', minute: '00' },
      endTime: { hour: '01', minute: '00' },
      is24Hours: false,
    })
  }

  const breakTimes: BreakTimeEntry[] = (raw.break_times ?? []).map((e) => ({
    days: (e.days ?? []).map(dayIndexToKey),
    startTime: parseApiTime(e.start_time),
    endTime: parseApiTime(e.end_time),
  }))

  // API: { weeks: number[], days: number[] } 형태 그대로 저장
  const regularClosingDates: RegularClosingDate[] = (raw.regular_closing_dates ?? []).map((e) => ({
    weeks: e.weeks ?? [],
    days: e.days ?? [],
  }))

  const temporaryClosingDates: TemporaryClosingDate[] = (raw.temporary_closing_dates ?? []).map((e) => ({
    startDate: e.start_date ?? '',
    endDate: e.end_date ?? '',
  }))

  return {
    businessHours,
    breakTimes,
    isClosedInHoliday: raw.is_closed_in_holiday ?? false,
    regularClosingDates,
    temporaryClosingDates,
  }
}

/** 내부 상태 → API payload */
function toApiPayload(state: ReturnType<typeof fromApiData>) {
  const dayKeyToIndex = (key: string) => DAY_KEYS.indexOf(key as typeof DAY_KEYS[number])

  const business_hours = state.businessHours.map((e) => {
    const start_time = toTimeStr(e.startTime)
    const end_time_str = toTimeStr(e.endTime)
    const isOverTime = checkOverTime(e.startTime, e.endTime)
    return {
      days: e.days.map(dayKeyToIndex).filter(i => i >= 0),
      start_time,
      // 다음날 넘어가면 end_time은 "00:00:00", over_time에 실제 종료 시간
      end_time: isOverTime ? '00:00:00' : end_time_str,
      over_time: isOverTime ? end_time_str : '00:00:00',
      is_24_hours: e.is24Hours,
    }
  })

  const break_times = state.breakTimes.map((e) => {
    const start_time = toTimeStr(e.startTime)
    const end_time_str = toTimeStr(e.endTime)
    const isOverTime = checkOverTime(e.startTime, e.endTime)
    return {
      days: e.days.map(dayKeyToIndex).filter(i => i >= 0),
      start_time,
      end_time: isOverTime ? '00:00:00' : end_time_str,
      over_time: isOverTime ? end_time_str : '00:00:00',
    }
  })

  // API 형태 { weeks: number[], days: number[] } 그대로 전송
  const regular_closing_dates = state.regularClosingDates.map((e) => ({
    weeks: e.weeks,
    days: e.days,
  }))

  const temporary_closing_dates = state.temporaryClosingDates.map((e) => ({
    start_date: e.startDate,
    end_date: e.endDate,
  }))

  return {
    business_hours,
    break_times,
    is_closed_in_holiday: state.isClosedInHoliday,
    regular_closing_dates,
    temporary_closing_dates,
  }
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 요일 선택 모달
// ─────────────────────────────────────────────
interface DaySelectModalProps {
  open: boolean
  selected: string[]
  disabledDays?: string[]
  onConfirm: (days: string[]) => void
  onCancel: () => void
}

function DaySelectModal({ open, selected, disabledDays = [], onConfirm, onCancel }: DaySelectModalProps) {
  const [local, setLocal] = useState<string[]>(selected)

  function toggle(day: string) {
    if (disabledDays.includes(day)) return
    setLocal(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function selectGroup(group: string[]) {
    const available = group.filter(d => !disabledDays.includes(d))
    const allSelected = available.every(d => local.includes(d))
    if (allSelected) {
      setLocal(prev => prev.filter(d => !available.includes(d)))
    } else {
      setLocal(prev => Array.from(new Set([...prev, ...available])))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="w-[300px] max-w-[300px] p-5" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-sm">요일 선택</DialogTitle>
          <DialogDescription className="sr-only">영업시간 또는 휴게시간 요일을 선택하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* 평일 */}
          <div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mb-1.5 h-auto p-0 text-xs"
              onClick={() => selectGroup(WEEKDAYS)}
            >
              평일 전체선택
            </Button>
            <div className="flex gap-1.5">
              {WEEKDAYS.map(day => (
                <Button
                  key={day}
                  type="button"
                  disabled={disabledDays.includes(day)}
                  onClick={() => toggle(day)}
                  className={`w-9 h-9 p-0 typo-body3 weight-500 ${local.includes(day) ? 'bg-key-blue hover:bg-key-blue/90 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                  variant="ghost"
                >
                  {DAY_LABELS[day]}
                </Button>
              ))}
            </div>
          </div>

          {/* 주말 */}
          <div>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mb-1.5 h-auto p-0 text-xs"
              onClick={() => selectGroup(WEEKENDS)}
            >
              주말 전체선택
            </Button>
            <div className="flex gap-1.5">
              {WEEKENDS.map(day => (
                <Button
                  key={day}
                  type="button"
                  disabled={disabledDays.includes(day)}
                  onClick={() => toggle(day)}
                  className={`w-9 h-9 p-0 typo-body3 weight-500 ${local.includes(day) ? 'bg-key-blue hover:bg-key-blue/90 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                  variant="ghost"
                >
                  {DAY_LABELS[day]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
          <Button size="sm" onClick={() => onConfirm(local)}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 정기 휴무 주기 선택 모달
// 레거시: RegularHolidaySelectModal.vue 포팅
// weeks(복수선택) + days(복수선택), 매주 버튼 별도
// ─────────────────────────────────────────────
// 주차 상수: 인덱스 0=첫째주~4=다섯째주 (API 그대로)
const WEEK_ITEMS = ['첫째 주', '둘째 주', '셋째 주', '넷째 주', '다섯째 주'] as const

interface RegularHolidaySelectModalProps {
  open: boolean
  current: RegularClosingDate
  existingDates: RegularClosingDate[]
  onConfirm: (date: RegularClosingDate) => void
  onCancel: () => void
}

function RegularHolidaySelectModal({
  open,
  current,
  existingDates,
  onConfirm,
  onCancel,
}: RegularHolidaySelectModalProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>(current.weeks)
  const [selectedDays, setSelectedDays] = useState<number[]>(current.days)
  const [isEveryWeek, setIsEveryWeek] = useState(current.weeks.length === WEEK_ITEMS.length)

  // 다른 항목과 주+요일이 겹치는지 확인 (disabled 로직)
  function isWeekDisabled(weekIdx: number): boolean {
    return existingDates.some(e =>
      e.weeks.includes(weekIdx) &&
      e.days.some(d => selectedDays.includes(d))
    )
  }
  function isDayDisabled(dayIdx: number): boolean {
    return existingDates.some(e =>
      e.days.includes(dayIdx) &&
      e.weeks.some(w => selectedWeeks.includes(w))
    )
  }

  function toggleWeek(weekIdx: number) {
    if (isWeekDisabled(weekIdx)) return
    setSelectedWeeks(prev =>
      prev.includes(weekIdx) ? prev.filter(w => w !== weekIdx) : [...prev, weekIdx]
    )
    setIsEveryWeek(false)
  }

  function toggleDay(dayIdx: number) {
    if (isDayDisabled(dayIdx)) return
    setSelectedDays(prev =>
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]
    )
  }

  function handleEveryWeekClick() {
    const next = !isEveryWeek
    setIsEveryWeek(next)
    // 매주: 0~4 모두 선택
    setSelectedWeeks(next ? [0, 1, 2, 3, 4] : [])
  }

  // 매주 disabled: 다른 항목이 있어서 어떤 주차가 막혀 있으면 disabled
  const isEveryWeekDisabled = WEEK_ITEMS.some((_, i) => isWeekDisabled(i))

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="w-[320px] max-w-[320px] p-5" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-sm">정기 휴무 설정</DialogTitle>
          <DialogDescription className="sr-only">정기 휴무 주차와 요일을 선택하세요.</DialogDescription>
        </DialogHeader>

        {/* 주차 선택 (2열 그리드 + 매주 버튼) */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            disabled={isEveryWeekDisabled}
            onClick={handleEveryWeekClick}
            className={`col-span-2 h-9 typo-body3 weight-500 ${isEveryWeek ? 'bg-key-blue hover:bg-key-blue/90 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            variant="ghost"
          >
            매주
          </Button>
          {WEEK_ITEMS.map((label, idx) => (
            <Button
              key={idx}
              type="button"
              disabled={isWeekDisabled(idx)}
              onClick={() => toggleWeek(idx)}
              className={`h-9 typo-body3 weight-500 ${selectedWeeks.includes(idx) && !isEveryWeek ? 'bg-key-blue hover:bg-key-blue/90 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
              variant="ghost"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* 요일 선택 */}
        <div className="flex gap-1">
          {DAY_KEYS.map((key, idx) => (
            <Button
              key={key}
              type="button"
              disabled={isDayDisabled(idx)}
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 p-0 typo-body3 weight-500 ${selectedDays.includes(idx) ? 'bg-key-blue hover:bg-key-blue/90 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
              variant="ghost"
            >
              {DAY_LABELS[key]}
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
          <Button
            size="sm"
            disabled={selectedWeeks.length === 0 || selectedDays.length === 0}
            onClick={() => onConfirm({ weeks: selectedWeeks, days: selectedDays })}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// 섹션 헤더 (섹션명 + 초기화 버튼)
// ─────────────────────────────────────────────
function SectionHeader({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="typo-body3 weight-600 text-foreground">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-neutral-400 hover:text-neutral-600"
        title="초기화"
        onClick={onReset}
      >
        <RotateCcw size={14} />
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인 다이얼로그
// ─────────────────────────────────────────────
interface BranchOpeningHoursDialogProps {
  storeId: string
  open: boolean
  onClose: () => void
}

export function BranchOpeningHoursDialog({ storeId, open, onClose }: BranchOpeningHoursDialogProps) {
  const { data: rawData } = useBranchOpeningHours(storeId)
  const { mutateAsync: updateHours, isPending } = useUpdateBranchOpeningHours(storeId)

  // ── 내부 상태 ──
  const [businessHours, setBusinessHours] = useState<BusinessHourEntry[]>([])
  const [breakTimes, setBreakTimes] = useState<BreakTimeEntry[]>([])
  const [isClosedInHoliday, setIsClosedInHoliday] = useState(false)
  const [regularClosingDates, setRegularClosingDates] = useState<RegularClosingDate[]>([])
  const [temporaryClosingDates, setTemporaryClosingDates] = useState<TemporaryClosingDate[]>([])

  // 모달 상태
  const [dayModal, setDayModal] = useState<{
    open: boolean
    type: 'business' | 'break'
    index: number
    disabledDays: string[]
  }>({ open: false, type: 'business', index: 0, disabledDays: [] })

  const [regularModal, setRegularModal] = useState<{
    open: boolean
    index: number
  }>({ open: false, index: -1 })

  // 임시휴무 달력 popover 상태
  const [calendarOpenIndex, setCalendarOpenIndex] = useState<number | null>(null)
  const dayModalKey = useDialogKey(dayModal.open, `day-${dayModal.type}-${dayModal.index}`)
  const regularModalKey = useDialogKey(regularModal.open, `regular-${regularModal.index}`)

  // ── 초기값 로드 ──
  const initialSnapshotRef = useRef('')

  const initState = useCallback(() => {
    if (!rawData) return
    const parsed = fromApiData(rawData as ApiOpeningHours)
    setBusinessHours(parsed.businessHours)
    setBreakTimes(parsed.breakTimes)
    setIsClosedInHoliday(parsed.isClosedInHoliday)
    setRegularClosingDates(parsed.regularClosingDates)
    setTemporaryClosingDates(parsed.temporaryClosingDates)
    initialSnapshotRef.current = JSON.stringify(toApiPayload(parsed))
  }, [rawData])

  useEffect(() => {
    if (open) initState()
  }, [open, initState])

  // 변경 여부 판단
  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false
    const current = JSON.stringify(toApiPayload({
      businessHours, breakTimes, isClosedInHoliday, regularClosingDates, temporaryClosingDates,
    }))
    return current !== initialSnapshotRef.current
  }, [businessHours, breakTimes, isClosedInHoliday, regularClosingDates, temporaryClosingDates])

  // ── 저장 ──
  async function handleSave() {
    const payload = toApiPayload({
      businessHours,
      breakTimes,
      isClosedInHoliday,
      regularClosingDates,
      temporaryClosingDates,
    })
    try {
      await updateHours(payload as Parameters<typeof updateHours>[0])
      toast.success('영업 정보가 저장되었습니다.')
      onClose()
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? '저장에 실패했습니다.'
      toast.error(msg)
    }
  }

  // ── 영업시간 조작 ──
  function openDayModal(type: 'business' | 'break', index: number) {
    const entries = type === 'business' ? businessHours : breakTimes
    const otherEntries = entries.filter((_, i) => i !== index)
    const disabledDays = otherEntries.flatMap(e => e.days)
    setDayModal({ open: true, type, index, disabledDays })
  }

  function updateBusinessHour(index: number, patch: Partial<BusinessHourEntry>) {
    setBusinessHours(prev => prev.map((e, i) => i === index ? { ...e, ...patch } : e))
  }

  function removeBusinessHour(index: number) {
    setBusinessHours(prev => prev.filter((_, i) => i !== index))
  }

  function addBusinessHour() {
    setBusinessHours(prev => [...prev, {
      days: [],
      startTime: { hour: '00', minute: '00' },
      endTime: { hour: '01', minute: '00' },
      is24Hours: false,
    }])
  }

  // ── 휴게시간 조작 ──
  function updateBreakTime(index: number, patch: Partial<BreakTimeEntry>) {
    setBreakTimes(prev => prev.map((e, i) => i === index ? { ...e, ...patch } : e))
  }

  function removeBreakTime(index: number) {
    setBreakTimes(prev => prev.filter((_, i) => i !== index))
  }

  function addBreakTime() {
    setBreakTimes(prev => [...prev, {
      days: [],
      startTime: { hour: '00', minute: '00' },
      endTime: { hour: '01', minute: '00' },
    }])
  }

  // ── 정기휴무 조작 ──
  function openRegularModal(index: number) {
    setRegularModal({ open: true, index })
  }

  function removeRegularClosing(index: number) {
    setRegularClosingDates(prev => prev.filter((_, i) => i !== index))
  }

  function addRegularClosing() {
    setRegularClosingDates(prev => [...prev, { weeks: [], days: [] }])
    setRegularModal({ open: true, index: regularClosingDates.length })
  }

  // ── 임시휴무 조작 ──
  function removeTemporaryClosing(index: number) {
    setTemporaryClosingDates(prev => prev.filter((_, i) => i !== index))
  }

  function addTemporaryClosing() {
    const today = format(new Date(), 'yyyy-MM-dd')
    setTemporaryClosingDates(prev => [...prev, { startDate: today, endDate: today }])
    setCalendarOpenIndex(temporaryClosingDates.length)
  }

  function updateTemporaryClosing(index: number, range: DateRange | undefined) {
    if (!range?.from) return
    const startDate = format(range.from, 'yyyy-MM-dd')
    const endDate = range.to ? format(range.to, 'yyyy-MM-dd') : startDate
    setTemporaryClosingDates(prev =>
      prev.map((e, i) => i === index ? { startDate, endDate } : e)
    )
  }

  // ── 정기휴무 레이블 (weeks[]+days[] → 텍스트) ──
  // 매주: 모든 주차(0~4) 선택 시 "매주"로 표시
  function getRegularLabel(date: RegularClosingDate): string {
    let weekLabel: string
    if (date.weeks.length === WEEK_ITEMS.length) {
      weekLabel = '매주'
    } else {
      weekLabel = date.weeks.map(w => WEEK_ITEMS[w] ?? `${w + 1}째 주`).join(', ')
    }
    const dayLabel = date.days.map(d => DAY_LABELS[DAY_KEYS[d] ?? ''] ?? `${d}`).join(', ')
    return date.weeks.length === 0 || date.days.length === 0
      ? '(미설정)'
      : `${weekLabel} ${dayLabel}`
  }

  // ── 현재 정기휴무 모달 데이터 ──
  const currentRegular: RegularClosingDate =
    regularModal.index >= 0 && regularModal.index < regularClosingDates.length
      ? regularClosingDates[regularModal.index]
      : { weeks: [], days: [] }

  const existingRegularDates = regularClosingDates.filter((_, i) => i !== regularModal.index)

  // ── 현재 요일 모달 데이터 ──
  const currentDayModalSelected =
    dayModal.type === 'business'
      ? (businessHours[dayModal.index]?.days ?? [])
      : (breakTimes[dayModal.index]?.days ?? [])

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v && !isPending) onClose() }}>
        <DialogContent
          className="w-[480px] max-w-[480px] flex flex-col max-h-[90vh] p-0 gap-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <LoadingOverlay show={isPending} />
          <DialogHeader className="p-4 shrink-0">
            <DialogTitle className="text-base">영업 정보 설정</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-8">

            {/* ── 영업 시간 ── */}
            <section>
              <SectionHeader
                label="영업 시간"
                onReset={() => {
                  const parsed = fromApiData(rawData as ApiOpeningHours ?? {})
                  setBusinessHours(parsed.businessHours)
                }}
              />
              <Card className="bg-muted border-0 shadow-none p-4 gap-3">
                {businessHours.map((entry, idx) => (
                  <BusinessHourRow
                    key={idx}
                    entry={entry}
                    isFirst={idx === 0}
                    onDayClick={() => openDayModal('business', idx)}
                    onUpdate={(patch) => updateBusinessHour(idx, patch)}
                    onRemove={() => removeBusinessHour(idx)}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" className="w-[10rem] mx-auto block" onClick={addBusinessHour}>
                  +추가
                </Button>
              </Card>
            </section>

            {/* ── 휴게 시간 ── */}
            <section>
              <SectionHeader
                label="휴게 시간"
                onReset={() => {
                  const parsed = fromApiData(rawData as ApiOpeningHours ?? {})
                  setBreakTimes(parsed.breakTimes)
                }}
              />
              <Card className="bg-muted border-0 shadow-none p-4 gap-3">
                {breakTimes.map((entry, idx) => (
                  <BreakTimeRow
                    key={idx}
                    entry={entry}
                    onDayClick={() => openDayModal('break', idx)}
                    onUpdate={(patch) => updateBreakTime(idx, patch)}
                    onRemove={() => removeBreakTime(idx)}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" className="w-[10rem] mx-auto block" onClick={addBreakTime}>
                  +추가
                </Button>
              </Card>
            </section>

            {/* ── 공휴일 ── */}
            <section>
              <SectionHeader
                label="공휴일"
                onReset={() => {
                  const parsed = fromApiData(rawData as ApiOpeningHours ?? {})
                  setIsClosedInHoliday(parsed.isClosedInHoliday)
                }}
              />
              <Card className="bg-muted border-0 shadow-none flex-row gap-3 p-4">
                <Button
                  type="button"
                  size="sm"
                  variant={isClosedInHoliday ? 'default' : 'outline'}
                  onClick={() => setIsClosedInHoliday(true)}
                  className="w-20"
                >
                  휴무
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!isClosedInHoliday ? 'default' : 'outline'}
                  onClick={() => setIsClosedInHoliday(false)}
                  className="w-20"
                >
                  휴무없음
                </Button>
              </Card>
            </section>

            {/* ── 정기 휴무 ── */}
            <section>
              <SectionHeader
                label="정기 휴무"
                onReset={() => {
                  const parsed = fromApiData(rawData as ApiOpeningHours ?? {})
                  setRegularClosingDates(parsed.regularClosingDates)
                }}
              />
              <Card className="bg-muted border-0 shadow-none p-4 gap-3">
                {regularClosingDates.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-neutral-400 hover:text-status-destructive"
                      onClick={() => removeRegularClosing(idx)}
                    >
                      <X size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 justify-start h-auto p-0 typo-body3 text-muted-foreground weight-400"
                      onClick={() => openRegularModal(idx)}
                    >
                      {getRegularLabel(date)}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-neutral-400 text-xs"
                      onClick={() => openRegularModal(idx)}
                    >
                      ▼
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={addRegularClosing}>
                  +추가
                </Button>
              </Card>
            </section>

            {/* ── 임시 휴무 ── */}
            <section>
              <SectionHeader
                label="임시 휴무"
                onReset={() => {
                  const parsed = fromApiData(rawData as ApiOpeningHours ?? {})
                  setTemporaryClosingDates(parsed.temporaryClosingDates)
                }}
              />
              <Card className="bg-muted border-0 shadow-none p-4 gap-3">
                {temporaryClosingDates.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-neutral-400 hover:text-status-destructive"
                      onClick={() => removeTemporaryClosing(idx)}
                    >
                      <X size={14} />
                    </Button>
                    <Popover
                      open={calendarOpenIndex === idx}
                      onOpenChange={(v) => setCalendarOpenIndex(v ? idx : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1 justify-start h-auto p-0 typo-body3 text-muted-foreground weight-400"
                        >
                          {date.startDate
                            ? `${date.startDate.replace(/-/g, '/')} ~ ${date.endDate.replace(/-/g, '/')}`
                            : '날짜 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="range"
                          locale={ko}
                          selected={
                            date.startDate
                              ? {
                                  from: new Date(date.startDate),
                                  to: date.endDate ? new Date(date.endDate) : undefined,
                                }
                              : undefined
                          }
                          onSelect={(range) => updateTemporaryClosing(idx, range)}
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                        <div className="flex justify-end gap-2 p-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => setCalendarOpenIndex(null)}>취소</Button>
                          <Button size="sm" onClick={() => setCalendarOpenIndex(null)}>확인</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-neutral-400"
                      onClick={() => setCalendarOpenIndex(calendarOpenIndex === idx ? null : idx)}
                    >
                      <CalendarIcon size={16} />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={addTemporaryClosing}>
                  +추가
                </Button>
              </Card>
            </section>

          </div>

          <DialogFooter className="flex-row p-4 shrink-0 gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isPending || !isDirty}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요일 선택 모달 */}
      <DaySelectModal
        key={dayModalKey}
        open={dayModal.open}
        selected={currentDayModalSelected}
        disabledDays={dayModal.disabledDays}
        onConfirm={(days) => {
          if (dayModal.type === 'business') {
            updateBusinessHour(dayModal.index, { days })
          } else {
            updateBreakTime(dayModal.index, { days })
          }
          setDayModal(prev => ({ ...prev, open: false }))
        }}
        onCancel={() => setDayModal(prev => ({ ...prev, open: false }))}
      />

      {/* 정기 휴무 주기 선택 모달 */}
      <RegularHolidaySelectModal
        key={regularModalKey}
        open={regularModal.open}
        current={currentRegular}
        existingDates={existingRegularDates}
        onConfirm={(date) => {
          setRegularClosingDates(prev =>
            prev.map((e, i) => i === regularModal.index ? date : e)
          )
          setRegularModal(prev => ({ ...prev, open: false }))
        }}
        onCancel={() => setRegularModal(prev => ({ ...prev, open: false }))}
      />
    </>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 영업시간 Row
// ─────────────────────────────────────────────
interface BusinessHourRowProps {
  entry: BusinessHourEntry
  isFirst: boolean
  onDayClick: () => void
  onUpdate: (patch: Partial<BusinessHourEntry>) => void
  onRemove: () => void
}

function BusinessHourRow({ entry, isFirst, onDayClick, onUpdate, onRemove }: BusinessHourRowProps) {
  const endHourOptions = getEndHourOptions(entry.startTime.hour)

  return (
    <div className="w-[300px] mx-auto space-y-2">
      {/* 요일 + 추가/삭제 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-between"
          onClick={onDayClick}
        >
          <span className="flex-1 text-left">
            {entry.days.length > 0 ? getDayText(entry.days) : '요일 선택'}
          </span>
          <span className="text-neutral-400 text-xs">▼</span>
        </Button>
        {!isFirst && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-neutral-400 hover:text-status-destructive"
            onClick={onRemove}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* 시간 — is24Hours이면 00:00~00:00 고정 & disabled */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">시작 시</span>
          <Select
            value={entry.startTime.hour}
            onValueChange={(v) => onUpdate({ startTime: { ...entry.startTime, hour: v } })}
            disabled={entry.is24Hours}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">시작 분</span>
          <Select
            value={entry.startTime.minute}
            onValueChange={(v) => onUpdate({ startTime: { ...entry.startTime, minute: v } })}
            disabled={entry.is24Hours}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTE_OPTIONS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">종료 시</span>
          <Select
            value={entry.endTime.hour}
            onValueChange={(v) => onUpdate({ endTime: { ...entry.endTime, hour: v } })}
            disabled={entry.is24Hours}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(entry.is24Hours ? HOUR_OPTIONS : endHourOptions).map(opt =>
                typeof opt === 'string'
                  ? <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  : <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">종료 분</span>
          <Select
            value={entry.endTime.minute}
            onValueChange={(v) => onUpdate({ endTime: { ...entry.endTime, minute: v } })}
            disabled={entry.is24Hours}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTE_OPTIONS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 하루 종일 — 토글 시 시간 00:00~00:00 고정, 해제 시 00:00~01:00 복원 */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none justify-end"
        onClick={() => {
          const next = !entry.is24Hours
          onUpdate({
            is24Hours: next,
            startTime: { hour: '00', minute: '00' },
            endTime: { hour: next ? '00' : '01', minute: '00' },
          })
        }}
      >
        <div
          className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5
            ${entry.is24Hours ? 'bg-key-blue' : 'bg-border'}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-background shadow transition-transform
              ${entry.is24Hours ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </div>
        <span className="text-sm text-muted-foreground">하루 종일</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 휴게시간 Row (하루종일 없음)
// ─────────────────────────────────────────────
interface BreakTimeRowProps {
  entry: BreakTimeEntry
  onDayClick: () => void
  onUpdate: (patch: Partial<BreakTimeEntry>) => void
  onRemove: () => void
}

function BreakTimeRow({ entry, onDayClick, onUpdate, onRemove }: BreakTimeRowProps) {
  const endHourOptions = getEndHourOptions(entry.startTime.hour)

  return (
    <div className="w-[300px] mx-auto space-y-2">
      {/* 레거시: [X] [요일▼] [+] 순서 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 flex items-center justify-between"
          onClick={onDayClick}
        >
          <span className="flex-1 text-left">
            {entry.days.length > 0 ? getDayText(entry.days) : '요일 선택'}
          </span>
          <span className="text-neutral-400 text-xs">▼</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-neutral-400 hover:text-status-destructive"
          onClick={onRemove}
        >
          <X size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">시작 시</span>
          <Select
            value={entry.startTime.hour}
            onValueChange={(v) => onUpdate({ startTime: { ...entry.startTime, hour: v } })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">시작 분</span>
          <Select
            value={entry.startTime.minute}
            onValueChange={(v) => onUpdate({ startTime: { ...entry.startTime, minute: v } })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MINUTE_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">종료 시</span>
          <Select
            value={entry.endTime.hour}
            onValueChange={(v) => onUpdate({ endTime: { ...entry.endTime, hour: v } })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {endHourOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">종료 분</span>
          <Select
            value={entry.endTime.minute}
            onValueChange={(v) => onUpdate({ endTime: { ...entry.endTime, minute: v } })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MINUTE_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
