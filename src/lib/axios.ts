import axios from 'axios'

import { useAuthStore } from '@/store/useAuthStore'

import { env } from '@/lib/env'

export const axiosInstance = axios.create({
  baseURL: env.VITE_BASE_URL,
  timeout: 60_000,
  timeoutErrorMessage: 'timeout',
  // 배열 파라미터를 key=v1,v2,v3 형식으로 직렬화 (레거시 API 호환)
  paramsSerializer: (params) => {
    const parts: string[] = []
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        parts.push(`${encodeURIComponent(key)}=${value.map(encodeURIComponent).join(',')}`)
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
    return parts.join('&')
  },
})

// 중복 요청 취소 관리
const pendingRequests = new Map<string, AbortController>()

const getRequestKey = (config: {
  method?: string
  url?: string
  params?: unknown
  data?: unknown
}) => {
  const { url, method, params, data } = config
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`
}

const cancelPendingRequest = (requestKey: string) => {
  const controller = pendingRequests.get(requestKey)
  if (controller) {
    controller.abort()
    pendingRequests.delete(requestKey)
  }
}

// 요청 인터셉터
axiosInstance.interceptors.request.use((config) => {
  // 인증 토큰 주입
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // BLOB 응답은 중복 취소 건너뛰기
  if (config.responseType === 'blob') {
    return config
  }

  // 중복 요청 취소
  const requestKey = getRequestKey(config)
  cancelPendingRequest(requestKey)

  const controller = new AbortController()
  config.signal = controller.signal
  pendingRequests.set(requestKey, controller)

  return config
})

// 401 동시 요청 시 중복 리다이렉트 방지 플래그
let isRedirecting = false

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config)
    pendingRequests.delete(requestKey)
    return response
  },
  (error) => {
    // 완료된 요청 Map에서 제거 (에러 포함)
    if (error.config) {
      const requestKey = getRequestKey(error.config)
      pendingRequests.delete(requestKey)
    }

    // 취소된 요청은 조용히 처리
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const url = error.config?.url ?? ''

    // /token 엔드포인트(로그인 API) 실패는 제외 — useLogin에서 에러 처리
    // /token/refresh 실패는 자동 로그인 실패이므로 포함
    const isLoginEndpoint = url === '/token'

    if (status === 401 && !isLoginEndpoint && !isRedirecting) {
      isRedirecting = true
      useAuthStore.getState().signOut()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)
