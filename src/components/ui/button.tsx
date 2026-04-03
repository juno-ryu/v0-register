"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Figma 기준 버튼 스펙
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-transparent bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-key-blue text-white hover:bg-key-blue/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        destructive:
          'bg-status-destructive text-white hover:bg-status-destructive/90 disabled:bg-neutral-250 disabled:text-neutral-400',
        outline:
          'border-key-blue bg-background text-key-blue hover:bg-key-blue/10 disabled:border-border disabled:text-neutral-400',
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
        '3xl': "h-[70px] px-3 typo-headline2 [&_svg:not([class*='size-'])]:size-6",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
