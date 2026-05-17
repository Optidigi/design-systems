"use client"
import * as React from "react"
import { X } from "lucide-react"
import { MobileFloatingPill } from "@/components/ui/mobile-floating-pill"

export interface MobileBackPillProps {
  onBack: () => void
}

/**
 * Top-left floating back pill (mobile sub-views). Mirrors MobileSavePill's
 * MobileFloatingPill base — same size, same default inverted color, same
 * position-driven safe-area insets.
 */
export const MobileBackPill: React.FC<MobileBackPillProps> = ({ onBack }) => (
  <MobileFloatingPill
    position="top-left"
    icon={<X className="h-5 w-5" aria-hidden />}
    onClick={onBack}
    ariaLabel="Close section"
    variant="default"
    dataAttrs={{ "data-mobile-back-pill": "" }}
  />
)
