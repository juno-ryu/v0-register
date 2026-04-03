import { z } from 'zod'
import { MEMBER_STATUS } from '@/features/customers/schema'
import type { SelectOption } from '@/components/common/filter/constants'

export const membershipCustomerFilterSchema = z.object({
  search_key: z.string(),
  q: z.string(),
  customer_company_ids: z.array(z.string()),
  status: z.array(z.string()),
})

export type MembershipCustomerFilterValues = z.infer<typeof membershipCustomerFilterSchema>

export function getDefaultMembershipCustomerFilter(): MembershipCustomerFilterValues {
  return {
    search_key: 'membership_customer_name',
    q: '',
    customer_company_ids: [],
    // 레거시 동일: 활성/중지/비밀번호재설정 3개 기본 선택, 삭제 제외
    status: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.STOPPED, MEMBER_STATUS.PASSWORD_SET_REQUIRED],
  }
}

export const SEARCH_KEY_OPTIONS: SelectOption[] = [
  { value: 'membership_customer_name', label: '회원명' },
  { value: 'employee_number', label: '회원번호' },
  { value: 'phone_number', label: '연락처' },
  { value: 'card_number', label: '카드번호' },
  { value: 'sn', label: 'RFID' },
]

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: MEMBER_STATUS.ACTIVE, label: '활성' },
  { value: MEMBER_STATUS.STOPPED, label: '중지' },
  { value: MEMBER_STATUS.PASSWORD_SET_REQUIRED, label: '비밀번호재설정' },
  { value: MEMBER_STATUS.DELETED, label: '삭제' },
]
