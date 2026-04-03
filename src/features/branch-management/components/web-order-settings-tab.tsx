import { useState } from 'react'
import type { BranchDetail } from '@/features/branch-management/schema'
import { ImageUploadDialog } from '@/features/branch-management/components/image-upload-dialog'
import type { ImageItem } from '@/components/common/image-upload'
import { useDialogKey } from '@/hooks/useDialogKey'

interface WebOrderSettingsTabProps {
  storeId: string
  detail: BranchDetail
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const IMAGE_PREVIEW_MAX = 4

// ─────────────────────────────────────────────
// SectionTitle — branch-information-tab.tsx 패턴 동일
// ─────────────────────────────────────────────
function SectionTitle({ title, onEdit }: { title: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="typo-body2 weight-700 text-foreground">{title}</h2>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-0.5 typo-micro1 text-key-blue cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          설정
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// InfoRow — branch-information-tab.tsx 패턴 동일
// ─────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <span className="w-36 shrink-0 typo-body3 weight-600 text-foreground">{label}</span>
      <div className="flex-1 typo-body3 text-foreground">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 구분선
// ─────────────────────────────────────────────
function Divider() {
  return <hr className="my-4 border-border" />
}

// ─────────────────────────────────────────────
// 이미지 미리보기
// ─────────────────────────────────────────────
function ImagePreview({ images, altPrefix }: { images: ImageItem[]; altPrefix: string }) {
  if (images.length === 0) return <span className="text-neutral-400">-</span>

  const preview = images.slice(0, IMAGE_PREVIEW_MAX)
  const extra = images.length - IMAGE_PREVIEW_MAX

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {preview.map((img, i) => (
          <img
            key={img.url}
            src={img.url}
            alt={`${altPrefix} ${i + 1}`}
            className="w-28 h-20 object-cover rounded"
          />
        ))}
      </div>
      {extra > 0 && (
        <div className="w-28">
          <span className="flex items-center justify-center w-full h-8 bg-muted rounded typo-body3 text-muted-foreground">
            +{extra}
          </span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export function WebOrderSettingsTab({ storeId, detail }: WebOrderSettingsTabProps) {
  const [bannerOpen, setBannerOpen] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const bannerDialogKey = useDialogKey(bannerOpen)
  const popupDialogKey = useDialogKey(popupOpen)

  // 배너 데이터 추출
  const bannerImages: ImageItem[] = (detail.banner_media_urls ?? []).map((url, i) => ({
    url,
    fileName: url.split('/').pop() ?? url,
    order: i,
  }))
  const bannerInterval = detail.banner_display_duration_seconds ?? 3

  // 팝업 데이터 추출
  const popupImages: ImageItem[] = [...(detail.modal_images ?? [])]
    .sort((a, b) => a.ordering - b.ordering)
    .map((img, i) => ({
      url: img.image_url,
      fileName: img.image_url.split('/').pop() ?? img.image_url,
      order: i,
      is_active: img.is_active ?? true,
    }))
  const autoSlideEnabled = detail.is_web_order_model_auto_slide ?? true
  const autoSlideInterval = detail.web_order_model_display_duration_seconds ?? 5

  return (
    <div className="p-6">
      {/* 페이지 배너 */}
      <SectionTitle title="페이지 배너" onEdit={() => setBannerOpen(true)} />
      <div className="mt-3">
        <InfoRow label="이미지">
          <ImagePreview images={bannerImages} altPrefix="배너" />
        </InfoRow>
        <InfoRow label="자동 전환 간격">
          {bannerImages.length > 0 ? `${bannerInterval}초` : '-'}
        </InfoRow>
      </div>

      <Divider />

      {/* 이벤트 팝업 */}
      <SectionTitle title="이벤트 팝업" onEdit={() => setPopupOpen(true)} />
      <div className="mt-3">
        <InfoRow label="이미지">
          <ImagePreview images={popupImages} altPrefix="팝업" />
        </InfoRow>
        <InfoRow label="자동 전환">
          {popupImages.length > 0 ? (
            <span className={autoSlideEnabled ? 'text-status-positive' : ''}>
              {autoSlideEnabled ? '사용함' : '사용 안 함'}
            </span>
          ) : (
            '-'
          )}
        </InfoRow>
        <InfoRow label="자동 전환 간격">
          {popupImages.length > 0 && autoSlideEnabled ? `${autoSlideInterval}초` : '-'}
        </InfoRow>
      </div>

      {/* 배너 설정 다이얼로그 */}
      <ImageUploadDialog
        key={bannerDialogKey}
        type="banner"
        open={bannerOpen}
        onClose={() => setBannerOpen(false)}
        initialImages={bannerImages}
        autoSlideInterval={bannerInterval}
        storeId={storeId}
        onSaved={() => setBannerOpen(false)}
      />

      {/* 팝업 설정 다이얼로그 */}
      <ImageUploadDialog
        key={popupDialogKey}
        type="popup"
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        initialImages={popupImages}
        autoSlideEnabled={autoSlideEnabled}
        autoSlideInterval={autoSlideInterval}
        storeId={storeId}
        onSaved={() => setPopupOpen(false)}
      />
    </div>
  )
}
