import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BaseDialog } from '@/components/common/base-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/common/image-upload'
import { z } from 'zod'
import { brandFormSchema, type BrandForm, type BrandDetail } from '@/features/brand-management/schema'

const BRAND_TYPE_OPTIONS = [
  { value: 'platform', label: '일반' },
  { value: 'hotel', label: '호텔/리조트' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: '운영 중' },
  { value: 'inactive', label: '운영 중단' },
]

const SERVICE_OPTIONS = [
  { value: 'true', label: '이용 중' },
  { value: 'false', label: '이용 안함' },
]

type BrandFormInput = z.input<typeof brandFormSchema>

const initialValues: BrandFormInput = brandFormSchema.parse({}) as BrandFormInput

function resolveValues(data: BrandDetail): BrandFormInput {
  return {
    name: data.name ?? '',
    domain: data.domain ?? '',
    title: data.title ?? '',
    service_type: data.service_type ?? 'platform',
    is_active: data.is_active ?? true,
    image_url: data.image_url ?? '',
    main_logo: data.main_logo ?? '',
    sub_logo: data.sub_logo ?? '',
    og_image: data.og_image ?? '',
    og_title: data.og_title ?? '',
    og_description: data.og_description ?? '',
    use_guest_user: data.use_guest_user ?? true,
    use_user: data.use_user ?? false,
    use_membership_user: data.use_membership_user ?? false,
    theme_colors:
      data.theme_colors && data.theme_colors.length > 0
        ? [...data.theme_colors, ...Array(7).fill('')].slice(0, 7)
        : ['', '', '', '', '', '', ''],
    registration_number: data.registration_number ?? '',
    business_report_number: data.business_report_number ?? '',
    phone: data.phone ?? '',
    representative_name: data.representative_name ?? '',
    footer_brand_name: data.footer_brand_name ?? '',
  }
}

