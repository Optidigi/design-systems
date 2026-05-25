"use client"
import * as React from "react"
import { useId } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CanvasBlockRenderer } from "@/components/ui/canvas-block-renderer"
import { CanvasGapButton } from "@/components/ui/canvas-gap-button"
import { BlockGutter } from "@/components/ui/block-gutter"
import { useCanvasBlocks } from "@/components/editor/canvas/useCanvasBlocks"
import { useCanvasSelection } from "@/components/editor/canvas/CanvasSelectionContext"
import { useFitZoom } from "@/components/ui/use-fit-zoom"
import { useScrollToSelection } from "@/components/ui/use-scroll-to-selection"
import { remapSelectionAfterReorder, remapSelectionAfterDelete, remapSelectionAfterInsert } from "@/components/editor/canvas/elementPath"
import { useIsMobile } from "@/hooks/use-mobile"
import { CanvasMobile } from "@/components/ui/canvas-mobile"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"
import { toCssVars } from "@/lib/theme/toCssVars"
import { isReadOnlyView } from "@/components/editor/canvas/canvasView"
import type { CanvasView } from "@/components/editor/canvas/canvasView"

/** The fixed "desktop" width the canvas surface is laid out at before being
 *  zoom-fitted into the (narrower) editor pane — see useFitZoom. */
const CANVAS_DESIGN_WIDTH = 1280

export interface CanvasModeProps {
  manifest: RtManifest
  /** Pre-loaded tenant CSS bundle, server-side-fetched and scoped to .rt-canvas.
   *  May be null if the tenant didn't ship one yet (renders without). */
  tenantCss: string | null
  /**
   * Which view the editor is in. Passed through to CanvasMobile so
   * the mobile drill-down can stay coherent.
   * - "canvas": inline-edit mode (default behaviour).
   * - "sidebar": select-only mode; clicks select elements rather than edit inline.
   * - "mobile": select-only mode; MobileInspectorBar handles edits.
   */
  view: CanvasView
  /** Tenant-level design-token overrides from Tenant.theme. Injected as a
   *  second <style> tag AFTER the compiled base bundle so the declarations
   *  win by source order. Null/undefined → no override tag emitted. */
  theme?: ThemeTokens | null
  /** The page-level Danger Zone card. Forwarded to CanvasMobile and rendered
   *  at the bottom of the mobile section-list view so destructive page actions
   *  remain reachable on mobile. Desktop ignores it — PageForm composes the
   *  desktop SEO/Danger grid itself. */
  dangerZone?: React.ReactNode
  /** The page-level SEO card. Forwarded to CanvasMobile and rendered above
   *  the dangerZone in the mobile section-list view. Desktop ignores it —
   *  PageForm composes the desktop SEO/Danger grid itself. */
  seoCard?: React.ReactNode
  /** Block-array mutators that also keep the shared `selected` ElementPath
   *  coherent. Provided by PageForm so both desktop and mobile paths share
   *  the same remap-on-mutation invariant. */
  reorderBlocks: (from: number, to: number) => void
  deleteBlock: (i: number) => void
  duplicateBlock: (i: number) => void
  /** Human-readable page title — shown in the mobile overview header. */
  pageTitle: string
  /** Called when the mobile overview's Delete-page row is tapped. Owner is
   *  PageForm — opens the existing TypedConfirmDialog. */
  onDeletePage: () => void
}

