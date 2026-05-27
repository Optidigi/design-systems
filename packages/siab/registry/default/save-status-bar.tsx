"use client"
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslations } from "next-intl"
import {
  StatusBadge,
  getStatusBadgeClassName,
  type StatusBadgeTone,
} from "@/components/ui/status-badge"

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

/**
 * SaveStatusBar — floating status pill anchored just above the bottom-
 * centre ModeBar. Only renders transient save lifecycle states:
 *
 *   idle              -> hidden
 *   dirty             -> hidden (PublishControls Save button carries this)
 *   saving            -> spinner pill, "Saving..."
 *   saved             -> success toast, "Saved"
 *   error             -> destructive pill, "Save blocked: N issues"
 *                        (clickable → jumps to first invalid field) or a
 *                        destructive toast, "Save failed" + Retry
 *
 * Visual treatment uses one compact status pill shape for saving / saved /
 * failed states. Saved/error keep the stronger success/destructive contrast
 * while staying smaller than the old wide default badge.
 *
 * Phone is suppressed entirely (`hidden md:flex`); the MobileSavePill
 * owns small-viewport save UI.
 *
 * The bar is UI-only: navigation guarding is handled by
 * `useNavigationGuard` mounted by the parent form.
 */
type Props = {
  status: SaveStatus
  errorCount?: number
  onRetry?: () => void
  onJumpToError?: () => void
}

export function SaveStatusBar({
  status,
  errorCount = 0,
  onRetry,
  onJumpToError,
}: Props) {
  const t = useTranslations("common")
  const { state, isMobile } = useSidebar()
  const lastToastStatusRef = useRef<SaveStatus | null>(null)

  useEffect(() => {
    if (status === "saved") {
      if (lastToastStatusRef.current !== "saved") {
        toast.success(t("saved"), { id: "save-status" })
      }
    } else if (status === "error" && errorCount === 0) {
      if (lastToastStatusRef.current !== "error") {
        toast.error(t("saveFailed"), {
          id: "save-status",
          action: onRetry
            ? {
                label: t("retry"),
                onClick: onRetry,
              }
            : undefined,
        })
      }
    }
    lastToastStatusRef.current = status
  }, [errorCount, onRetry, status, t])

  // Hidden states: idle and dirty render nothing — PublishControls'
  // Save button carries the dirty signal on desktop. Saved and non-validation
  // failure outcomes are emitted through Sonner so every success/error action
  // uses the same notification element.
  if (status === "idle" || status === "dirty" || status === "saved" || (status === "error" && errorCount === 0)) {
    return null
  }

  // Anchor above the ModeBar (fixed bottom-centre with the same sidebar
  // offset). 4.75rem clears ~1rem ModeBar inset + ~2.75rem pill height +
  // a 1rem visual gap.
  const sidebarOffset = isMobile
    ? "0px"
    : state === "expanded"
      ? "var(--sidebar-width)"
      : "var(--sidebar-width-icon)"
  const positionClasses = "hidden md:flex fixed z-40 -translate-x-1/2"
  const positionStyle: CSSProperties = {
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)",
    left: `calc(50% + ${sidebarOffset} / 2)`,
  }

  let body: ReactNode = null
  let label = ""
  let isClickableJump = false
  let retryAction: (() => void) | null = null

  if (status === "saving") {
    label = t("saving")
    body = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>{label}</span>
      </>
    )
  } else if (status === "error") {
    if (errorCount > 0) {
      label = t("saveBlocked", { count: errorCount })
      isClickableJump = Boolean(onJumpToError)
      body = (
        <>
          <AlertCircle className="h-4 w-4 text-destructive-foreground" aria-hidden />
          <span>{label}</span>
        </>
      )
    } else {
      label = t("saveFailed")
      retryAction = onRetry ?? null
      body = (
        <>
          <AlertCircle className="h-4 w-4 text-destructive-foreground" aria-hidden />
          <span>{label}</span>
        </>
      )
    }
  }

  // One shared lifecycle badge. Sonner success/error toasts consume the same
  // registry primitive so save/delete/failure feedback cannot visually drift.
  const variant: StatusBadgeTone =
    status === "error" ? "destructive" : "neutral"

  const inner = isClickableJump ? (
    <button
      type="button"
      role="status"
      aria-live="polite"
      aria-label={label}
      onClick={onJumpToError}
      className={getStatusBadgeClassName(variant, "cursor-pointer hover:opacity-90")}
    >
      {body}
    </button>
  ) : (
    <StatusBadge
      tone={variant}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {body}
    </StatusBadge>
  )

  return (
    <div className={positionClasses} style={positionStyle}>
      {retryAction ? (
        <div className="inline-flex items-center gap-2">
          {inner}
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={retryAction}
            aria-label={t("retry")}
            className="h-8"
          >
            {t("retry")}
          </Button>
        </div>
      ) : (
        inner
      )}
    </div>
  )
}
