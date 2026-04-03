import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowUpDown, GripVertical, Loader2, Plus, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uploadMediaFiles } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// 레거시 CommonImageUpload의 ImageItem 대응
export interface ImageItem {
  url: string
  fileName: string
  order: number
  is_active?: boolean
  /** immediateUpload=false 모드에서 File 객체 보관 */
  file?: File
}

interface ImageUploadProps {
  /** S3 저장 경로 (예: 'media', 'food-beverage-banner') */
  location: string
  /** 현재 이미지 목록 */
  value: ImageItem[]
  /** 변경 콜백 */
  onChange: (items: ImageItem[]) => void
  /** 최대 업로드 개수 (기본: 5) */
  maxImages?: number
  /** 허용 파일 확장자 (기본: .png, .jpg, .jpeg) */
  acceptFormats?: string[]
  /** 최대 파일 크기 MB (기본: 3) */
  maxFileSizeMB?: number
  /** 권장 이미지 크기 텍스트 */
  recommendedSize?: string
  /** DnD 순서 변경 활성화 (기본: false) */
  enableReorder?: boolean
  /** is_active 체크박스 표시 (기본: false) */
  showCheckbox?: boolean
  /** false면 CDN 업로드 스킵, File 객체를 ImageItem.file에 보관 (기본: true) */
  immediateUpload?: boolean
  disabled?: boolean
  className?: string
}

const DEFAULT_ACCEPT = ['.png', '.jpg', '.jpeg']
const DEFAULT_MAX_SIZE_MB = 3
const DEFAULT_MAX_IMAGES = 5

