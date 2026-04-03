import * as React from "react"
import { CheckIcon, MinusIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  wrapperClassName,
  size = "default",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  wrapperClassName?: string
  size?: "sm" | "default"
}) {
  return (
    <div
      className={cn("shrink-0 inline-flex", wrapperClassName)}
      style={{ padding: size === "sm" ? "2.5px" : "3px" }}
    >
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(
          // Figma: border-width=2px (SVG path 아웃라인 방식)
          "peer shrink-0 border-2 border-neutral-600 bg-transparent outline-none transition-shadow cursor-pointer",
          // Figma: default=18px/radius-3px, sm=15px/radius-2px
          size === "default" && "size-[18px] rounded-[3px]",
          size === "sm"      && "size-[15px] rounded-[2px]",
          // checked/indeterminate 기본 색상 — className으로 override 가능
          "data-[state=checked]:bg-key-blue data-[state=checked]:border-key-blue data-[state=checked]:text-white",
          "data-[state=indeterminate]:bg-neutral-400 data-[state=indeterminate]:border-neutral-400 data-[state=indeterminate]:text-white",
          // focus
          "focus-visible:border-key-blue focus-visible:ring-2 focus-visible:ring-key-blue/20",
          // disabled
          "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:data-[state=checked]:bg-border disabled:data-[state=checked]:border-border",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current transition-none"
        >
          {props.checked === "indeterminate"
            ? <MinusIcon className={size === "sm" ? "size-2.5 text-white" : "size-3 text-white"} strokeWidth={3} />
            : <CheckIcon className={size === "sm" ? "size-2.5 text-white" : "size-3 text-white"} strokeWidth={3} />
          }
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  )
}

export { Checkbox }
