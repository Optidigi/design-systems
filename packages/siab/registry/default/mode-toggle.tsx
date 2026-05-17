"use client"
import * as React from "react"
import { SegmentedPill } from "@/components/ui/segmented-pill"
import { LayoutGrid, PanelLeft } from "lucide-react"

/**
 * Editor view mode. Canvas = WYSIWYG inline editing; sidebar = select-only
 * canvas with a right-hand drill-down inspector. Owned by @siab/mode-ui
 * because the canonical 2-state toggle below is bound to these values.
 */
export type EditorMode = "canvas" | "sidebar"

/**
 * Two-state Canvas / Sidebar toggle — thin opinionated wrapper around
 * SegmentedPill with the items baked in. Used by editor chrome to flip
 * between the WYSIWYG canvas view and the inspector-driven sidebar view.
 */
export const ModeToggle: React.FC<{
  mode: EditorMode
  onChange: (next: EditorMode) => void
  className?: string
}> = ({ mode, onChange, className }) => (
  <SegmentedPill<EditorMode>
    ariaLabel="Editor view"
    value={mode}
    onValueChange={(next) => next && onChange(next)}
    allowDeselect={false}
    labelBreakpoint="md"
    items={[
      { value: "canvas",  label: "Canvas",  icon: LayoutGrid, ariaLabel: "Canvas view" },
      { value: "sidebar", label: "Sidebar", icon: PanelLeft,  ariaLabel: "Sidebar view" },
    ]}
    className={className}
  />
)
