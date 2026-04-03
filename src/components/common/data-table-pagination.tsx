import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface DataTablePaginationProps {
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function DataTablePagination({
  totalCount,
  page,
  pageSize,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)

  const VISIBLE_PAGES = 10
  const halfVisible = Math.floor(VISIBLE_PAGES / 2)
  let startPage = Math.max(1, page - halfVisible)
  const endPage = Math.min(totalPages, startPage + VISIBLE_PAGES - 1)
  if (endPage - startPage + 1 < VISIBLE_PAGES) {
    startPage = Math.max(1, endPage - VISIBLE_PAGES + 1)
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  )

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    onPageChange(newPage)
  }

  return (
    <>
      {/* 데스크톱: 페이지 번호 전체 */}
      <div className="hidden md:flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft size={14} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 text-xs"
            onClick={() => handlePageChange(p)}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight size={14} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
        >
          <ChevronsRight size={14} />
        </Button>
      </div>

      {/* 모바일: 이전/다음 + Page X of Y */}
      <div className="flex md:hidden items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </Button>

        <span className="typo-body3 text-muted-foreground">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </>
  )
}
