import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { BaseDialog } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload, type ImageItem } from '@/components/common/image-upload'
import { useUpdateBranchBanner, useUpdateBranchModal } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'

// ─────────────────────────────────────────────
// 타입 (ImageItem은 공용 컴포넌트에서 re-export)
// ─────────────────────────────────────────────
export type { ImageItem }

interface ImageUploadDialogProps {
  type: 'banner' | 'popup'
  open: boolean
  onClose: () => void
  initialImages: ImageItem[]
  autoSlideEnabled?: boolean
  autoSlideInterval?: number
  storeId: string
  onSaved?: () => void
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const UPLOAD_CONFIG = {
  banner: {
    maxImages: 10,
    maxFileSizeMB: 2,
    recommendedSize: '1000×600 px',
    location: 'food-beverage-banner',
    defaultInterval: 3,
    minInterval: 1,
    maxInterval: 10,
  },
  popup: {
    maxImages: 5,
    maxFileSizeMB: 3,
    recommendedSize: '900×1350 px',
    location: 'food-beverage-popup',
    defaultInterval: 5,
    minInterval: 1,
    maxInterval: 12,
  },
} as const

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export function ImageUploadDialog({
  type,
  open,
  onClose,
  initialImages,
  autoSlideEnabled: initialAutoSlide = true,
  autoSlideInterval: initialInterval,
  storeId,
  onSaved,
}: ImageUploadDialogProps) {
  const config = UPLOAD_CONFIG[type]

  const [images, setImages] = useState<ImageItem[]>(() =>
    initialImages.map((img, i) => ({ ...img, order: i })),
  )
  const [autoSlide, setAutoSlide] = useState(initialAutoSlide)
  const [slideInterval, setSlideInterval] = useState<number>(initialInterval ?? config.defaultInterval)

  const bannerMutation = useUpdateBranchBanner(storeId)
  const modalMutation = useUpdateBranchModal(storeId)
  const isSaving = bannerMutation.isPending || modalMutation.isPending

  // 저장
  async function handleSave() {
    if (type === 'banner') {
      bannerMutation.mutate(
        {
          banner_media_urls: images.map((img) => img.url),
          banner_display_duration_seconds: slideInterval,
        },
        {
          onSuccess: () => {
            toast.success('저장되었습니다.')
            onSaved?.()
          },
        },
      )
    } else {
      modalMutation.mutate(
        {
          modal_images: images.map((img, idx) => ({
            image_url: img.url,
            ordering: idx,
            link: '',
            is_active: img.is_active ?? true,
          })),
          is_web_order_model_auto_slide: autoSlide,
          web_order_model_display_duration_seconds: slideInterval,
        },
        {
          onSuccess: () => {
            toast.success('저장되었습니다.')
            onSaved?.()
          },
        },
      )
    }
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={type === 'banner' ? '페이지 배너' : '이벤트 팝업'}
      widthClass="w-[480px] max-w-[480px]"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            저장
          </Button>
        </>
      }
    >
      <LoadingOverlay show={isSaving} />
      <div className="p-4 space-y-4">
        {/* 공용 ImageUpload 컴포넌트 — enableReorder + showCheckbox props로 분기 */}
        <ImageUpload
          location={config.location}
          value={images}
          onChange={setImages}
          maxImages={config.maxImages}
          maxFileSizeMB={config.maxFileSizeMB}
          recommendedSize={config.recommendedSize}
          enableReorder
          showCheckbox={type === 'popup'}
        />

        {/* 팝업 전용: 자동전환 설정 */}
        {type === 'popup' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label className="typo-body3 weight-500">자동전환</Label>
              <RadioGroup
                value={autoSlide ? 'on' : 'off'}
                onValueChange={(v) => setAutoSlide(v === 'on')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="on" id="auto-slide-on" />
                  <Label htmlFor="auto-slide-on" className="typo-body3">사용함</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="off" id="auto-slide-off" />
                  <Label htmlFor="auto-slide-off" className="typo-body3">사용 안 함</Label>
                </div>
              </RadioGroup>
            </div>
            {autoSlide && (
              <div className="space-y-2">
                <Label className="typo-body3 weight-500">자동전환 간격</Label>
                <Select value={String(slideInterval)} onValueChange={(v) => setSlideInterval(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: config.maxInterval - config.minInterval + 1 },
                      (_, i) => config.minInterval + i,
                    ).map((sec) => (
                      <SelectItem key={sec} value={String(sec)}>{sec}초</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* 배너: 자동전환 간격 */}
        {type === 'banner' && images.length > 0 && (
          <div className="space-y-2 pt-2">
            <Label className="typo-body3 weight-500">자동전환 간격</Label>
            <Select value={String(slideInterval)} onValueChange={(v) => setSlideInterval(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: config.maxInterval - config.minInterval + 1 },
                  (_, i) => config.minInterval + i,
                ).map((sec) => (
                  <SelectItem key={sec} value={String(sec)}>{sec}초</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </BaseDialog>
  )
}
