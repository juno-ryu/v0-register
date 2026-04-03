import { cva } from "class-variance-authority"

export const tabsListVariants = cva(
  "rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-12 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
        // 레거시 SubMenus 스타일 — 배경 채움형, 활성 시 빨간색, 탭 사이 세로 구분선
        segment: "h-12 w-full rounded-none bg-muted p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
