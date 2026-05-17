"use client"
import { useEffect, useState } from "react"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

/**
 * SaveStatusBar — floating status pill anchored just above the bottom-
 * centre ModeBar. Only renders transient save lifecycle states:
 *
 *   idle              -> hidden
 *   dirty             -> hidden (PublishControls Save button carries this)
 *   saving            -> spinner pill, "Saving..."
 *   saved             -> success pill, "Saved" — fades out after 2.5s
 *   error             -> destructive pill, "Save blocked: N issues"
 *                        (clickable → jumps to first invalid field) or
 *                        "Save failed" + Retry for non-field server errors
 *
 * Visual treatment mirrors the ModeBar / ThemeBar buttons exactly: an
 * outer `FLOATING_PILL_CLASS` capsule (popover surface) wrapping an inner
 * `bg-muted/30` segmented group whose single child looks like a SegmentedPill
 * ghost button (`h-7 rounded-sm px-2 text-sm font-medium`). Only the icon
 * tint signals state — green for saved, destructive for error.
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
  const { state, isMobile } = useSidebar()
  // Saved is visible for 3.25s, then transitions out via opacity + slide
  // down before unmounting. A bit slower than the previous 2.5s so the
  // success state is comfortably readable without dominating the canvas.
  const [showSaved, setShowSaved] = useState(false)
  const [savedFading, setSavedFading] = useState(false)
  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true)
      setSavedFading(false)
      const fade = setTimeout(() => setSavedFading(true), 3_250)
      const hide = setTimeout(() => setShowSaved(false), 3_750)
      return () => {
        clearTimeout(fade)
        clearTimeout(hide)
      }
    }
    setShowSaved(false)
    setSavedFading(false)
  }, [status])

  // Hidden states: idle and dirty render nothing — PublishControls'
  // Save button carries the dirty signal on desktop.
  if (status === "idle" || status === "dirty" || (status === "saved" && !showSaved)) {
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
  const positionStyle: React.CSSProperties = {
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)",
    left: `calc(50% + ${sidebarOffset} / 2)`,
  }

  let body: React.ReactNode = null
  let label = ""
  let isClickableJump = false
  let retryAction: (() => void) | null = null

  if (status === "saving") {
    label = "Saving..."
    body = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>{label}</span>
      </>
    )
  } else if (status === "saved") {
    label = "Saved"
    body = (
      <>
        <CheckCircle2 className="h-4 w-4 text-success-foreground" aria-hidden />
        <span>{label}</span>
      </>
    )
  } else if (status === "error") {
    if (errorCount > 0) {
      label = `Save blocked: ${errorCount} ${errorCount === 1 ? "issue" : "issues"}`
      isClickableJump = Boolean(onJumpToError)
      body = (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
          <span>{label}</span>
        </>
      )
    } else {
      label = "Save failed"
      retryAction = onRetry ?? null
      body = (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
          <span>{label}</span>
        </>
      )
    }
  }

  // Saved variant: translucent green with strong backdrop blur + boosted
  // saturation so the glass effect actually reads (the canvas content
  // behind softly diffuses through). A thin white inset ring acts as the
  // "glass edge" highlight, and `text-success-foreground` (white) keeps
  // the label crisp despite the lower bg opacity.
  const savedClasses =
    status === "saved"
      ? "h-9 px-4 rounded-md shadow-lg shadow-success/25 bg-success/55 supports-[backdrop-filter]:bg-success/40 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-inset ring-white/30 text-success-foreground"
      : "h-9 px-3 rounded-md border border-border shadow-md bg-card text-card-foreground"
  const innerButtonClasses = cn(
    "inline-flex items-center gap-2 font-medium",
    savedClasses,
  )

  // Saved exit: fade + slide-down. The pill stays mounted during the
  // ~500ms transition; both opacity and translate animate together.
  const fadeClass =
    status === "saved"
      ? cn(
          "transition-all duration-500 ease-out",
          savedFading && "opacity-0 translate-y-2",
        )
      : ""

  const inner = isClickableJump ? (
    <button
      type="button"
      role="status"
      aria-live="polite"
      aria-label={label}
      onClick={onJumpToError}
      className={cn(innerButtonClasses, "cursor-pointer hover:opacity-90", fadeClass)}
    >
      {body}
    </button>
  ) : (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(innerButtonClasses, fadeClass)}
    >
      {body}
    </div>
  )

  return (
    <div className={positionClasses} style={positionStyle}>
      {retryAction ? (
        <div className={cn("inline-flex items-center gap-2", fadeClass)}>
          {inner}
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={retryAction}
            aria-label="Retry save"
            className="h-9"
          >
            Retry
          </Button>
        </div>
      ) : (
        inner
      )}
    </div>
  )
}
