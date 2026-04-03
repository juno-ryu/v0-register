import { useState } from 'react'
import { type FieldValues, type UseFormReturn, FormProvider } from 'react-hook-form'
import { RotateCcw, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterSectionProps<T extends FieldValues> {
  /** RHF form 인스턴스 — 부모에서 생성해서 전달, FormProvider로 감싸줌 (없으면 단순 레이아웃 셸로 동작) */
  form?: UseFormReturn<T>
  /** 초기화 시 리셋할 기본값 */
  defaultValues?: T
  children: React.ReactNode
  /** 조회 버튼 클릭 시 — form 있으면 validated 값 전달, 없으면 단순 호출 */
  onSubmit?: (values: T) => void
  /** 조회 버튼 클릭 시 (레거시 — form 없는 경우) */
  onSearch?: () => void
  /** 초기화 버튼 클릭 시 */
  onReset?: () => void
}

// 필터 셸 컴포넌트
// form prop 있으면 FormProvider + handleSubmit, 없으면 단순 레이아웃 셸로 동작
export function FilterSection<T extends FieldValues>({
  form,
  defaultValues,
  children,
  onSubmit,
  onSearch,
  onReset,
}: FilterSectionProps<T>) {
  const [collapsed, setCollapsed] = useState(false)

  const handleReset = () => {
    if (form && defaultValues) {
      form.reset(defaultValues as Parameters<typeof form.reset>[0])
    }
    onReset?.()
  }

  const handleSubmit = form
    ? form.handleSubmit((values) => onSubmit?.(values))
    : (e: React.FormEvent) => { e.preventDefault(); onSearch?.() }

  return (
    // form 없으면 FormProvider 없이 렌더
    <FormProviderWrapper form={form}>
      <form
        className="border bg-muted py-[0.5rem] px-[2rem] max-md:p-4 max-md:py-0"
        onSubmit={handleSubmit}
      >
        {!collapsed && (
          <>
            <div className="[&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-[var(--color-line-stroke)]">
              {children}
            </div>
            <div className="flex items-center justify-center gap-2 pb-[0.5rem] border-b border-[var(--color-line-normal)] mb-2 max-md:mb-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="gap-1.5 min-w-[5rem]"
              >
                <RotateCcw size={16} />
                초기화
              </Button>
              <Button type="submit" className="gap-1.5 min-w-[5rem]">
                <Search size={16} />
                조회
              </Button>
            </div>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          className="w-full weight-700 max-md:my-2">
          {collapsed ? '검색/필터 열기' : '검색/필터 닫기'}
          {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </Button>
      </form>
    </FormProviderWrapper>
  )
}

function FormProviderWrapper<T extends FieldValues>({
  form,
  children,
}: {
  form?: UseFormReturn<T>
  children: React.ReactNode
}) {
  if (form) return <FormProvider {...form}>{children}</FormProvider>
  return <>{children}</>
}

interface FilterItemProps {
  label: string
  children: React.ReactNode
}

// 라벨(고정 너비) + 컨텐츠(full-width) 한 행
export function FilterItem({ label, children }: FilterItemProps) {
  return (
    <div className="flex items-center gap-4 max-md:items-start">
      <span className="w-16 min-w-[80px] shrink-0 typo-body3 weight-500 text-foreground weight-700 max-md:py-2">
        {label}
      </span>
      <div className="flex-1 py-[0.5rem]">
        {children}
      </div>
    </div>
  )
}
