"use client"
import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Square, Squircle, Circle } from "lucide-react"
import type { ThemeTokens } from "@/lib/theme/schema"

const RADIUS_LEVELS: { id: string; label: string; value: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "sharp", label: "Sharp", value: "0", Icon: Square },
  { id: "soft", label: "Soft", value: "0.5rem", Icon: Squircle },
  { id: "round", label: "Round", value: "1.5rem", Icon: Circle },
]

function findRadiusLevel(radius: string | undefined): string | undefined {
  return RADIUS_LEVELS.find((l) => l.value === radius)?.id
}

export const RadiusControl: React.FC<{
  radius: ThemeTokens["radius"]
  onChange: (next: { radius?: string }) => void
}> = ({ radius, onChange }) => {
  const activeLevel = findRadiusLevel(radius)

  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        value={activeLevel ?? ""}
        onValueChange={(id) => {
          if (!id) return
          const level = RADIUS_LEVELS.find((l) => l.id === id)
          if (level) onChange({ radius: level.value })
        }}
        className="gap-1"
      >
        {RADIUS_LEVELS.map(({ id, label, Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={label}
            className="size-9 rounded-md border border-border bg-background data-[state=on]:border-primary data-[state=on]:bg-primary/5"
          >
            <Icon className="size-4" aria-hidden />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
