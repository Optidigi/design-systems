"use client"
import * as React from "react"
import { useFormContext } from "react-hook-form"
import { X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BLOCK_ELEMENTS, type ElementSpec } from "@/components/editor/canvas/blockElements"
import type { ElementPath } from "@/components/editor/canvas/elementPath"
import { elementPathToName } from "@/components/editor/canvas/elementPath"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"
import { inspectorFontStyle, roleToFontFamily } from "@/lib/theme/inspectorFonts"
import { useMobileEditor, type MobileSnap } from "@/components/editor/canvas/mobile/MobileEditorContext"
import { LexicalField } from "@/components/editor/richText/LexicalField"
import { MobileMediaSheet } from "@/components/ui/mobile-media-sheet"
import { MobileIconSheet } from "@/components/ui/mobile-icon-sheet"
import { resolveLucideIcon } from "@/components/ui/icon-picker"
import { MobileArrayDrilldown } from "@/components/ui/mobile-array-drilldown"

export interface MobileComponentEditorProps {
  path: ElementPath
  block: any
  manifest: RtManifest
  theme?: ThemeTokens | null
}

/**
 * Dispatches to a per-kind editor body based on the element's ElementSpec.
 * Mirrors BlockFormFields.FieldRenderer from the desktop sidebar — same code
 * paths per kind, different presentation (vaul-sized sheet vs. side aside).
 */
export const MobileComponentEditor: React.FC<MobileComponentEditorProps> = ({ path, block, manifest, theme }) => {
  const { clearSelection, state, focusPop } = useMobileEditor()
  const blockType: string | undefined = block?.blockType
  const specs: ElementSpec[] = blockType ? (BLOCK_ELEMENTS[blockType] ?? []) : []

  const parentSpec = specs.find((s) => s.field === path.field)
  let activeSpec: ElementSpec | undefined = parentSpec
  if (parentSpec?.kind === "array" && path.subField) {
    activeSpec = parentSpec.itemFields?.find((s) => s.field === path.subField)
  }

  const label = activeSpec?.label ?? path.field

  return (
    <div data-mobile-editor className="flex h-full min-h-0 flex-col" style={inspectorFontStyle(theme)}>
      <div className="flex items-center justify-between pb-2 shrink-0">
        <span className="text-sm font-medium truncate">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={clearSelection}
          aria-label="Close editor"
          data-mobile-editor-close
        >
          <X className="size-4" />
        </Button>
      </div>
      {/* Single scroll owner for the sheet — scrolls (with a visible bar)
          only at the top detent; clipped at the compact detent. overscroll
          containment lives here so the canvas behind can't rubber-band.
          onFocusCapture → focusPop(): pop the sheet to the editing detent
          (0.92) so the focused field clears the keyboard — instantly, since
          an animated snap racing the keyboard displaces the position:fixed
          sheet (FE-69/70). focusPop also remembers the prior detent, which
          MobileInspectorBar restores when the keyboard closes (FE-72). */}
      <div
        className={`flex-1 min-h-0 overscroll-contain ${
          state.activeSnapPoint === 0.92 ? "overflow-y-auto" : "overflow-hidden"
        }`}
        onFocusCapture={() => focusPop()}
      >
        <MobileFieldRenderer spec={activeSpec} parentSpec={parentSpec} path={path} manifest={manifest} blockType={blockType} />
      </div>
    </div>
  )
}

