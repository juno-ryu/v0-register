import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    // mobile(<960px): 16px 패딩, fluid
    // tablet(960~1365px): 900px 고정, 중앙 정렬
    // desktop(≥1366px): 1280px 고정, 중앙 정렬
    <div
      className={cn(
        'mx-auto w-full px-4 py-4 md:max-w-[900px] md:px-0 xl:max-w-[1280px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
