/**
 * ContrastBadge.jsx
 * Displays a WCAG level badge (AAA / AA / AA Large / Fail).
 */
import React from 'react'

const BADGE_STYLES = {
  AAA: 'bg-emerald-500 text-white',
  AA: 'bg-blue-500 text-white',
  'AA Large': 'bg-amber-500 text-white',
  Fail: 'bg-red-500 text-white',
}

const ICON = {
  AAA: '✓✓',
  AA: '✓',
  'AA Large': '~',
  Fail: '✗',
}

export function ContrastBadge({ level, ratio, showRatio = false, size = 'sm' }) {
  const badgeClass = BADGE_STYLES[level] ?? BADGE_STYLES.Fail
  const sizeClass = size === 'xs' ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold font-mono ${badgeClass} ${sizeClass}`}
      title={`Contrast ratio: ${ratio}:1 — WCAG Level: ${level}`}
      aria-label={`Contrast ratio ${ratio} to 1, WCAG level ${level}`}
    >
      <span aria-hidden="true">{ICON[level]}</span>
      {level}
      {showRatio && <span className="opacity-80">({ratio})</span>}
    </span>
  )
}
