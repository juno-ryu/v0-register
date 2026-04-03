import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore, selectIsBrandAccount } from '@/store/useAuthStore'
import { useBrandList } from '@/features/brand-management/queries'
import { useCreateBranch } from '@/features/branch-management/queries'
import { LoadingOverlay } from '@/components/common/loading-overlay'
import { createBranchPayloadSchema, type CreateBranchPayload } from '@/features/branch-management/schema'

const initialValues: CreateBranchPayload = {
  brand_id: '',
  name: '',
  phone_number: '',
  full_address: '',
  is_active: true,
  business_name: '',
  registration_number: '',
  representative_name: '',
}

interface BranchCreateDialogProps {
  open: boolean
  onClose: () => void
}
export function BranchCreateDialog({ open, onClose }: BranchCreateDialogProps) {
  const isBrandAccount = useAuthStore(selectIsBrandAccount)
  const userBrandId = useAuthStore((s) => s.userBrandId)

  // 브랜드 목록 (전체 조회)
  const { data: brandData } = useBrandList({ page: 1, per_page: 9999 })
  const brandOptions = brandData?.results ?? []

  const { mutate: createBranch, isPending: isSubmitting } = useCreateBranch()

  const defaultValues = useMemo(
    () => ({
      ...initialValues,
      brand_id: isBrandAccount && userBrandId ? String(userBrandId) : '',
    }),
    [isBrandAccount, userBrandId],
  )

  const form = useForm<CreateBranchPayload>({
    resolver: zodResolver(createBranchPayloadSchema),
    defaultValues,
  })

  const handleSubmit = (data: CreateBranchPayload) => {
    createBranch(data, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="매장 등록"
      noScrollBody
    >
      <LoadingOverlay show={isSubmitting} />
      {/* 스크롤 바디 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* 매장명 (필수) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>매장명 <span className="text-status-destructive typo-micro1">(필수)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="매장명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 브랜드 (필수) */}
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      브랜드 {!isBrandAccount && <span className="text-status-destructive typo-micro1">(필수)</span>}
                    </FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val)}
                      disabled={isBrandAccount}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="브랜드 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brandOptions.map((brand) => (
                          <SelectItem key={String(brand.id)} value={String(brand.id)}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="typo-body3 weight-500 text-status-destructive">브랜드를 선택해 주세요.</p>
                    )}
                  </FormItem>
                )}
              />

              {/* 전화번호 */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호</FormLabel>
                    <FormControl>
                      <Input placeholder="02-1234-5678" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 주소 */}
              <FormField
                control={form.control}
                name="full_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="주소 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 상호/법인명 */}
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상호/법인명</FormLabel>
                    <FormControl>
                      <Input placeholder="상호/법인명 입력" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

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
            </div>

          {/* 푸터 고정 */}
          <div className="p-4 border-t shrink-0 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '매장 등록'}
            </Button>
          </div>
        </form>
      </Form>
    </BaseDialog>
  )
}
