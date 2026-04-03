import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { typedZodResolver } from '@/lib/form'
import { X } from 'lucide-react'
import { BaseDialog } from '@/components/common/base-dialog'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload, type ImageItem } from '@/components/common/image-upload'
import { z } from 'zod'
import { menuFormSchema, type MenuItem, type MenuCategoryItem, type OptionCategoryItem } from '@/features/menu-management/schema'

const formSchema = menuFormSchema.extend({
  operation_name: z.string().min(1, '상품명(관리전용)을 입력해주세요.').max(20),
  name: z.string().min(1, '상품명(노출용)을 입력해주세요.').max(20),
})

type FormValues = z.infer<typeof formSchema>

const MIN_QTY_OPTIONS = Array.from({ length: 99 }, (_, i) => i + 1)

const initialValues: FormValues = {
  name: '',
  operation_name: '',
  base_price: 0,
  origin_price: 0,
  highlight_description: '',
  description: '',
  parent_object_id: '',
  menu_categories: [],
  option_categories: [],
  ordering: 0,
  min_available_quantity: 1,
  max_available_quantity: null,
  membership_discount_allowed: false,
  image_url: '',
}

function resolveValues(data: MenuItem, storeId: string | null): FormValues {
  return {
    name: data.name ?? '',
    operation_name: data.operation_name ?? '',
    base_price: data.base_price ?? 0,
    origin_price: data.origin_price ?? 0,
    highlight_description: data.highlight_description ?? '',
    description: data.description ?? '',
    parent_object_id: storeId ?? '',
    menu_categories: data.menu_categories.map((c) => c.id),
    option_categories: data.option_categories.map((o) => o.id),
    ordering: data.ordering,
    min_available_quantity: data.min_available_quantity ?? 1,
    max_available_quantity: data.max_available_quantity ?? null,
    membership_discount_allowed: data.membership_discount_allowed ?? false,
    image_url: data.image_url ?? '',
  }
}

