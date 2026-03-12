/**
 * ColorSwatch.jsx
 * Individual color card with hex display, lock toggle, regenerate, copy,
 * and OKLCH sliders for real-time tweaking.
 */
import React, { useState, useCallback } from 'react'
import { Lock, Unlock, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import {
  readableOverlay,
  hexToOklchComponents,
  oklchComponentsToHex,
  parseToHex,
  randomHex,
} from '../utils/colorUtils.js'

export function ColorSwatch({ color, onUpdate, onLockToggle, onRegenerate }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editingHex, setEditingHex] = useState(false)
  const [hexInput, setHexInput] = useState(color.hex)

  const overlay = readableOverlay(color.hex)
  const components = hexToOklchComponents(color.hex)

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(color.hex)
      } else {
        const ta = document.createElement('textarea')
        ta.value = color.hex
        ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* silently ignore clipboard errors */ }
  }, [color.hex])

  const handleSlider = useCallback((key, value) => {
    const newComponents = {
      ...hexToOklchComponents(color.hex),
      [key]: Number(value),
    }
    const newHex = oklchComponentsToHex(newComponents)
    onUpdate(color.id, newHex)
  }, [color.hex, color.id, onUpdate])

  const handleHexCommit = useCallback(() => {
    const parsed = parseToHex(hexInput)
    if (parsed) {
      onUpdate(color.id, parsed)
      setHexInput(parsed)
    } else {
      setHexInput(color.hex) // revert
    }
    setEditingHex(false)
  }, [hexInput, color.hex, color.id, onUpdate])

  const handleHexKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleHexCommit()
    if (e.key === 'Escape') {
      setHexInput(color.hex)
      setEditingHex(false)
    }
  }, [handleHexCommit, color.hex])

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-md flex flex-col transition-shadow hover:shadow-lg"
      style={{ backgroundColor: color.hex }}
      role="region"
      aria-label={`Color swatch ${color.hex}`}
    >
      {/* Main color display */}
      <div className="flex-1 min-h-[120px] p-4 flex flex-col justify-between">
        {/* Top controls */}
        <div className="flex justify-between items-start gap-2">
          <button
            onClick={() => onLockToggle(color.id)}
            className="p-1.5 rounded-lg backdrop-blur-sm bg-black/10 hover:bg-black/20 transition-colors"
            style={{ color: overlay }}
            aria-label={color.locked ? 'Unlock color' : 'Lock color'}
            title={color.locked ? 'Unlock color' : 'Lock color'}
          >
            {color.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <button
            onClick={() => onRegenerate(color.id)}
            disabled={color.locked}
            className="p-1.5 rounded-lg backdrop-blur-sm bg-black/10 hover:bg-black/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: overlay }}
            aria-label="Regenerate this color"
            title="Regenerate this color"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Hex label */}
        <div className="flex items-center gap-2 mt-2">
          {editingHex ? (
            <input
              autoFocus
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexCommit}
              onKeyDown={handleHexKeyDown}
              className="font-mono text-sm px-2 py-1 rounded-lg w-28 border-0 outline-none bg-black/20 backdrop-blur-sm"
              style={{ color: overlay }}
              aria-label="Edit hex color value"
              maxLength={7}
            />
          ) : (
            <button
              onClick={() => {
                setHexInput(color.hex)
                setEditingHex(true)
              }}
              className="font-mono text-sm font-semibold px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 transition-colors tracking-wider"
              style={{ color: overlay }}
              title="Click to edit hex value"
              aria-label={`Hex value ${color.hex}, click to edit`}
            >
              {color.hex.toUpperCase()}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg backdrop-blur-sm bg-black/10 hover:bg-black/20 transition-colors"
            style={{ color: overlay }}
            aria-label={copied ? 'Copied!' : 'Copy hex value'}
            title={copied ? 'Copied!' : 'Copy hex code'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Slider panel */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-expanded={expanded}
          aria-controls={`sliders-${color.id}`}
        >
          <span>Adjust (OKLCH)</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div id={`sliders-${color.id}`} className="px-4 pb-4 space-y-3">
            <Slider
              label="Lightness"
              id={`l-${color.id}`}
              value={components.l}
              min={0} max={1} step={0.01}
              onChange={(v) => handleSlider('l', v)}
              trackStyle="bg-gradient-to-r from-black to-white"
            />
            <Slider
              label="Chroma"
              id={`c-${color.id}`}
              value={components.c}
              min={0} max={1} step={0.01}
              onChange={(v) => handleSlider('c', v)}
              trackStyle="bg-gradient-to-r from-gray-400 to-purple-500"
            />
            <Slider
              label="Hue"
              id={`h-${color.id}`}
              value={components.h}
              min={0} max={360} step={1}
              onChange={(v) => handleSlider('h', v)}
              trackStyle="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-red-500"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Slider({ label, id, value, min, max, step, onChange, trackStyle }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label htmlFor={id} className="text-xs text-gray-600 dark:text-gray-400">
          {label}
        </label>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {typeof value === 'number' && max <= 1
            ? (value * 100).toFixed(0) + '%'
            : Math.round(value) + (max > 1 ? '°' : '')}
        </span>
      </div>
      <div className={`relative h-2 rounded-full ${trackStyle} overflow-hidden`}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
        <div
          className="absolute inset-y-0 left-0 bg-transparent"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      {/* Visible thumb indicator */}
      <div className="relative h-0 overflow-visible">
        <div
          className="absolute -top-3 w-3 h-3 rounded-full bg-white border-2 border-gray-400 shadow -translate-x-1/2 pointer-events-none"
          style={{ left: `${((value - min) / (max - min)) * 100}%` }}
          aria-hidden="true"
        />
      </div>
      {/* Actual range input shown on top cleanly */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer accent-gray-700 dark:accent-gray-200"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