interface BrandFormDialogProps {
  open: boolean
  brandDetail?: BrandDetail | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: BrandForm) => void
}
export function BrandFormDialog({
  open,
  brandDetail,
  isSubmitting,
  onClose,
  onSubmit,
}: BrandFormDialogProps) {
  const isEditMode = !!brandDetail

  const defaultValues = useMemo(
    () => brandDetail ? resolveValues(brandDetail) : initialValues,
    [brandDetail],
  )

  const form = useForm<BrandFormInput, unknown, BrandForm>({
    resolver: zodResolver(brandFormSchema),
    defaultValues,
  })

  const themeColors = useWatch({ control: form.control, name: 'theme_colors' }) ?? ['', '', '', '', '', '', '']
  const ogTitle = useWatch({ control: form.control, name: 'og_title' }) ?? ''
  const ogDescription = useWatch({ control: form.control, name: 'og_description' }) ?? ''

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? '브랜드 수정' : '브랜드 등록'}
      noScrollBody
    >
      {/* 스크롤 가능한 콘텐츠 영역 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* 브랜드 명 (필수) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>브랜드 명 <span className="text-status-destructive typo-micro1">(필수)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="브랜드 명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 브랜드 타입 */}
              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>브랜드 타입</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRAND_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* 도메인 (필수) */}
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>도메인 <span className="text-status-destructive typo-micro1">(필수)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="예: abc.orderhop.ai 또는 abc.ara.live" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 브랜드 상태 */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>브랜드 상태</FormLabel>
                    <Select
                      value={field.value ? 'active' : 'inactive'}
                      onValueChange={(v) => field.onChange(v === 'active')}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* 비회원 주문 (disabled — 레거시 동일) */}
              <FormItem>
                <FormLabel>비회원 주문</FormLabel>
                <Select value="true" disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              {/* 일반회원 주문 */}
              <FormField
                control={form.control}
                name="use_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>일반회원 주문</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(v === 'true')}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* 임직원회원 서비스 */}
              <FormField
                control={form.control}
                name="use_membership_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>임직원회원 서비스</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(v === 'true')}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* 페이지 제목 (필수) */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>페이지 제목 <span className="text-status-destructive typo-micro1">(필수)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="페이지 제목 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 테마 컬러 */}
              <FormItem>
                <FormLabel>테마 컬러</FormLabel>
                <div className="space-y-1">
                  {themeColors.map((_, index) => (
                    <Input
                      key={index}
                      placeholder={`컬러 코드 #${index + 1}`}
                      value={themeColors[index] ?? ''}
                      onChange={(e) => {
                        const next = [...themeColors]
                        next[index] = e.target.value
                        form.setValue('theme_colors', next)
                      }}
                    />
                  ))}
                </div>
              </FormItem>

              {/* 브랜드 이미지 */}
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>브랜드 이미지</FormLabel>
                    <ImageUpload
                      location="brands"
                      value={field.value ? [{ url: field.value, fileName: field.value.split('/').pop() ?? '', order: 0 }] : []}
                      onChange={(items) => field.onChange(items[0]?.url ?? '')}
                      maxImages={1}
                      recommendedSize="500 x 500px"
                      disabled={isSubmitting}
                    />
                  </FormItem>
                )}
              />

              {/* 메인 로고 */}
              <FormField
                control={form.control}
                name="main_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메인 로고</FormLabel>
                    <ImageUpload
                      location="brands"
                      value={field.value ? [{ url: field.value, fileName: field.value.split('/').pop() ?? '', order: 0 }] : []}
                      onChange={(items) => field.onChange(items[0]?.url ?? '')}
                      maxImages={1}
                      recommendedSize="500 x 200px"
                      disabled={isSubmitting}
                    />
                  </FormItem>
                )}
              />

              {/* 서브 로고 */}
              <FormField
                control={form.control}
                name="sub_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>서브 로고</FormLabel>
                    <ImageUpload
                      location="brands"
                      value={field.value ? [{ url: field.value, fileName: field.value.split('/').pop() ?? '', order: 0 }] : []}
                      onChange={(items) => field.onChange(items[0]?.url ?? '')}
                      maxImages={1}
                      recommendedSize="500 x 200px"
                      disabled={isSubmitting}
                    />
                  </FormItem>
                )}
              />

              {/* OG 이미지 */}
              <FormField
                control={form.control}
                name="og_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG 이미지</FormLabel>
                    <ImageUpload
                      location="brands"
                      value={field.value ? [{ url: field.value, fileName: field.value.split('/').pop() ?? '', order: 0 }] : []}
                      onChange={(items) => field.onChange(items[0]?.url ?? '')}
                      maxImages={1}
                      recommendedSize="1200 x 630px"
                      disabled={isSubmitting}
                    />
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* OG 제목 */}
              <FormField
                control={form.control}
                name="og_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG 제목</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="OG 제목 입력"
                          maxLength={60}
                          {...field}
                        />
                      </FormControl>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 typo-micro1 text-muted-foreground">
                        {ogTitle.length}/60
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              {/* OG 설명글 */}
              <FormField
                control={form.control}
                name="og_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG 설명글</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="OG 설명글 입력"
                          maxLength={160}
                          rows={4}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <span className="absolute right-3 bottom-2 typo-micro1 text-muted-foreground">
                        {ogDescription.length}/160
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="h-2 bg-accent" />

              {/* 사업자등록번호 */}
              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사업자등록번호</FormLabel>
                    <FormControl>
                      <Input placeholder="123-45-67890" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 통신판매업신고 */}
              <FormField
                control={form.control}
                name="business_report_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>통신판매업신고</FormLabel>
                    <FormControl>
                      <Input placeholder="통신판매업신고 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 전화번호 */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호</FormLabel>
                    <FormControl>
                      <Input placeholder="전화번호 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 대표자 */}
              <FormField
                control={form.control}
                name="representative_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>대표자</FormLabel>
                    <FormControl>
                      <Input placeholder="대표자 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 법인명 */}
              <FormField
                control={form.control}
                name="footer_brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>법인명</FormLabel>
                    <FormControl>
                      <Input placeholder="법인명 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

            </div>

            {/* 플로팅 푸터 */}
            <div className="p-4 border-t shrink-0 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                취소
              </Button>
              <Button
                className="flex-1"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </Form>
    </BaseDialog>
  )
}
