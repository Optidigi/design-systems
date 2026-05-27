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
import {
  statusBadgeSonnerClassName,
  statusBadgeSonnerContentClassName,
  statusBadgeSonnerStyleVars,
  statusBadgeSonnerTitleClassName,
} from "@/components/ui/status-badge"

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
          toast: statusBadgeSonnerClassName,
          icon: "text-current",
          content: statusBadgeSonnerContentClassName,
          title: statusBadgeSonnerTitleClassName,
          description: "text-xs leading-tight",
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          ...statusBadgeSonnerStyleVars,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
