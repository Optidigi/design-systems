import type { CSSProperties, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type StatusBadgeTone = "success" | "destructive" | "neutral"

export const statusBadgeBaseClassName =
  "h-8 px-3 rounded-md shadow-md backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/25"

export const statusBadgeContentClassName =
  "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium"

export const statusBadgeToneClassNames: Record<StatusBadgeTone, string> = {
  success:
    "shadow-success/20 bg-success/75 supports-[backdrop-filter]:bg-success/65 text-success-foreground",
  destructive:
    "shadow-destructive/20 bg-destructive/75 supports-[backdrop-filter]:bg-destructive/65 text-destructive-foreground",
  neutral: "border border-border bg-card text-card-foreground",
}

export const statusBadgeSonnerClassName =
  `${statusBadgeBaseClassName} min-h-8 max-w-[min(24rem,calc(100vw-2rem))] !rounded-md !px-3 !py-0 text-sm font-medium`

export const statusBadgeSonnerContentClassName = "min-w-0 flex-1 overflow-hidden"

export const statusBadgeSonnerTitleClassName =
  "min-w-0 truncate whitespace-nowrap text-sm font-medium leading-none"

export const statusBadgeSonnerStyleVars = {
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
} as CSSProperties

export function getStatusBadgeClassName(
  tone: StatusBadgeTone,
  className?: string,
) {
  return cn(
    statusBadgeContentClassName,
    statusBadgeBaseClassName,
    statusBadgeToneClassNames[tone],
    className,
  )
}

export function StatusBadge({
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone: StatusBadgeTone }) {
  return (
    <div
      className={getStatusBadgeClassName(tone, className)}
      {...props}
    />
  )
}
