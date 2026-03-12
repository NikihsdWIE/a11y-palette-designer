/**
 * ExportPanel.jsx
 * Export palette as CSS variables, Tailwind config, or JSON.
 */
import React, { useState } from 'react'
import { Copy, Check, Code2, FileJson, Palette } from 'lucide-react'
import {
  toCSSVariables,
  toTailwindConfig,
  toJSON,
  copyToClipboard,
} from '../utils/exportUtils.js'

const FORMATS = [
  { id: 'css', label: 'CSS Variables', Icon: Code2, generator: toCSSVariables },
  { id: 'tailwind', label: 'Tailwind Config', Icon: Palette, generator: toTailwindConfig },
  { id: 'json', label: 'JSON', Icon: FileJson, generator: toJSON },
]

export function ExportPanel({ palette }) {
  const [activeFormat, setActiveFormat] = useState('css')
  const [copiedFormat, setCopiedFormat] = useState(null)

  const currentFormat = FORMATS.find((f) => f.id === activeFormat)
  const output = currentFormat?.generator(palette) ?? ''

  const handleCopy = async () => {
    await copyToClipboard(output)
    setCopiedFormat(activeFormat)
    setTimeout(() => setCopiedFormat(null), 2000)
  }

  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <h2 id="export-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Export Palette
      </h2>

      {/* Format tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Export format">
        {FORMATS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeFormat === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveFormat(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFormat === id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {currentFormat?.label}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-600 transition-colors"
            aria-label={copiedFormat === activeFormat ? 'Copied to clipboard' : 'Copy to clipboard'}
          >
            {copiedFormat === activeFormat ? (
              <>
                <Check size={12} aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        </div>

        <pre
          id={`panel-${activeFormat}`}
          role="tabpanel"
          className="p-4 text-sm font-mono overflow-x-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap"
          aria-label={`${currentFormat?.label} output`}
        >
          <code>{output}</code>
        </pre>
      </div>

      {/* Color swatches preview row */}
      <div className="flex gap-2 items-center flex-wrap">
        {palette.map((c, i) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow"
              style={{ backgroundColor: c.hex }}
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
