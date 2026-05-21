"use client"
import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MobileMediaSheet } from "@/components/ui/mobile-media-sheet"

const resolveUrl = (v: unknown): string | null => {
  if (!v) return null
  if (typeof v === "string") return v
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>
    if (typeof obj.url === "string") return obj.url
    if (typeof obj.filename === "string") return `/media/${obj.filename}`
  }
  return null
}

export const MobileSeoSettings: React.FC = () => {
  const { watch, setValue } = useFormContext()
  const seoTitle = watch("seo.title") as string | null | undefined
  const seoDescription = watch("seo.description") as string | null | undefined
  const ogImage = watch("seo.ogImage") as unknown
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const url = resolveUrl(ogImage)

  return (
    <div data-mobile-seo-settings>
      <header className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-border bg-background px-2 pt-14 pb-3">
        <h2 className="text-sm font-medium truncate">SEO</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mobile-seo-title" className="text-sm">SEO title</Label>
          <Input id="mobile-seo-title" value={seoTitle ?? ""} onChange={(e) => setValue("seo.title", e.target.value, { shouldDirty: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile-seo-description" className="text-sm">SEO description</Label>
          <Textarea id="mobile-seo-description" value={seoDescription ?? ""} onChange={(e) => setValue("seo.description", e.target.value, { shouldDirty: true })} rows={4} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Open Graph image</Label>
          {url ? (
            <img src={url} alt="" className="w-full max-h-48 object-cover rounded-md border border-border" />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground gap-2">
              <ImageIcon className="size-5" /> No OG image
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(true)}>
              {url ? "Replace" : "Choose"}
            </Button>
            {url && (
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setValue("seo.ogImage", null, { shouldDirty: true })}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <MobileMediaSheet open={sheetOpen} onOpenChange={setSheetOpen} onPick={(m) => setValue("seo.ogImage", m, { shouldDirty: true })} />
    </div>
  )
}
