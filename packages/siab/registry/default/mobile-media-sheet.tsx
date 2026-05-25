"use client"
import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  useMobileMediaSheet,
  type MediaItem,
} from "@/components/editor/canvas/MobileMediaSheetContext"
import { useTranslations } from "next-intl"

export type { MediaItem }

export interface MobileMediaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (media: MediaItem) => void
  tenantId?: number | string
}

export const MobileMediaSheet: React.FC<MobileMediaSheetProps> = ({
  open,
  onOpenChange,
  onPick,
  tenantId,
}) => {
  const t = useTranslations("editor")
  const { resolveTenantId, fetchMedia, MediaPickerComponent } = useMobileMediaSheet()
  const [resolvedTenantId, setResolvedTenantId] = React.useState<number | string | null>(
    tenantId ?? null,
  )
  const [items, setItems] = React.useState<MediaItem[]>([])

  React.useEffect(() => {
    if (resolvedTenantId != null) return
    let cancelled = false
    void (async () => {
      const tid = await resolveTenantId()
      if (tid != null && !cancelled) setResolvedTenantId(tid)
    })()
    return () => {
      cancelled = true
    }
  }, [resolvedTenantId, resolveTenantId])

  const reload = React.useCallback(async () => {
    if (resolvedTenantId == null) return
    const fetched = await fetchMedia(resolvedTenantId)
    setItems(fetched)
  }, [resolvedTenantId, fetchMedia])

  React.useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] z-[60] overflow-y-auto px-4 pb-4"
        data-mobile-media-sheet
      >
        <SheetHeader className="pb-3">
          <SheetTitle>{t("chooseImage")}</SheetTitle>
        </SheetHeader>
        {resolvedTenantId != null && (
          <MediaPickerComponent
            items={items}
            tenantId={resolvedTenantId}
            onPick={(m) => {
              onPick(m)
              onOpenChange(false)
            }}
            onUploaded={(m) => {
              void reload()
              onPick(m)
              onOpenChange(false)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
