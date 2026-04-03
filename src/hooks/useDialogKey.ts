import { useId } from 'react'

/**
 * Dialog key reset 패턴 — 열림/닫힘 시 컴포넌트 remount를 강제하는 key 생성
 * 기존 useId() + key={`${id}-${open ? identifier : 'closed'}`} 패턴 통합
 */
export function useDialogKey(isOpen: boolean, identifier?: string | number | null) {
  const id = useId()
  return `${id}-${isOpen ? (identifier ?? 'open') : 'closed'}`
}