// ---------------------------------------------------------------------------
// Per-block sortable wrapper — must be a component so useSortable can be
// called per item without violating rules-of-hooks.
// ---------------------------------------------------------------------------
interface SortableBlockItemProps {
  id: string
  block: any
  index: number
  isActive: boolean
  manifest: RtManifest
  onActivate: () => void
  onUpdate: (next: any) => void
  onDelete: () => void
  onDuplicate: () => void
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
  id,
  block,
  index,
  isActive,
  manifest,
  onActivate,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/block relative"
    >
      {/* Block gutter chip — top-right overlay inside the block, revealed on hover */}
      <BlockGutter
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      <CanvasBlockRenderer
        block={block}
        index={index}
        isActive={isActive}
        manifest={manifest}
        onActivate={onActivate}
        onUpdate={onUpdate}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CanvasMode
// ---------------------------------------------------------------------------

/**
 * Top-level canvas mode editor. Dispatches to CanvasMobile on narrow
 * viewports (<768px) and the desktop canvas-only pane on wide ones.
 *
 * In Phase 3 the desktop sidebar lives in PageForm — CanvasMode renders
 * ONLY the canvas pane on desktop. The sidebar (SidebarDrillDown — block
 * list + selected-block form + page-settings) is composed in PageForm.
 *
 * Reads/writes the form state via react-hook-form (RHF) — the form is
 * provided by PageForm's existing FormProvider.
 */
export const CanvasMode: React.FC<CanvasModeProps> = ({ manifest, tenantCss, view, dangerZone, seoCard, theme, reorderBlocks, deleteBlock, duplicateBlock, pageTitle, onDeletePage }) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <CanvasMobile
        manifest={manifest}
        tenantCss={tenantCss}
        view="mobile"
        dangerZone={dangerZone}
        seoCard={seoCard}
        theme={theme}
        reorderBlocks={reorderBlocks}
        deleteBlock={deleteBlock}
        duplicateBlock={duplicateBlock}
        pageTitle={pageTitle}
        onDeletePage={onDeletePage}
      />
    )
  }

  return <CanvasModeDesktop manifest={manifest} tenantCss={tenantCss} view={view} dangerZone={dangerZone} theme={theme} reorderBlocks={reorderBlocks} deleteBlock={deleteBlock} duplicateBlock={duplicateBlock} pageTitle={pageTitle} onDeletePage={onDeletePage} />
}

/** Desktop layout — extracted so it only mounts when not mobile.
 *  Renders ONLY the canvas scroll pane; the sidebar is owned by PageForm. */
