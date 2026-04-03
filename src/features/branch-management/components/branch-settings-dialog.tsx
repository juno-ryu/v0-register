import { useState } from 'react'
import { toast } from 'sonner'
import { BaseDialog } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore, selectIsManagementAccount } from '@/store/useAuthStore'
import { useBrandList } from '@/hooks/useCommonQueries'
import { useUpdateBranchGeneralInfo } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import type { BranchDetail } from '@/features/branch-management/schema'

interface BranchSettingsDialogProps {
  storeId: string
  detail: BranchDetail
  open: boolean
  onClose: () => void
}

export function BranchSettingsDialog({
  storeId,
  detail,
  open,
  onClose,
}: BranchSettingsDialogProps) {
  const isManagement = useAuthStore(selectIsManagementAccount)
  // useBrandList는 results 배열을 직접 반환 (BrandItem[])
  const { data: brandOptions = [] } = useBrandList(isManagement)
  const { mutateAsync: updateGeneralInfo, isPending } = useUpdateBranchGeneralInfo(storeId)

  const [name, setName] = useState(detail.name ?? '')
  const [brandId, setBrandId] = useState<string>(String(detail.brand?.id ?? ''))
  const [phoneNumber, setPhoneNumber] = useState(detail.phone_number ?? '')
  const [fullAddress, setFullAddress] = useState(detail.full_address ?? '')
  const [status, setStatus] = useState<'active' | 'inactive'>(detail.is_active ? 'active' : 'inactive')
  const [businessName, setBusinessName] = useState(detail.business_name ?? '')
  const [registrationNumber, setRegistrationNumber] = useState(detail.registration_number ?? '')
  const [representativeName, setRepresentativeName] = useState(detail.representative_name ?? '')
  const [nameError, setNameError] = useState('')

  async function handleSave() {
    if (!name.trim()) {
      setNameError('매장명을 입력해 주세요.')
      return
    }
    setNameError('')

    try {
      await updateGeneralInfo({
        name: name.trim(),
        phone_number: phoneNumber || null,
        full_address: fullAddress || null,
        is_active: status === 'active',
        business_name: businessName || null,
        registration_number: registrationNumber || null,
        representative_name: representativeName || null,
      })
      toast.success('매장 정보가 수정되었습니다.')
      onClose()
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? '매장 정보 수정에 실패했습니다.'
      toast.error(msg)
    }
  }

  return (
    <BaseDialog
      open={open}
      onClose={() => { if (!isPending) onClose() }}
      title="매장 정보 수정"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isPending}>
            {isPending ? '저장 중...' : '수정 완료'}
          </Button>
        </>
      }
    >
      <LoadingOverlay show={isPending} />
      <div className="p-4 space-y-4">
          {/* 매장명 */}
          <div className="space-y-1.5">
            <Label>
              매장명 <span className="text-status-destructive typo-micro1">(필수)</span>
            </Label>
            <Input
              placeholder="매장명 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <p className="typo-micro1 text-status-destructive">{nameError}</p>}
          </div>

          {/* 브랜드 */}
          <div className="space-y-1.5">
            <Label>
              브랜드 <span className="text-status-destructive typo-micro1">(필수)</span>
            </Label>
            <Select
              value={brandId}
              onValueChange={setBrandId}
              disabled={!isManagement}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="브랜드 선택" />
              </SelectTrigger>
              <SelectContent>
                {/* 운영사 계정: API에서 가져온 전체 브랜드 목록 / 그 외: 현재 매장의 브랜드만 표시 */}
                {isManagement
                  ? brandOptions.map((brand) => (
                      <SelectItem key={brand.id} value={String(brand.id)}>
                        {brand.name}
                      </SelectItem>
                    ))
                  : detail.brand && (
                      <SelectItem value={String(detail.brand.id)}>
                        {detail.brand.name}
                      </SelectItem>
                    )
                }
              </SelectContent>
            </Select>
          </div>

          {/* 전화번호 */}
          <div className="space-y-1.5">
            <Label>전화번호</Label>
            <Input
              placeholder="전화번호 입력"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* 주소 */}
          <div className="space-y-1.5">
            <Label>주소</Label>
            <Input
              placeholder="주소 입력"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
            />
          </div>

          {/* 상태 */}
          <div className="space-y-1.5">
            <Label>상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'inactive')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">운영 중</SelectItem>
                <SelectItem value="inactive">운영 중단</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 상호/법인명 */}
          <div className="space-y-1.5">
            <Label>상호/법인명</Label>
            <Input
              placeholder="상호/법인명 입력"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          {/* 사업자등록번호 */}
          <div className="space-y-1.5">
            <Label>사업자등록번호</Label>
            <Input
              placeholder="123-45-67890"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>

          {/* 대표자 */}
          <div className="space-y-1.5">
            <Label>대표자</Label>
            <Input
              placeholder="대표자 입력"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
            />
          </div>
      </div>
    </BaseDialog>
  )
}
