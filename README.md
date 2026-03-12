# A11y-First Color Palette Designer

A professional, accessibility-driven color palette tool that generates beautiful color palettes while enforcing **WCAG 2.1 contrast standards** in real time.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Palette Generation
- Generate a palette of **5 colors** instantly
- **Lock individual colors** to keep them while regenerating the rest
- **OKLCH sliders** (Lightness, Chroma, Hue) per color for precise real-time tweaking
- Click any hex code to **edit it directly** or copy it to clipboard

### Accessibility Engine
- Live **WCAG 2.1 contrast ratio** calculation using the official relative luminance formula
- Every color pair is classified as **AAA**, **AA**, **AA Large**, or **Fail**
- Sidebar shows **AA / AAA pass counts** and a live pass-rate progress bar

### Safe Pair Matrix
- Full **N×N contrast grid** — rows = foreground, columns = background
- Each cell previews the actual "Aa" text on its background with a contrast badge
- Filter the matrix by **All / AA / AAA / Fail** to quickly spot problems

### Palette Library
- **50 curated design palettes** across styles: warm, cool, dark, vibrant, elegant, playful, nature and more
- Browse by **tag** or **search** by name / description
- **Min AA slider (0–50%)** to filter palettes by accessibility level
- One-click **Apply Palette** — locked colors are always preserved

### Export
- Export your palette as:
  - **CSS Custom Properties** (`--color-1: #hex`)
  - **Tailwind Config** (`extend.colors` block)
  - **JSON**
- One-click copy to clipboard

### UI & Accessibility
- **Dark / Light mode** toggle — respects `prefers-color-scheme`, persisted in `localStorage`
- Fully **responsive** — works on mobile and desktop
- Skip-to-main link, `aria-label` on all interactive elements, keyboard-navigable throughout
- The tool itself meets WCAG 2.1 AA — it practices what it preaches

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 18 + Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **Icons** | Lucide React |
| **Color Math** | [Culori](https://culorijs.org/) (OKLCH conversions, contrast, clamping) |
| **Contrast Formula** | WCAG 2.1 relative luminance — sRGB IEC 61966-2-1 |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/NikihsdWIE/a11y-palette-designer.git
cd a11y-palette-designer

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── main.jsx                        # React entry point
├── index.css                       # Tailwind directives
├── App.jsx                         # Root layout, state, dark mode
├── components/
│   ├── ColorSwatch.jsx             # Color card with OKLCH sliders
│   ├── SafePairMatrix.jsx          # N×N contrast grid
│   ├── ContrastBadge.jsx           # AAA / AA / AA Large / Fail badge
│   ├── ExportPanel.jsx             # CSS / Tailwind / JSON export
│   └── PaletteLibraryModal.jsx     # Curated palette browser
├── data/
│   └── paletteLibrary.js           # 50 curated palette definitions
└── utils/
    ├── colorUtils.js               # WCAG 2.1 engine + color helpers
    └── exportUtils.js              # Export string generators
```

---

## WCAG 2.1 Reference

| Level | Minimum Contrast |
|---|---|
| AA — Normal text | ≥ 4.5 : 1 |
| AAA — Normal text | ≥ 7.0 : 1 |
| AA — Large text (18pt+ / 14pt+ bold) | ≥ 3.0 : 1 |
| AAA — Large text | ≥ 4.5 : 1 |

---

## License

[MIT](LICENSE) — free to use, modify and distribute.
