// 레거시 utils/copyToClipBoard.js 포팅
import { toast } from 'sonner'

/**
 * 클립보드에 텍스트 복사 + 토스트 표시
 * @param text 복사할 텍스트
 * @param fieldName 토스트에 표시할 필드명 (없으면 기본 메시지)
 * @returns 복사 성공 여부
 */
export const copyToClipboard = async (text: string, fieldName?: string): Promise<boolean> => {
  const message = fieldName ? `${fieldName}이(가) 복사되었습니다.` : '복사되었습니다.'
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message)
    return true
  } catch {
    // 구형 브라우저 fallback
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (successful) toast.success(message)
      return successful
    } catch {
      return false
    }
  }
}
