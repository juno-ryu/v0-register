import { format } from 'date-fns'

// 레거시 store/common/actions.js 엑셀 유틸 포팅

const DEFAULT_COL_WIDTH = 12

const HEADER_STYLE = {
  font: { bold: true },
  fill: { type: 'pattern', patternType: 'solid', fgColor: { rgb: 'F5F5F5' } },
  border: {
    top: { style: 'thin', color: { rgb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
    left: { style: 'thin', color: { rgb: 'CCCCCC' } },
    right: { style: 'thin', color: { rgb: 'CCCCCC' } },
  },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const META_LABEL_STYLE = {
  font: { bold: true },
  fill: { patternType: 'solid', fgColor: { rgb: 'E8E8E8' } },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const META_VALUE_STYLE = {
  alignment: { horizontal: 'left', vertical: 'center' },
}

const DATA_CELL_STYLE = {
  alignment: { horizontal: 'left', vertical: 'center' },
}

const CURRENCY_STYLE = {
  numFmt: '₩ #,##0',
  alignment: { horizontal: 'right', vertical: 'center' },
}

/**
 * 서버에서 JSON 배열(헤더 행 + 데이터 행)을 반환하는 경우 엑셀로 변환 후 다운로드
 * 레거시 downloadOrdersExcel 포팅
 *
 * @param apiData - 서버 응답: [[헤더...], [행1...], [행2...], ...]
 * @param fileName - 다운로드 파일명
 * @param sheetName - 시트명
 * @param meta - 조회 개요 영역 (상단 메타 정보)
 * @param colWidthMap - 컬럼별 너비 (헤더명 → 너비)
 * @param currencyKeywords - 금액 컬럼 식별 키워드 (기본: ['금액'])
 */
export async function downloadJsonAsExcel({
  apiData,
  fileName,
  sheetName = 'Sheet1',
  meta = [],
  colWidthMap = {},
  currencyKeywords = ['금액'],
}: {
  apiData: unknown[][]
  fileName: string
  sheetName?: string
  meta?: [string, string][]
  colWidthMap?: Record<string, number>
  currencyKeywords?: string[]
}) {
  const XLSX = (await import('xlsx-js-style')).default
  const headerRow = (apiData[0] as string[]) ?? []
  const dataRows = apiData.slice(1)

  const META_ROW_COUNT = meta.length
  // 메타 있으면 빈 행 추가 후 헤더, 없으면 헤더 바로
  const HEADER_ROW_INDEX = META_ROW_COUNT > 0 ? META_ROW_COUNT + 1 : 0
  const DATA_START_ROW = HEADER_ROW_INDEX + 1

  const sheetData: unknown[][] = [
    ...meta,
    ...(META_ROW_COUNT > 0 ? [[]] : []), // 빈 행
    headerRow,
    ...dataRows,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

  // 컬럼 너비 설정
  const colWidths = headerRow.map((header: string) => ({
    wch: colWidthMap[header] ?? DEFAULT_COL_WIDTH,
  }))
  worksheet['!cols'] = colWidths

  // 메타 행 스타일
  for (let row = 0; row < META_ROW_COUNT; row++) {
    const labelCell = XLSX.utils.encode_cell({ r: row, c: 0 })
    const valueCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[labelCell]) worksheet[labelCell].s = META_LABEL_STYLE
    if (worksheet[valueCell]) worksheet[valueCell].s = META_VALUE_STYLE
  }

  // 헤더 행 스타일
  const colCount = headerRow.length
  for (let col = 0; col < colCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: col })
    if (worksheet[cellRef]) worksheet[cellRef].s = HEADER_STYLE
  }

  // 금액 컬럼 인덱스 찾기
  const currencyColumns = headerRow.reduce<number[]>((acc, header: string, idx) => {
    if (currencyKeywords.some((kw) => header.includes(kw))) acc.push(idx)
    return acc
  }, [])

  // 데이터 행 스타일
  for (let row = DATA_START_ROW; row < sheetData.length; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = currencyColumns.includes(col)
          ? CURRENCY_STYLE
          : DATA_CELL_STYLE
      }
    }
  }

  // 자동 필터
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: HEADER_ROW_INDEX, c: 0 },
      e: { r: HEADER_ROW_INDEX, c: colCount - 1 },
    }),
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}

/**
 * 주문내역 엑셀 다운로드 헬퍼
 * 레거시 downloadOrdersExcel 동일한 파일명 규칙 + 메타 영역 포팅
 */
