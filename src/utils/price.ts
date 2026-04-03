// 레거시 utils/priceFormat.js 포팅

/**
 * 숫자를 천 단위 콤마 포맷으로 변환
 * 레거시 priceFormat과 동일
 */
export const priceFormat = (price: number | string | null | undefined): string => {
  if (price == null) return '0'
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 숫자를 원화 포맷으로 변환 (예: 1,234 원)
 * 레거시 priceFormatWithCurrency와 동일
 */
export const priceFormatWithCurrency = (
  price: number | null | undefined,
  currency = 'KRW',
  locale = 'kr-KR',
): string => {
  const truncated = Math.trunc(price ?? 0)
  if (isNaN(truncated) || truncated === -1) return '-'

  if (currency === 'KRW') {
    return priceFormat(truncated) + ' 원'
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(truncated)
}
