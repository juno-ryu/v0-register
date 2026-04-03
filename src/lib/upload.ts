import { axiosInstance } from '@/lib/axios'

/**
 * S3 미디어 파일 업로드
 * 레거시: store/auth/actions.js uploadMediaFiles
 * POST /v1/b/upload-media-files
 *
 * @param files - 업로드할 파일 목록
 * @param location - S3 저장 경로 (예: 'brands', 'menus')
 * @returns 업로드된 파일 URL 목록
 */
export async function uploadMediaFiles(files: File[], location: string): Promise<string[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await axiosInstance.post<string[]>('/v1/b/upload-media-files', formData, {
    params: { location },
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}
