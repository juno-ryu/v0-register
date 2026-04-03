import { z } from 'zod'
import type { SelectOption } from '@/components/common/filter/constants'

export const normalCustomerFilterSchema = z.object({
  search_key: z.enum(['phone_number', 'name', 'user_id']),
  q: z.string(),
  registered_store_ids: z.array(z.string()),
  // 광고수신동의: ['true', 'false'] = 전체, ['true'] = 동의, ['false'] = 동의안함, [] = 전체
  is_subscribed: z.array(z.string()),
})

export type NormalCustomerFilterValues = z.infer<typeof normalCustomerFilterSchema>

export function getDefaultNormalCustomerFilter(): NormalCustomerFilterValues {
  return {
    search_key: 'phone_number',
    q: '',
    registered_store_ids: [],
    is_subscribed: ['true', 'false'],
  }
}

export const SEARCH_KEY_OPTIONS: SelectOption[] = [
  { value: 'phone_number', label: '연락처' },
  { value: 'name', label: '이름' },
  { value: 'user_id', label: '고객번호' },
]

export const IS_SUBSCRIBED_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'true', label: '동의' },
  { value: 'false', label: '동의하지 않음' },
]
