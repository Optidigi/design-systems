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

const SNAP_POINTS: MobileSnap[] = [0.3, 0.5, 1]

/**
 * Bottom inspector bar driven by vaul.
 *
 * Snap points: [0.3, 0.5, 1]
 *   0.5 — initial on selection (component editor half-height)
 *   0.3 — drag-down from 0.5 (editor still visible but compact)
 *   1   — fullscreen (richtext focus / media/icon sheet)
 *
 * Idle state (selected null + drillStack empty) fully hides the drawer via
 * open={false} — no persistent strip.
 *
 * vaul config:
 *   open={!isIdle}       — hidden when idle
 *   dismissible={false}  — cannot be closed; controlled by selection state
 *   modal={false}        — canvas stays interactive
 *   handleOnly={true}    — drag only on the grip, not the body
 *   noBodyStyles={true}  — PageForm uses document scroll
 *   repositionInputs={false} — iOS keyboard handled manually
 *   fadeFromIndex={2}    — overlay only when fullscreen (index 2 in 3-snap array)
 */
export const MobileInspectorBar: React.FC<MobileInspectorBarProps> = ({ block, manifest, theme }) => {
  const { state, expandTo } = useMobileEditor()
  const isIdle = state.selected == null && state.drillStack.length === 0
  const pathKey = state.selected
    ? `${state.selected.blockIndex}.${state.selected.field}.${state.selected.itemIndex ?? ""}.${state.selected.subField ?? ""}`
    : "idle"

  // Vaul 1.1.x sets `body { pointer-events: none }` while the drawer is
  // open — regardless of modal=false and noBodyStyles. Stamp a data-attr
  // on body so we can restore pointer-events for everything outside the
  // visible drawer area.
  React.useEffect(() => {
    if (isIdle) {
      delete document.body.dataset.mobileInspectorOpen
      return
    }
    document.body.dataset.mobileInspectorOpen = "true"
    return () => {
      delete document.body.dataset.mobileInspectorOpen
    }
  }, [isIdle])

  return (
    <Vaul.Root
      open={!isIdle}
      dismissible={false}
      modal={false}
      handleOnly
      noBodyStyles
      repositionInputs={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={state.activeSnapPoint}
      setActiveSnapPoint={(snap) => expandTo((snap as MobileSnap) ?? 0.5)}
      fadeFromIndex={2}
    >
      <Vaul.Portal>
        {/* Override vaul's body { pointer-events: none } when our drawer is open. */}
        <style dangerouslySetInnerHTML={{
          __html: `body[data-mobile-inspector-open="true"] { pointer-events: auto !important; }`
        }} />
        <Vaul.Content
          data-mobile-inspector-bar
          aria-label="Section inspector"
          className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] flex-col rounded-t-[10px] border-t border-border bg-background outline-none pointer-events-none"
        >
          <Vaul.Title className="sr-only">Section inspector</Vaul.Title>
          {/* Inner wrapper is pointer-events-auto so only the VISIBLE drawer area is interactive. */}
          <div className="pointer-events-auto flex h-full flex-col">
            {/* Drag grip — vaul wires up dragging when handleOnly is true */}
            <div
              data-mobile-inspector-grip
              className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
              aria-hidden
            />

            <div
              data-mobile-inspector-mode="editing"
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3"
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
