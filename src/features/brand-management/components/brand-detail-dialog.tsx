import { Copy } from 'lucide-react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { copyToClipboard } from '@/utils/clipboard'
import type { BrandDetail } from '@/features/brand-management/schema'

interface BrandDetailDialogProps {
  open: boolean
  brandDetail: BrandDetail | null
  onClose: () => void
  onEdit: () => void
}

const SERVICE_TYPE_LABEL: Record<string, string> = {
  platform: '일반',
  hotel: '호텔/리조트',
}

function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').slice(0, 19).replace(/-/g, '/')
}

function StatusChip({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 typo-body3 ${active ? 'text-status-positive' : 'text-neutral-400'}`}>
      <span className={`block h-1.5 w-1.5 rounded-full ${active ? 'bg-status-positive' : 'bg-neutral-400'}`} />
      {active ? '이용 중' : '이용 안함'}
    </span>
  )
}

function ImagePreview({ label, url }: { label: string; url: string | null | undefined }) {
  return (
    <BaseRow label={label}>
      {url ? (
        <img
          src={url}
          alt={label}
          className="w-[100px] h-[100px] rounded-lg object-contain bg-muted p-3"
        />
      ) : (
        <span className="typo-body3 text-foreground text-right">-</span>
      )}
    </BaseRow>
  )
}

export function BrandDetailDialog({ open, brandDetail, onClose, onEdit }: BrandDetailDialogProps) {
  const footer = (
    <>
      <Button variant="outline" className="flex-1" onClick={onClose}>
        닫기
      </Button>
      <Button className="flex-1" onClick={onEdit}>
        수정
      </Button>
    </>
  )

  return (
    <BaseDialog open={open} onClose={onClose} title="브랜드 정보" footer={footer}>
      {!brandDetail ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
      <>
      {/* 섹션 1: 기본 정보 */}
      <div className="p-4 space-y-3">
        <BaseRow label="ID">
          <div className="flex items-center gap-1">
            <span className="typo-body3 text-foreground text-right break-all">{brandDetail.id}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 text-key-blue"
              onClick={() => copyToClipboard(String(brandDetail.id), 'ID')}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </BaseRow>

        <BaseRow label="브랜드명" value={brandDetail.name} />
        <BaseRow label="브랜드 타입" value={SERVICE_TYPE_LABEL[brandDetail.service_type ?? ''] ?? '-'} />
        <BaseRow label="도메인" value={brandDetail.domain ?? '-'} />
        <BaseRow label="브랜드 상태" value={<StatusChip active={brandDetail.is_active !== false} />} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 2: 운영 상태 */}
      <div className="p-4 space-y-3">
        <BaseRow label="비회원 주문" value={<StatusChip active={brandDetail.use_guest_user !== false} />} />
        <BaseRow label="일반회원 주문" value={<StatusChip active={brandDetail.use_user === true} />} />
        <BaseRow label="임직원회원 서비스" value={<StatusChip active={brandDetail.use_membership_user === true} />} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 3: 페이지 설정 */}
      <div className="p-4 space-y-3">
        <BaseRow label="페이지 제목" value={brandDetail.title ?? '-'} />
        <ImagePreview label="배너 이미지" url={brandDetail.image_url} />
        <ImagePreview label="로고" url={brandDetail.main_logo} />
        <ImagePreview label="파비콘" url={brandDetail.sub_logo} />
        <BaseRow
          label="테마 컬러"
          value={
            brandDetail.theme_colors?.filter(Boolean).length
              ? brandDetail.theme_colors.filter(Boolean).join(', ')
              : '-'
          }
        />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 4: OG 메타데이터 */}
      <div className="p-4 space-y-3">
        <BaseRow label="OG 제목" value={brandDetail.og_title ?? '-'} />
        <ImagePreview label="OG 이미지" url={brandDetail.og_image} />
        <BaseRow label="OG 설명글" value={brandDetail.og_description ?? '-'} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 5: 법인 정보 */}
      <div className="p-4 space-y-3">
        <BaseRow label="사업자등록번호" value={brandDetail.registration_number ?? '-'} />
        <BaseRow label="통신판매업신고" value={brandDetail.business_report_number ?? '-'} />
        <BaseRow label="전화번호" value={brandDetail.phone ?? '-'} />
        <BaseRow label="대표자" value={brandDetail.representative_name ?? '-'} />
        <BaseRow label="법인명" value={brandDetail.footer_brand_name ?? '-'} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 6: 계정 정보 */}
      <div className="p-4 space-y-3">
        <BaseRow label="로그인 ID" value={brandDetail.administrator_username ?? '-'} />
        <BaseRow label="마지막 계정 설정 일시" value={formatDate(brandDetail.administrator_update_dt)} />
      </div>

      <div className="h-2 bg-accent" />

      {/* 섹션 7: 타임스탬프 */}
      <div className="p-4 space-y-3">
        <BaseRow label="마지막 업데이트 일시" value={formatDate(brandDetail.update_dt)} />
        <BaseRow label="생성 일시" value={formatDate(brandDetail.create_dt)} />
      </div>
      </>
      )}
    </BaseDialog>
  )
}
