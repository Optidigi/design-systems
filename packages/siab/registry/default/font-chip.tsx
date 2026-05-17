"use client"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection } from "lexical"
import { $patchStyleText } from "@lexical/selection"
import { Type } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Role = "title" | "heading" | "text"

const ROLES: Array<{ role: Role; label: string }> = [
  { role: "title",   label: "Title font" },
  { role: "heading", label: "Heading font" },
  { role: "text",    label: "Text font" },
]

export const FontChip: React.FC = () => {
  const [editor] = useLexicalComposerContext()

  const apply = (role: Role) => {
    editor.update(() => {
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return
      $patchStyleText(sel, { "font-family": `var(--font-${role})` })
    })
  }

  const clear = () => {
    editor.update(() => {
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return
      $patchStyleText(sel, { "font-family": null })
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Font family"
        >
          <Type className="size-3.5" aria-hidden />
          <span>Font</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-56 p-1.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(role)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
          >
            <span className="text-foreground" style={{ fontFamily: `var(--rt-tenant-font-${role}, var(--font-${role}))` }}>Aa</span>
            <span className="text-muted-foreground">{label}</span>
          </button>
        ))}
        <div className="border-t border-border my-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left text-muted-foreground"
        >
          Clear font
        </button>
      </PopoverContent>
    </Popover>
  )
}
