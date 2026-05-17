"use client"
import { useId } from "react"
import type { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  control: Control<any>
  pending: boolean
  isDirty?: boolean
  errorCount?: number
  dirtyCount?: number
  variant?: "card" | "bare"
}

/**
 * Publish controls — Status select + Save button. Used in two contexts:
 *   - variant="card"  → inside the Publish card in hidden/grid mode (shows "Status" label)
 *   - variant="bare"  → in the sticky TopBar in side mode (no label, compact)
 *
 * Field name "status" and option values "draft"/"published" mirror the zod
 * schema and existing inline JSX in PageForm.
 */
export function PublishControls({ control, pending, isDirty, errorCount, dirtyCount, variant = "card" }: Props) {
  // WCAG 4.1.2 — shadcn's FormControl forwards id/aria-describedby to a Radix
  // Select root, not its trigger button, so the SelectTrigger ends up with no
  // accessible name. We mint a stable id here, attach it to the FormLabel, and
  // point aria-labelledby on the trigger at the same id. The label stays in
  // the a11y tree on every variant; `sr-only` hides it visually in bare mode.
  const labelId = useId()
  return (
    <div className={cn(
      "flex items-end gap-2",
      variant === "bare" && "shrink-0"
    )}>
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem className={cn("min-w-0", variant === "card" ? "flex-1" : "min-w-[140px]")}>
            <FormLabel id={labelId} className={cn(variant === "bare" && "sr-only")}>Status</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value ?? "draft"}>
                <SelectTrigger className="w-full" aria-labelledby={labelId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            {variant === "card" && <FormMessage />}
          </FormItem>
        )}
      />
      {/* The Save button itself carries the desktop "unsaved changes"
          signal — mirrors MobileSavePill: 2px coloured border + matching
          icon tint, with a small floating count badge in the top-right
          corner of the button when changes are pending. Theme-tinted bg
          so it reads in both CMS light + dark modes. */}
      <div className="relative">
        <Button
          type="submit"
          disabled={pending || !isDirty}
          title={
            errorCount && errorCount > 0
              ? `Save blocked: ${errorCount} ${errorCount === 1 ? "issue" : "issues"}`
              : isDirty
                ? `Save (⌘S / Ctrl+S) — ${dirtyCount ?? 1} unsaved ${(dirtyCount ?? 1) === 1 ? "change" : "changes"}`
                : "Save (⌘S / Ctrl+S)"
          }
          variant="default"
          className={cn(
            // Inverted shadcn surface — dark pill on light mode, light pill on
            // dark mode. Matches the MobileSavePill default treatment.
            "bg-foreground text-background hover:bg-foreground/90 gap-2",
            isDirty && !errorCount && "border-2 border-amber-500/70",
            errorCount != null && errorCount > 0 && "border-2 border-destructive/70",
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : errorCount != null && errorCount > 0 ? (
            <AlertCircle className="h-4 w-4" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {pending ? "Saving..." : "Save"}
        </Button>
        {/* Floating count badge — only shows on dirty / error, mirrors the
            MobileSavePill's top-right counter. Pointer-events-none so it
            doesn't intercept clicks on the button. */}
        {(isDirty || (errorCount != null && errorCount > 0)) && !pending && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-medium flex items-center justify-center",
              errorCount != null && errorCount > 0
                ? "bg-destructive text-destructive-foreground"
                : "bg-amber-500 text-white",
            )}
          >
            {(() => {
              const n = (errorCount != null && errorCount > 0) ? errorCount : (dirtyCount ?? 1)
              return n > 9 ? "9+" : n
            })()}
          </span>
        )}
      </div>
    </div>
  )
}