const CanvasModeDesktop: React.FC<CanvasModeProps> = ({ manifest, tenantCss, view, theme, pageTitle: _pageTitle, onDeletePage: _onDeletePage }) => {
  const {
    blocks,
    activeIndex,
    setActiveIndex,
    updateBlock,
    insertBlockAt,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
  } = useCanvasBlocks(manifest)

  const { select, selected } = useCanvasSelection()

  // Mirror external sidebar selection (selected.blockIndex) into the canvas's
  // local activeIndex so the canvas block ring reflects sidebar drill-down.
  React.useEffect(() => {
    setActiveIndex(selected?.blockIndex ?? null)
  }, [selected?.blockIndex])

  // Render the canvas at a fixed desktop width, zoom-fitted into the pane so
  // the tenant site's viewport breakpoints resolve to their desktop layout.
  const { ref: paneRef, zoom } = useFitZoom(CANVAS_DESIGN_WIDTH)

  // When the sidebar selects an element, scroll it into view and fire the
  // arrival-pulse animation so the user's eye is drawn to the selected node.
  useScrollToSelection(paneRef, selected)

  // Click outside any block → deactivate / deselect
  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveIndex(null)
      select(null)
    }
  }

  // Mutation wrappers that keep the shared `selected` ElementPath coherent
  // after the block array changes. `select` writes back through
  // CanvasSelectionContext → PageForm.setSelected (the single source of truth).
  const deleteBlockWithRemap = (i: number) => {
    select((prev) => remapSelectionAfterDelete(prev, i))
    deleteBlock(i)
  }

  const reorderBlocksWithRemap = (from: number, to: number) => {
    select((prev) => remapSelectionAfterReorder(prev, from, to))
    reorderBlocks(from, to)
  }

  const insertBlockAtWithRemap = (i: number, slug: string, seed?: Record<string, unknown>) => {
    select((prev) => remapSelectionAfterInsert(prev, i))
    insertBlockAt(i, slug, seed)
  }

  const duplicateBlockWithRemap = (i: number) => {
    // duplicate inserts the clone at i+1 — same as insert at i+1
    select((prev) => remapSelectionAfterInsert(prev, i + 1))
    duplicateBlock(i)
  }

  // dnd-kit setup — mirrors BlockEditor.tsx sensors config
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // dnd-kit emits transforms in viewport-px. CSS `zoom` on the canvas wrapper
  // scales them down, so a translate of N looks like N*zoom on screen — and
  // dnd-kit's displacement calculations for sibling blocks produce wildly wrong
  // positions during drag. Divide every transform component by zoom so the
  // rendered translate produces the viewport-px movement dnd-kit expects.
  const zoomCompensateModifier = React.useMemo<Modifier>(
    () => ({ transform }) => {
      if (zoom === 1) return transform
      return {
        ...transform,
        x: transform.x / zoom,
        y: transform.y / zoom,
      }
    },
    [zoom],
  )

  // Stable sortable IDs: index-based strings. After a drag, blocks array is
  // reordered in state so indices stay correct.
  const sortableIds = blocks.map((_, i) => String(i))

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = Number(active.id)
    const to = Number(over.id)
    if (Number.isNaN(from) || Number.isNaN(to)) return
    reorderBlocksWithRemap(from, to)
  }

  return (
    <div className="w-full">
      {/* Canvas surface — measured for zoom-fit. No scroll here: the parent
          (PageForm) owns the scroll container (Task 6).
          `contain: inline-size` is load-bearing: the fixed-width (1280px) zoom
          child would otherwise propagate its width up and cause unwanted layout
          side-effects — `min-w-0` + `overflow-x-hidden` alone don't stop it
          under CSS `zoom`. Containment makes the pane's width purely
          context-determined; the child is then just visually clipped. */}
      <div
        ref={paneRef}
        className="min-w-0 [contain:inline-size] overflow-x-hidden bg-background"
        onClick={onCanvasClick}
      >
        {/* Inject the compiled tenant CSS via dangerouslySetInnerHTML, NOT a
            text child: the bundle contains chars React text-escapes on SSR but
            not on the client (Tailwind v4 emits `@media (width >= 40rem)` — the
            `>` becomes `&gt;` in the SSR'd HTML, `>` on the client) → a
            hydration mismatch. dangerouslySetInnerHTML emits the CSS verbatim
            and React doesn't hydration-diff its content. */}
        {tenantCss && (
          <style data-rt-tenant-css dangerouslySetInnerHTML={{ __html: tenantCss }} />
        )}
        {/* Theme overrides — injected AFTER the base bundle so equal-specificity
            custom-property declarations win by source order. toCssVars returns ""
            for an empty/null theme, but gate on `theme &&` anyway to skip the tag
            entirely when no theme is configured. */}
        {theme && (
          <style data-rt-theme-overrides dangerouslySetInnerHTML={{ __html: toCssVars(theme) }} />
        )}
        {/* Fixed-width design surface, zoom-fitted into the pane. mx-auto keeps
            the surface centred when zoom × CANVAS_DESIGN_WIDTH < pane width. */}
        <div style={{ width: CANVAS_DESIGN_WIDTH, zoom }} className="mx-auto">
          {/* onClickCapture: a single dynamic guard so NO <a> inside the canvas
              ever navigates — Lexical link nodes, InlineCtaButton, or any link a
              tenant block emits. Capture phase runs before the link's default
              action; the click still bubbles so editing affordances fire. */}
          <div
            className="rt-canvas"
            data-rt-view={view}
            data-rt-mode={theme?.mode === "dark" ? "dark" : "light"}
            onClickCapture={(e) => {
              if ((e.target as HTMLElement | null)?.closest("a[href]")) e.preventDefault()
            }}
          >
            {/* Leading gap — insert at position 0. Only shown in canvas view
                (sidebar/mobile view is select-only: no block insertion from canvas). */}
            {!isReadOnlyView(view) && (
              <CanvasGapButton
                onInsert={(slug, seed) => insertBlockAtWithRemap(0, slug, seed)}
              />
            )}
            {blocks.length === 0 && (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                <p>No blocks yet. {!isReadOnlyView(view) ? "Click the + above to add one." : "Switch to canvas view to add blocks."}</p>
              </div>
            )}
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[zoomCompensateModifier]}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {blocks.map((block, i) => (
                  <React.Fragment key={i}>
                    <SortableBlockItem
                      id={String(i)}
                      block={block}
                      index={i}
                      isActive={activeIndex === i}
                      manifest={manifest}
                      onActivate={() => setActiveIndex(i)}
                      onUpdate={updateBlock(i)}
                      onDelete={() => deleteBlockWithRemap(i)}
                      onDuplicate={() => duplicateBlockWithRemap(i)}
                    />
                    {/* Trailing gap after each block — canvas view only */}
                    {!isReadOnlyView(view) && (
                      <CanvasGapButton
                        onInsert={(slug, seed) => insertBlockAtWithRemap(i + 1, slug, seed)}
                      />
                    )}
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  )
}
