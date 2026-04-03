import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  wrapperClassName,
  size = "default",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  wrapperClassName?: string
  size?: "default" | "sm"
}) {
  const isSmall = size === "sm"

  return (
    <div
      className={cn("shrink-0 inline-flex", wrapperClassName)}
      style={{ padding: isSmall ? "1.67px" : "2px" }}
    >
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={cn(
          "shrink-0 rounded-full outline-none cursor-pointer transition-all",
          "border-2 border-neutral-600 bg-transparent",
          isSmall ? "size-[16.66667px]" : "size-5",
          // checked: 파란 링 + 배경색 갭(inset shadow) + 파란 배경
          "data-[state=checked]:border-key-blue data-[state=checked]:bg-key-blue",
          isSmall
            ? "data-[state=checked]:shadow-[inset_0_0_0_3px_var(--background)]"
            : "data-[state=checked]:shadow-[inset_0_0_0_4px_var(--background)]",
          // disabled
          "disabled:cursor-not-allowed disabled:border-border",
          "disabled:data-[state=checked]:border-key-blue/30 disabled:data-[state=checked]:bg-key-blue/30",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator />
      </RadioGroupPrimitive.Item>
    </div>
  )
}

export { RadioGroup, RadioGroupItem }
