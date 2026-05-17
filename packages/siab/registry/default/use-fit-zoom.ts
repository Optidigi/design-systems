"use client"
import * as React from "react"

/** Pure fit calc — exported for unit testing. Scales the design surface to
 *  fill the container width in BOTH directions (down on narrow panes, up on
 *  wide ones). A zero/invalid container width falls back to 1. */
export function fitZoom(containerWidth: number, targetWidth: number): number {
  if (containerWidth > 0) return containerWidth / targetWidth
  return 1
}

/**
 * Measures a container and returns a `zoom` factor that fits a fixed-width
 * design surface inside it.
 *
 * Why this exists: the tenant site is built with *viewport*-based Tailwind
 * breakpoints (`md:`, `lg:`). The canvas editor pane is narrower than the
 * browser viewport, but `@media` queries still evaluate against the viewport
 * — so the site's desktop layout activates while only a fraction of the
 * width is available, cramping every block. Rendering the canvas at a fixed
 * desktop width and CSS-`zoom`-ing it down to fit keeps the layout
 * pixel-identical to a real desktop render, just visually scaled. `zoom`
 * (unlike `transform: scale`) shrinks the layout box too, so scrolling and
 * hit-testing stay natural.
 *
 * The zoom factor fills the container width in both directions: scales down
 * on narrow panes and scales up on panes wider than `targetWidth`, so the
 * design surface always occupies the full available width.
 */
export function useFitZoom(targetWidth: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = React.useState(1)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      setZoom(fitZoom(el.clientWidth, targetWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [targetWidth])

  return { ref, zoom }
}
