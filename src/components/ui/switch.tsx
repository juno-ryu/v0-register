import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  thumbClassName,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  thumbClassName?: string
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // 트랙: 32×10px
        "group relative inline-flex h-[10px] w-[32px] shrink-0 items-center rounded-full outline-none transition-colors cursor-pointer",
        // ON / OFF 트랙 기본 색상 — className으로 override 가능
        // 예) className="data-[state=checked]:bg-key-pink data-[state=unchecked]:bg-neutral-400"
        "data-[state=checked]:bg-key-blue data-[state=unchecked]:bg-neutral-400",
        // disabled 트랙
        "disabled:cursor-not-allowed disabled:data-[state=checked]:bg-key-blue/10 disabled:data-[state=unchecked]:bg-border",
        // focus
        "focus-visible:ring-2 focus-visible:ring-key-blue/30",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[14px] rounded-full bg-background transition-[left]",
          // shadow-soft
          "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.15)]",
          // stroke: 트랙 색과 동일 — thumbClassName으로 override 가능
          // 예) thumbClassName="data-[state=checked]:ring-key-pink"
          "ring-1 data-[state=checked]:ring-key-blue data-[state=unchecked]:ring-neutral-400",
          // disabled stroke
          "group-disabled:data-[state=checked]:ring-key-blue/10 group-disabled:data-[state=unchecked]:ring-border",
          // disabled thumb fill
          "group-disabled:bg-muted",
          // 위치
          "absolute top-1/2 -translate-y-1/2",
          "data-[state=unchecked]:left-[-2px] data-[state=checked]:left-[20px]",
          thumbClassName
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
