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
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronRight, GripVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BlockTypePicker } from "@/components/editor/BlockTypePicker"
import { blockBySlug } from "@/blocks/registry"
import type { CanvasBlocksApi } from "@/components/editor/canvas/useCanvasBlocks"
import type { RtManifest } from "@/lib/richText/manifest"

export interface MobileSectionListProps {
  api: Pick<CanvasBlocksApi, "blocks" | "reorderBlocks" | "insertBlockAt">
  manifest: RtManifest
  tenantId: number | string
  onOpenSection: (i: number) => void
  pageTitle: string
  onOpenPageSettings: () => void
  onOpenSeo: () => void
  onDeletePage: () => void
}

interface SortableCardProps {
  id: string
  block: any
  index: number
  onOpen: () => void
}

const SortableSectionCard: React.FC<SortableCardProps> = ({ id, block, index, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const cfg = blockBySlug[block?.blockType]
  const label = cfg
    ? (typeof cfg.labels?.singular === "string" ? cfg.labels.singular : cfg.slug)
    : (block?.blockType ?? "?")
  const preview = cfg?.summary ? cfg.summary(block) : undefined
  const Icon = cfg?.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-background flex items-center gap-2 min-h-[64px] transition-colors hover:bg-accent/50"
      data-mobile-section-card
      data-section-index={index}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="flex h-11 w-11 shrink-0 items-center justify-center cursor-grab rounded-sm text-muted-foreground hover:bg-muted active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit ${label} section`}
        className="flex flex-1 items-center gap-3 min-w-0 py-3 pr-3 text-left"
      >
        {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm text-foreground leading-snug">{label}</div>
          {preview && (
            <div className="truncate text-xs text-muted-foreground leading-snug mt-0.5">{preview}</div>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </div>
  )
}

export const MobileSectionList: React.FC<MobileSectionListProps> = ({
  api,
  tenantId,
  onOpenSection,
  pageTitle,
  onOpenPageSettings,
  onOpenSeo,
  onDeletePage,
}) => {
  const { blocks, reorderBlocks, insertBlockAt } = api
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = React.useMemo(() => blocks.map((_, i) => String(i)), [blocks.length])

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = Number(active.id)
    const to = Number(over.id)
    if (Number.isNaN(from) || Number.isNaN(to)) return
    reorderBlocks(from, to)
  }

  return (
    <div className="flex flex-col gap-4 p-4" data-mobile-section-list>
      <header className="flex items-center justify-between gap-3 pb-1">
        <h1 className="truncate text-base font-semibold text-foreground" data-mobile-page-title>
          {pageTitle || "Untitled page"}
        </h1>
      </header>

      <section className="space-y-2" aria-label="Sections">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground">Sections</h2>
          <span className="text-[11px] text-muted-foreground">Drag to reorder</span>
        </div>
        {blocks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No sections yet. Tap "+ Add section" below.
          </div>
        )}
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {blocks.map((block, i) => (
                <SortableSectionCard
                  key={block.id ?? i}
                  id={String(i)}
                  block={block}
                  index={i}
                  onOpen={() => onOpenSection(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="default"
          className="w-full mt-1 gap-2"
          onClick={() => setPickerOpen(true)}
          data-mobile-add-section
        >
          <Plus className="size-4" /> Add section
        </Button>
      </section>

      <section className="space-y-1" aria-label="Page actions">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground pb-1">Page</h2>
        <PageRow label="Page settings" onClick={onOpenPageSettings} data-test="mobile-row-page-settings" />
        <PageRow label="SEO" onClick={onOpenSeo} data-test="mobile-row-seo" />
        <PageRow label="Delete page" onClick={onDeletePage} variant="destructive" data-test="mobile-row-delete" />
      </section>

      <BlockTypePicker
        tenantId={tenantId}
        controlledOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={(slug) => {
          insertBlockAt(blocks.length, slug)
          setPickerOpen(false)
        }}
      />
    </div>
  )
}

const PageRow: React.FC<{
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
  "data-test"?: string
}> = ({ label, onClick, variant = "default", ...attrs }) => (
  <button
    type="button"
    onClick={onClick}
    data-mobile-page-row
    data-test={attrs["data-test"]}
    className={[
      "flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-left text-sm transition-colors min-h-[48px]",
      variant === "destructive" ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent/50",
    ].join(" ")}
  >
    <span>{label}</span>
    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
  </button>
)