interface MenuFormDialogProps {
  open: boolean
  initialData?: MenuItem | null
  storeId: string | null
  ordering: number
  isSubmitting: boolean
  categories: MenuCategoryItem[]
  options: OptionCategoryItem[]
  onClose: () => void
  onSubmit: (data: FormValues, imageFile: File | null, removeImage: boolean) => void
}
export function MenuFormDialog({
  open,
  initialData,
  storeId,
  ordering,
  isSubmitting,
  categories,
  options,
  onClose,
  onSubmit,
}: MenuFormDialogProps) {
  const isEditMode = !!initialData

  // 이미지 상태 (RHF 밖에서 관리 — ImageUpload의 immediateUpload=false 모드)
  const [productImages, setProductImages] = useState<ImageItem[]>(() => {
    if (initialData?.image_url) {
      const url = initialData.image_url
      return [{ url, fileName: url.split('/').pop() ?? '', order: 0 }]
    }
    return []
  })

  // 카테고리/옵션 멀티셀렉 상태 (key 변경으로 마운트 시 초기값 자동 적용)
  const initialSelectedCategories = useMemo(
    () =>
      initialData?.menu_categories.map((c) => ({
        id: c.id,
        name: c.name,
        operation_name: c.operation_name ?? c.name,
        sn: c.sn,
      })) ?? [],
    // 마운트 시 1회만 계산 — initialData는 다이얼로그가 열릴 때만 변경됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const initialSelectedOptions = useMemo(
    () =>
      initialData?.option_categories.map((o) => ({
        id: o.id,
        name: o.name,
        sn: o.sn,
      })) ?? [],
    // 마운트 시 1회만 계산 — initialData는 다이얼로그가 열릴 때만 변경됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [selectedCategories, setSelectedCategories] = useState<MenuCategoryItem[]>(initialSelectedCategories)
  const [selectedOptions, setSelectedOptions] = useState<OptionCategoryItem[]>(initialSelectedOptions)

  const defaultValues = useMemo(
    () => initialData
      ? resolveValues(initialData, storeId)
      : { ...initialValues, parent_object_id: storeId ?? '', ordering },
    [initialData, storeId, ordering],
  )

  const form = useForm<FormValues>({
    resolver: typedZodResolver(formSchema),
    defaultValues,
  })

  const minQty = form.watch('min_available_quantity') ?? 1

  // 최소 수량 변경 시 최대 수량 보정
  useEffect(() => {
    const maxQty = form.getValues('max_available_quantity')
    if (maxQty != null && maxQty < minQty) {
      form.setValue('max_available_quantity', minQty)
    }
  }, [minQty, form])

  // ─────────────────────────────────────────────
  // 카테고리/옵션 토글
  // ─────────────────────────────────────────────
  const toggleCategory = (cat: MenuCategoryItem) => {
    const exists = selectedCategories.some((c) => c.id === cat.id)
    const next = exists
      ? selectedCategories.filter((c) => c.id !== cat.id)
      : [...selectedCategories, cat]
    setSelectedCategories(next)
    form.setValue('menu_categories', next.map((c) => c.id))
  }

  const toggleOption = (opt: OptionCategoryItem) => {
    const exists = selectedOptions.some((o) => o.id === opt.id)
    const next = exists
      ? selectedOptions.filter((o) => o.id !== opt.id)
      : [...selectedOptions, opt]
    setSelectedOptions(next)
    form.setValue('option_categories', next.map((o) => o.id))
  }

  // ─────────────────────────────────────────────
  // 제출
  // ─────────────────────────────────────────────
  // 레거시 ProductRegistrationForm handleSubmit 포팅
  // selectedFile이 있으면 File binary, 기존 이미지면 URL 문자열, 없으면 null
  const handleSubmit = form.handleSubmit((data) => {
    const selectedFile = productImages[0]?.file ?? null
    const hasExistingImage = productImages.length > 0 && !selectedFile

    if (selectedFile) {
      // 새 파일 선택: File 객체 전달 → FormData binary 전송
      onSubmit(data, selectedFile, false)
    } else if (hasExistingImage) {
      // 기존 이미지 유지: URL 문자열 그대로
      onSubmit({ ...data, image_url: productImages[0].url }, null, false)
    } else {
      // 이미지 없음 (삭제됨)
      onSubmit(data, null, true)
    }
  })

  // 가격 입력 포맷 (콤마 제거 후 숫자만)
  const parsePriceInput = (v: string): number => {
    const n = parseInt(v.replace(/[^\d]/g, ''), 10)
    return isNaN(n) ? 0 : n
  }

  const maxQtyOptions = [
    { label: '제한 없음', value: null as number | null },
    ...Array.from({ length: 99 - minQty + 1 }, (_, i) => ({
      label: String(minQty + i),
      value: minQty + i,
    })),
  ]

  const operationNameLen = form.watch('operation_name')?.length ?? 0
  const displayNameLen = form.watch('name')?.length ?? 0
  const highlightLen = form.watch('highlight_description')?.length ?? 0
  const descriptionLen = form.watch('description')?.length ?? 0

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? '상품 수정' : '상품 등록'}
      noScrollBody
    >
      <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">

              {/* ── 섹션 1: 기본 정보 ── */}
              <div className="p-4 space-y-4">

                {/* 상품명 (관리전용) */}
                <FormField
                  control={form.control}
                  name="operation_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        상품명 (관리전용) <span className="text-status-destructive typo-micro1">(필수)</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="상품명 입력"
                            maxLength={20}
                            {...field}
                          />
                        </FormControl>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">
                          {operationNameLen}/20
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 상품명 (노출용) */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        상품명 (노출용) <span className="text-status-destructive typo-micro1">(필수)</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="상품명 입력"
                            maxLength={20}
                            {...field}
                          />
                        </FormControl>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">
                          {displayNameLen}/20
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 정상가 */}
                <FormField
                  control={form.control}
                  name="origin_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        정상가 <span className="text-status-destructive typo-micro1">(필수)</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="정상가 입력"
                            className="pr-8"
                            value={field.value ? field.value.toLocaleString('ko-KR') : ''}
                            onChange={(e) => field.onChange(parsePriceInput(e.target.value))}
                          />
                        </FormControl>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">원</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 판매가 */}
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        판매가 <span className="text-status-destructive typo-micro1">(필수)</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="판매가 입력"
                            className="pr-8"
                            value={field.value ? field.value.toLocaleString('ko-KR') : ''}
                            onChange={(e) => field.onChange(parsePriceInput(e.target.value))}
                          />
                        </FormControl>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">원</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 상품 이미지 — immediateUpload=false: File 객체 보관 → submit 시 FormData 전송 */}
                <div className="space-y-2">
                  <Label>상품 이미지</Label>
                  <ImageUpload
                    location="media"
                    value={productImages}
                    onChange={setProductImages}
                    maxImages={1}
                    maxFileSizeMB={2}
                    recommendedSize="1000×600 px (5:3 비율)"
                    immediateUpload={false}
                  />
                </div>

                {/* 상품 설명 (강조) */}
                <FormField
                  control={form.control}
                  name="highlight_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품 설명 (강조)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder={'상품 설명 입력\n(예시: 뜨거운 음료이니 조심하세요!)'}
                            maxLength={24}
                            rows={2}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <span className="absolute right-3 bottom-2 typo-micro1 text-muted-foreground">
                          {highlightLen}/24
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* 상품 설명 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품 설명</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="상품 설명 입력"
                            maxLength={200}
                            rows={3}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <span className="absolute right-3 bottom-2 typo-micro1 text-muted-foreground">
                          {descriptionLen}/200
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="h-2 bg-accent" />

              {/* ── 섹션 2: 카테고리 & 옵션 ── */}
              <div className="p-4 space-y-4">

                {/* 카테고리 멀티셀렉 */}
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <CategoryMultiSelect
                    items={categories}
                    selected={selectedCategories}
                    onToggle={toggleCategory}
                    placeholder="카테고리 선택"
                    labelKey="operation_name"
                  />
                </div>

                {/* 옵션 멀티셀렉 */}
                <div className="space-y-2">
                  <Label>옵션</Label>
                  <OptionMultiSelect
                    items={options}
                    selected={selectedOptions}
                    onToggle={toggleOption}
                    placeholder="옵션 선택"
                  />
                </div>
              </div>

              <div className="h-2 bg-accent" />

              {/* ── 섹션 3: 추가 설정 ── */}
              <div className="p-4 space-y-4">

                {/* 고객사 멤버십 할인 */}
                <FormField
                  control={form.control}
                  name="membership_discount_allowed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>고객사 멤버십 할인</FormLabel>
                      <RadioGroup
                        value={field.value ? 'true' : 'false'}
                        onValueChange={(v) => field.onChange(v === 'true')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="false" id="discount-false" />
                          <Label htmlFor="discount-false" className="weight-400 cursor-pointer">할인 미적용</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="true" id="discount-true" />
                          <Label htmlFor="discount-true" className="weight-400 cursor-pointer">할인 적용</Label>
                        </div>
                      </RadioGroup>
                    </FormItem>
                  )}
                />

                {/* 최소 주문 단위 */}
                <FormField
                  control={form.control}
                  name="min_available_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최소 주문 단위</FormLabel>
                      <Select
                        value={String(field.value ?? 1)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MIN_QTY_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 최대 주문 제한 */}
                <FormField
                  control={form.control}
                  name="max_available_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최대 주문 제한</FormLabel>
                      <Select
                        value={field.value == null ? 'null' : String(field.value)}
                        onValueChange={(v) => field.onChange(v === 'null' ? null : Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maxQtyOptions.map((opt) => (
                            <SelectItem
                              key={opt.value == null ? 'null' : opt.value}
                              value={opt.value == null ? 'null' : String(opt.value)}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="typo-micro1 text-neutral-400">
                        최소 주문 단위보다 작은 값은 설정할 수 없습니다.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 푸터 */}
            <DialogFooter className="p-4 shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
    </BaseDialog>
  )
}

// ─────────────────────────────────────────────
// 카테고리 멀티셀렉 컴포넌트
// ─────────────────────────────────────────────
interface CategoryMultiSelectProps {
  items: MenuCategoryItem[]
  selected: MenuCategoryItem[]
  onToggle: (item: MenuCategoryItem) => void
  placeholder: string
  labelKey: 'operation_name' | 'name'
}

function CategoryMultiSelect({ items, selected, onToggle, placeholder, labelKey }: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      {/* 드롭다운 트리거 */}
      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-between px-3 py-2 typo-body3 h-auto"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-muted-foreground">{placeholder}</span>
        <span className="typo-micro1 text-muted-foreground">▼</span>
      </Button>

      {/* 드롭다운 목록 */}
      {open && (
        <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 typo-body3 text-muted-foreground">카테고리가 없습니다.</p>
          ) : (
            items.map((item) => {
              const isSelected = selected.some((c) => c.id === item.id)
              const displayName = item[labelKey] ?? item.name
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  className={`flex w-full items-center justify-start px-3 py-2 typo-body3 h-auto rounded-none ${isSelected ? 'bg-accent/50 weight-500' : ''}`}
                  onClick={() => onToggle(item)}
                >
                  <span className="mr-2">{isSelected ? '✓' : ' '}</span>
                  {item.sn ? `(${item.sn}) ${displayName}` : displayName}
                </Button>
              )
            })
          )}
        </div>
      )}

      {/* 선택된 태그 */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-key-blue/10 px-2 py-0.5 typo-micro1 text-key-blue"
            >
              {item[labelKey] ?? item.name}
              <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => onToggle(item)}>
                <X size={10} />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 옵션 멀티셀렉 컴포넌트
