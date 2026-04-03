import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Figma: border-border, bg-background, px-4(16px), py-2(8px), typo-body3/weight-400
        "w-full min-h-[88px] border border-border bg-background px-4 py-2 typo-body3 text-foreground outline-none transition-[color,box-shadow] resize-none",
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

export { Textarea }
