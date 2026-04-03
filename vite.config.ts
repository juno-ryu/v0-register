import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5175,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // recharts는 dashboard.lazy에서만 사용 → manualChunks 제거, 자동 lazy 번들링
        manualChunks: (id) => {
          // React 코어 — 모든 페이지 필수, 별도 chunk로 캐시 최적화
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // Radix UI 공통 컴포넌트
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix'
          }
          // TanStack (router + query + table) — 공통 런타임
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-tanstack'
          }
        },
      },
    },
  },
})
