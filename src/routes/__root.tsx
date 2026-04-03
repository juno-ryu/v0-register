import { QueryClient } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    // 테마 기능 활용 시
    <ThemeProvider defaultTheme="light" storageKey="arabiz-theme">
      <>
        <Outlet />
        <Toaster />
        {/* 개발 환경에서만 디버깅 툴 노출 */}
        {import.meta.env.DEV && (
          <>
            {/* <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" /> */}
          </>
        )}
      </>
    </ThemeProvider>
  )
}
