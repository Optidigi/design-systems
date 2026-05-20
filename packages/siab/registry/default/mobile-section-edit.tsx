"use client"
import * as React from "react"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CanvasBlockRenderer } from "@/components/ui/canvas-block-renderer"
import { MobileInspectorBar } from "@/components/ui/mobile-inspector-bar"
import { MobileFloatingPill } from "@/components/ui/mobile-floating-pill"
import { useMobileEditor } from "@/components/editor/canvas/mobile/MobileEditorContext"
import { blockBySlug } from "@/blocks/registry"
import type { CanvasBlocksApi } from "@/components/editor/canvas/useCanvasBlocks"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"


export interface MobileSectionEditProps {
  api: Pick<CanvasBlocksApi, "blocks" | "updateBlock" | "deleteBlock" | "duplicateBlock" | "reorderBlocks">
  index: number
  manifest: RtManifest
  theme?: ThemeTokens | null
  onBack: () => void
  onPrev?: () => void
  onNext?: () => void
  onJumpToSection: (i: number) => void
}

/**
 * Focused section view for mobile canvas mode.
 *
 * Top chrome: ‹ Back · prev/next chevrons · section-name dropdown · save Badge.
 * Body: the single rendered section, full mobile width.
 * Bottom: persistent MobileInspectorBar (vaul) — idle strip in 3rem, expands on tap.
 *
 * Selection state lives in MobileEditorContext (mounted by CanvasMobile).
 */
export const MobileSectionEdit: React.FC<MobileSectionEditProps> = ({
  api,
  index,
  manifest,
  theme,
  onBack,
  onPrev,
  onNext,
  onJumpToSection,
}) => {
  const { blocks, updateBlock, deleteBlock } = api
  const block = blocks[index]
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const { state: editorState } = useMobileEditor()
  const isIdle = editorState.selected == null && editorState.drillStack.length === 0

  // Guard: if the block was deleted from elsewhere (e.g. trash icon in
  // the inspector bar), navigate back. We track first-seen via a ref so
  // the RHF re-hydration transient (block briefly undefined on mount)
  // doesn't pop the user back to overview.
  const blockEverExistedRef = React.useRef(false)
  React.useEffect(() => {
    if (block) {
      blockEverExistedRef.current = true
      return
    }
    if (blockEverExistedRef.current) onBack()
  }, [block, onBack])

  if (!block) return null

  const cfg = blockBySlug[block?.blockType]
  const label = cfg
    ? (typeof cfg.labels?.singular === "string" ? cfg.labels.singular : cfg.slug)
    : (block?.blockType ?? "?")

  return (
    <div data-mobile-section-edit className="flex h-full min-h-0 flex-col">
      {/* Top chrome */}
      <header className="sticky top-0 z-30 flex items-center justify-center gap-1 border-b border-border bg-background px-2 pt-14 pb-3 min-w-0">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-12"
            onClick={onPrev}
            disabled={!onPrev}
            aria-label="Previous section"
            data-mobile-prev
          >
            <ChevronLeft className="size-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="h-11 max-w-[10rem] truncate font-medium" aria-label={`Switch section (current: ${label})`} data-mobile-section-name>
                {label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[14rem]">
              {blocks.map((b, i) => {
                const c = blockBySlug[b?.blockType]
                const l = c ? (typeof c.labels?.singular === "string" ? c.labels.singular : c.slug) : b?.blockType
                const Icon = c?.icon
                return (
                  <DropdownMenuItem
                    key={b.id ?? i}
                    onClick={() => onJumpToSection(i)}
                    className={i === index ? "bg-accent" : undefined}
                  >
                    {Icon && <Icon className="mr-2 size-4 text-muted-foreground" aria-hidden />}
                    <span>{l}</span>
                    <span className="ml-2 text-xs text-muted-foreground">#{i + 1}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-12"
            onClick={onNext}
            disabled={!onNext}
            aria-label="Next section"
            data-mobile-next
          >
            <ChevronRight className="size-6" />
          </Button>

      </header>

      {/* Canvas region — single rendered section.
          min-h-0 lets this flex child shrink so overflow-y-auto actually
          engages — without it a tall section grows past the column and is
          clipped unscrollable (FE-61).
          touch-pan-x/y allows scrolling but suppresses pinch-zoom (FE-62). */}
      <div
        data-mobile-canvas
        className="flex-1 min-h-0 overflow-y-auto touch-pan-x touch-pan-y"
        onClickCapture={(e) => {
          if ((e.target as HTMLElement | null)?.closest("a[href]")) e.preventDefault()
        }}
      >
        <div className="rt-canvas" data-rt-view="mobile" data-rt-mode={theme?.mode ?? "light"}>
          <CanvasBlockRenderer
            block={block}
            index={index}
            isActive
            manifest={manifest}
            onActivate={() => {}}
            onUpdate={updateBlock(index)}
          />
        </div>
      </div>

      {/* Inspector bar — hidden when idle (vaul open={false}), visible on selection */}
      <MobileInspectorBar
        block={block}
        manifest={manifest}
        theme={theme}
      />

      {/* Idle trash pill — visible only when no element is selected */}
      {isIdle && (
        <MobileFloatingPill
          position="bottom-right"
          icon={<Trash2 className="h-5 w-5" aria-hidden />}
          onClick={() => setDeleteOpen(true)}
          ariaLabel={`Delete ${label} section`}
          variant="destructive"
          dataAttrs={{ "data-mobile-trash-pill": "" }}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this section?"
        description={`${label} will be removed from this page. This can't be undone.`}
        confirmLabel="Delete section"
        variant="destructive"
        onConfirm={async () => {
          deleteBlock(index)
          onBack()
        }}
      />
    </div>
  )
}
