import { useState } from 'react'
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
import { GripVertical } from 'lucide-react'
import { BaseDialog } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/common/loading-overlay'

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
export interface OrderChangeItem {
  id: string | number
  /** 관리자용 이름 (없으면 name 사용) */
  operation_name?: string | null
  name: string
  sn?: string | null
  image_url?: string | null
  /** 연결 정보 텍스트 (카테고리: 상품명, 옵션: 연결상품) */
  connected_label?: string
}

type OrderChangeType = 'menu' | 'category' | 'option' | 'operationProfile'

const TYPE_LABELS: Record<OrderChangeType, string> = {
  menu: '상품',
  category: '상품 카테고리',
  option: '상품 옵션',
  operationProfile: '운영모드',
}

interface OrderChangeDialogProps {
  open: boolean
  type: OrderChangeType
  items: OrderChangeItem[]
  isSaving?: boolean
  onClose: () => void
  onSave: (orderedItems: Array<{ id: string | number; ordering: number }>) => Promise<void>
}

// ─────────────────────────────────────────────
// 개별 정렬 아이템
// ─────────────────────────────────────────────
function SortableItem({
  item,
  index,
  type,
}: {
  item: OrderChangeItem
  index: number
  type: OrderChangeType
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-md border bg-background p-3 transition-shadow ${
        isDragging ? 'shadow-lg opacity-50' : ''
      }`}
    >
      {/* 드래그 핸들 — setActivatorNodeRef로 핸들 영역만 드래그 활성화 */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab items-center text-neutral-400 active:cursor-grabbing touch-none"
      >
        <GripVertical size={20} />
      </div>

      {/* 상품 타입만 이미지 표시 */}
      {type === 'menu' && (
        <div className="relative shrink-0">
          <div className="h-12 w-12 overflow-hidden rounded border border-border bg-muted">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-accent" />
            )}
          </div>
          <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-br bg-neutral-700/80 text-[10px] font-bold text-white">
            {index + 1}
          </span>
        </div>
      )}

      {/* 이미지 없는 타입은 순번만 */}
      {type !== 'menu' && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-700/80 text-[11px] font-bold text-white">
          {index + 1}
        </span>
      )}

      {/* 정보 */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1 overflow-hidden">
          {item.sn && <span className="shrink-0 text-xs text-neutral-400">({item.sn})</span>}
          <span className="truncate text-sm font-semibold text-foreground">
            {item.operation_name || item.name}
          </span>
        </div>
        {item.operation_name && item.name && (
          <span className="truncate text-xs text-muted-foreground">노출명: {item.name}</span>
        )}
        {item.connected_label && (
          <span className="truncate text-xs text-neutral-400">{item.connected_label}</span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 진열 순서 변경 다이얼로그
// ─────────────────────────────────────────────
export function OrderChangeDialog({
  open,
  type,
  items,
  isSaving = false,
  onClose,
  onSave,
}: OrderChangeDialogProps) {
  const [localItems, setLocalItems] = useState<OrderChangeItem[]>(items)

  const sensors = useSensors(
    useSensor(PointerSensor),
  )

  const hasChanges = localItems.some((item, i) => item.id !== items[i]?.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localItems.findIndex((item) => String(item.id) === active.id)
    const newIndex = localItems.findIndex((item) => String(item.id) === over.id)
    setLocalItems(arrayMove(localItems, oldIndex, newIndex))
  }

  const handleSave = async () => {
    if (!hasChanges || isSaving) return
    const orderedItems = localItems.map((item, index) => ({ id: item.id, ordering: index }))
    await onSave(orderedItems)
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`진열 순서 설정 (${TYPE_LABELS[type]})`}
      footer={
        <>
          <Button
            variant="outline"
            className="flex-1 border-key-blue text-key-blue hover:bg-key-blue/5"
            onClick={onClose}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button
            className="flex-1"
            disabled={!hasChanges || isSaving}
            onClick={handleSave}
          >
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </>
      }
    >
      <LoadingOverlay show={isSaving} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={localItems.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-4 flex flex-col gap-2">
            {localItems.map((item, index) => (
              <SortableItem key={String(item.id)} item={item} index={index} type={type} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </BaseDialog>
  )
}
