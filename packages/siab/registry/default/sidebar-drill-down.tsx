"use client"
import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronLeft, ChevronRight, GripVertical, Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { blockBySlug } from "@/blocks/registry"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"
import { BlockFormFields } from "@/components/ui/block-form-fields"

type Mode =
  | { kind: "list" }
  | { kind: "block"; blockIndex: number }
  | { kind: "page-settings" }

export interface SidebarDrillDownProps {
  blocks: any[]
  selectedBlockIndex: number | null
  onSelectBlock: (i: number | null) => void
  onReorder: (from: number, to: number) => void
  onDeleteBlock: (i: number) => void
  onDuplicateBlock: (i: number) => void
  manifest: RtManifest
  seoCard: React.ReactNode
  dangerZone: React.ReactNode
  theme?: ThemeTokens | null
}

export const SidebarDrillDown: React.FC<SidebarDrillDownProps> = ({
  blocks,
  selectedBlockIndex,
  onSelectBlock,
  onReorder,
  onDeleteBlock,
  onDuplicateBlock,
  manifest,
  seoCard,
  dangerZone,
  theme,
}) => {
  const [mode, setMode] = React.useState<Mode>(
    selectedBlockIndex != null ? { kind: "block", blockIndex: selectedBlockIndex } : { kind: "list" },
  )

  // Sync external selection → mode. Whenever selectedBlockIndex changes
  // (e.g. canvas click on a different block), drill into that block.
  // When it goes null (external deselect), return to the list state.
  React.useEffect(() => {
    if (selectedBlockIndex != null) {
      setMode({ kind: "block", blockIndex: selectedBlockIndex })
    } else if (mode.kind === "block") {
      setMode({ kind: "list" })
    }
  }, [selectedBlockIndex])

  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

  const dndId = React.useId()
  const ids = React.useMemo(() => blocks.map((_, i) => String(i)), [blocks.length])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = Number(active.id)
    const to = Number(over.id)
    if (Number.isNaN(from) || Number.isNaN(to)) return
    onReorder(from, to)
  }

  // Fallback: if we're in block mode but the block no longer exists, return to list
  const blockForMode = mode.kind === "block" ? blocks[mode.blockIndex] : undefined
  React.useEffect(() => {
    if (mode.kind === "block" && !blockForMode) {
      setMode({ kind: "list" })
    }
  }, [mode, blockForMode])

  let content: React.ReactNode

  if (mode.kind === "list") {
    content = (
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Page</h2>
          <button
            type="button"
            onClick={() => setMode({ kind: "page-settings" })}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Page settings"
          >
            <Settings className="size-3.5" />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {blocks.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">No blocks yet. Add one to start.</p>
          ) : (
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveDragId(String(e.active.id))}
              onDragEnd={(e) => {
                setActiveDragId(null)
                onDragEnd(e)
              }}
              onDragCancel={() => setActiveDragId(null)}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {blocks.map((block, i) => (
                  <BlockListRow
                    key={block.id ?? i}
                    id={String(i)}
                    block={block}
                    blockIndex={i}
                    onSelect={() => {
                      onSelectBlock(i)
                      setMode({ kind: "block", blockIndex: i })
                    }}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeDragId != null ? (
                  <BlockListRowGhost block={blocks[Number(activeDragId)]} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
          {/* Add block button lives INSIDE the scrollable list, just below the
              last block row (or below the empty-state hint when no blocks
              exist). Previously it was pinned to a sidebar footer; moving it
              into the scroll area makes the "next-action" affordance sit
              against the existing blocks rather than floating at the bottom
              of the sidebar pane. */}
          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 mt-1">
            <Plus className="size-3.5" aria-hidden /> Add block
          </Button>
        </div>
      </div>
    )
  } else if (mode.kind === "block") {
    if (!blockForMode) {
      // useEffect above will redirect; render nothing in the meantime
      content = null
    } else {
      content = (
        <BlockFormState
          block={blockForMode}
          blockIndex={mode.blockIndex}
          manifest={manifest}
          theme={theme}
          onBack={() => setMode({ kind: "list" })}
          onDelete={() => {
            onDeleteBlock(mode.blockIndex)
            setMode({ kind: "list" })
          }}
        />
      )
    }
  } else {
    content = (
      <PageSettingsState
        onBack={() => setMode({ kind: "list" })}
        seoCard={seoCard}
        dangerZone={dangerZone}
      />
    )
  }

  const transitionKey = mode.kind === "block" ? `block-${mode.blockIndex}` : mode.kind

  return (
    <div className="relative h-full overflow-hidden">
      <div
        key={transitionKey}
        className="h-full animate-in slide-in-from-right-3 duration-150"
      >
        {content}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

const BlockListRow: React.FC<{
  id: string
  block: any
  blockIndex: number
  onSelect: () => void
}> = ({ id, block, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const justDraggedRef = React.useRef(false)

  React.useEffect(() => {
    if (isDragging) {
      justDraggedRef.current = true
    } else if (justDraggedRef.current) {
      // Drag ended — keep the flag true briefly to swallow the trailing click.
      const timerId = setTimeout(() => {
        justDraggedRef.current = false
      }, 150)
      return () => clearTimeout(timerId)
    }
  }, [isDragging])

  const cfg = blockBySlug[block.blockType]
  const label = cfg ? (typeof cfg.labels?.singular === "string" ? cfg.labels.singular : cfg.slug) : block.blockType
  const summary = cfg?.summary ? cfg.summary(block) : undefined
  const Icon = cfg?.icon
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/row flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border hover:bg-accent/30"
      onClick={() => {
        if (isDragging || justDraggedRef.current) return
        onSelect()
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 cursor-grab rounded-sm p-0.5 text-muted-foreground hover:bg-accent active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium leading-snug">{label}</div>
        {summary && (
          <div className="truncate text-[11px] leading-snug text-muted-foreground">{summary}</div>
        )}
      </div>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </div>
  )
}

const BlockListRowGhost: React.FC<{ block: any }> = ({ block }) => {
  const cfg = blockBySlug[block?.blockType]
  const label = cfg
    ? (typeof cfg.labels?.singular === "string" ? cfg.labels.singular : cfg.slug)
    : block?.blockType
  const summary = cfg?.summary ? cfg.summary(block) : undefined
  const Icon = cfg?.icon
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background/95 backdrop-blur-sm px-2 py-1.5 shadow-lg cursor-grabbing">
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium leading-snug">{label}</div>
        {summary && (
          <div className="truncate text-[11px] leading-snug text-muted-foreground">{summary}</div>
        )}
      </div>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </div>
  )
}

const BlockFormState: React.FC<{
  block: any
  blockIndex: number
  manifest: RtManifest
  theme?: ThemeTokens | null
  onBack: () => void
  onDelete: () => void
}> = ({ block, blockIndex, manifest, theme, onBack, onDelete }) => {
  const cfg = blockBySlug[block.blockType]
  const label = cfg
    ? (typeof cfg.labels?.singular === "string" ? cfg.labels.singular : cfg.slug)
    : block.blockType
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  return (
    <div className="flex h-full flex-col">
      {/* Actions header — back (left) + delete (right). Sits above the
          section-name header so the destructive + navigation controls are
          at the top of the pane, not pinned to a footer at the bottom. */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1"
          aria-label="Back to block list"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="gap-1.5"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete block
        </Button>
      </header>
      <header className="flex items-center border-b border-border px-3 py-2">
        <span className="text-xs font-medium truncate">{label}</span>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <BlockFormFields block={block} blockIndex={blockIndex} manifest={manifest} theme={theme} />
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this block?"
        description={`${label} will be removed from this page. This can't be undone.`}
        confirmLabel="Delete block"
        variant="destructive"
        onConfirm={async () => {
          onDelete()
        }}
      />
    </div>
  )
}

const PageSettingsState: React.FC<{
  onBack: () => void
  seoCard: React.ReactNode
  dangerZone: React.ReactNode
}> = ({ onBack, seoCard, dangerZone }) => (
  <div className="flex h-full flex-col">
    <header className="flex items-center border-b border-border px-3 py-2">
      <span className="text-xs font-medium">Page settings</span>
    </header>
    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {seoCard}
      {dangerZone}
    </div>
    <footer className="border-t border-border px-3 py-2 flex items-center">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onBack}
        className="h-8 gap-1"
        aria-label="Back to block list"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back
      </Button>
    </footer>
  </div>
)