const MobileFieldRenderer: React.FC<{
  spec: ElementSpec | undefined
  parentSpec: ElementSpec | undefined
  path: ElementPath
  manifest: RtManifest
  blockType: string | undefined
}> = ({ spec, parentSpec, path, manifest, blockType }) => {
  const { watch, setValue } = useFormContext()
  const { expandTo } = useMobileEditor()
  const name = elementPathToName(path)
  const value = watch(name)

  // If the selected element is a sub-field of an array, route through
  // MobileArrayDrilldown so the user gets the array-list/array-item chrome
  // (back arrow, item label, trash) wrapping the sub-field editor. The
  // drill stack was already seeded by SET_SELECTED.
  const isArraySubField = parentSpec?.kind === "array" && path.subField != null
  if (isArraySubField && parentSpec) {
    const arrayName = `blocks.${path.blockIndex}.${parentSpec.field}`
    return (
      <MobileArrayDrilldown
        spec={parentSpec}
        blockIndex={path.blockIndex}
        manifest={manifest}
        arrayName={arrayName}
      />
    )
  }

  if (!spec) return <p className="text-xs text-muted-foreground">No editor for this element.</p>
  // Inputs below deliberately omit autoFocus: grabbing focus while the bottom
  // sheet is still animating open pops the keyboard mid-transition, so the
  // sheet never shifts up. The user taps a field to focus it.
  if (spec.kind === "text") {
    return (
      <div className="space-y-2 pb-4" data-mobile-editor-kind="text">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <Input
          value={value ?? ""}
          onChange={(e) => setValue(name, e.target.value, { shouldDirty: true })}
          style={{ fontFamily: roleToFontFamily(spec.role) }}
        />
      </div>
    )
  }
  if (spec.kind === "richtext") {
    return (
      <div className="space-y-2 pb-4" data-mobile-editor-kind="richtext">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <div
          className="rounded-md border border-border bg-background px-3 py-2"
          style={{ ["--rt-inspector-font-body" as string]: roleToFontFamily(spec.role) }}
        >
          <LexicalField
            key={`mobile-${path.blockIndex}.${spec.field}${path.itemIndex ?? ""}${path.subField ?? ""}`}
            chrome="full"
            variant={spec.variant ?? "inline"}
            value={value}
            onChange={(next) => setValue(name, next, { shouldDirty: true })}
            manifest={manifest}
            placeholder={spec.label}
            allowColor={blockType === "richText"}
          />
        </div>
      </div>
    )
  }
  if (spec.kind === "cta") {
    const cta = (value ?? {}) as { label?: string; href?: string }
    return (
      <div className="space-y-3 pb-4" data-mobile-editor-kind="cta">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input
            value={cta.label ?? ""}
            onChange={(e) => setValue(name, { ...cta, label: e.target.value }, { shouldDirty: true })}
            placeholder="Button text"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">URL</Label>
          <Input
            value={cta.href ?? ""}
            onChange={(e) => setValue(name, { ...cta, href: e.target.value }, { shouldDirty: true })}
            placeholder="https://..."
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    )
  }
  if (spec.kind === "image") {
    return <ImageEditor value={value} setValue={setValue} name={name} expandTo={expandTo} />
  }
  if (spec.kind === "icon") {
    return <IconEditor value={value} setValue={setValue} name={name} expandTo={expandTo} />
  }
  if (spec.kind === "array") {
    const arrayName = `blocks.${path.blockIndex}.${spec.field}`
    return (
      <MobileArrayDrilldown
        spec={spec}
        blockIndex={path.blockIndex}
        manifest={manifest}
        arrayName={arrayName}
      />
    )
  }
  return <p className="text-xs text-muted-foreground">Unknown kind</p>
}

const resolveUrl = (v: any): string | null => {
  if (!v) return null
  if (typeof v === "string") return v
  if (typeof v === "object") {
    if (v.url) return v.url
    if (v.filename) return `/media/${v.filename}`
  }
  return null
}

const ImageEditor: React.FC<{
  value: any
  setValue: (name: string, val: any, opts?: { shouldDirty?: boolean }) => void
  name: string
  expandTo: (snap: MobileSnap) => void
}> = ({ value, setValue, name, expandTo }) => {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const url = resolveUrl(value)

  return (
    <div className="space-y-3 pb-4" data-mobile-editor-kind="image">
      {url ? (
        <img src={url} alt="" className="w-full max-h-48 object-cover rounded-md border border-border" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground gap-2">
          <ImageIcon className="size-5" />
          No image
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => { expandTo(0.92); setSheetOpen(true) }}
        >
          {url ? "Replace" : "Choose"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setValue(name, null, { shouldDirty: true })}
          >
            Remove
          </Button>
        )}
      </div>
      <MobileMediaSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) expandTo(0.42) }}
        onPick={(m) => setValue(name, m, { shouldDirty: true })}
      />
    </div>
  )
}

const IconEditor: React.FC<{
  value: any
  setValue: (name: string, val: any, opts?: { shouldDirty?: boolean }) => void
  name: string
  expandTo: (snap: MobileSnap) => void
}> = ({ value, setValue, name, expandTo }) => {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const iconName: string | null = value ?? null
  const Icon = resolveLucideIcon(iconName)

  return (
    <div className="space-y-3 pb-4" data-mobile-editor-kind="icon">
      <button
        type="button"
        onClick={() => { expandTo(0.92); setSheetOpen(true) }}
        className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-3 text-sm hover:bg-accent/30"
      >
        {Icon ? <Icon className="size-6 shrink-0" /> : null}
        <span className={Icon ? undefined : "text-muted-foreground"}>
          {iconName ?? "Choose icon"}
        </span>
      </button>
      <MobileIconSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) expandTo(0.42) }}
        value={iconName}
        onChange={(next) => setValue(name, next, { shouldDirty: true })}
      />
    </div>
  )
}
