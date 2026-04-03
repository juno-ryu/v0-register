import { z } from 'zod'

const envSchema = z.object({
  VITE_BASE_URL: z.string().url(),
  VITE_DOMAIN_NAME: z.string(),
})

export const env = envSchema.parse(import.meta.env)
