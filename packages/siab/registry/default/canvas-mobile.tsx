"use client"
import * as React from "react"
import { useCanvasBlocks } from "@/components/editor/canvas/useCanvasBlocks"
import { MobileSectionList } from "@/components/ui/mobile-section-list"
import { MobileSectionEdit } from "@/components/ui/mobile-section-edit"
import { MobilePageSettings } from "@/components/ui/mobile-page-settings"
import { MobileSeoSettings } from "@/components/ui/mobile-seo-settings"
import { CanvasSelectionProvider } from "@/components/editor/canvas/CanvasSelectionContext"
import { MobileEditorProvider, useMobileEditor } from "@/components/editor/canvas/mobile/MobileEditorContext"
import type { ElementPath } from "@/components/editor/canvas/elementPath"
import type { CanvasModeProps } from "@/components/ui/canvas-mode"
import { toCssVars } from "@/lib/theme/toCssVars"
import { useMobileSubview } from "@/lib/editor/useMobileSubview"
import { MobileBackPill } from "@/components/ui/mobile-back-pill"

export const CanvasMobile: React.FC<CanvasModeProps> = (props) => {
  return (
    <MobileEditorProvider>
      <CanvasMobileInner {...props} />
    </MobileEditorProvider>
  )
}

const CanvasMobileInner: React.FC<CanvasModeProps> = ({ manifest, tenantCss, dangerZone: _dangerZone, seoCard: _seoCard, theme, reorderBlocks, deleteBlock, duplicateBlock, pageTitle, onDeletePage }) => {
  const { state, setSelected, clearSelection } = useMobileEditor()
  const { blocks, activeIndex, setActiveIndex, updateBlock, insertBlockAt } = useCanvasBlocks()
  const api = { blocks, activeIndex, setActiveIndex, updateBlock, insertBlockAt, reorderBlocks, deleteBlock, duplicateBlock }
  const { view, goto } = useMobileSubview()

  // Bridge MobileEditorContext.selected → CanvasSelectionContext.select.
  // Inline primitives call `select(path)`; we route it into setSelected so the
  // inspector bar reacts. SetStateAction support: if a primitive passes a
  // functional updater, evaluate it against the current selection.
  const select = React.useCallback((next: React.SetStateAction<ElementPath | null>) => {
    const resolved = typeof next === "function" ? (next as (p: ElementPath | null) => ElementPath | null)(state.selected) : next
    if (resolved == null) clearSelection()
    else setSelected(resolved)
  }, [state.selected, setSelected, clearSelection])

  return (
    <CanvasSelectionProvider value={{ view: "mobile", selected: state.selected, select }}>
      {tenantCss && <style data-rt-tenant-css dangerouslySetInnerHTML={{ __html: tenantCss }} />}
      {theme && <style data-rt-theme-overrides dangerouslySetInnerHTML={{ __html: toCssVars(theme) }} />}
      {view.kind !== "overview" && (
        <MobileBackPill onBack={() => { clearSelection(); goto({ kind: "overview" }) }} />
      )}

      {view.kind === "overview" && (
        <div className="flex w-full flex-col pb-24">
          <MobileSectionList
            api={api}
            manifest={manifest}
            onOpenSection={(i) => goto({ kind: "section", index: i })}
            pageTitle={pageTitle}
            onOpenPageSettings={() => goto({ kind: "page-settings" })}
            onOpenSeo={() => goto({ kind: "seo" })}
            onDeletePage={onDeletePage}
          />
        </div>
      )}

      {view.kind === "page-settings" && (
        <div className="fixed inset-0 z-30 flex flex-col bg-background overflow-hidden">
          <MobilePageSettings />
        </div>
      )}

      {view.kind === "seo" && (
        <div className="fixed inset-0 z-30 flex flex-col bg-background overflow-hidden">
          <MobileSeoSettings />
        </div>
      )}

      {view.kind === "section" && (
        <div className="fixed inset-0 z-30 flex flex-col bg-background overflow-hidden">
          <MobileSectionEdit
            api={api}
            index={view.index}
            manifest={manifest}
            theme={theme}
            onBack={() => { clearSelection(); goto({ kind: "overview" }) }}
            onPrev={view.index > 0 ? () => { clearSelection(); goto({ kind: "section", index: view.index - 1 }, { replace: true }) } : undefined}
            onNext={view.index < blocks.length - 1 ? () => { clearSelection(); goto({ kind: "section", index: view.index + 1 }, { replace: true }) } : undefined}
            onJumpToSection={(i) => { clearSelection(); goto({ kind: "section", index: i }, { replace: true }) }}
          />
        </div>
      )}
    </CanvasSelectionProvider>
  )
}
