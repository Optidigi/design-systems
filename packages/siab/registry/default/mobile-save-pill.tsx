"use client"
import * as React from "react"
import { Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { MobileFloatingPill, type MobileFloatingPillVariant } from "@/components/ui/mobile-floating-pill"
import type { SaveStatus } from "@/components/ui/save-status-bar"

export interface MobileSavePillProps {
  status: SaveStatus
  dirtyCount?: number
  errorCount?: number
  onSave: () => void
}

const STATUS_TO_VARIANT: Record<SaveStatus, MobileFloatingPillVariant> = {
  idle: "default",
  saved: "success",
  dirty: "warning",
  saving: "loading",
  error: "destructive",
}

const ICON: Record<SaveStatus, React.ReactNode> = {
  idle: <Save className="h-5 w-5" aria-hidden />,
  saved: <CheckCircle2 className="h-5 w-5" aria-hidden />,
  dirty: <Save className="h-5 w-5" aria-hidden />,
  saving: <Save className="h-5 w-5" aria-hidden />, // overridden by loading variant spinner
  error: <AlertCircle className="h-5 w-5" aria-hidden />,
}

/**
 * Top-right floating save pill. Thin status-aware wrapper over MobileFloatingPill.
 */
export const MobileSavePill: React.FC<MobileSavePillProps> = ({ status, dirtyCount, errorCount = 0, onSave }) => {
  const isError = status === "error"
  const badgeCount = isError ? errorCount : (dirtyCount ?? 0)
  const ariaLabel =
    status === "saving" ? "Saving" :
    status === "error" ? `Save (${errorCount} error${errorCount === 1 ? "" : "s"})` :
    status === "dirty" ? `Save (${badgeCount} unsaved)` :
    "Saved"

  return (
    <MobileFloatingPill
      position="top-right"
      icon={ICON[status]}
      onClick={onSave}
      ariaLabel={ariaLabel}
      variant={STATUS_TO_VARIANT[status]}
      badgeCount={badgeCount}
      badgeTone={isError ? "destructive" : "warning"}
      dataAttrs={{
        "data-mobile-save-pill": "",
        "data-save-status": status,
      }}
    />
  )
}
