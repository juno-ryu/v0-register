import Cookies from 'js-cookie'
import { useState } from 'react'

import { useAuthStore } from '@/store/useAuthStore'
import { parseJwt } from '@/utils/jwt'

import { authApi } from '@/features/auth/api'
import type { LoginInput } from '@/features/auth/schema'

// 쿠키에서 refreshToken 읽어 자동 로그인 시도
// 레거시 tryAutoLogin action 대응
export const tryAutoLogin = async (): Promise<boolean> => {
  const refreshToken = Cookies.get('arabiz-refresh-token')
  if (!refreshToken) return false

  try {
    const { access, refresh } = await authApi.refresh(refreshToken)
    const payload = parseJwt(access)

    useAuthStore.getState().setAuth({
      accessToken: access,
      refreshToken: refresh,
      isSuperUser: payload.is_superuser,
      userName: payload.username,
      managementId: payload.management,
      userBrandId: payload.brand,
      userStoreId: payload.store,
    })
    return true
  } catch {
    useAuthStore.getState().signOut()
    return false
  }
}

// 로그인 훅
export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.login(data)
      // 레거시 postToken과 동일: API response body에서 management/brand/store 직접 추출
      useAuthStore.getState().setAuth({
        accessToken: response.access,
        refreshToken: response.refresh,
        isSuperUser: response.is_superuser,
        userName: response.username,
        managementId: response.management,
        userBrandId: response.brand,
        userStoreId: response.store,
      })
      return true
    } catch {
      setError('아이디와 비밀번호가 일치하지 않습니다.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
