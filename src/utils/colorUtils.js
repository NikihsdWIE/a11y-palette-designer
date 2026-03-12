/**
 * colorUtils.js
 * WCAG 2.1 contrast engine + color helpers
 * Uses culori for color-space math, does NOT expose any external URLs.
 */
import {
  parse,
  formatHex,
  converter,
  random as culoriRandom,
  clampChroma,
} from 'culori'

const toOklch = converter('oklch')
const toRgb = converter('rgb')

// ─── WCAG 2.1 Relative Luminance ───────────────────────────────────────────

/**
 * Convert a linear sRGB component value to perceptual.
 * @param {number} val  0-1 linear
 */
function linearize(val) {
  const v = Math.max(0, Math.min(1, val))
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Relative luminance per WCAG 2.1 §1.4.3
 * @param {string} hex  e.g. "#ff0000"
 * @returns {number}  0-1
 */
export function relativeLuminance(hex) {
  const rgb = toRgb(parse(hex))
  if (!rgb) return 0
  const R = linearize(rgb.r ?? 0)
  const G = linearize(rgb.g ?? 0)
  const B = linearize(rgb.b ?? 0)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * WCAG 2.1 contrast ratio between two hex colors.
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}  e.g. 4.51
 */
export function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hex1)
  const L2 = relativeLuminance(hex2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

// ─── WCAG Level Labels ──────────────────────────────────────────────────────

/**
 * Returns the WCAG AA/AAA result for normal and large text.
 * @param {number} ratio
 * @returns {{ normalAA: boolean, normalAAA: boolean, largeAA: boolean, largeAAA: boolean, level: 'AAA'|'AA'|'AA Large'|'Fail' }}
 */
export function wcagLevel(ratio) {
  const normalAA = ratio >= 4.5
  const normalAAA = ratio >= 7.0
  const largeAA = ratio >= 3.0
  const largeAAA = ratio >= 4.5

  let level = 'Fail'
  if (normalAAA) level = 'AAA'
  else if (normalAA) level = 'AA'
  else if (largeAA) level = 'AA Large'

  return { normalAA, normalAAA, largeAA, largeAAA, level }
}

// ─── Color Generation ───────────────────────────────────────────────────────

/**
 * Generate a visually distinct, aesthetically pleasing random hex color.
 */
export function randomHex() {
  // Use oklch for perceptually uniform random colors with decent saturation
  const h = Math.random() * 360
  const c = 0.08 + Math.random() * 0.14   // chroma: medium saturation
  const l = 0.35 + Math.random() * 0.40   // lightness: avoid too dark/light

  const clamped = clampChroma({ mode: 'oklch', l, c, h }, 'oklch', 'p3')
  return formatHex(clamped) ?? '#6366f1'
}

/**
 * Generate an initial palette of 5 random hex colors.
 * @returns {PaletteColor[]}
 */
export function generatePalette() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    hex: randomHex(),
    locked: false,
  }))
}

// ─── Contrast Matrix ────────────────────────────────────────────────────────

/**
 * Build a full NxN contrast matrix from an array of hex strings.
 * @param {string[]} hexColors
 * @returns {{ ratio: number; level: string; normalAA: boolean }[][]}
 */
export function buildContrastMatrix(hexColors) {
  return hexColors.map((fg) =>
    hexColors.map((bg) => {
      const ratio = contrastRatio(fg, bg)
      return { ratio, ...wcagLevel(ratio) }
    })
  )
}

// ─── Color Manipulation ─────────────────────────────────────────────────────

/**
 * Adjust hue/saturation/lightness of a hex color and return a new hex.
 * Operates in the oklch color space for perceptual uniformity.
 *
 * @param {string} hex
 * @param {{ h?: number; s?: number; l?: number }} delta  delta adjustments (0-1 scale for l/s, 0-360 for h)
 * @returns {string}
 */
export function adjustColor(hex, delta) {
  const oklch = toOklch(parse(hex))
  if (!oklch) return hex

  const adjusted = {
    ...oklch,
    l: Math.max(0, Math.min(1, (oklch.l ?? 0) + (delta.l ?? 0))),
    c: Math.max(0, Math.min(0.4, (oklch.c ?? 0) + (delta.s ?? 0))),
    h: (((oklch.h ?? 0) + (delta.h ?? 0)) % 360 + 360) % 360,
  }

  const clamped = clampChroma(adjusted, 'oklch', 'p3')
  return formatHex(clamped) ?? hex
}

/**
 * Return a hex color that contrasts well against the given background
 * for overlay text (white or black).
 * @param {string} bgHex
 * @returns {'#ffffff'|'#000000'}
 */
export function readableOverlay(bgHex) {
  const L = relativeLuminance(bgHex)
  return L > 0.179 ? '#000000' : '#ffffff'
}

/**
 * Parse any valid CSS color string to hex.
 * Returns null if invalid.
 * @param {string} input
 * @returns {string|null}
 */
export function parseToHex(input) {
  try {
    const result = formatHex(parse(input.trim()))
    return result ?? null
  } catch {
    return null
  }
}

/**
 * Extract oklch components for slider controls (0-1 scale).
 * Returns { l, c, h } where l/c are 0–1 fractions and h is 0–360.
 * @param {string} hex
 */
export function hexToOklchComponents(hex) {
  const oklch = toOklch(parse(hex))
  if (!oklch) return { l: 0.5, c: 0.1, h: 0 }
  return {
    l: oklch.l ?? 0.5,
    c: Math.min(1, (oklch.c ?? 0) / 0.4), // normalize chroma to 0-1
    h: oklch.h ?? 0,
  }
}

/**
 * Build hex from oklch slider components.
 * @param {{ l: number; c: number; h: number }} components  l/c are 0-1, h is 0-360
 */
export function oklchComponentsToHex({ l, c, h }) {
  const clamped = clampChroma(
    { mode: 'oklch', l, c: c * 0.4, h },
    'oklch',
    'p3'
  )
  return formatHex(clamped) ?? '#6366f1'
}
