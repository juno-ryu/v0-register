import { format } from 'date-fns'

// 레거시 utils/dateTimeHelpers.js 포팅 (핵심 함수만)

/**
 * 날짜를 지정된 포맷으로 변환
 * 레거시 formatDate와 동일
 */
export const formatDate = (date: string | Date | null | undefined, dateFormat = 'yyyy. MM. dd'): string => {
  if (!date) return ''
  return format(new Date(date), dateFormat)
}

/**
 * 요일 인덱스 배열을 텍스트로 변환
 * 레거시 getDayText와 동일
 * @param selectedDays - 0: 월, 1: 화, ..., 6: 일
 */
export const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const

export const getDayText = (selectedDays: number[]): string => {
  if (selectedDays.length === 7) return '매일'
  const text = selectedDays.map((day) => DAYS[day]).join(', ')
  return text.replace('월, 화, 수, 목, 금', '평일').replace('토, 일', '주말')
}
