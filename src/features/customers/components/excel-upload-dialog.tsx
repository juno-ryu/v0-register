import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import { Paperclip, X, Download, Upload } from 'lucide-react'
import { BaseDialog, BaseRow } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table'
import { useMembershipCustomerBulkUpload } from '@/features/customers/queries'
import { useStoreList } from '@/hooks/useCommonQueries'
import { LoadingOverlay } from '@/components/common/loading-overlay'

// 업로드 결과 응답 타입
interface UploadResult {
  total_data_count: number
  new_membership_customer_count: number
  updated_membership_customer_count: number
  failed_data_count: number
  result_excel_url: string | null
  result_detail: string[][] | null
}

interface ExcelUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
}

// 처리 상세 내역 행 타입
interface ResultDetailRow {
  memberNo: string
  memberName: string
  phone: string
  cardNo: string
  rfid: string
  org: string
  dept: string
  status: string
  reason: string
}

// 처리결과 값 → 뱃지 배경색
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case '신규':
      return 'bg-[#28a745] text-white'
    case '수정':
      return 'bg-[#007bff] text-white'
    case '실패':
      return 'bg-status-destructive text-white'
    default:
      return 'bg-accent text-muted-foreground'
  }
}

// 처리결과 값 → 행 배경색
function getRowBgStyle(status: string): string {
  switch (status) {
    case '신규':
      return 'bg-green-50'
    case '수정':
      return 'bg-key-blue/10'
    case '실패':
      return 'bg-red-50'
    default:
      return ''
  }
}

