import { useQuery } from '@tanstack/react-query'

import { axiosInstance } from '@/lib/axios'
import { fetchBrandDetail } from '@/features/brand-management/api'
import {
  useAuthStore,
  selectIsBrandAccount,
  selectIsStoreAccount,
  selectIsManagementAccount,
  selectIsSettlementAccount,
  SETTLEMENT_USERNAME,
} from '@/store/useAuthStore'

// 매장 상세 조회 (매장 계정 전용)
// 레거시: GET /stores/{storeId}/information
interface StoreInformation {
  name?: string
  brand?: { id?: string | number; name?: string }
  is_open?: boolean
}

// 운영사 매장 상세 (brand 정보 포함)
// 레거시: GET /v1/b/management/stores/{storeId}
interface ManagementStoreDetail {
  brand?: {
    id?: string | number
    name?: string
    domain?: string
    is_active?: boolean
  }
}

async function fetchStoreInformation(storeId: string): Promise<StoreInformation> {
  const response = await axiosInstance.get<StoreInformation>(`/stores/${storeId}/information`)
  return response.data
}

async function fetchManagementStoreDetail(storeId: string): Promise<ManagementStoreDetail> {
  const response = await axiosInstance.get<ManagementStoreDetail>(`/v1/b/management/stores/${storeId}`)
  return response.data
}

// 계정 분류 라벨
export function useAccountTypeLabel(): string {
  const userName = useAuthStore((s) => s.userName)
  const isManagement = useAuthStore(selectIsManagementAccount)
  const isBrand = useAuthStore(selectIsBrandAccount)
  const isStore = useAuthStore(selectIsStoreAccount)

  if (userName === SETTLEMENT_USERNAME) return '정산'
  if (isManagement) return '운영사'
  if (isBrand) return '브랜드'
  if (isStore) return '매장'
  return ''
}

// 매장 계정: 매장 상세 정보 조회
export function useStoreInformation() {
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const isStore = useAuthStore(selectIsStoreAccount)

  return useQuery({
    queryKey: ['my-account', 'store-information', userStoreId],
    queryFn: () => fetchStoreInformation(userStoreId!),
    enabled: isStore && !!userStoreId,
    staleTime: 5 * 60 * 1000,
  })
}

// 매장 계정: management store detail (brand 정보 획득)
export function useManagementStoreDetail() {
  const userStoreId = useAuthStore((s) => s.userStoreId)
  const isStore = useAuthStore(selectIsStoreAccount)

  return useQuery({
    queryKey: ['my-account', 'management-store-detail', userStoreId],
    queryFn: () => fetchManagementStoreDetail(userStoreId!),
    enabled: isStore && !!userStoreId,
    staleTime: 5 * 60 * 1000,
  })
}

// 브랜드 계정: 브랜드 상세 조회
export function useMyBrandDetail() {
  const userBrandId = useAuthStore((s) => s.userBrandId)
  const isBrand = useAuthStore(selectIsBrandAccount)
  const isSettlement = useAuthStore(selectIsSettlementAccount)

  return useQuery({
    queryKey: ['my-account', 'brand-detail', userBrandId],
    queryFn: () => fetchBrandDetail(userBrandId!),
    // 브랜드 계정 또는 정산 계정(brandId 보유 시)
    enabled: (isBrand || isSettlement) && !!userBrandId,
    staleTime: 5 * 60 * 1000,
  })
}
