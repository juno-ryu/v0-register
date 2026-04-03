import {
  CheckCircleIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Figma 스펙: node-id=1494-77708
// bg: neutral-800(#333333), text: white, typo-body3/weight-800
// 아이콘: 24px, action: #4791ff, width: 328px

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!bg-neutral-800 !text-white !border-none !rounded-none !shadow-none !w-[328px] !px-4 !py-2.5 flex items-center gap-2",
          title: "typo-body3 weight-800 !text-white",
          description: "typo-micro1 !text-white/70",
          actionButton: "!bg-transparent !text-[#4791ff] typo-body3 weight-600",
          cancelButton: "!bg-transparent !text-white/60 typo-body3 weight-600",
          icon: "!size-6 shrink-0",
        },
      }}
      icons={{
        success: <CheckCircleIcon className="size-6 text-status-positive" />,
        info: <InfoIcon className="size-6 text-[#4791ff]" />,
        warning: <TriangleAlertIcon className="size-6 text-status-cautionary" />,
        error: <OctagonXIcon className="size-6 text-status-destructive" />,
        loading: <Loader2Icon className="size-6 animate-spin text-white" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
