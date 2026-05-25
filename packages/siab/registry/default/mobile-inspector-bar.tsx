"use client"
import * as React from "react"
import { Drawer as Vaul } from "vaul"
import { useMobileEditor, type MobileSnap } from "@/components/editor/canvas/mobile/MobileEditorContext"
import { useInspectorKeyboardLock } from "@/components/editor/canvas/mobile/useInspectorKeyboardLock"
import { MobileComponentEditor } from "@/components/ui/mobile-component-editor"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"
import { useTranslations } from "next-intl"

export interface MobileInspectorBarProps {
  /** Block currently displayed in the section view — passed to MobileComponentEditor. */
  block: any
  manifest: RtManifest
  /** Used ONLY to extract font family overrides for editor content; the drawer chrome itself still inherits admin tokens. */
  theme?: ThemeTokens | null
  renderInspector?: (context: MobileInspectorBarSlotContext) => React.ReactNode
}

export interface MobileInspectorBarSlotContext {
  isIdle: boolean
  snapFraction: number
  pathKey: string
  handle: React.ReactNode
  editor: React.ReactNode
  body: React.ReactNode
}

export interface MobileInspectorBarLayoutProps {
  snapFraction: number
  handle: React.ReactNode
  body: React.ReactNode
}

const SNAP_POINTS: MobileSnap[] = [0.42, 0.92]

/**
 * Bottom inspector bar driven by vaul.
 *
 * Snap points: [0.42, 0.92]
 *   0.42 — compact detent; the sheet opens here on selection — a canvas
 *          sliver stays visible. A drag down dismisses the sheet.
 *   0.92 — editing detent; focusing a field pops the sheet here (animated)
 *          so the field clears the keyboard. Native keyboard dismissal does
 *          not restore the sheet; the user stays in editing mode until Done
 *          or a manual sheet drag/close.
 *
 * Idle state (selected null + drillStack empty) fully hides the drawer via
 * open={false} — no persistent strip.
 *
 * vaul config:
 *   open={!isIdle}       — hidden when idle
 *   dismissible={true}   — a drag down past the low detent dismisses the
 *                          sheet; onOpenChange then clears the selection
 *   modal={false}        — canvas stays interactive
 *   noBodyStyles={true}  — PageForm uses document scroll
 *   repositionInputs={false} — vaul's own keyboard handler mis-positions the
 *                          sheet at snap index 0 (it guards on a falsy
 *                          activeSnapPointIndex), so it stays disabled. iOS's
 *                          native focus-scroll is suppressed by
 *                          useInspectorKeyboardLock instead (FE-71).
 *   (no handleOnly)      — the whole sheet body is draggable, not just the
 *                          grip; vaul's shouldDrag arbitrates drag-vs-scroll
 *                          per gesture (FE-72).
 */
export const MobileInspectorBar: React.FC<MobileInspectorBarProps> = ({ block, manifest, theme, renderInspector }) => {
  const t = useTranslations("editor")
  const { state, expandTo, clearSelection } = useMobileEditor()
  const isIdle = state.selected == null && state.drillStack.length === 0
  const pathKey = state.selected
    ? `${state.selected.blockIndex}.${state.selected.field}.${state.selected.itemIndex ?? ""}.${state.selected.subField ?? ""}`
    : "idle"

  // Visible snap fraction — the scroll region below is capped to it so content
  // taller than the active detent stays clipped to the visible sheet (FE-60).
  const snapFraction = typeof state.activeSnapPoint === "number" ? state.activeSnapPoint : 0.42

  // iOS Safari only: suppress the native focus-scroll that would otherwise drag
  // this position:fixed sheet off-screen when a field is focused (FE-71).
  useInspectorKeyboardLock(!isIdle)

  const handle = (
    <Vaul.Handle
      data-mobile-inspector-grip
      preventCycle
      className="mt-2 shrink-0 !bg-muted-foreground/30"
    />
  )
  const editor = state.selected ? (
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
  ) : null
  const body = (
    <div
      className="flex-1 min-h-0 overflow-hidden px-4 py-3"
      style={{ maxHeight: `calc(${snapFraction} * 100svh - 1rem)` }}
    >
      {editor}
    </div>
  )
  const content = renderInspector
    ? renderInspector({ isIdle, snapFraction, pathKey, handle, editor, body })
    : (
      <MobileInspectorBarLayout
        snapFraction={snapFraction}
        handle={handle}
        body={body}
      />
    )

  return (
    <Vaul.Root
      open={!isIdle}
      dismissible
      modal={false}
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
          aria-label={t("sectionInspector")}
          className="fixed inset-x-0 top-0 z-50 flex h-[100svh] flex-col overscroll-contain rounded-t-[10px] border-t border-border bg-background outline-none pointer-events-none"
        >
          <Vaul.Title className="sr-only">{t("sectionInspector")}</Vaul.Title>
          {content}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  )
}

export const MobileInspectorBarLayout: React.FC<MobileInspectorBarLayoutProps> = ({
  handle,
  body,
}) => (
  <div className="pointer-events-auto flex h-full flex-col overscroll-contain">
    {/* Drag handle. The whole sheet body is draggable (vaul default, no
        handleOnly — FE-72); the handle stays as a visible grip affordance. */}
    {handle}
    {body}
  </div>
)
