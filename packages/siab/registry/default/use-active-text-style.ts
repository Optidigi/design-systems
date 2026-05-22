"use client"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { StyledHeadingNode } from "@/lib/richText/lexical/StyledHeadingNode"
import { StyledParagraphNode } from "@/lib/richText/lexical/StyledParagraphNode"

/**
 * Returns the `--rt-color` and `--rt-style` values currently applied at
 * the active selection — used by ColorChip / StyleChip to render the
 * matching popover option with an "active" outline.
 *
 * Subscribes to Lexical's update listener so the indicators re-derive
 * whenever the selection or formatting changes.
 *
 * Returns nulls when no range selection exists, or when the selection
 * spans nodes with conflicting values (the swatch / row simply renders
 * unselected then — no false-positive active state).
 */
export interface ActiveTextStyle {
  color: string | null
  style: string | null
}

const RT_STYLE_RE = /--rt-style\s*:\s*([a-z0-9-]+)/
const RT_COLOR_RE = /--rt-color\s*:\s*([a-z0-9-]+)/

export const useActiveTextStyle = (): ActiveTextStyle => {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = React.useState<ActiveTextStyle>({ color: null, style: null })

  React.useEffect(() => {
    const read = () => {
      editor.getEditorState().read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) { setActive({ color: null, style: null }); return }
        const nodes = sel.getNodes()
        let color: string | null | undefined = undefined
        let style: string | null | undefined = undefined
        for (const n of nodes) {
          if (!$isTextNode(n)) continue
          const css = n.getStyle()
          const c = css.match(RT_COLOR_RE)?.[1] ?? null
          const s = css.match(RT_STYLE_RE)?.[1] ?? null
          if (color === undefined) color = c
          else if (color !== c) color = null
          if (style === undefined) style = s
          else if (style !== s) style = null
        }
        // Block-scoped styles live on their element nodes, not on text-node
        // CSS — surface them so the StyleChip's active state works there too.
        const block = sel.anchor.getNode().getTopLevelElement()
        if (block instanceof StyledHeadingNode) {
          const headingStyle = block.getRtStyle() || null
          style = headingStyle
        } else if (block instanceof StyledParagraphNode) {
          const paragraphStyle = block.getRtStyle() || null
          style = paragraphStyle
        }
        setActive({ color: color ?? null, style: style ?? null })
      })
    }
    read()
    return editor.registerUpdateListener(read)
  }, [editor])

  return active
}