export async function downloadOrdersExcel({
  apiData,
  startDate,
  endDate,
  meta,
}: {
  apiData: unknown[][]
  startDate: string // 'yyyy-MM-dd'
  endDate: string   // 'yyyy-MM-dd'
  meta?: {
    searchKeyword?: string
    brandName?: string
    storeName?: string
    statusName?: string
    channelName?: string
  }
}) {
  const metaRows: [string, string][] = [
    ['조회 기준', '이용내역 - 식음료'],
    ['검색어', meta?.searchKeyword ?? ''],
    ['조회 기간', `${format(new Date(startDate), 'yyyy/MM/dd')} ~ ${format(new Date(endDate), 'yyyy/MM/dd')}`],
    ['브랜드', meta?.brandName ?? '전체'],
    ['매장', meta?.storeName ?? '전체'],
    ['상태', meta?.statusName ?? '전체'],
    ['채널', meta?.channelName ?? '전체'],
    ['추출일시', format(new Date(), 'yyyy/MM/dd HH:mm:ss')],
  ]

  const colWidthMap: Record<string, number> = {
    주문일시: 22,
    주문ID: 28,
    브랜드: 15,
    매장: 20,
    주문내역: 20,
    주문채널: 10,
    주문분류: 10,
    회원번호: 12,
    주문상태: 10,
    주문금액: 12,
    할인금액: 12,
    결제금액: 12,
  }

  const startFormatted = format(new Date(startDate), 'yyMMdd')
  const endFormatted = format(new Date(endDate), 'yyMMdd')
  const fileName = `이용내역_식음료_${startFormatted}~${endFormatted}.xlsx`

  await downloadJsonAsExcel({
    apiData,
    fileName,
    sheetName: '이용내역',
    meta: metaRows,
    colWidthMap,
  })
}

/**
 * 통계 엑셀 다운로드 헬퍼
 * 레거시 createStatisticsExcelFile 포팅
 * - 통화 포맷 (매출금액, 할인금액)
 * - 백분율 포맷 (매출비중, 할인수량비중, 할인금액비중)
 * - 컬럼별 너비 설정
 */
export async function downloadStatisticsExcel({
  apiData,
  fileName,
}: {
  apiData: unknown[][]
  fileName: string
}) {
  const XLSX = (await import('xlsx-js-style')).default
  const [headers, ...data] = apiData as [string[], ...unknown[][]]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

  // 레거시 포맷 정의
  const krwFormat = '_-₩* #,##0_-;_-₩* (#,##0)_-;_-₩* "-"_-;_-@_-'
  const percentageFormat = '0.00"%"'

  // 포맷 적용 대상 컬럼 인덱스
  const quantityIndex = headers.indexOf('매출수량')
  const discountAmountIndex = headers.indexOf('할인금액')
  const amountIndex = headers.indexOf('매출금액')
  const discountQuantityRatioIndex = headers.indexOf('할인수량비중')
  const discountAmountRatioIndex = headers.indexOf('할인금액비중')
  const percentageIndex = headers.indexOf('매출비중')

  for (let R = 1; R <= data.length; ++R) {
    if (quantityIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: quantityIndex })
      if (ws[cell]) ws[cell].t = 'n'
    }
    if (discountAmountIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: discountAmountIndex })
      if (ws[cell]) ws[cell].z = krwFormat
    }
    if (amountIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: amountIndex })
      if (ws[cell]) ws[cell].z = krwFormat
    }
    if (discountQuantityRatioIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: discountQuantityRatioIndex })
      if (ws[cell]) ws[cell].z = percentageFormat
    }
    if (discountAmountRatioIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: discountAmountRatioIndex })
      if (ws[cell]) ws[cell].z = percentageFormat
    }
    if (percentageIndex !== -1) {
      const cell = XLSX.utils.encode_cell({ r: R, c: percentageIndex })
      if (ws[cell]) ws[cell].z = percentageFormat
    }
  }

  // 레거시와 동일한 컬럼 너비
  ws['!cols'] = headers.map((header) => {
    switch (header) {
      case 'ID': return { wpx: 100 }
      case '카테고리(상품)':
      case '카테고리(상품옵션)': return { wpx: 120 }
      case '상품':
      case '상품 옵션': return { wpx: 150 }
      case '할인수량': return { wpx: 120 }
      case '매출수량': return { wpx: 80 }
      case '할인금액': return { wpx: 140 }
      case '매출금액': return { wpx: 100 }
      case '매출비중': return { wpx: 90 }
      default: return { wpx: 100 }
    }
  })

  // 자동 필터
  ws['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1`,
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, fileName)
}

/**
 * 지급 내역 엑셀 다운로드 헬퍼
 * 레거시 createDisbursementExcelFile 포팅
 * - 숫자 컬럼 자동 감지 → KRW 포맷
 * - 날짜 문자열(YY/MM/DD HH:mm:ss) → Excel date 객체 변환
 * - "환불"/"취소" 거래 → 금액 음수 처리
 */
