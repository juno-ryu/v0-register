import { useState, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download } from 'lucide-react'
import { DataTable } from '@/components/common/data-table'
import { TableToolbar } from '@/components/common/table-toolbar'
import {
  CATEGORY_EXPAND_TYPE,
  CATEGORY_EXPAND_OPTIONS,
  ORDERING_OPTIONS,
  ROW_TYPE,
  STATISTICS_TYPE,
} from '@/features/statistics/schema'
import type {
  StatisticsCategoryRow,
  StatisticsRow,
  CategoryExpandType,
  StatisticsType,
} from '@/features/statistics/schema'

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatCurrency(value: number): string {
  return `${value.toLocaleString()}원`
}

function formatDiscountQuantity(qty: number, total: number): string {
  const ratio = total === 0 ? 0 : (qty / total) * 100
  return `${qty} (${ratio.toFixed(2)}%)`
}

function formatDiscountPrice(price: number, total: number): string {
  const ratio = total === 0 ? 0 : (price / total) * 100
  return `${formatCurrency(price)} (${ratio.toFixed(2)}%)`
}

// ─────────────────────────────────────────────
// 행 펼치기
// ─────────────────────────────────────────────
function buildFlatRows(
  categories: StatisticsCategoryRow[],
  expandType: CategoryExpandType,
  orderingType: string,
): StatisticsRow[] {
  const sortField = orderingType.startsWith('-') ? orderingType.slice(1) : orderingType
  const isDescending = !orderingType.startsWith('-')
  const multiplier = isDescending ? -1 : 1

  const compareFn = (a: StatisticsRow, b: StatisticsRow) => {
    if (sortField === 'product_name') {
      const aName = (('menu_name' in a ? a.menu_name : null) ?? ('option_name' in a ? a.option_name : null) ?? '') as string
      const bName = (('menu_name' in b ? b.menu_name : null) ?? ('option_name' in b ? b.option_name : null) ?? '') as string
      return multiplier * aName.localeCompare(bName)
    }
    const aVal = Number((a as unknown as Record<string, unknown>)[sortField]) || 0
    const bVal = Number((b as unknown as Record<string, unknown>)[sortField]) || 0
    return multiplier * (aVal - bVal)
  }

  if (expandType === CATEGORY_EXPAND_TYPE.CATEGORY) {
    const sorted = [...categories].sort((a, b) => {
      if (sortField === 'product_name') {
        return multiplier * (a.category_name ?? '').localeCompare(b.category_name ?? '')
      }
      return multiplier * ((a[sortField as keyof typeof a] as number) - (b[sortField as keyof typeof b] as number))
    })
    return sorted.flatMap((cat) => [cat, ...[...cat.items].sort(compareFn)])
  }

  return categories.flatMap((cat) => cat.items).sort(compareFn)
}

// ─────────────────────────────────────────────
// 요약 통계
// ─────────────────────────────────────────────
function calcSummary(categories: StatisticsCategoryRow[]) {
  return categories.reduce(
    (acc, cat) => {
      for (const item of cat.items) {
        acc.totalQuantity += item.total_quantity
        acc.totalPrice += item.total_price
        acc.totalDiscountQty += item.total_membership_discounted_quantity
        acc.totalDiscountPrice += item.total_membership_discounted_price
      }
      return acc
    },
    { totalQuantity: 0, totalPrice: 0, totalDiscountQty: 0, totalDiscountPrice: 0 },
  )
}

// ─────────────────────────────────────────────
// 셀 값 추출
// ─────────────────────────────────────────────
function getNameValue(row: StatisticsRow, isProductSales: boolean): string {
  if (row.type === ROW_TYPE.CATEGORY) {
    return isProductSales
      ? (row.menu_category_name ?? row.category_name)
      : (row.option_category_name ?? row.category_name)
  }
  return isProductSales ? (row.menu_name ?? '') : (row.option_name ?? '')
}