// 처리 상세 내역 컬럼 정의
const resultDetailColumns: ColumnDef<ResultDetailRow>[] = [
  { accessorKey: 'memberNo', header: '회원번호', size: 100, meta: { align: 'center' } },
  { accessorKey: 'memberName', header: '회원명', size: 90, meta: { align: 'center' } },
  { accessorKey: 'phone', header: '연락처', size: 130, meta: { align: 'center' } },
  { accessorKey: 'cardNo', header: '카드번호', size: 110, meta: { align: 'center' } },
  { accessorKey: 'rfid', header: 'RFID', size: 90, meta: { align: 'center' } },
  { accessorKey: 'org', header: '소속', size: 100, meta: { align: 'center' } },
  { accessorKey: 'dept', header: '부서', size: 60, meta: { align: 'center' } },
  {
    accessorKey: 'status',
    header: '처리결과',
    size: 70,
    meta: { align: 'center' },
    cell: ({ getValue }) => {
      const status = getValue() as string
      return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs weight-600 ${getStatusBadgeStyle(status)}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: '사유',
    size: 250,
    meta: { align: 'left' },
    cell: ({ getValue }) => (
      <span className="text-status-destructive text-[13px]">{getValue() as string}</span>
    ),
  },
]


export function ExcelUploadDialog({ open, onOpenChange, brandId }: ExcelUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 매장 선택
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const { data: stores = [] } = useStoreList(brandId)

  // 파일 & 파싱 데이터
  const [file, setFile] = useState<File | null>(null)
  const [attachedData, setAttachedData] = useState<object[]>([])

  // 업로드 결과
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [selectedStoreName, setSelectedStoreName] = useState<string>('')

  const { mutate: bulkUpload, isPending } = useMembershipCustomerBulkUpload()

  // 파일 선택 트리거
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // 파일 파싱 (A~G 컬럼만, 레거시 동일)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const XLSX = await import('xlsx-js-style')

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // A~G 컬럼(0~6)만 읽기
      const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')
      range.s.c = 0
      range.e.c = 6
      const newRange = XLSX.utils.encode_range(range)

      const jsonData = XLSX.utils.sheet_to_json<object>(worksheet, {
        defval: '',
        raw: false,
        range: newRange,
      })

      setFile(selected)
      setAttachedData(jsonData)
    }
    reader.readAsArrayBuffer(selected)

    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = ''
  }

  // 파일 제거
  const handleRemoveFile = () => {
    setFile(null)
    setAttachedData([])
  }

  // 등록 버튼
  const handleSubmit = () => {
    if (!selectedStoreId || !file || attachedData.length === 0) return

    const payload = {
      total_data_count: attachedData.length,
      data: attachedData.map((row) => Object.values(row)),
    }

    bulkUpload(
      {
        brandId,
        storeId: selectedStoreId,
        data: payload,
      },
      {
        onSuccess: (result) => {
          setUploadResult(result as UploadResult)
          const store = stores.find((s) => String(s.id) === selectedStoreId)
          setSelectedStoreName(store?.name ?? '')
        },
      },
    )
  }

  // 결과 엑셀 다운로드 (레거시 동일)
  const handleDownloadResult = () => {
    if (!uploadResult?.result_excel_url) {
      toast.warning('다운로드 파일이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    const a = document.createElement('a')
    a.href = uploadResult.result_excel_url
    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2)
    a.download = `${formattedDate}_${selectedStoreName}_업로드결과.xlsx`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 다이얼로그 닫기 시 상태 초기화
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFile(null)
      setAttachedData([])
      setSelectedStoreId('')
      setUploadResult(null)
      setSelectedStoreName('')
    }
    onOpenChange(nextOpen)
  }

  // result_detail → DataTable용 객체 배열 변환
  const resultDetailData = useMemo<ResultDetailRow[]>(() => {
    if (!uploadResult?.result_detail) return []
    return uploadResult.result_detail.map((item) => ({
      memberNo: item[0] || '-',
      memberName: item[1] || '-',
      phone: item[2] || '-',
      cardNo: item[3] || '-',
      rfid: item[4] || '-',
      org: item[5] || '-',
      dept: item[6] || '-',
      status: item[7] || '-',
      reason: item[8] || '-',
    }))
  }, [uploadResult?.result_detail])

  const isAfterUpload = uploadResult !== null
  const canSubmit = !!selectedStoreId && !!file && attachedData.length > 0 && !isPending

  return (
    <BaseDialog
      open={open}
      onClose={() => handleOpenChange(false)}
      title={isAfterUpload ? '엑셀 업로드 결과' : '회원 엑셀 업로드 (등록/수정)'}
      widthClass="w-full max-w-[600px]"
      footer={
        isAfterUpload ? (
          <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
            닫기
          </Button>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
              {isPending ? '등록 중...' : '등록'}
            </Button>
          </>
        )
      }
    >
      <LoadingOverlay show={isPending} />
      {/* 스크롤 바디 */}
      <div className="p-4">
          {/* ── BeforeUpload ── */}
          {!isAfterUpload && (
            <div>
              {/* 양식 다운로드 */}
              <BaseRow label="양식 다운로드" className="py-4">
                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        'https://delivery-static.arabiz.live/media/2024/고객사회원등록엑셀양식.xlsx',
                      )
                    }
                  >
                    <Download className="mr-1 h-4 w-4" />
                    다운로드
                  </Button>
                </div>
              </BaseRow>

              <div className="border-t border-dashed border-border" />

              {/* 매장 선택 */}
              <BaseRow label={<>매장 <span className="text-status-destructive">(필수)</span></>} className="py-4">
                <div className="flex-1 space-y-1.5">
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="매장 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={String(store.id)}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">회원이 이용할 매장을 선택해 주세요.</p>
                </div>
              </BaseRow>

              <div className="border-t border-dashed border-border" />

              {/* 업로드 파일 */}
              <BaseRow label={<>업로드 파일 <span className="text-status-destructive">(필수)</span></>} className="py-4">
                {file ? (
                  /* 파일 선택 후 */
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 px-4 py-2 border border-key-blue rounded-full w-fit">
                      <Paperclip className="h-4 w-4 text-key-blue" />
                      <span className="typo-body3">{file.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-1 text-key-blue"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="typo-body3 weight-700 text-muted-foreground bg-muted px-3 py-1 rounded-lg w-fit">
                      회원 데이터 총 {attachedData.length} 건
                    </p>
                  </div>
                ) : (
                  /* 파일 미선택 */
                  <div className="flex-1 space-y-3">
                    <Button variant="default" className="w-full" onClick={handleTriggerFileInput}>
                      <Upload className="mr-1 h-4 w-4" />
                      파일 선택
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      <li>- 업로드 가능 파일 형식: .xlsx</li>
                      <li>- 최대 업로드 건수: 1,000 건</li>
                      <li>- 최대 파일 크기: 2 MB</li>
                    </ul>
                  </div>
                )}
              </BaseRow>
            </div>
          )}

          {/* ── AfterUpload ── */}
          {isAfterUpload && uploadResult && (
            <div className="space-y-4">
              {/* 결과 요약 테이블 */}
              <div className="flex items-center justify-between">
                <span className="weight-700 typo-body2">회원 등록/수정 결과</span>
                {uploadResult.total_data_count > 0 && (
                  <Button variant="outline" size="sm" onClick={handleDownloadResult}>
                    <Download className="mr-1 h-4 w-4" />
                    결과 다운로드
                  </Button>
                )}
              </div>

              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-3 py-2">총 건수</th>
                    <th className="border border-border px-3 py-2">신규 등록</th>
                    <th className="border border-border px-3 py-2">정보 수정</th>
                    <th className="border border-border px-3 py-2">등록 실패</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2">
                      {uploadResult.total_data_count ? `${uploadResult.total_data_count} 건` : '-'}
                    </td>
                    <td className="border border-border px-3 py-2">
                      {uploadResult.new_membership_customer_count
                        ? `${uploadResult.new_membership_customer_count} 건`
                        : '-'}
                    </td>
                    <td className="border border-border px-3 py-2">
                      {uploadResult.updated_membership_customer_count
                        ? `${uploadResult.updated_membership_customer_count} 건`
                        : '-'}
                    </td>
                    <td className="border border-border px-3 py-2">
                      {uploadResult.failed_data_count
                        ? `${uploadResult.failed_data_count} 건`
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 처리 상세 내역 (result_detail 있을 때만) */}
              {resultDetailData.length > 0 && (
                <>
                  <Separator className="border-dashed" />
                  <p className="weight-700 typo-body2">처리 상세 내역</p>
                  <DataTable
                    columns={resultDetailColumns}
                    data={resultDetailData}
                    getRowClassName={(row) => getRowBgStyle(row.status)}
                  />
                </>
              )}
            </div>
          )}
      </div>
    </BaseDialog>
  )
}
