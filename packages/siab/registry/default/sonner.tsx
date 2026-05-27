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

const DEFAULT_TOAST_CLASS =
  "flex h-8 w-auto min-w-0 items-center gap-1.5 rounded-md px-3 py-0 text-sm font-medium shadow-md backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/25"

const Toaster = ({
  position = "bottom-center",
  offset = "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)",
  mobileOffset = "1rem",
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
        unstyled: toastOptions?.unstyled ?? true,
        classNames: {
          toast: DEFAULT_TOAST_CLASS,
          title: "text-sm font-medium leading-none",
          description: "text-xs text-current/80",
          content: "flex min-w-0 flex-col gap-1",
          icon: "text-current",
          default: "border border-border bg-card text-card-foreground",
          loading: "border border-border bg-card text-card-foreground",
          info: "border border-border bg-card text-card-foreground",
          warning: "border border-border bg-card text-card-foreground",
          success:
            "border-0 bg-success/75 text-success-foreground shadow-success/20 supports-[backdrop-filter]:bg-success/65",
          error:
            "border-0 bg-destructive/75 text-destructive-foreground shadow-destructive/20 supports-[backdrop-filter]:bg-destructive/65",
          ...toastOptions?.classNames,
        },
      }}
      style={
        {
          "--width": "auto",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
