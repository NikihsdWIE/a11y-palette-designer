/**
 * SafePairMatrix.jsx
 * NxN grid showing contrast ratios between all palette colors.
 * Rows = foreground, Columns = background.
 */
import React, { useState } from 'react'
import { contrastRatio, wcagLevel, readableOverlay } from '../utils/colorUtils.js'
import { ContrastBadge } from './ContrastBadge.jsx'

export function SafePairMatrix({ palette }) {
  const [filter, setFilter] = useState('all') // 'all' | 'aa' | 'aaa' | 'fail'

  const hexColors = palette.map((c) => c.hex)

  return (
    <section aria-labelledby="matrix-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="matrix-heading"
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            Safe Pair Matrix
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Rows = foreground text · Columns = background
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Show:</span>
          {['all', 'aa', 'aaa', 'fail'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
              }`}
              aria-pressed={filter === f}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table
          className="min-w-full border-collapse"
          role="grid"
          aria-label="Color contrast matrix"
        >
          <thead>
            <tr>
              {/* Corner cell */}
              <th
                scope="col"
                className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-2 w-16 min-w-[4rem]"
                aria-label="Foreground / Background"
              >
                <span className="text-[10px] text-gray-400 select-none">FG\BG</span>
              </th>
              {hexColors.map((bg, ci) => (
                <th
                  key={ci}
                  scope="col"
                  className="p-2 min-w-[90px] text-center"
                  aria-label={`Background color ${bg}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm mx-auto"
                      style={{ backgroundColor: bg }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                      {bg.toUpperCase()}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {hexColors.map((fg, ri) => (
              <tr
                key={ri}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                {/* Row header */}
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 p-2 border-r border-gray-100 dark:border-gray-700"
                  aria-label={`Foreground color ${fg}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                      style={{ backgroundColor: fg }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                      {fg.toUpperCase()}
                    </span>
                  </div>
                </th>

                {hexColors.map((bg, ci) => {
                  const ratio = contrastRatio(fg, bg)
                  const info = wcagLevel(ratio)
                  const isSelf = ri === ci

                  // Filter logic
                  const visible = (() => {
                    if (filter === 'all') return true
                    if (filter === 'aa') return info.normalAA
                    if (filter === 'aaa') return info.normalAAA
                    if (filter === 'fail') return !info.normalAA
                    return true
                  })()

                  return (
                    <td
                      key={ci}
                      className={`p-1.5 text-center transition-opacity ${
                        !visible ? 'opacity-20' : ''
                      } ${isSelf ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      aria-label={
                        isSelf
                          ? 'Same color — not applicable'
                          : `Foreground ${fg} on background ${bg}: contrast ${ratio} to 1, ${info.level}`
                      }
                    >
                      {isSelf ? (
                        <span className="text-gray-300 dark:text-gray-600 text-lg select-none" aria-hidden="true">—</span>
                      ) : (
                        <MatrixCell fg={fg} bg={bg} ratio={ratio} info={info} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 items-center text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true" />
          AAA ≥ 7:1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" aria-hidden="true" />
          AA ≥ 4.5:1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" aria-hidden="true" />
          Large text ≥ 3:1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
          Fail &lt; 3:1
        </span>
      </div>
    </section>
  )
}

function MatrixCell({ fg, bg, ratio, info }) {
  return (
    <div
      className="rounded-lg p-1.5 flex flex-col items-center gap-1 min-h-[64px] justify-center"
      style={{ backgroundColor: bg }}
    >
      {/* Preview text */}
      <span
        className="text-xs font-semibold leading-none"
        style={{ color: fg }}
        aria-hidden="true"
      >
        Aa
      </span>
      <ContrastBadge level={info.level} ratio={ratio} size="xs" />
      <span
        className="font-mono text-[9px] font-bold"
        style={{ color: readableOverlay(bg) }}
        aria-hidden="true"
      >
        {ratio}:1
      </span>
    </div>
  )
}
