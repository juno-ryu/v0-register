import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/features/auth/hooks/useAuth'
import type { LoginInput } from '@/features/auth/schema'
import { selectIsAuthenticated, useAuthStore } from '@/store/useAuthStore'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const { login, isLoading, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, watch, setValue } = useForm<LoginInput>({
    defaultValues: { username: '', password: '' },
  })

  const [username, password] = watch(['username', 'password'])
  const isDisabled = !username || !password || isLoading

  // 이미 로그인된 경우 대시보드로 이동
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: LoginInput) => {
    const success = await login(data)
    if (success) {
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <main className="flex h-screen">
      {/* 좌측 배경 이미지 영역 (데스크탑) */}
      <div className="hidden flex-1 lg:flex">
        <img
          src="/images/bo-bg.png"
          alt="background"
          className="h-full w-full object-cover"
        />
      </div>

      {/* 우측 로그인 폼 영역 */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* 로고 + 타이틀 */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <img src="/images/logo-icon.svg" alt="Logo" width={32} height={32} className="w-fit" />
            <h1 className="typo-headline2 weight-700">오더홉 관리자 로그인</h1>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* 아이디 인풋 */}
            <div className="relative">
              <Input
                {...register('username')}
                type="text"
                placeholder="아이디"
                className={error ? 'border-status-destructive pr-8' : 'pr-8'}
                autoComplete="username"
              />
              {username && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setValue('username', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 비밀번호 인풋 */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호"
                  className={error ? 'border-status-destructive pr-16' : 'pr-16'}
                  autoComplete="current-password"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setValue('password', '')}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {error && <p className="typo-body3 text-status-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isDisabled}
              className="w-full bg-black hover:bg-neutral-800"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
