"use client"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type MobileFloatingPillVariant = "default" | "warning" | "destructive" | "loading" | "success"
export type MobileFloatingPillPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right"

export interface MobileFloatingPillProps {
  position: MobileFloatingPillPosition
  /** Lucide icon (or any node). Ignored when variant="loading". */
  icon: React.ReactNode
  onClick: () => void
  ariaLabel: string
  variant?: MobileFloatingPillVariant
  /** Counter badge top-right of pill. Suppressed when 0/undefined. */
  badgeCount?: number
  /** Override badge tone (defaults to match variant). */
  badgeTone?: "warning" | "destructive"
  disabled?: boolean
  /** Stable test/data attrs (`data-mobile-*`). */
  dataAttrs?: Record<string, string | undefined>
}

/**
 * Reusable floating pill for mobile editor (save / back / trash / etc).
 *
 * Default variant inverts the surface: dark pill + light icon in light mode,
 * light pill + dark icon in dark mode — pops against any tenant canvas.
 *
 * Position drives top/right/bottom/left + safe-area inset.
 * 48px tap target (h-12 w-12). Always md:hidden + fixed z-50.
 */
export const MobileFloatingPill: React.FC<MobileFloatingPillProps> = ({
  position,
  icon,
  onClick,
  ariaLabel,
  variant = "default",
  badgeCount,
  badgeTone,
  disabled,
  dataAttrs,
}) => {
  const isLoading = variant === "loading"
  const tone = badgeTone ?? (variant === "destructive" ? "destructive" : "warning")
  const showBadge = badgeCount != null && badgeCount > 0

  const positionClasses = {
    "top-left": "top-3 left-3",
    "top-right": "top-3 right-3",
    "bottom-left": "bottom-3 left-3",
    "bottom-right": "bottom-3 right-3",
  }[position]
  const positionStyle: React.CSSProperties = {
    ...(position.startsWith("top") ? { top: "calc(env(safe-area-inset-top) + 0.75rem)" } : {}),
    ...(position.startsWith("bottom") ? { bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" } : {}),
    ...(position.endsWith("left") ? { left: "calc(env(safe-area-inset-left) + 0.75rem)" } : {}),
    ...(position.endsWith("right") ? { right: "calc(env(safe-area-inset-right) + 0.75rem)" } : {}),
  }

  const variantClasses = cn(
    "border bg-foreground text-background border-transparent shadow-lg",
    variant === "warning" && "border-2 border-amber-500/70 text-amber-400 dark:text-amber-500",
    variant === "destructive" && "border-2 border-destructive/70 text-red-400 dark:text-destructive",
    variant === "loading" && "opacity-90 cursor-wait border-transparent",
    variant === "success" && "text-background/80 border-transparent",
  )

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        const tag = document.activeElement?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA") e.preventDefault()
      }}
      onClick={isLoading || disabled ? undefined : onClick}
      disabled={isLoading || disabled}
      aria-label={ariaLabel}
      {...(dataAttrs ?? {})}
      className={cn(
        "md:hidden fixed z-50 inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors pointer-events-auto",
        positionClasses,
        variantClasses,
      )}
      style={positionStyle}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {showBadge && (
        <span
          className={cn(
            "absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-medium flex items-center justify-center",
            tone === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white",
          )}
          aria-hidden
        >
          {(badgeCount ?? 0) > 9 ? "9+" : badgeCount}
        </span>
      )}
    </button>
  )
}
