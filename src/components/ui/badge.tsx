import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Figma 기준 Badge 스펙
export const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline:     "border border-border text-foreground",
        ghost:       "text-foreground",
        link:        "text-primary underline-offset-4 underline",
        error:    "bg-status-destructive text-white",
        positive: "bg-status-positive text-white",
        warning:  "bg-status-cautionary text-white",
        neutral:  "bg-neutral-550 text-white",
      },
      size: {
        sm:      "h-5 rounded-full typo-micro2 weight-700",
        default: "h-6 rounded-full typo-micro1 weight-600",
        lg:      "h-7 rounded-full typo-body3 weight-600",
        xl:      "h-8 rounded-full typo-body1 weight-600",
      },
      type: {
        chip:  "px-1.5",
        badge: "",
        dot:   "bg-transparent px-0 gap-1.5",
      },
    },
    compoundVariants: [
      { type: "badge", size: "sm",      className: "px-2" },
      { type: "badge", size: "default", className: "px-2" },
      { type: "badge", size: "lg",      className: "px-3" },
      { type: "badge", size: "xl",      className: "px-3" },
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

function Badge({
  className,
  variant = "default",
  size = "default",
  type = "badge",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      data-type={type}
      className={cn(badgeVariants({ variant, size, type }), className)}
      {...props}
    >
      {type === "dot" && (
        <span
          className={cn(
            "inline-block size-1.5 rounded-full shrink-0",
            variant === "error"    && "bg-status-destructive",
            variant === "positive" && "bg-status-positive",
            variant === "warning"  && "bg-status-cautionary",
            variant === "neutral"  && "bg-neutral-550",
          )}
        />
      )}
      {props.children}
    </Comp>
  )
}

export { Badge }
