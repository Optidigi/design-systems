"use client"
import * as React from "react"
import { Drawer as Vaul } from "vaul"
import { useMobileEditor, type MobileSnap } from "@/components/editor/canvas/mobile/MobileEditorContext"
import { MobileComponentEditor } from "@/components/ui/mobile-component-editor"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"

export interface MobileInspectorBarProps {
  /** Block currently displayed in the section view — passed to MobileComponentEditor. */
  block: any
  manifest: RtManifest
  /** Used ONLY to extract font family overrides for editor content; the drawer chrome itself still inherits admin tokens. */
  theme?: ThemeTokens | null
}

const SNAP_POINTS: MobileSnap[] = [0.42, 0.92]

/**
 * Bottom inspector bar driven by vaul.
 *
 * Snap points: [0.42, 0.92]
 *   0.42 — initial on selection (compact editor)
 *   0.92 — near-full; richtext / media / array editors auto-promote here.
 *          A canvas sliver stays visible for spatial context.
 *
 * Idle state (selected null + drillStack empty) fully hides the drawer via
 * open={false} — no persistent strip.
 *
 * vaul config:
 *   open={!isIdle}       — hidden when idle
 *   dismissible={true}   — a handle drag down past the low detent dismisses
 *                          the sheet; onOpenChange then clears the selection
 *   modal={false}        — canvas stays interactive
 *   handleOnly={true}    — drag only on the grip, not the body
 *   noBodyStyles={true}  — PageForm uses document scroll
 *   repositionInputs={false} — vaul's own keyboard handler mis-positions the
 *                          sheet at snap index 0 (it guards on a falsy
 *                          activeSnapPointIndex), so it stays disabled. The
 *                          CMS adds no keyboard handling of its own; iOS
 *                          positions the focused field natively (FE-68).
 */
export const MobileInspectorBar: React.FC<MobileInspectorBarProps> = ({ block, manifest, theme }) => {
  const { state, expandTo, clearSelection } = useMobileEditor()
  const isIdle = state.selected == null && state.drillStack.length === 0
  const pathKey = state.selected
    ? `${state.selected.blockIndex}.${state.selected.field}.${state.selected.itemIndex ?? ""}.${state.selected.subField ?? ""}`
    : "idle"

  // Visible snap fraction — the scroll region below is capped to it so content
  // taller than the active detent stays clipped to the visible sheet (FE-60).
  const snapFraction = typeof state.activeSnapPoint === "number" ? state.activeSnapPoint : 0.42

  return (
    <Vaul.Root
      open={!isIdle}
      dismissible
      modal={false}
      handleOnly
      noBodyStyles
      repositionInputs={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={state.activeSnapPoint}
      setActiveSnapPoint={(snap) => expandTo((snap as MobileSnap) ?? 0.42)}
      onOpenChange={(open) => { if (!open && !isIdle) clearSelection() }}
    >
      <Vaul.Portal>
        <Vaul.Content
          data-mobile-inspector-bar
          aria-label="Section inspector"
          className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] flex-col rounded-t-[10px] border-t border-border bg-background outline-none pointer-events-none"
        >
          <Vaul.Title className="sr-only">Section inspector</Vaul.Title>
          {/* Inner wrapper is pointer-events-auto so only the VISIBLE drawer area is interactive. */}
          <div className="pointer-events-auto flex h-full flex-col">
            {/* Drag handle. Vaul.Handle is what actually makes the sheet
                draggable when handleOnly is set — a plain div is not wired
                for drag. preventCycle disables vaul's tap-to-cycle: the
                handle is a pure drag affordance, not a hidden toggle.
                !bg override keeps the handle on a theme token (vaul's
                default [data-vaul-handle] background is a hard-coded grey). */}
            <Vaul.Handle
              data-mobile-inspector-grip
              preventCycle
              className="mt-2 shrink-0 !bg-muted-foreground/30"
            />

            <div
              data-mobile-inspector-mode="editing"
              className="flex-1 min-h-0 overflow-hidden px-4 py-3"
              style={{ maxHeight: `calc(${snapFraction} * 100dvh - 1rem)` }}
            >
              {state.selected && (
                <div
                  key={pathKey}
                  className="h-full animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <MobileComponentEditor
                    path={state.selected}
                    block={block}
                    manifest={manifest}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  )
}
