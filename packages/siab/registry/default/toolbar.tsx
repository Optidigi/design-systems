"use client"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { FORMAT_ELEMENT_COMMAND } from "lexical"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RtManifest } from "@/lib/richText/manifest"
import { MarkChips } from "@/components/ui/mark-chips"
import { ColorChip } from "@/components/ui/color-chip"
import { FontChip } from "@/components/ui/font-chip"
import { StyleChip } from "@/components/ui/style-chip"
import { LinkChip } from "@/components/ui/link-chip"

export const Toolbar: React.FC<{ manifest: RtManifest; variant: "block" | "inline"; allowColor?: boolean; allowFontFamily?: boolean; onOpenLink: () => void }> = ({ manifest, variant, allowColor = false, allowFontFamily = false, onOpenLink }) => {
  const [editor] = useLexicalComposerContext()

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1">
      <MarkChips manifest={manifest} surface="persistent" />
      {/* Colour is reserved for the dedicated RichText block only. Every
          other block's inline-text fields get colour control via the
          sitewide ThemeBar. */}
      {allowColor && <ColorChip manifest={manifest} />}
      {allowFontFamily && <FontChip manifest={manifest} />}
      <StyleChip manifest={manifest} />
      <LinkChip onOpen={onOpenLink} surface="persistent" />
      {variant === "block" && (
        <>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button type="button" size="sm" variant="ghost" aria-label="Align left" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}><AlignLeft className="size-4" /></Button>
          <Button type="button" size="sm" variant="ghost" aria-label="Align center" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}><AlignCenter className="size-4" /></Button>
          <Button type="button" size="sm" variant="ghost" aria-label="Align right" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}><AlignRight className="size-4" /></Button>
        </>
      )}
    </div>
  )
}
