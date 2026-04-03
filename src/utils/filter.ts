/**
 * 체크박스 멀티셀렉트 토글 — 'all' 옵션 포함
 *
 * 'all' 선택 시: ['all']로 초기화
 * 일반 값 선택 시: 'all' 제거 후 토글, 빈 배열이 되면 ['all']로 복귀
 */
export function toggleMultiSelect(prev: string[], value: string): string[] {
  if (value === 'all') return ['all']

  const withoutAll = prev.filter((v) => v !== 'all')
  if (withoutAll.includes(value)) {
    const next = withoutAll.filter((v) => v !== value)
    return next.length === 0 ? ['all'] : next
  }
  return [...withoutAll, value]
}
