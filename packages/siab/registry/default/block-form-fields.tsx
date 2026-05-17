"use client"
import * as React from "react"
import { useFormContext } from "react-hook-form"
import { LexicalField } from "@/components/editor/richText/LexicalField"
import { InlineImage } from "@/components/editor/canvas/inline/InlineImage"
import { IconPicker, resolveLucideIcon } from "@/components/editor/canvas/inline/IconPicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BLOCK_ELEMENTS, type ElementSpec } from "@/components/editor/canvas/blockElements"
import { ArrayItemCard } from "@/components/ui/array-item-card"
import { CanvasSelectionProvider } from "@/components/editor/canvas/CanvasSelectionContext"
import type { RtManifest } from "@/lib/richText/manifest"
import type { ThemeTokens } from "@/lib/theme/schema"
import { inspectorFontStyle, roleToFontFamily } from "@/lib/theme/inspectorFonts"

export interface BlockFormFieldsProps {
  block: any
  blockIndex: number
  manifest: RtManifest
  theme?: ThemeTokens | null
}

export const BlockFormFields: React.FC<BlockFormFieldsProps> = ({ block, blockIndex, manifest, theme }) => {
  const blockType: string | undefined = block?.blockType
  const specs: ElementSpec[] = blockType ? (BLOCK_ELEMENTS[blockType] ?? []) : []

  return (
    <CanvasSelectionProvider value={{ view: "canvas", selected: null, select: () => {} }}>
      <div className="space-y-4" style={inspectorFontStyle(theme)}>
        {specs.map((spec) =>
          spec.kind === "array" ? (
            <ArraySection
              key={spec.field}
              spec={spec}
              block={block}
              blockIndex={blockIndex}
              manifest={manifest}
            />
          ) : (
            <FieldRenderer
              key={spec.field}
              spec={spec}
              block={block}
              blockIndex={blockIndex}
              manifest={manifest}
              theme={theme}
            />
          ),
        )}
      </div>
    </CanvasSelectionProvider>
  )
}

const FieldRenderer: React.FC<{
  spec: ElementSpec
  block: any
  blockIndex: number
  manifest: RtManifest
  theme?: ThemeTokens | null
}> = ({ spec, block: _block, blockIndex, manifest, theme }) => {
  const { watch, setValue } = useFormContext()
  const name = `blocks.${blockIndex}.${spec.field}`
  const value = watch(name)
  const setShouldDirty = (next: unknown) => setValue(name, next, { shouldDirty: true })

  if (spec.kind === "richtext") {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <div style={{ ["--rt-inspector-font-body" as string]: roleToFontFamily(spec.role) }}>
          <LexicalField
            key={`${blockIndex}.${spec.field}`}
            chrome="full"
            variant={spec.variant ?? "inline"}
            value={value}
            onChange={setShouldDirty}
            manifest={manifest}
            placeholder={spec.label}
            allowColor={_block?.blockType === "richText"}
          />
        </div>
      </div>
    )
  }

  if (spec.kind === "text") {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <Input
          value={value ?? ""}
          onChange={(e) => setShouldDirty(e.target.value)}
          style={{ fontFamily: roleToFontFamily(spec.role) }}
        />
      </div>
    )
  }

  if (spec.kind === "image") {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <InlineImage value={value} onChange={setShouldDirty} />
      </div>
    )
  }

  if (spec.kind === "icon") {
    const iconValue: string | null = value ?? null
    const Icon = resolveLucideIcon(iconValue)
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <IconPicker
          value={iconValue}
          onChange={setShouldDirty}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent/30"
            >
              {Icon ? <Icon className="size-4 shrink-0" /> : null}
              <span className={Icon ? undefined : "text-muted-foreground"}>
                {iconValue ?? "Choose icon"}
              </span>
            </button>
          }
        />
      </div>
    )
  }

  if (spec.kind === "cta") {
    const cta = (value ?? {}) as { label?: string; href?: string }
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{spec.label}</Label>
        <div className="space-y-2 pl-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={cta.label ?? ""}
              onChange={(e) => setShouldDirty({ ...cta, label: e.target.value })}
              placeholder="Button text"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              value={cta.href ?? ""}
              onChange={(e) => setShouldDirty({ ...cta, href: e.target.value })}
              placeholder="https://..."
              inputMode="url"
            />
          </div>
        </div>
      </div>
    )
  }

  return <p className="text-xs text-muted-foreground">Unknown field kind: {String(spec.kind)}</p>
}

const ArraySection: React.FC<{
  spec: ElementSpec
  block: any
  blockIndex: number
  manifest: RtManifest
}> = ({ spec, block: _block, blockIndex, manifest }) => {
  const { watch, setValue } = useFormContext()
  const name = `blocks.${blockIndex}.${spec.field}`
  const items: any[] = watch(name) ?? []

  function setItems(next: any[]) {
    setValue(name, next, { shouldDirty: true })
  }

  return (
    <section className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{spec.label}</Label>
      <div className="space-y-2">
        {items.map((item, itemIndex) => (
          <ArrayItemCard
            key={item.id ?? itemIndex}
            spec={spec}
            item={item}
            itemIndex={itemIndex}
            blockIndex={blockIndex}
            onChange={(next) => {
              const copy = [...items]
              copy[itemIndex] = next
              setItems(copy)
            }}
            onRemove={() => {
              const copy = items.filter((_, j) => j !== itemIndex)
              setItems(copy)
            }}
            manifest={manifest}
          />
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, {}])}
          className="w-full rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/30"
        >
          + Add {spec.itemLabel ? spec.itemLabel({}, items.length) : "item"}
        </button>
      </div>
    </section>
  )
}
