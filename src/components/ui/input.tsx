import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Figma: h-40px, border-border, bg-background, px-4(16px), typo-body3/weight-400
        "h-10 w-full min-w-0 border border-border bg-background px-4 typo-body3 text-foreground outline-none transition-[color,box-shadow]",
        "placeholder:text-muted-foreground",
        "focus-visible:border-key-blue focus-visible:ring-2 focus-visible:ring-key-blue/20",
        "disabled:bg-muted disabled:text-neutral-400 disabled:cursor-not-allowed",
        "aria-invalid:border-status-destructive aria-invalid:focus-visible:border-status-destructive aria-invalid:focus-visible:ring-status-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
