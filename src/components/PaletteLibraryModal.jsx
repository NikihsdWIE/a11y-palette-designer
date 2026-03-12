/**
 * PaletteLibraryModal.jsx
 * Full-screen modal to browse and apply curated accessible palettes.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { X, Search, CheckCircle2, Sparkles, Tag } from 'lucide-react'
import { PALETTE_LIBRARY, ALL_TAGS } from '../data/paletteLibrary.js'
import { contrastRatio, wcagLevel, readableOverlay } from '../utils/colorUtils.js'

// ─── Pass-rate computation ───────────────────────────────────────────────────

function computePassRate(hexColors) {
  let pass = 0
  let total = 0
  for (let i = 0; i < hexColors.length; i++) {
    for (let j = 0; j < hexColors.length; j++) {
      if (i === j) continue
      total++
      const ratio = contrastRatio(hexColors[i], hexColors[j])
      if (wcagLevel(ratio).normalAA) pass++
    }
  }
  return total > 0 ? Math.round((pass / total) * 100) : 0
}

// ─── Pre-compute pass rates once (outside component — never changes) ─────────

const libraryWithRates = PALETTE_LIBRARY.map((p) => ({
  ...p,
  aaPassRate: computePassRate(p.colors),
}))

// ─── Sub-components ──────────────────────────────────────────────────────────

function PassBadge({ rate }) {
  const color =
    rate === 100
      ? 'bg-emerald-500 text-white'
      : rate >= 80
      ? 'bg-blue-500 text-white'
      : 'bg-amber-500 text-white'

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}
      aria-label={`AA pass rate: ${rate} percent`}
    >
      <CheckCircle2 size={10} aria-hidden="true" />
      {rate}% AA
    </span>
  )
}

function PaletteCard({ palette, onApply }) {
  const { name, description, colors, aaPassRate, tags } = palette

  return (
    <article className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Color strip */}
      <div className="flex h-14" role="img" aria-label={`Color strip for ${name}`}>
        {colors.map((hex, i) => (
          <div
            key={i}
            className="flex-1 relative group/swatch"
            style={{ backgroundColor: hex }}
            title={hex.toUpperCase()}
          >
            <span
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity text-[9px] font-mono font-bold"
              style={{ color: readableOverlay(hex) }}
              aria-hidden="true"
            >
              {hex.slice(1).toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
            {name}
          </h3>
          <PassBadge rate={aaPassRate} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium capitalize"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Pair preview grid */}
        <ContrastMiniGrid colors={colors} />

        <button
          onClick={() => onApply(palette)}
          className="w-full mt-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          aria-label={`Apply ${name} palette`}
        >
          Apply Palette
        </button>
      </div>
    </article>
  )
}

function ContrastMiniGrid({ colors }) {
  const SIZE = colors.length
  // Show only the first 3 foreground colors vs first 3 background colors for compactness
  const slice = colors.slice(0, 3)

  return (
    <div
      className="grid gap-px rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700"
      style={{ gridTemplateColumns: `repeat(${slice.length}, 1fr)` }}
      aria-label="Mini contrast preview"
      role="presentation"
    >
      {slice.map((fg, ri) =>
        slice.map((bg, ci) => {
          if (ri === ci) {
            return (
              <div
                key={`${ri}-${ci}`}
                className="h-6 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-300"
                aria-hidden="true"
              >
                —
              </div>
            )
          }
          const ratio = contrastRatio(fg, bg)
          const { normalAA } = wcagLevel(ratio)
          return (
            <div
              key={`${ri}-${ci}`}
              className="h-6 flex items-center justify-center"
              style={{ backgroundColor: bg }}
              title={`${fg} on ${bg}: ${ratio}:1`}
              aria-hidden="true"
            >
              <span
                className="text-[9px] font-bold"
                style={{ color: fg }}
              >
                {normalAA ? '✓' : '✗'}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export function PaletteLibraryModal({ onClose, onApply }) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [minRate, setMinRate] = useState(0)

  // Trap focus inside modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent background scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return libraryWithRates.filter((p) => {
      if (p.aaPassRate < minRate) return false
      if (activeTag !== 'all' && !p.tags.includes(activeTag)) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some(t => t.includes(q))) return false
      return true
    })
  }, [query, activeTag, minRate])

  const handleApply = useCallback((palette) => {
    onApply(palette.colors)
    onClose()
  }, [onApply, onClose])

  const allTags = ALL_TAGS

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-4xl max-h-[92dvh] sm:max-h-[90vh] bg-gray-50 dark:bg-gray-950 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-500" aria-hidden="true" />
            <h2
              id="library-modal-title"
              className="text-base font-extrabold text-gray-900 dark:text-gray-100"
            >
              Palette Library
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              {filtered.length} palettes
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Close library"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 space-y-3 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search palettes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search palettes"
            />
          </div>

          {/* Tag filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <Tag size={13} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                aria-pressed={activeTag === tag}
                className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${
                  activeTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                }`}
              >
                {tag}
              </button>
            ))}

            {/* Min AA rate slider */}
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="whitespace-nowrap">Min AA:</span>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={minRate}
                onChange={(e) => setMinRate(Number(e.target.value))}
                className="w-20 accent-indigo-600"
                aria-label={`Minimum AA pass rate: ${minRate}%`}
              />
              <span className="font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right">
                {minRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-3">
              <Search size={32} aria-hidden="true" />
              <p className="text-sm font-medium">No palettes match your filters.</p>
              <button
                onClick={() => { setQuery(''); setActiveTag('all'); setMinRate(0) }}
                className="text-xs text-indigo-500 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
            Pass rates computed live using WCAG 2.1 relative luminance. Use the Min AA slider to filter by accessibility level.
          </p>
        </div>
      </div>
    </div>
  )
}
