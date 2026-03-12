/**
 * exportUtils.js
 * Generates CSS variables, Tailwind config, and JSON export strings.
 */

/**
 * @param {Array<{hex: string}>} palette
 * @returns {string}  CSS variable block
 */
export function toCSSVariables(palette) {
  const vars = palette
    .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    .join('\n')
  return `:root {\n${vars}\n}`
}

/**
 * @param {Array<{hex: string}>} palette
 * @returns {string}  Tailwind config extend block
 */
export function toTailwindConfig(palette) {
  const colors = palette
    .map((c, i) => `      palette${i + 1}: '${c.hex}',`)
    .join('\n')
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors}\n      },\n    },\n  },\n}`
}

/**
 * @param {Array<{hex: string}>} palette
 * @returns {string}  JSON string
 */
export function toJSON(palette) {
  const obj = Object.fromEntries(
    palette.map((c, i) => [`color${i + 1}`, c.hex])
  )
  return JSON.stringify(obj, null, 2)
}

/**
 * Copy text to clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for non-secure contexts
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}