export async function downloadDisbursementExcel({
  apiData,
  fileName,
}: {
  apiData: unknown[][]
  fileName: string
}) {
  const XLSX = (await import('xlsx-js-style')).default
  const [headers, ...data] = apiData as [string[], ...unknown[][]]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

  const krwFormat = '_-₩* #,##0_-;_-₩* (#,##0)_-;_-₩* "-"_-;_-@_-'
  const EXCEL_DATE_FORMAT = 'yyyy/mm/dd HH:mm:ss'

  // 거래분류 또는 상태 컬럼 인덱스
  const transactionTypeIndex = headers.indexOf('거래분류') !== -1
    ? headers.indexOf('거래분류')
    : headers.indexOf('상태')

  // 첫 데이터 행 기준으로 숫자/날짜 컬럼 자동 감지
  const numericColumnIndexes: number[] = []
  const dateColumnIndexes: number[] = []

  for (let C = 0; C < headers.length; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C })
    const cellValue = ws[cellAddress]?.v

    if (typeof cellValue === 'number') {
      numericColumnIndexes.push(C)
    } else if (
      typeof cellValue === 'string' &&
      cellValue.match(/^\d{2}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}$/)
    ) {
      dateColumnIndexes.push(C)
    }
  }

  // 데이터 행 처리
  for (let R = 1; R <= data.length; ++R) {
    const transactionType = data[R - 1][transactionTypeIndex] as string

    // 숫자 컬럼: KRW 포맷 + 환불/취소 음수 처리
    for (const C of numericColumnIndexes) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (ws[cellAddress]) {
        if (transactionType === '환불' || transactionType === '취소') {
          ws[cellAddress].v = -Math.abs(ws[cellAddress].v as number)
        }
        ws[cellAddress].z = krwFormat
      }
    }

    // 날짜 컬럼: Excel date 객체 변환
    for (const C of dateColumnIndexes) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cellValue = ws[cellAddress]?.v
      if (!cellValue || typeof cellValue !== 'string') continue

      const parts = cellValue.split(' ')
      if (parts.length < 2) continue

      const [datePart, timePart] = parts
      const [yy, mm, dd] = datePart.split('/').map(Number)
      const [hours, minutes, seconds] = timePart.split(':').map(Number)
      const fullYear = yy < 50 ? 2000 + yy : 1900 + yy
      const date = new Date(fullYear, mm - 1, dd, hours, minutes, seconds)

      ws[cellAddress] = { t: 'd', v: date, z: EXCEL_DATE_FORMAT } as never
    }
  }

  // 자동 필터
  ws['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1`,
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, fileName)
}

/**
 * 일반고객 엑셀 다운로드 헬퍼
 * 레거시 createNormalCustomersExcelFile 포팅
 * - 헤더 스타일 (E0E0E0 배경, bold)
 * - 광고수신동의: boolean → O/X
 * - 생성일시: ISO → Excel date 객체
 * - 열너비: wpx * 0.71 (레거시 동일)
 */
export async function downloadNormalCustomersExcel({
  apiData,
  fileName,
}: {
  apiData: unknown[][]
  fileName: string
}) {
  const XLSX = (await import('xlsx-js-style')).default
  const [headers, ...data] = apiData as [string[], ...unknown[][]]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

  const EXCEL_DATE_FORMAT = 'yyyy/mm/dd HH:mm:ss'
  const isSubscribedIndex = headers.indexOf('광고수신동의')
  const dateColumnIndexes: number[] = []

  // 헤더 스타일 + 날짜 컬럼 감지
  for (let C = 0; C < headers.length; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: 'E0E0E0' }, bgColor: { rgb: 'E0E0E0' }, patternType: 'solid' },
        font: { bold: true },
      }
    }
    if (headers[C] === '생성일시') {
      dateColumnIndexes.push(C)
    }
  }

  // 데이터 행 처리
  for (let R = 1; R <= data.length; ++R) {
    // 광고수신동의: boolean → O/X
    if (isSubscribedIndex !== -1) {
      const isSubscribed = data[R - 1][isSubscribedIndex]
      ws[XLSX.utils.encode_cell({ r: R, c: isSubscribedIndex })] = {
        t: 's',
        v: isSubscribed ? 'O' : 'X',
      }
    }

    // 생성일시: ISO 문자열 → Excel date 객체 변환
    for (const C of dateColumnIndexes) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cellValue = ws[cellAddress]?.v
      if (!cellValue) continue

      const date = new Date(cellValue as string)
      if (isNaN(date.getTime())) continue

      ws[cellAddress] = { t: 'd', v: date, z: EXCEL_DATE_FORMAT } as never
    }
  }

  // 레거시와 동일한 열너비 (wpx * 0.71)
  ws['!cols'] = headers.map((header) => {
    switch (header) {
      case '고객번호': return { wpx: 53 * 0.71 }
      case '연락처': return { wpx: 148 * 0.71 }
      case '이름': return { wpx: 125 * 0.71 }
      case '가입경로': return { wpx: 184 * 0.71 }
      case '광고수신동의': return { wpx: 125 * 0.71 }
      case '생성일시': return { wpx: 156 * 0.71 }
      default: return { wpx: 100 * 0.71 }
    }
  })

  // 자동 필터
  ws['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}1`,
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, fileName)
}
