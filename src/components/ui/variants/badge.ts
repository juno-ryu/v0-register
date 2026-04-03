import { cva } from "class-variance-authority"

// Figma 기준 Badge 스펙
// type=chip : status chip — px-1.5(6px), typo-micro2/700, bg 채움
// type=badge: 일반 badge — px-2(8px)/px-3(12px), size따라 typo, bg 채움
// type=dot  : dot + 텍스트 — 패딩 없음, 컬러 dot, 텍스트 색상
// variant: error | positive | warning | neutral (status 색상)

export const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        // shadcn 기본 유지
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline:     "border border-border text-foreground",
        ghost:       "text-foreground",
        link:        "text-primary underline-offset-4 underline",
        // 우리 status 추가
        error:    "bg-status-destructive text-white",
        positive: "bg-status-positive text-white",
        warning:  "bg-status-cautionary text-white",
        neutral:  "bg-neutral-550 text-white",
      },
      size: {
        // sm: h-20px, typo-micro2(10px)/700
        sm:      "h-5 rounded-full typo-micro2 weight-700",
        // default: h-24px, typo-micro1(12px)/600
        default: "h-6 rounded-full typo-micro1 weight-600",
        // lg: h-28px, typo-body3(14px)/600 — filter/removable chip용
        lg:      "h-7 rounded-full typo-body3 weight-600",
        // xl: h-32px, typo-body1(16px)/600
        xl:      "h-8 rounded-full typo-body1 weight-600",
      },
      type: {
        // chip: status chip — px-1.5(6px)
        chip:  "px-1.5",
        // badge: 일반 badge — 패딩은 compoundVariants에서 size별로 지정
        badge: "",
        // dot: 배경 없음, gap
        dot:   "bg-transparent px-0 gap-1.5",
      },
    },
    compoundVariants: [
      // badge type — size별 패딩
      { type: "badge", size: "sm",      className: "px-2" },
      { type: "badge", size: "default", className: "px-2" },
      { type: "badge", size: "lg",      className: "px-3" },
      { type: "badge", size: "xl",      className: "px-3" },
      // dot — 색상을 텍스트 색상으로 전환
      { variant: "error",    type: "dot", className: "text-status-destructive" },
      { variant: "positive", type: "dot", className: "text-status-positive" },
      { variant: "warning",  type: "dot", className: "text-status-cautionary" },
      { variant: "neutral",  type: "dot", className: "text-muted-foreground" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      type: "badge",
    },
  }
)
