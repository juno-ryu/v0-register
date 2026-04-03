import { useState } from 'react'
import { toast } from 'sonner'
import { BaseDialog } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpsertBranchAdministrator } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { BranchDetail } from '@/features/branch-management/schema'

interface BranchAccountDialogProps {
  storeId: string
  detail: BranchDetail
  open: boolean
  onClose: () => void
}

export function BranchAccountDialog({
  storeId,
  detail,
  open,
  onClose,
}: BranchAccountDialogProps) {
  const { mutateAsync: upsertAdministrator, isPending } = useUpsertBranchAdministrator(storeId)

  const [username, setUsername] = useState(detail.administrator_username ?? '')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  async function handleSave() {
    let isValid = true

    if (!username.trim()) {
      setUsernameError('로그인 ID를 입력해 주세요.')
      isValid = false
    } else {
      setUsernameError('')
    }

    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해 주세요.')
      isValid = false
    } else {
      setPasswordError('')
    }

    if (!isValid) return

    try {
      await upsertAdministrator({ username: username.trim(), password: password.trim() })
      toast.success('로그인 계정이 설정되었습니다.')
      onClose()
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? '로그인 계정 설정에 실패했습니다.'
      toast.error(msg)
    }
  }

  return (
    <BaseDialog
      open={open}
      onClose={() => { if (!isPending) onClose() }}
      title="로그인 계정 설정"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isPending}>
            {isPending ? '저장 중...' : '설정 완료'}
          </Button>
        </>
      }
    >
      <LoadingOverlay show={isPending} />
      <div className="p-4 space-y-4">
          {/* 로그인 ID */}
          <div className="space-y-1.5">
            <Label>
              로그인 ID <span className="text-status-destructive typo-micro1">(필수)</span>
            </Label>
            <Input
              placeholder="로그인 ID 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {usernameError && <p className="typo-micro1 text-status-destructive">{usernameError}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label>
              로그인 비밀번호 <span className="text-status-destructive typo-micro1">(필수)</span>
            </Label>
            <Input
              type="password"
              placeholder="로그인 비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && <p className="typo-micro1 text-status-destructive">{passwordError}</p>}
          </div>
      </div>
    </BaseDialog>
  )
}
