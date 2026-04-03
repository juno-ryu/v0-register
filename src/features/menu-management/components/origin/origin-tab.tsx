import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  useOrigins,
  useUpdateOrigins,
  useSyncMenu,
} from '@/features/menu-management/queries'
import { axiosInstance } from '@/lib/axios'
import { PageLayout } from '@/components/layout/page-layout'

const MAX_LENGTH = 20000

// isDidOnly 판단용 (category-tab, option-tab 동일 패턴)
function useStorePosType(storeId: string | null) {
  return useQuery({
    queryKey: ['store-detail-pos', storeId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ pos?: string | null }>(
        `/v1/b/management/stores/${storeId}`,
      )
      return data.pos ?? null
    },
    enabled: !!storeId,
  })
}

interface OriginTabProps {
  storeId: string | null
}

export function OriginTab({ storeId }: OriginTabProps) {
  const { data: posType } = useStorePosType(storeId)
  const isDidOnly = posType === 'did_only'
  const { data: fetchedOrigins = '' } = useOrigins(storeId)
  const updateOriginsMutation = useUpdateOrigins(storeId)
  const syncMenuMutation = useSyncMenu(storeId)

  const [text, setText] = useState('')

  // 서버 데이터 로드 시 textarea 초기화
  useEffect(() => {
    setText(fetchedOrigins)
  }, [fetchedOrigins])

  // 변경 여부 (레거시 isStorable)
  const isChanged = text !== fetchedOrigins

  const handleSave = async () => {
    try {
      await updateOriginsMutation.mutateAsync(text)
      toast.success('원산지 정보가 저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const handleReset = () => {
    setText(fetchedOrigins)
  }

  const handleSyncMenu = async () => {
    try {
      await syncMenuMutation.mutateAsync()
      toast.success('포스 동기화가 완료되었습니다.')
    } catch {
      toast.error('포스 동기화에 실패했습니다.')
    }
  }

  return (
    <PageLayout>
      {/* 헤더 */}
      <p className="typo-body3 mb-3">
        원산지 표기는 &lt;농산물의 원산지 표시에 관한 법률&gt; 에 의한 필수
        사항입니다.
      </p>

      {/* 버튼 행 */}
      <div className="flex items-center justify-between mb-3">
        {/* 왼쪽: 수정 + 수정 취소 */}
        <div className="flex items-center gap-3">
          <Button
            disabled={!isChanged || updateOriginsMutation.isPending}
            onClick={handleSave}
          >
            수정
          </Button>
          {isChanged && (
            <Button
              variant="outline"
              className="text-status-destructive border-status-destructive/40 hover:bg-status-destructive hover:text-white"
              onClick={handleReset}
            >
              수정 취소
            </Button>
          )}
        </div>

        {/* 오른쪽: 포스 동기화 (DID_ONLY 아닌 매장만) */}
        {!isDidOnly && (
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={handleSyncMenu}
            disabled={syncMenuMutation.isPending}
          >
            <RefreshCw size={16} />
            포스 동기화
          </Button>
        )}
      </div>

      {/* Textarea */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="예) 쌀(국내산), 닭고기(국내산), 김치(중국산)"
        className="min-h-[200px] resize-y"
        maxLength={MAX_LENGTH}
      />

      {/* 글자 수 카운터 */}
      <div className="flex items-center justify-end mt-1 gap-4">
        {!text && (
          <span className="typo-body3 text-status-destructive weight-700">
            원산지를 입력해 주세요
          </span>
        )}
        <span className="typo-body3 text-neutral-400">
          {text.length} / {MAX_LENGTH.toLocaleString()}
        </span>
      </div>
    </PageLayout>
  )
}