// ─────────────────────────────────────────────
interface OptionMultiSelectProps {
  items: OptionCategoryItem[]
  selected: OptionCategoryItem[]
  onToggle: (item: OptionCategoryItem) => void
  placeholder: string
}

function OptionMultiSelect({ items, selected, onToggle, placeholder }: OptionMultiSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-between px-3 py-2 typo-body3 h-auto"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-muted-foreground">{placeholder}</span>
        <span className="typo-micro1 text-muted-foreground">▼</span>
      </Button>

      {open && (
        <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 typo-body3 text-muted-foreground">옵션이 없습니다.</p>
          ) : (
            items.map((item) => {
              const isSelected = selected.some((o) => o.id === item.id)
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  className={`flex w-full items-center justify-start px-3 py-2 typo-body3 h-auto rounded-none ${isSelected ? 'bg-accent/50 weight-500' : ''}`}
                  onClick={() => onToggle(item)}
                >
                  <span className="mr-2">{isSelected ? '✓' : ' '}</span>
                  {item.sn ? `(${item.sn}) ${item.name}` : item.name}
                </Button>
              )
            })
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-key-blue/10 px-2 py-0.5 typo-micro1 text-key-blue"
            >
              {item.name}
              <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => onToggle(item)}>
                <X size={10} />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
