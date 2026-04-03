import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Figma 기준 버튼 스펙 — shadcn 기본 variant 구조 유지, 스타일만 Figma 스펙으로 오버라이드
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg transition-all cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  {
    variants: {
      variant: {
        default:
          'bg-key-blue text-white hover:bg-key-blue/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        destructive:
          'bg-status-destructive text-white hover:bg-status-destructive/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        outline:
          'border border-key-blue bg-background text-key-blue hover:bg-key-blue/10 disabled:border-border disabled:text-neutral-400',
        secondary:
          'bg-accent text-foreground hover:bg-border disabled:bg-neutral-250 disabled:text-neutral-400',
        ghost:
          'text-foreground hover:bg-accent disabled:text-neutral-400',
        link: 'text-key-blue underline-offset-4 hover:underline disabled:text-neutral-400',
      },
      size: {
        sm: "h-8 px-3 typo-body3 [&_svg:not([class*='size-'])]:size-4",
        default: "h-10 px-3 typo-body3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-3 typo-body1 [&_svg:not([class*='size-'])]:size-4",
        xl: "h-[52px] px-3 typo-headline4 [&_svg:not([class*='size-'])]:size-6",
        '2xl': "h-16 px-3 typo-headline3 [&_svg:not([class*='size-'])]:size-6",
        '3xl':
          "h-[70px] px-3 typo-headline2 [&_svg:not([class*='size-'])]:size-6",
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
