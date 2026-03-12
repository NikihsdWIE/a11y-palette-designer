/**
 * App.jsx
 * A11y-First Color Palette Designer
 *
 * Layout:
 *   - Sidebar: palette controls, stats, dark mode toggle
 *   - Main: color swatches grid, safe-pair matrix, export panel
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  RefreshCw,
  Moon,
  Sun,
  Shuffle,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { ColorSwatch } from './components/ColorSwatch.jsx'
import { SafePairMatrix } from './components/SafePairMatrix.jsx'
import { ExportPanel } from './components/ExportPanel.jsx'
import { ContrastBadge } from './components/ContrastBadge.jsx'
import { PaletteLibraryModal } from './components/PaletteLibraryModal.jsx'
import {
  generatePalette,
  randomHex,
  contrastRatio,
  wcagLevel,
} from './utils/colorUtils.js'

// ─── Dark mode hook ─────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      localStorage.getItem('a11y-theme') === 'dark' ||
      (!localStorage.getItem('a11y-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('a11y-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('a11y-theme', 'light')
    }
  }, [dark])

  return [dark, setDark]
}

// ─── Palette stats ───────────────────────────────────────────────────────────

function usePaletteStats(palette) {
  return useMemo(() => {
    const hexes = palette.map((c) => c.hex)
    let aaPass = 0
    let aaaPass = 0
    let totalPairs = 0

    for (let i = 0; i < hexes.length; i++) {
      for (let j = 0; j < hexes.length; j++) {
        if (i === j) continue
        totalPairs++
        const ratio = contrastRatio(hexes[i], hexes[j])
        const info = wcagLevel(ratio)
        if (info.normalAA) aaPass++
        if (info.normalAAA) aaaPass++
      }
    }

    return { aaPass, aaaPass, totalPairs }
  }, [palette])
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useDarkMode()
  const [palette, setPalette] = useState(() => generatePalette())
  const [showMatrix, setShowMatrix] = useState(true)
  const [showExport, setShowExport] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const stats = usePaletteStats(palette)

  // Regenerate all unlocked colors
  const handleRegenerateAll = useCallback(() => {
    setPalette((prev) =>
      prev.map((c) => (c.locked ? c : { ...c, hex: randomHex() }))
    )
  }, [])

  // Regenerate a single color by id
  const handleRegenerate = useCallback((id) => {
    setPalette((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hex: randomHex() } : c))
    )
  }, [])

  // Update a color's hex
  const handleUpdate = useCallback((id, hex) => {
    setPalette((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hex } : c))
    )
  }, [])

  // Toggle lock on a color
  const handleLockToggle = useCallback((id) => {
    setPalette((prev) =>
      prev.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c))
    )
  }, [])

  // Apply a palette from the library (respects locked colors)
  const handleApplyLibraryPalette = useCallback((hexColors) => {
    setPalette((prev) =>
      prev.map((c, i) =>
        c.locked ? c : { ...c, hex: hexColors[i] ?? hexColors[hexColors.length - 1] }
      )
    )
  }, [])

  const lockedCount = palette.filter((c) => c.locked).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {showLibrary && (
        <PaletteLibraryModal
          onClose={() => setShowLibrary(false)}
          onApply={handleApplyLibraryPalette}
        />
      )}

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside
          className="lg:w-72 xl:w-80 lg:min-h-screen bg-white dark:bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 flex flex-col"
          aria-label="Palette controls"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                  A11y-First
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Color Palette Designer
                </p>
              </div>
              <button
                onClick={() => setDark((d) => !d)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-5 space-y-4 flex-1">
            <button
              onClick={handleRegenerateAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              aria-label="Regenerate all unlocked colors"
            >
              <Shuffle size={16} aria-hidden="true" />
              Regenerate Palette
            </button>

            <button
              onClick={() => setShowLibrary(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold text-sm transition-colors shadow-sm border border-indigo-200 dark:border-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              aria-label="Open palette library"
            >
              <BookOpen size={16} aria-hidden="true" />
              Browse Library
            </button>

            {lockedCount > 0 && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                {lockedCount} color{lockedCount > 1 ? 's' : ''} locked — only unlocked colors will change.
              </p>
            )}

            {/* Stats */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Palette Stats
              </h2>
              <StatRow
                label="AA pairs"
                value={`${stats.aaPass} / ${stats.totalPairs}`}
                accent={stats.aaPass === stats.totalPairs ? 'emerald' : 'amber'}
              />
              <StatRow
                label="AAA pairs"
                value={`${stats.aaaPass} / ${stats.totalPairs}`}
                accent={stats.aaaPass === stats.totalPairs ? 'emerald' : 'blue'}
              />
              <div className="pt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">AA Pass rate</span>
                  <span className="font-semibold">
                    {stats.totalPairs > 0
                      ? Math.round((stats.aaPass / stats.totalPairs) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalPairs > 0 ? (stats.aaPass / stats.totalPairs) * 100 : 0}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={stats.aaPass}
                    aria-valuemin={0}
                    aria-valuemax={stats.totalPairs}
                    aria-label="AA pass rate"
                  />
                </div>
              </div>
            </div>

            {/* WCAG Info */}
            <details className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-xs space-y-2 group">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-700 dark:text-gray-300 list-none">
                <span className="flex items-center gap-1.5">
                  <Info size={13} aria-hidden="true" />
                  WCAG 2.1 Reference
                </span>
                <span className="text-gray-400">▾</span>
              </summary>
              <div className="pt-2 space-y-1.5 text-gray-600 dark:text-gray-400">
                <p><strong className="text-gray-700 dark:text-gray-300">AA Normal:</strong> ≥ 4.5:1</p>
                <p><strong className="text-gray-700 dark:text-gray-300">AAA Normal:</strong> ≥ 7.0:1</p>
                <p><strong className="text-gray-700 dark:text-gray-300">AA Large:</strong> ≥ 3.0:1 (18pt+ or 14pt+ bold)</p>
                <p><strong className="text-gray-700 dark:text-gray-300">AAA Large:</strong> ≥ 4.5:1</p>
                <p className="pt-1 text-gray-400">Contrast uses WCAG 2.1 relative luminance (sRGB IEC 61966-2-1).</p>
              </div>
            </details>
          </div>
        </aside>

        {/* ─── Main ─────────────────────────────────────────────────── */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 space-y-10 overflow-x-hidden"
        >
          {/* Palette grid */}
          <section aria-labelledby="palette-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="palette-heading"
                className="text-lg font-bold text-gray-900 dark:text-gray-100"
              >
                Color Palette
              </h2>
              <button
                onClick={handleRegenerateAll}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                aria-label="Regenerate all unlocked colors"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Regenerate
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {palette.map((color) => (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  onUpdate={handleUpdate}
                  onLockToggle={handleLockToggle}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </div>
          </section>

          {/* Contrast quick-view strip */}
          <section aria-labelledby="contrast-quick">
            <h2
              id="contrast-quick"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
            >
              Notable Pairs
            </h2>
            <div className="flex flex-wrap gap-2">
              <NotablePairs palette={palette} />
            </div>
          </section>

          {/* Safe pair matrix — collapsible */}
          <CollapsibleSection
            title="Safe Pair Matrix"
            expanded={showMatrix}
            onToggle={() => setShowMatrix((v) => !v)}
          >
            <SafePairMatrix palette={palette} />
          </CollapsibleSection>

          {/* Export panel — collapsible */}
          <CollapsibleSection
            title="Export"
            expanded={showExport}
            onToggle={() => setShowExport((v) => !v)}
          >
            <ExportPanel palette={palette} />
          </CollapsibleSection>
        </main>
      </div>
    </div>
  )
}

// ─── Small helper components ─────────────────────────────────────────────────

function StatRow({ label, value, accent = 'indigo' }) {
  const accents = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  }
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-bold ${accents[accent]}`}>{value}</span>
    </div>
  )
}

function CollapsibleSection({ title, expanded, onToggle, children }) {
  return (
    <section className="space-y-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100 group"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronUp size={18} className="text-indigo-500" aria-hidden="true" />
        ) : (
          <ChevronDown size={18} className="text-indigo-500" aria-hidden="true" />
        )}
        {title}
      </button>
      {expanded && children}
    </section>
  )
}

/**
 * Displays the top AA-passing and worst failing pairs.
 */
function NotablePairs({ palette }) {
  const pairs = useMemo(() => {
    const results = []
    for (let i = 0; i < palette.length; i++) {
      for (let j = 0; j < palette.length; j++) {
        if (i === j) continue
        const ratio = contrastRatio(palette[i].hex, palette[j].hex)
        results.push({ fg: palette[i].hex, bg: palette[j].hex, ratio, ...wcagLevel(ratio) })
      }
    }
    results.sort((a, b) => b.ratio - a.ratio)
    const top = results.slice(0, 4)
    const worst = results.filter((r) => !r.normalAA).slice(-2)
    return { top, worst }
  }, [palette])

  return (
    <>
      {pairs.top.map(({ fg, bg, ratio, level }, i) => (
        <PairChip key={`top-${i}`} fg={fg} bg={bg} ratio={ratio} level={level} />
      ))}
      {pairs.worst.length > 0 && (
        <>
          <span className="self-center text-xs text-gray-400 dark:text-gray-600 mx-1">·</span>
          {pairs.worst.map(({ fg, bg, ratio, level }, i) => (
            <PairChip key={`worst-${i}`} fg={fg} bg={bg} ratio={ratio} level={level} />
          ))}
        </>
      )}
    </>
  )
}

function PairChip({ fg, bg, ratio, level }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
      aria-label={`${fg} on ${bg}, contrast ${ratio} to 1, ${level}`}
    >
      <span
        className="w-4 h-4 rounded-full border border-white dark:border-gray-700 shadow-sm flex-shrink-0"
        style={{ backgroundColor: fg }}
        aria-hidden="true"
      />
      <span
        className="font-semibold text-xs"
        style={{ color: fg, backgroundColor: bg, padding: '1px 4px', borderRadius: '4px' }}
        aria-hidden="true"
      >
        Aa
      </span>
      <span
        className="w-4 h-4 rounded-full border border-white dark:border-gray-700 shadow-sm flex-shrink-0"
        style={{ backgroundColor: bg }}
        aria-hidden="true"
      />
      <ContrastBadge level={level} ratio={ratio} size="xs" />
    </div>
  )
}
