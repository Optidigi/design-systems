"use client"

import * as React from "react"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Palette, Type, SquareRoundCorner } from "lucide-react"
import { PalettePicker, type PalettePreset } from "@/components/ui/palette-picker"
import { FontPicker, type FontPreset } from "@/components/ui/font-picker"
import { RadiusControl, type RadiusLevel } from "@/components/ui/radius-control"
import type { ThemeTokens } from "@/lib/theme/schema"
import type { RtManifest } from "@/lib/richText/manifest"
import { SegmentedPill } from "@/components/ui/segmented-pill"
import { FLOATING_PILL_CLASS } from "@/components/ui/mode-bar"
import { cn } from "@/lib/utils"

type Segment = "palette" | "fonts" | "shape"

export function ThemeBar({
  theme,
  manifest,
  onThemeChange,
  palettes,
  fonts,
  radiusLevels,
}: {
  theme: ThemeTokens | null
  manifest: RtManifest
  onThemeChange: (theme: ThemeTokens) => void
  palettes: PalettePreset[]
  fonts: FontPreset[]
  radiusLevels?: RadiusLevel[]
}) {
  // Theme edits are *not* autosaved — they flow up via onThemeChange so the
  // parent form can track them in the same dirty/Save cycle as page-form
  // fields. The previous debounced setTenantTheme inside ThemeBar was a
  // behaviour outlier (silent autosave to a different document); routing
  // through the explicit Save button is what users expect.
  function handleUpdate(partial: Partial<ThemeTokens>) {
    onThemeChange({ ...(theme ?? {}), ...partial })
  }

  const [openSegment, setOpenSegment] = React.useState<Segment | null>(null)

  // Fix #1: track the last-open segment so onCloseAutoFocus can return focus
  // to the correct button even when openSegment has already been set to null
  // by onOpenChange (Escape / outside-click path).
  const lastOpenSegmentRef = React.useRef<Segment | null>(null)
  React.useEffect(() => {
    if (openSegment) lastOpenSegmentRef.current = openSegment
  }, [openSegment])

  const segmentRefs = React.useRef<Record<Segment, HTMLButtonElement | null>>({
    palette: null,
    fonts: null,
    shape: null,
  })

  return (
    <Popover open={openSegment != null} onOpenChange={(open) => !open && setOpenSegment(null)}>
      <PopoverAnchor asChild>
        <div className="flex justify-center py-2">
          <div className={cn(FLOATING_PILL_CLASS)}>
            <SegmentedPill<Segment>
              ariaLabel="Theme controls"
              value={openSegment}
              onValueChange={(next) => setOpenSegment(next)}
              itemRef={(value, el) => { segmentRefs.current[value] = el }}
              items={[
                { value: "palette", label: "Colours", icon: Palette, ariaLabel: "Colour palette" },
                { value: "fonts", label: "Fonts", icon: Type, ariaLabel: "Font pairings" },
                { value: "shape", label: "Shape", icon: SquareRoundCorner, ariaLabel: "Corner radius" },
              ]}
            />
          </div>
        </div>
      </PopoverAnchor>
        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={4}
          className="w-auto max-w-[calc(100vw-2rem)] rounded-xl border border-border/40 bg-card/95 shadow-md backdrop-blur-sm p-3"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            const target = lastOpenSegmentRef.current
            if (target) {
              e.preventDefault()
              segmentRefs.current[target]?.focus()
            }
          }}
        >
          {openSegment === "palette" && (
            <PalettePicker
              palettes={palettes}
              value={theme?.palette}
              darkValue={theme?.darkPalette}
              mode={theme?.mode ?? "light"}
              onChange={(patch) => handleUpdate(patch)}
            />
          )}
          {openSegment === "fonts" && (
            <FontPicker
              fonts={fonts}
              value={theme?.fonts}
              manifest={manifest}
              onChange={(next) => handleUpdate({ fonts: next })}
            />
          )}
          {openSegment === "shape" && (
            <RadiusControl
              radius={theme?.radius}
              levels={radiusLevels}
              onChange={(next) => handleUpdate(next)}
            />
          )}
        </PopoverContent>
      </Popover>
  )
}
