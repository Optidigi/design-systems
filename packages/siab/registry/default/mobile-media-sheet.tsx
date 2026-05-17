"use client"
import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MediaGrid } from "@/components/media/MediaGrid"
import { MediaUploader } from "@/components/media/MediaUploader"
import type { Media } from "@/payload-types"

export interface MobileMediaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (media: Media) => void
  tenantId?: number | string
}

export const MobileMediaSheet: React.FC<MobileMediaSheetProps> = ({ open, onOpenChange, onPick, tenantId }) => {
  const [resolvedTenantId, setResolvedTenantId] = React.useState<number | string | null>(tenantId ?? null)
  const [items, setItems] = React.useState<Media[]>([])

  React.useEffect(() => {
    if (resolvedTenantId != null) return
    let cancelled = false
    ;(async () => {
      const meRes = await fetch("/api/users/me")
      if (!meRes.ok) return
      const me = (await meRes.json()).user
      if (!me) return
      if (me.role === "super-admin") {
        const m = window.location.pathname.match(/\/sites\/([^/]+)/)
        if (!m || !m[1]) return
        const tRes = await fetch(`/api/tenants?where[slug][equals]=${encodeURIComponent(m[1])}&limit=1`)
        if (!tRes.ok) return
        const tJson = await tRes.json()
        const tid = tJson.docs?.[0]?.id
        if (tid != null && !cancelled) setResolvedTenantId(tid)
      } else {
        const first = me.tenants?.[0]?.tenant
        const tid = typeof first === "object" && first ? first.id : first
        if (tid != null && !cancelled) setResolvedTenantId(tid)
      }
    })()
    return () => { cancelled = true }
  }, [resolvedTenantId])

  const reload = React.useCallback(async () => {
    if (resolvedTenantId == null) return
    const res = await fetch(`/api/media?where[tenant][equals]=${resolvedTenantId}&limit=200&sort=-updatedAt`)
    if (!res.ok) return
    const json = await res.json()
    setItems(json.docs ?? [])
  }, [resolvedTenantId])

  React.useEffect(() => { if (open) void reload() }, [open, reload])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] z-[60] overflow-y-auto px-4 pb-4"
        data-mobile-media-sheet
      >
        <SheetHeader className="pb-3">
          <SheetTitle>Choose image</SheetTitle>
        </SheetHeader>
        {resolvedTenantId != null && (
          <div className="space-y-4">
            <MediaUploader tenantId={resolvedTenantId} onUploaded={(m) => { void reload(); onPick(m); onOpenChange(false) }} />
            <MediaGrid items={items} selectable onSelect={(m) => { onPick(m); onOpenChange(false) }} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
