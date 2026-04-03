import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Figma 기준 버튼 스펙 — shadcn 기본 variant 구조 유지, 스타일만 Figma 스펙으로 오버라이드
// variant: default | destructive | outline | secondary | ghost | link (shadcn 기본)
// size: sm(32) | default(40) | lg(48) | xl(52) | 2xl(64) | 3xl(70)
// disabled: bg-neutral-250, text-neutral-400, outline border-border
// 공통: px-3(12px), gap-1(4px), rounded-lg(8px)

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg transition-all cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        // solid black — 주요 CTA
        default:
          'bg-key-blue text-white hover:bg-key-blue/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        // solid red — 삭제/위험
        destructive:
          'bg-status-destructive text-white hover:bg-status-destructive/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        // outlined — Figma Button/Pink outlined
        outline:
          'border border-key-blue bg-background text-key-blue hover:bg-key-blue/10 disabled:border-border disabled:text-neutral-400',
        // solid grey — Figma Button/Grey
        secondary:
          'bg-accent text-foreground hover:bg-border disabled:bg-neutral-250 disabled:text-neutral-400',
        // text only — Figma Button/Pink text
        ghost:
          'text-foreground hover:bg-accent disabled:text-neutral-400',
        // text link
        link: 'text-key-blue underline-offset-4 hover:underline disabled:text-neutral-400',
      },
      size: {
        // Figma 32px — KR/Body3_800 (14px/800), icon 16px
        sm: "h-8 px-3 typo-body3 [&_svg:not([class*='size-'])]:size-4",
        // Figma 40px — KR/Body3_800 (14px/800), icon 16px
        default: "h-10 px-3 typo-body3 [&_svg:not([class*='size-'])]:size-4",
        // Figma 48px — KR/Body1_800 (16px/800), icon 16px
        lg: "h-12 px-3 typo-body1 [&_svg:not([class*='size-'])]:size-4",
        // Figma 52px — KR/Headline4_700 (18px/700), icon 24px
        xl: "h-[52px] px-3 typo-headline4 [&_svg:not([class*='size-'])]:size-6",
        // Figma 64px — KR/Headline3_700 (20px/700), icon 24px
        '2xl': "h-16 px-3 typo-headline3 [&_svg:not([class*='size-'])]:size-6",
        // Figma 70px — KR/Headline2_700 (22px/700), icon 24px
        '3xl':
          "h-[70px] px-3 typo-headline2 [&_svg:not([class*='size-'])]:size-6",
        // 아이콘 전용
        xs: "h-6 px-2 typo-micro1 [&_svg:not([class*='size-'])]:size-3",
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
