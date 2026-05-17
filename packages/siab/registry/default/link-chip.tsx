"use client"
import * as React from "react"
import { Link as LinkIcon } from "lucide-react"

export const LinkChip: React.FC<{ onOpen: () => void; surface: "floating" | "persistent" }> = ({ onOpen, surface }) => {
  const cls = surface === "floating"
    ? "rounded-sm p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
    : "rounded-sm p-2 hover:bg-accent text-muted-foreground hover:text-foreground"
  return (
    <button type="button" className={cls} onClick={onOpen} aria-label="Link">
      <LinkIcon className="size-4" aria-hidden />
    </button>
  )
}
