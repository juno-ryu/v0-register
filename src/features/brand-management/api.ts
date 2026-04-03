import { axiosInstance } from '@/lib/axios'
import type { BrandListParams, BrandListResponse, BrandDetail, BrandForm } from '@/features/brand-management/schema'

/** 브랜드 API prefix */
const BRANDS_PREFIX = '/v1/b/brands'

/**
 * 브랜드 목록 조회
 * 레거시: api/modules/brands.ts brandList + store/brands/actions.ts fetchBrandList
 * GET /v1/b/brands
 */
export async function fetchBrandList(params: BrandListParams): Promise<BrandListResponse> {
  const response = await axiosInstance.get<BrandListResponse>(BRANDS_PREFIX, { params })
  return response.data
}

/**
 * 브랜드 상세 조회
 * 레거시: api/modules/brands.ts brandDetail + store/brands/actions.ts fetchBrandDetail
 * GET /v1/b/brands/:brandId
 */
export async function fetchBrandDetail(brandId: string | number): Promise<BrandDetail> {
  const response = await axiosInstance.get<BrandDetail>(`${BRANDS_PREFIX}/${brandId}`)
  return response.data
}

/**
 * 브랜드 생성
 * 레거시: api/modules/brands.ts brandCreate + store/brands/actions.ts createBrand
 * POST /v1/b/brands
 */
export async function createBrand(payload: BrandForm): Promise<BrandDetail> {
  const response = await axiosInstance.post<BrandDetail>(BRANDS_PREFIX, payload)
  return response.data
}

/**
 * 브랜드 수정
 * 레거시: api/modules/brands.ts brandUpdate + store/brands/actions.ts updateBrand
 * PATCH /v1/b/brands/:brandId
 */
export async function updateBrand(brandId: number, payload: Partial<BrandForm>): Promise<BrandDetail> {
  const response = await axiosInstance.patch<BrandDetail>(`${BRANDS_PREFIX}/${brandId}`, payload)
  return response.data
}
