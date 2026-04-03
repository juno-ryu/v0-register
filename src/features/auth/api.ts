import { axiosInstance } from '@/lib/axios'

import type { LoginInput, TokenResponse, TokenRefreshResponse } from '@/features/auth/schema'

export const authApi = {
  // POST /token - 로그인
  login: (data: LoginInput) =>
    axiosInstance.post<TokenResponse>('/token', data).then((res) => res.data),

  // POST /token/refresh - 액세스 토큰 갱신
  refresh: (refreshToken: string) =>
    axiosInstance
      .post<TokenRefreshResponse>('/token/refresh', { refresh: refreshToken })
      .then((res) => res.data),
}
