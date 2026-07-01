import { useEffect, useState, type RefObject } from 'react'

export function useScaleToFit(
  containerRef: RefObject<HTMLElement | null>,
  contentWidth: number,
  contentHeight: number,
): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function recompute() {
      if (!el) return
      const { clientWidth, clientHeight } = el
      const next = Math.min(clientWidth / contentWidth, clientHeight / contentHeight, 1)
      setScale(next > 0 ? next : 1)
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, contentWidth, contentHeight])

  return scale
}
