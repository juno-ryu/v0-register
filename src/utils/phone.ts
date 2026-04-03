// 레거시 utils/formatPhoneNumber.js 포팅

/**
 * 전화번호를 표시용 포맷으로 변환
 * - +82 국가코드 제거
 * - 010-1234-5678 형태로 변환
 */
const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber) return '-'
  const formatted = phoneNumber.replace('+82', '')
  const withLeadingZero = formatted.startsWith('0') ? formatted : `0${formatted}`
  return withLeadingZero.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}

export default formatPhoneNumber
