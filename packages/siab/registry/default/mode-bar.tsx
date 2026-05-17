"use client"
import * as React from "react"
import { ModeToggle, type EditorMode } from "@/components/ui/mode-toggle"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/**
 * Shared floating-pill surface treatment used by ModeBar (bottom-centre)
 * and any other floating bar that wants the same visual (e.g. ThemeBar).
 * Positioning utilities and pill-specific layout adjustments (e.g. gap-0)
 * are NOT included — each caller composes them on top.
 */
export const FLOATING_PILL_CLASS =
  "rounded-full border border-border bg-popover/95 p-1 shadow-lg backdrop-blur-sm supports-[backdrop-filter]:bg-popover/80"

/**
 * Floating editor-mode bar. Fixed to the bottom-centre of the viewport so it
 * stays in exactly the same place across Canvas / Sidebar — the single,
 * consistent entry point for switching modes.
 *
 * Offsets its horizontal centre by half the admin sidebar width so the bar
 * centres within the editor pane rather than the full viewport. Requires
 * `@siab/sidebar` to be installed in the consumer (declared as a
 * `registryDependencies` of `@siab/mode-ui`).
 */
export const ModeBar: React.FC<{
  mode: EditorMode
  onChange: (next: EditorMode) => void
}> = ({ mode, onChange }) => {
  const { state, isMobile } = useSidebar()
  const sidebarOffset = isMobile
    ? "0px"
    : state === "expanded"
      ? "var(--sidebar-width)"
      : "var(--sidebar-width-icon)"

  return (
    <div
      className={cn(FLOATING_PILL_CLASS, "fixed bottom-4 z-50 -translate-x-1/2")}
      style={{
        // Keep clear of the phone keyboard / iOS safe-area.
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        // `left` is offset by half the admin sidebar width so the bar centres
        // within the editor pane rather than the full viewport.
        left: `calc(50% + ${sidebarOffset} / 2)`,
      }}
    >
      <ModeToggle mode={mode} onChange={onChange} />
    </div>
  )
}
