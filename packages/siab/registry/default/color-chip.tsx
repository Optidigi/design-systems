"use client"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection } from "lexical"
import { $patchStyleText } from "@lexical/selection"
import { Palette } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { RtManifest } from "@/lib/richText/manifest"
import { useAnchorRtCanvas } from "@/components/ui/use-rt-canvas-anchor"
import { useActiveTextStyle } from "@/components/ui/use-active-text-style"
import { cn } from "@/lib/utils"

export interface ColorChipProps {
  manifest: RtManifest
}

interface ResolvedColors {
  tokens: Record<string, string>
  /** The canvas's inherited text colour — used as the "Default" swatch fill. */
  defaultColor: string
}

const useResolvedColors = (manifest: RtManifest): ResolvedColors => {
  const anchor = useAnchorRtCanvas()
  const [resolved, setResolved] = React.useState<ResolvedColors>({ tokens: {}, defaultColor: "" })

  React.useEffect(() => {
    if (!anchor) return
    const tokens: Record<string, string> = {}
    const cs = getComputedStyle(anchor)
    for (const c of manifest.colorTokens ?? []) {
      const v = cs.getPropertyValue(c.cssVar).trim()
      // Prefer the canvas-scoped value; fall back to the admin mirror.
      if (v) tokens[c.id] = v
      else {
        const mirror = cs.getPropertyValue(c.cssVar.replace(/^--color-/, "--rt-tenant-color-")).trim()
        if (mirror) tokens[c.id] = mirror
      }
    }
    setResolved({ tokens, defaultColor: cs.color || "" })
  }, [anchor, manifest])

  return resolved
}

export const ColorChip: React.FC<ColorChipProps> = ({ manifest }) => {
  const [editor] = useLexicalComposerContext()
  const { tokens: resolved, defaultColor } = useResolvedColors(manifest)
  const { color: activeColor } = useActiveTextStyle()
  const tokens = manifest.colorTokens ?? []
  if (tokens.length === 0) return null

  const apply = (id: string | null) => {
    editor.update(() => {
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return
      $patchStyleText(sel, { "--rt-color": id })
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Text colour"
        >
          <Palette className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-56 p-1.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-6 gap-1.5 p-1">
          {/* Default colour swatch — rendered first so it lives in-grid with the
              palette tokens. The fill is the canvas's inherited text colour, so
              picking it visually "matches" the colour the text reverts to. */}
          <button
            type="button"
            aria-label="Default colour"
            aria-pressed={activeColor === null}
            title="Default colour"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(null)}
            className={cn(
              "size-6 rounded-full ring-1 ring-border hover:ring-2 hover:ring-foreground focus-visible:ring-2 focus-visible:ring-ring",
              activeColor === null && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
            )}
            style={{ backgroundColor: defaultColor || "transparent" }}
          />
          {tokens.map((t) => {
            const isActive = activeColor === t.id
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.label}
                aria-pressed={isActive}
                title={t.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(t.id)}
                className={cn(
                  "size-6 rounded-full ring-1 ring-border hover:ring-2 hover:ring-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
                )}
                style={{ backgroundColor: resolved[t.id] || "transparent" }}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
