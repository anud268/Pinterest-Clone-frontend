import { useMemo } from 'react'
import { useElementWidth } from '../../lib/hooks'
import { aspectRatio } from '../../lib/image'

const DEFAULT_RATIO = 1.3
const CAPTION_HEIGHT = 56

const layout = (width, minColumnWidth, maxColumns) => {
  const gap = width < 640 ? 10 : 16
  const count = Math.max(2, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))))
  return { gap, count, columnWidth: (width - gap * (count - 1)) / count }
}

// Greedy "shortest column first" placement using known image ratios. Each item's column only
// depends on the items before it, so appending a page never moves pins that are already shown.
const distribute = (items, count, columnWidth) => {
  const columns = Array.from({ length: count }, () => [])
  const heights = new Array(count).fill(0)
  items.forEach((item, index) => {
    const target = heights.indexOf(Math.min(...heights))
    columns[target].push({ item, index })
    heights[target] += (aspectRatio(item) ?? DEFAULT_RATIO) * columnWidth + CAPTION_HEIGHT
  })
  return columns
}

export default function MasonryGrid({ items, renderItem, minColumnWidth = 220, maxColumns = 7, className = '' }) {
  const [ref, width] = useElementWidth()
  const { gap, count, columnWidth } = width ? layout(width, minColumnWidth, maxColumns) : { gap: 16, count: 0, columnWidth: 0 }
  const columns = useMemo(() => (count ? distribute(items, count, columnWidth) : []), [items, count, columnWidth])

  return (
    <div ref={ref} className={`w-full ${className}`}>
      <div className="flex items-start" style={{ gap }}>
        {columns.map((column, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
            {column.map(({ item, index }) => renderItem(item, index))}
          </div>
        ))}
      </div>
    </div>
  )
}

const SKELETON_HEIGHTS = [300, 220, 360, 260, 330, 200, 280, 380, 240, 310, 210, 350, 270, 230, 320, 290]

export function MasonrySkeleton({ count = 16, minColumnWidth = 220, maxColumns = 7 }) {
  const [ref, width] = useElementWidth()
  const { gap, count: columns } = width ? layout(width, minColumnWidth, maxColumns) : { gap: 16, count: 0 }

  return (
    <div ref={ref} className="w-full" aria-busy="true" aria-label="Loading pins">
      <div className="flex items-start" style={{ gap }}>
        {Array.from({ length: columns }, (_, c) => (
          <div key={c} className="flex flex-1 flex-col" style={{ gap }}>
            {SKELETON_HEIGHTS.slice(0, count)
              .filter((_, i) => i % columns === c)
              .map((height, i) => (
                <div key={i}>
                  <div className="skeleton rounded-2xl" style={{ height: height * (columns <= 2 ? 0.7 : 1) }} />
                  <div className="skeleton mt-2 h-3 w-2/3 rounded-full" />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
