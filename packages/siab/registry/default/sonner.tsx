"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({
  position = "bottom-center",
  offset = "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)",
  mobileOffset = "1rem",
  richColors = true,
  toastOptions,
  icons,
  style,
  ...props
}: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      offset={offset}
      mobileOffset={mobileOffset}
      richColors={richColors}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-current" />,
        info: <InfoIcon className="size-4 text-current" />,
        warning: <TriangleAlertIcon className="size-4 text-current" />,
        error: <OctagonXIcon className="size-4 text-current" />,
        loading: <Loader2Icon className="size-4 animate-spin text-current" />,
        ...icons,
      }}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "min-h-8 max-w-[min(24rem,calc(100vw-2rem))] !rounded-md !px-3 !py-1.5 text-sm font-medium shadow-md backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/25",
          icon: "text-current",
          content: "min-w-0 flex-1 overflow-hidden",
          title: "min-w-0 truncate whitespace-nowrap text-sm font-medium leading-tight",
          description: "text-xs leading-tight",
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          "--width": "max-content",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in oklch, var(--success) 75%, transparent)",
          "--success-border": "color-mix(in oklch, var(--success) 70%, white 25%)",
          "--success-text": "var(--success-foreground)",
          "--error-bg": "color-mix(in oklch, var(--destructive) 75%, transparent)",
          "--error-border": "color-mix(in oklch, var(--destructive) 70%, white 25%)",
          "--error-text": "var(--destructive-foreground)",
          "--border-radius": "calc(var(--radius) - 2px)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