function getCategoryValue(row: StatisticsRow, isProductSales: boolean): string {
  if (row.type === ROW_TYPE.CATEGORY) return ''
  return isProductSales ? (row.menu_category_name ?? '') : (row.option_category_name ?? '')
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface StatisticsTableProps {
  data: StatisticsCategoryRow[]
  statisticsType: StatisticsType
  fromDate: string
  toDate: string
  storeName?: string
  isLoading?: boolean
  onDownloadExcel: () => void
}

export function StatisticsTable({
  data,
  statisticsType,
  isLoading,
  onDownloadExcel,
}: StatisticsTableProps) {
  const [expandType, setExpandType] = useState<CategoryExpandType>(CATEGORY_EXPAND_TYPE.CATEGORY)
  const [orderingType, setOrderingType] = useState(ORDERING_OPTIONS[0].value)

  const isProductSales = statisticsType === STATISTICS_TYPE.PRODUCT_SALES
  const summary = useMemo(() => calcSummary(data), [data])
  const flatRows = useMemo(
    () => buildFlatRows(data, expandType, orderingType),
    [data, expandType, orderingType],
  )

  const showCategoryCol = expandType === CATEGORY_EXPAND_TYPE.EXPAND
  const nameHeader = isProductSales ? '상품' : '상품 옵션'
  const categoryHeader = isProductSales ? '카테고리 (상품)' : '카테고리 (상품 옵션)'

  const columns = useMemo<ColumnDef<StatisticsRow>[]>(() => {
    const cols: ColumnDef<StatisticsRow>[] = []

    if (showCategoryCol) {
      cols.push({
        id: 'category',
        header: categoryHeader,
        minSize: 240,
        cell: ({ row }) => getCategoryValue(row.original, isProductSales),
      })
    }

    cols.push(
      {
        id: 'name',
        header: nameHeader,
        minSize: 200,
        cell: ({ row }) => (
          <span
            style={{
              paddingLeft:
                row.original.type !== ROW_TYPE.CATEGORY &&
                expandType === CATEGORY_EXPAND_TYPE.CATEGORY
                  ? '0.5rem'
                  : '0',
            }}
          >
            {getNameValue(row.original, isProductSales)}
          </span>
        ),
      },
      {
        id: 'discount_qty',
        header: '할인수량(비중)',
        size: 160,
        meta: { align: 'right' },
        cell: ({ row }) =>
          formatDiscountQuantity(
            row.original.total_membership_discounted_quantity,
            row.original.total_quantity,
          ),
      },
      {
        id: 'total_qty',
        header: '매출수량',
        size: 100,
        meta: { align: 'right' },
        cell: ({ row }) => row.original.total_quantity,
      },
      {
        id: 'discount_price',
        header: '할인금액(비중)',
        size: 192,
        meta: { align: 'right' },
        cell: ({ row }) =>
          formatDiscountPrice(
            row.original.total_membership_discounted_price,
            row.original.total_price,
          ),
      },
      {
        id: 'total_price',
        header: '매출금액',
        size: 124,
        meta: { align: 'right' },
        cell: ({ row }) => formatCurrency(row.original.total_price),
      },
      {
        id: 'percentage',
        header: '매출비중',
        size: 100,
        meta: { align: 'right' },
        cell: ({ row }) => `${Number(row.original.percentage).toFixed(2)}%`,
      },
    )

    return cols
  }, [showCategoryCol, expandType, isProductSales, nameHeader, categoryHeader])

  return (
    <div>
      <TableToolbar
        actions={[
          { icon: Download, label: '엑셀 저장', onClick: onDownloadExcel, disabled: data.length === 0 },
        ]}
        summarySlot={
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 typo-body3">
            <p>총 매출 수량 <span className="weight-700 text-key-blue">{summary.totalQuantity.toLocaleString()} 건</span></p>
            <p>총 매출 금액 <span className="weight-700 text-key-blue">{formatCurrency(summary.totalPrice)}</span></p>
            <p>총 할인 수량 <span className="weight-700 text-key-blue">{summary.totalQuantity === 0 ? '0 건 (0.00%)' : `${summary.totalDiscountQty.toLocaleString()} 건 (${((summary.totalDiscountQty / summary.totalQuantity) * 100).toFixed(2)}%)`}</span></p>
            <p>총 할인 금액 <span className="weight-700 text-key-blue">{summary.totalPrice === 0 ? '0원 (0.00%)' : `${formatCurrency(summary.totalDiscountPrice)} (${((summary.totalDiscountPrice / summary.totalPrice) * 100).toFixed(2)}%)`}</span></p>
          </div>
        }
        topSlot={
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 typo-micro1">
            <p>총 매출 수량 <span className="weight-700 text-key-blue">{summary.totalQuantity.toLocaleString()}건</span></p>
            <p>총 매출 금액 <span className="weight-700 text-key-blue">{formatCurrency(summary.totalPrice)}</span></p>
            <p>총 할인 수량 <span className="weight-700 text-key-blue">{summary.totalQuantity === 0 ? '0건 (0.00%)' : `${summary.totalDiscountQty.toLocaleString()}건 (${((summary.totalDiscountQty / summary.totalQuantity) * 100).toFixed(2)}%)`}</span></p>
            <p>총 할인 금액 <span className="weight-700 text-key-blue">{summary.totalPrice === 0 ? '0원 (0.00%)' : `${formatCurrency(summary.totalDiscountPrice)} (${((summary.totalDiscountPrice / summary.totalPrice) * 100).toFixed(2)}%)`}</span></p>
          </div>
        }
      >
        <Select value={expandType} onValueChange={(v) => setExpandType(v as CategoryExpandType)}>
          <SelectTrigger className="max-md:w-auto max-md:border-0 max-md:shadow-none max-md:px-1 max-md:typo-micro1 max-md:gap-0.5 max-md:[&_svg]:size-4 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_EXPAND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="max-md:typo-micro1 max-md:h-8 whitespace-nowrap">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={orderingType} onValueChange={setOrderingType}>
          <SelectTrigger className="max-md:w-auto max-md:border-0 max-md:shadow-none max-md:px-1 max-md:typo-micro1 max-md:gap-0.5 max-md:[&_svg]:size-4 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDERING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="max-md:typo-micro1 max-md:h-8 whitespace-nowrap">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableToolbar>

      <DataTable
        columns={columns}
        data={flatRows}
        totalCount={flatRows.length}
        isLoading={isLoading}
        emptyMessage="조회된 데이터가 없습니다."
        getRowClassName={(row) =>
          row.type === ROW_TYPE.CATEGORY
            ? 'bg-accent font-bold hover:bg-accent'
            : ''
        }
      />
    </div>
  )
}
