import { z } from 'zod'

export const loginInputSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

// API POST /token 응답 스키마
export const tokenResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  is_superuser: z.boolean(),
  username: z.string(),
  management: z.string().nullable(),
  brand: z.string().nullable(),
  store: z.string().nullable(),
})

// POST /token/refresh 응답 스키마
export const tokenRefreshResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type TokenResponse = z.infer<typeof tokenResponseSchema>
export type TokenRefreshResponse = z.infer<typeof tokenRefreshResponseSchema>