export function ImageUpload({
  location,
  value,
  onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  acceptFormats = DEFAULT_ACCEPT,
  maxFileSizeMB = DEFAULT_MAX_SIZE_MB,
  recommendedSize,
  enableReorder = false,
  showCheckbox = false,
  immediateUpload = true,
  disabled,
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isReorderMode, setIsReorderMode] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))
  const maxSizeBytes = maxFileSizeMB * 1024 * 1024
  const acceptText = acceptFormats.join(', ')
  const isUploadDisabled = disabled || isUploading || value.length >= maxImages

  // ── 파일 업로드 ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const invalidFiles = files.filter(
      (f) => !acceptFormats.some((ext) => f.name.toLowerCase().endsWith(ext)),
    )
    if (invalidFiles.length > 0) {
      toast.warning(`업로드 가능한 파일 형식은 ${acceptText}만 가능합니다.`)
      e.target.value = ''
      return
    }

    const oversizedFiles = files.filter((f) => f.size > maxSizeBytes)
    if (oversizedFiles.length > 0) {
      toast.warning(`파일 크기가 ${maxFileSizeMB}MB를 초과했습니다.`)
      e.target.value = ''
      return
    }

    const available = maxImages - value.length
    const filesToUpload = files.slice(0, available)
    if (files.length > available) {
      toast.warning(`이미지는 최대 ${maxImages}개까지 업로드 가능합니다. ${filesToUpload.length}개만 업로드됩니다.`)
    }

    if (immediateUpload) {
      // 즉시 CDN 업로드 → URL 반환 (배너/팝업 등)
      setIsUploading(true)
      try {
        const urls = await uploadMediaFiles(filesToUpload, location)
        const newItems: ImageItem[] = urls.map((url, i) => ({
          url,
          fileName: filesToUpload[i]?.name ?? url.split('/').pop() ?? url,
          order: value.length + i,
          is_active: showCheckbox ? true : undefined,
        }))
        onChange([...value, ...newItems])
      } catch {
        toast.error('이미지 업로드에 실패했습니다.')
      } finally {
        setIsUploading(false)
        e.target.value = ''
      }
    } else {
      // File 객체 보관 → 부모 컴포넌트에서 submit 시 FormData로 전송 (상품 이미지 등)
      const newItems: ImageItem[] = filesToUpload.map((file, i) => ({
        url: URL.createObjectURL(file),
        fileName: file.name,
        order: value.length + i,
        file,
      }))
      onChange([...value, ...newItems])
      e.target.value = ''
    }
  }

  // ── 삭제 (blob URL 메모리 해제 포함) ──
  function handleDelete(index: number) {
    const deleted = value[index]
    if (deleted?.file && deleted.url.startsWith('blob:')) {
      URL.revokeObjectURL(deleted.url)
    }
    onChange(value.filter((_, i) => i !== index))
  }

  // ── 체크박스 토글 ──
  function handleToggleActive(index: number) {
    onChange(value.map((img, i) => (i === index ? { ...img, is_active: !img.is_active } : img)))
  }

  // ── DnD 재정렬 (url 기반 안정적 ID) ──
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = value.findIndex((img) => img.url === active.id)
    const newIndex = value.findIndex((img) => img.url === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(value, oldIndex, newIndex))
  }

  // ── 이미지 목록 렌더 ──
  function renderImageList() {
    if (value.length === 0) return null

    const items = value.map((img, index) => (
      <SortableImageItem
        key={`${img.url}-${index}`}
        img={img}
        index={index}
        isReorderMode={isReorderMode}
        showCheckbox={showCheckbox}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    ))

    // reorder 모드에서만 DndContext 래핑
    if (enableReorder) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((img) => img.url)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">{items}</div>
          </SortableContext>
        </DndContext>
      )
    }

    return <div className="space-y-2">{items}</div>
  }

  return (
    <div className={cn('flex flex-col gap-2 min-w-0 overflow-hidden', className)}>
      {/* 가이드라인 */}
      <ul className="typo-micro1 text-muted-foreground space-y-0.5 list-disc list-inside">
        <li>업로드 가능 파일 형식: {acceptText}</li>
        {recommendedSize && <li>이미지 권장 크기: {recommendedSize}</li>}
        <li>최대 파일 크기: {maxFileSizeMB}MB</li>
      </ul>

      {/* 버튼 행 */}
      <div className="flex items-center gap-2">
        {enableReorder && value.length > 1 && (
          <Button
            type="button"
            variant={isReorderMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsReorderMode((prev) => !prev)}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            {isReorderMode ? '위치 변경 완료' : '위치 변경'}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptText}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          size="sm"
          disabled={isUploadDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          추가
        </Button>
      </div>

      {/* 이미지 목록 */}
      {renderImageList()}
    </div>
  )
}

// ─────────────────────────────────────────────
// SortableImageItem — DnD 대응 개별 이미지 행
// ─────────────────────────────────────────────
function SortableImageItem({
  img,
  index,
  isReorderMode,
  showCheckbox,
  onDelete,
  onToggleActive,
}: {
  img: ImageItem
  index: number
  isReorderMode: boolean
  showCheckbox: boolean
  onDelete: (index: number) => void
  onToggleActive: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.url })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 p-2 border rounded-md bg-card min-w-0',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* DnD 핸들 */}
      {isReorderMode && (
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 shrink-0 text-neutral-400" />
        </div>
      )}

      {/* 썸네일 */}
      <div className="relative w-16 h-16 shrink-0">
        <img src={img.url} alt={img.fileName} className="w-16 h-16 object-cover rounded" />
        {isReorderMode && (
          <div className="absolute top-0 left-0 bg-black text-white typo-micro1 weight-700 w-5 h-5 flex items-center justify-center rounded-br">
            {index + 1}
          </div>
        )}
        {showCheckbox && !isReorderMode && (
          <div className="absolute top-0 left-0">
            <Checkbox checked={img.is_active ?? true} onCheckedChange={() => onToggleActive(index)} />
          </div>
        )}
      </div>

      {/* 파일명 */}
      <span className="flex-1 min-w-0 truncate typo-body3 text-muted-foreground">{img.fileName}</span>

      {/* 삭제 */}
      {!isReorderMode && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onDelete(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
