import { useState } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { TableToolbar } from '@/components/common/table-toolbar'
import { PageLayout } from '@/components/layout/page-layout'
import { priceFormat } from '@/utils/price'
import { downloadDisbursementExcel } from '@/utils/excel'
import { MENU_TYPE } from '@/features/disbursement/schema'
import { useTransactions, useDisbursementSetSummary, useCancelMealTransaction } from '@/features/disbursement/queries'
import { fetchTransactionExcelData, fetchTransactionExcelDataForMeal } from '@/features/disbursement/api'
import { TransactionTable } from '@/features/disbursement/components/transaction-table'
import type { TransactionItem } from '@/features/disbursement/schema'

export const Route = createLazyFileRoute(
  '/_authenticated/disbursement-customers/$menuType/$setId',
)({
  component: TransactionListPage,
})

function TransactionListPage() {
  const navigate = useNavigate()
  const { menuType, setId } = Route.useParams()
  const isMeal = menuType === 'meal'
  const setIdNum = Number(setId)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [cancelTarget, setCancelTarget] = useState<TransactionItem | null>(null)

  const transactionParams = {
    operator_customer_company_disbursement_set: setIdNum,
    page,
    per_page: pageSize,
  }

  const { data: summary } = useDisbursementSetSummary(setIdNum)
  const { data, isLoading } = useTransactions(
    isMeal ? MENU_TYPE.MEAL : MENU_TYPE.FOOD,
    transactionParams,
  )

  const cancelMutation = useCancelMealTransaction(
    isMeal ? MENU_TYPE.MEAL : MENU_TYPE.FOOD,
    transactionParams,
  )

  const transactions = data?.results ?? []
  const totalCount = data?.count ?? 0

  const handlePageChange = (newPage: number) => setPage(newPage)

  const handleCancelClick = (item: TransactionItem) => {
    setCancelTarget(item)
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync(cancelTarget.id)
      setCancelTarget(null)
      toast.success('거래가 취소되었습니다.')
    } catch {
      toast.error('거래 취소 중 오류가 발생했습니다.')
    }
  }

  const handleExcelDownload = async () => {
    try {
      const params = { operator_customer_company_disbursement_set: setIdNum }
      const apiData = isMeal
        ? await fetchTransactionExcelDataForMeal(params)
        : await fetchTransactionExcelData(params)

      const storeName = summary?.store_name ?? ''
      const companyName = summary?.customer_company_name ?? ''
      const periodStart = summary?.disbursement_period_start ?? ''
      const [year, month] = periodStart.split('-')
      await downloadDisbursementExcel({ apiData, fileName: `${storeName}-${companyName}-정산월${year}${month}.xlsx` })
    } catch {
      toast.error('엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }


  return (
    <PageLayout>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 gap-1 typo-body3 text-muted-foreground"
        onClick={() => navigate({ to: '/disbursement-customers' })}
      >
        <ChevronLeft className="h-4 w-4" />
        지급 관리로 돌아가기
      </Button>

      {summary && (
        <div className="mb-4 border">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent hover:bg-accent">
                <TableHead className="typo-micro1 weight-600 text-muted-foreground">매장</TableHead>
                <TableHead className="typo-micro1 weight-600 text-muted-foreground">고객사</TableHead>
                <TableHead className="typo-micro1 weight-600 text-muted-foreground">정산기간</TableHead>
                <TableHead className="typo-micro1 weight-600 text-muted-foreground">총 주문</TableHead>
                <TableHead className="typo-micro1 weight-600 text-muted-foreground">총 고객사부담금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="h-12 typo-body3 text-key-blue">{summary.store_name ?? '-'}</TableCell>
                <TableCell className="h-12 typo-body3 text-key-blue">{summary.customer_company_name ?? '-'}</TableCell>
                <TableCell className="h-12 typo-body3 text-key-blue">
                  {summary.disbursement_period_start} ~ {summary.disbursement_period_end}
                </TableCell>
                <TableCell className="h-12 typo-body3 text-key-blue">
                  {summary.transaction_count != null
                    ? `${summary.transaction_count.toLocaleString()} 건`
                    : '-'}
                </TableCell>
                <TableCell className="h-12 typo-body3 text-key-blue">
                  {summary.total_burden_amounts != null
                    ? priceFormat(summary.total_burden_amounts.net_customer_company_burden_amount)
                    : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <TableToolbar
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        actions={[
          { icon: Download, label: '전체 엑셀 저장', onClick: handleExcelDownload, disabled: totalCount === 0 },
        ]}
      />

      <TransactionTable
        data={transactions}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        isMeal={isMeal}
        onPageChange={handlePageChange}
        onCancelClick={handleCancelClick}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        variant="success"
        title="거래 취소 확인"
        description={
          cancelTarget && (
            <div className="space-y-4">
              <p>선택한 급식 거래를 취소하시겠습니까?</p>
              <div className="space-y-1">
                <p><span className="weight-700">거래코드:</span> {cancelTarget.meal_order_sn ?? '-'}</p>
                <p><span className="weight-700">회원:</span> {cancelTarget.employee_name ?? '-'}</p>
              </div>
            </div>
          )
        }
        confirmLabel={cancelMutation.isPending ? '처리 중...' : '거래 취소하기'}
        cancelLabel="닫기"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </PageLayout>
  )
}
