import { useState, useMemo, Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { format, startOfMonth, endOfMonth, addDays, addWeeks, startOfWeek, endOfWeek, isSameDay, isSameWeek, isSameMonth } from 'date-fns'
import { Download } from 'lucide-react'
import { FilterSection } from '@/components/common/filter-section'
import { DisbursementFilter } from '@/components/common/filter/disbursement-filter/disbursement-filter'
import { type DisbursementFilterValues, DISBURSEMENT_FILTER_DEFAULTS } from '@/components/common/filter/disbursement-filter/constants'
import { TableToolbar } from '@/components/common/table-toolbar'
import { TermSelector } from '@/components/common/term-selector'
import { DisbursementTable } from '@/features/disbursement/components/disbursement-table'
import { useDisbursementSets } from '@/features/disbursement/queries'
import { fetchDisbursementExcelDataByMenuType } from '@/features/disbursement/api'
import { MENU_TYPE } from '@/features/disbursement/schema'
import type { DisbursementSetItem, DisbursementSetsParams, MenuType } from '@/features/disbursement/schema'
import type { DateRange } from 'react-day-picker'
import { priceFormat } from '@/utils/price'
import { PageLayout } from '@/components/layout/page-layout'
import { downloadDisbursementExcel } from '@/utils/excel'
import { useAuthStore } from '@/store/useAuthStore'
import { useBrandList } from '@/hooks/useCommonQueries'

type TermMode = 'daily' | 'weekly' | 'monthly' | 'custom'

const TERM_OPTIONS = [
  { value: 'monthly', label: '월간' },
  { value: 'custom', label: '기간선택' },
]

function getMonthRange(year: number, month: number) {
  const base = new Date(year, month, 1)
  return {
    start: format(startOfMonth(base), 'yyyy-MM-dd'),
    end: format(endOfMonth(base), 'yyyy-MM-dd'),
  }
}

interface DisbursementTabProps {
  menuType: MenuType
}

export function DisbursementTab({ menuType }: DisbursementTabProps) {
  const navigate = useNavigate()
  const userBrandId = useAuthStore((s) => s.userBrandId)
  const { data: brandList = [] } = useBrandList()
  const brandName = brandList.find((b) => b.id === userBrandId)?.name ?? '전체'

  const now = new Date()
  const [termMode, setTermMode] = useState<TermMode>('monthly')

  // 일간
  const [dailyDate, setDailyDate] = useState(now)
  // 주간
  const [weekDate, setWeekDate] = useState(startOfWeek(now, { weekStartsOn: 1 }))
  // 월간
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  // 기간선택
  const [customRange, setCustomRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })

  const { start: monthStart, end: monthEnd } = useMemo(
    () => getMonthRange(year, month),
    [year, month],
  )

  // 모드별 기간 계산
  const { startDate, endDate } = useMemo(() => {
    switch (termMode) {
      case 'daily':
        return { startDate: format(dailyDate, 'yyyy-MM-dd'), endDate: format(dailyDate, 'yyyy-MM-dd') }
      case 'weekly':
        return { startDate: format(weekDate, 'yyyy-MM-dd'), endDate: format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') }
      case 'monthly':
        return { startDate: monthStart, endDate: monthEnd }
      case 'custom':
        return {
          startDate: customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : monthStart,
          endDate: customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : monthEnd,
        }
      default:
        return { startDate: monthStart, endDate: monthEnd }
    }
  }, [termMode, dailyDate, weekDate, monthStart, monthEnd, customRange])

  const form = useForm<DisbursementFilterValues>({ defaultValues: DISBURSEMENT_FILTER_DEFAULTS })
  const [filterParams, setFilterParams] = useState<Partial<DisbursementSetsParams>>({})

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isDownloading, setIsDownloading] = useState(false)

  const queryParams: DisbursementSetsParams = {
    disbursement_period_start: startDate,
    disbursement_period_end: endDate,
    menu_type: menuType,
    page,
    per_page: pageSize,
    ...filterParams,
  }

  const { data, isLoading } = useDisbursementSets(queryParams)

  const items = data?.results ?? []
  const totalCount = data?.count ?? 0
  const totalOrderCount = data?.total_number_of_orders_in_disbursements ?? 0
  const totalCustomerCompanyAmount = data?.total_net_customer_company_burden_amount ?? 0

  // ─── 필터 ───
  const handleFilterSubmit = (values: DisbursementFilterValues) => {
    setFilterParams({
      store_ids: values.store_ids.length > 0 ? values.store_ids.join(',') : undefined,
      customer_company_ids: values.customer_company_ids.length > 0 ? values.customer_company_ids.join(',') : undefined,
      disbursement_status: values.disbursement_status.length > 0 ? values.disbursement_status.join(',') : undefined,
    })
    setPage(1)
  }

  const handleFilterReset = () => {
    setFilterParams({})
    setPage(1)
  }

  // ─── 기간 네비게이션 ───
  const handlePrevDay = () => { setDailyDate((d) => addDays(d, -1)); setPage(1) }
  const handleNextDay = () => { setDailyDate((d) => addDays(d, 1)); setPage(1) }
  const isDailyNextDisabled = isSameDay(dailyDate, now)

  const handlePrevWeek = () => { setWeekDate((d) => addWeeks(d, -1)); setPage(1) }
  const handleNextWeek = () => { setWeekDate((d) => addWeeks(d, 1)); setPage(1) }
  const isWeeklyNextDisabled = isSameWeek(weekDate, now, { weekStartsOn: 1 })

  const handlePrevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else { setMonth((m) => m - 1) }
    setPage(1)
  }
  const handleNextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else { setMonth((m) => m + 1) }
    setPage(1)
  }
  const isMonthlyNextDisabled = isSameMonth(new Date(year, month), now)

  const getPrev = () => termMode === 'daily' ? handlePrevDay : termMode === 'weekly' ? handlePrevWeek : handlePrevMonth
  const getNext = () => termMode === 'daily' ? handleNextDay : termMode === 'weekly' ? handleNextWeek : handleNextMonth
  const getNextDisabled = () => termMode === 'daily' ? isDailyNextDisabled : termMode === 'weekly' ? isWeeklyNextDisabled : termMode === 'monthly' ? isMonthlyNextDisabled : undefined

  const getDisplayText = () => {
    switch (termMode) {
      case 'daily':
        return isSameDay(dailyDate, now) ? '오늘' : format(dailyDate, 'yy/MM/dd')
      case 'weekly':
        return `${format(weekDate, 'yy/MM/dd')}~${format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yy/MM/dd')}`
      case 'monthly':
        return `${year}년 ${month + 1}월`
      case 'custom':
        return customRange?.from && customRange?.to
          ? `${format(customRange.from, 'yy/MM/dd')} ~ ${format(customRange.to, 'yy/MM/dd')}`
          : '기간을 선택하세요'
      default:
        return ''
    }
  }

  // ─── 행 클릭 ───
  const handleTransactionCountClick = (item: DisbursementSetItem) => {
    if (!item.id) return
    const menuTypePath = menuType === MENU_TYPE.MEAL ? 'meal' : 'food-and-beverage'
    navigate({
      to: '/disbursement-customers/$menuType/$setId',
      params: { menuType: menuTypePath, setId: String(item.id) },
    })
  }

  // ─── 엑셀 다운로드 ───
  const handleDownloadExcel = async () => {
    if (isDownloading || totalCount === 0) return
    setIsDownloading(true)
    try {
      const apiData = await fetchDisbursementExcelDataByMenuType(menuType, {
        disbursement_period_start: startDate,
        disbursement_period_end: endDate,
      })
      const typeName = menuType === MENU_TYPE.MEAL ? '급식' : '식음료'
      const dateLabel = format(new Date(year, month), 'yyyyMM')
      await downloadDisbursementExcel({ apiData, fileName: `${typeName}-${brandName}-${dateLabel}.xlsx` })
    } catch {
      toast.error('파일 다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Fragment>
      <PageLayout className="pb-0 max-md:px-0 max-md:pt-0">
        <FilterSection
          form={form}
          defaultValues={DISBURSEMENT_FILTER_DEFAULTS}
          onSubmit={handleFilterSubmit}
          onReset={handleFilterReset}
        >
          <DisbursementFilter />
        </FilterSection>
      </PageLayout>
      <PageLayout>
        <TermSelector
          termOptions={TERM_OPTIONS}
          term={termMode}
          onTermChange={(v) => setTermMode(v as TermMode)}
          displayText={getDisplayText()}
          onPrev={getPrev()}
          onNext={getNext()}
          isNextDisabled={getNextDisabled()}
          isCustomMode={termMode === 'custom'}
          customRange={customRange}
          onCustomRangeChange={(range) => { setCustomRange(range); setPage(1) }}
        />

        <TableToolbar
          totalCount={totalOrderCount}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          actions={[
            { label: isDownloading ? '다운로드 중...' : '전체 저장', onClick: handleDownloadExcel, disabled: isDownloading || totalCount === 0, icon: Download },
          ]}
          summarySlot={
            <p className="typo-body3 text-muted-foreground">
              총 거래{' '}
              <span className="weight-600 text-key-blue">{totalOrderCount.toLocaleString()}</span>
              건&nbsp;&nbsp;총 고객사정산금액:{' '}
              <span className="weight-600 text-key-blue">{priceFormat(totalCustomerCompanyAmount)}</span>
              원
            </p>
          }
        />

        <DisbursementTable
          data={items}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          isMeal={menuType === MENU_TYPE.MEAL}
          onPageChange={(p) => setPage(p)}
          onDetailClick={handleTransactionCountClick}
        />
      </PageLayout>
    </Fragment>
  )
}
