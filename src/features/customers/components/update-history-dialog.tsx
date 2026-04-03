import { RefreshCw, Download } from 'lucide-react'
import { BaseDialog } from '@/components/common/base-dialog'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { DataTablePagination } from '@/components/common/data-table-pagination'
import type { ColumnDef } from '@tanstack/react-table'
import { useMembershipSyncLogs } from '@/features/customers/queries'
import { formatDate } from '@/utils/date'
import { useState } from 'react'

// sync_type 변환 (레거시 MEMBERSHIP_SYNC_TYPE_TEXT)
const SYNC_TYPE_TEXT: Record<string, string> = {
  AUTO_SYNC: '동기화(자동)',
  MANUAL_SYNC: '동기화(수동)',
  FILE_UPLOAD: '파일업로드',
}

interface MembershipSyncLog {
  id: number
  completed_at: string
  sync_type: string
  total: number
  no_changed: number
  new: number
  updated: number
  failed: number
  excel_url: string | null
}

interface UpdateHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string | number
  onExcelUploadClick: () => void
}

const columns: ColumnDef<MembershipSyncLog>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 50,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.id}</span>
    ),
  },
  {
    accessorKey: 'completed_at',
    header: '완료 일시',
    size: 172,
    cell: ({ row }) => (
      <span className="text-sm whitespace-pre-line">
        {row.original.completed_at
          ? formatDate(row.original.completed_at, 'yyyy/MM/dd HH:mm:ss')
          : '-'}
      </span>
    ),
  },
  {
    accessorKey: 'sync_type',
    header: '분류',
    size: 104,
    cell: ({ row }) => (
      <span className="text-sm">
        {SYNC_TYPE_TEXT[row.original.sync_type] ?? row.original.sync_type}
      </span>
    ),
  },
  {
    accessorKey: 'total',
    header: '전체',
    size: 84,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.total?.toLocaleString() ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'no_changed',
    header: '변경없음',
    size: 84,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.no_changed?.toLocaleString() ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'new',
    header: '신규',
    size: 84,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.new?.toLocaleString() ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'updated',
    header: '수정',
    size: 84,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.updated?.toLocaleString() ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'failed',
    header: '실패',
    size: 84,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.failed?.toLocaleString() ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'excel_url',
    header: '저장',
    size: 80,
    meta: { align: 'center' },
    cell: ({ row }) => {
      const url = row.original.excel_url
      const id = row.original.id
      const completedAt = row.original.completed_at
        ? formatDate(row.original.completed_at, 'yyyyMMdd_HHmmss')
        : ''

      if (!url) {
        return (
          <Button size="sm" variant="ghost" disabled className="h-7 w-7 p-0">
            <Download className="h-4 w-4" />
          </Button>
        )
      }

      return (
        <a
          href={url}
          download={`sync_log_${id}_${completedAt}.xlsx`}
          target="_blank"
          rel="noreferrer"
        >
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Download className="h-4 w-4" />
          </Button>
        </a>
      )
    },
  },
]

export function UpdateHistoryDialog({
  open,
  onOpenChange,
  brandId,
  onExcelUploadClick,
}: UpdateHistoryDialogProps) {
  const [page, setPage] = useState(1)
  const perPage = 10

  const { data, isLoading, refetch, isFetching } = useMembershipSyncLogs(
    brandId,
    { page, per_page: perPage },
  )

  const logs = (data?.results ?? []) as MembershipSyncLog[]
  const totalCount = data?.count ?? 0

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setPage(1)
    onOpenChange(nextOpen)
  }

  const handleExcelUpload = () => {
    handleOpenChange(false)
    onExcelUploadClick()
  }

  return (
    <BaseDialog
      open={open}
      onClose={() => handleOpenChange(false)}
      title="고객사 회원 업데이트 내역"
      widthClass="max-w-4xl"
      footer={
        <div className="flex flex-col w-full gap-4">
          {totalCount > 0 && (
            <div>
              <DataTablePagination
                totalCount={totalCount}
                page={page}
                pageSize={perPage}
                onPageChange={setPage}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
            <Button className="flex-1" onClick={handleExcelUpload}>
              엑셀 업로드
            </Button>
          </div>
        </div>
      }
    >
      {/* 스크롤 바디 — 테이블만 */}
      <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="typo-body3 weight-700 text-foreground">업데이트 내역</span>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={logs}
            totalCount={totalCount}
            page={page}
            pageSize={perPage}
            isLoading={isLoading}
          />
      </div>
    </BaseDialog>
  )
}
