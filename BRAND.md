# Komma — Brand Guidelines

## Brand Essence

**Komma** is a writing tool — a focused environment where writers craft documents, review changes with AI, and refine their prose. It's not a generic doc tool. It's an opinionated workspace built for people who care about what they write.

**Tagline:** *Every word, precisely placed.*

**One-liner:** AI-powered document editor for writers who care about craft.

---

## Name

**Komma** — from "comma" in many European languages (German, Swedish, Dutch, and others). The comma is the smallest punctuation mark that changes meaning — it represents precision, rhythm, and the care that separates good writing from great writing.

- Always written as **Komma** (capital K, no "the")
- Never "KOMMA" or "komma" in marketing copy
- In code/CLI contexts, lowercase `komma` is acceptable
- If disambiguation is needed: "Komma Editor" or "Komma App"

---

## Brand Personality

| Trait | Description |
|-------|-------------|
| **Precise** | Every element earns its place. Writers don't have time for decoration. |
| **Confident** | Knows what it is. Doesn't try to be everything. |
| **Crafted** | Feels premium but not precious. Tools should feel good to use. |
| **Dark-first** | Built for late nights and deep focus. Light mode exists but dark is home. |
| **Editorial** | Respects the written word. Typography matters. |

**Voice:** Direct, concise, technical but not cold. Speaks like a seasoned editor — no jargon, no marketing fluff. Says "Write better" not "Empower your content creation journey."

---

## Logo

### Concept Direction

The logo should combine **punctuation/precision** with **document/text** energy. Two strong directions:

**Direction A — The Comma Mark**
A stylized comma, elevated from humble punctuation to a bold graphic mark. Clean enough to work as a favicon at 16px. The curve could subtly reference a pen stroke or cursor.

**Direction B — The K Glyph**
A custom letterform "K" where the diagonal strokes suggest a comma's curve or a pen in motion. Combines the initial with the brand metaphor in one mark.

**Direction C — The Precision Mark**
An abstract mark that evokes both punctuation and editorial precision — perhaps overlapping comma forms, or a mark that suggests text being refined. Modern, geometric, distinctive.

### Logo Requirements

- Must work at 16x16 (favicon), 32x32 (dock icon), and 512x512 (app icon)
- Must be recognizable in monochrome (single color on dark or light)
- Should feel at home in a macOS dock alongside apps like Linear, Notion, VS Code
- Avoid: gradients in the mark itself, overly detailed illustrations, generic "document" icons
- The logomark should stand alone without the wordmark

### Wordmark

- Set in a geometric sans-serif with slightly squared terminals
- Suggested fonts: **Inter**, **General Sans**, **Satoshi**, or a custom cut
- Generous letter-spacing (tracking +2-4%)
- Weight: Medium (500) for headers, Regular (400) for body

---

## Color System — Options

Four palette directions. Each follows the same principle: **one dominant accent** against near-black backgrounds, with a signature gradient for marketing/headers. Pick one.

---

### Option A: Komma Violet *(Linear-adjacent, proven)*

The closest to Linear's proven aesthetic. Purple communicates precision, craft, and modernity. Differentiates from the sea of blue dev tools.

| Role | Name | Hex | Note |
|------|------|-----|------|
| Accent | **Komma Violet** | `#8B7BF5` | Slightly warmer than Linear's blue-purple |
| Accent Light | **Lavender** | `#B4A9FF` | Hover states, secondary highlights |
| Background | **Void** | `#0A0A0F` | Near-black with purple undertone |
| Surface | **Onyx** | `#141419` | Cards, sidebar, elevated surfaces |
| Border | **Smoke** | `#1E1E28` | Subtle dividers |
| Text Primary | **Snow** | `#EDEDEF` | Cool off-white |
| Text Secondary | **Slate** | `#6E6E80` | Muted labels, timestamps |

**Signature gradient:** `linear-gradient(135deg, #8B7BF5, #D4A5FF, #5B8DEF)` — violet to lilac to soft blue.

**Glow:** `box-shadow: 0 0 16px rgba(139, 123, 245, 0.25)`

**Light mode:**

| Role | Name | Hex |
|------|------|-----|
| Background | **Cloud** | `#FAFAFA` |
| Surface | **Mist** | `#F0F0F3` |
| Border | **Silver** | `#E2E2E8` |
| Text Primary | **Obsidian** | `#1A1A2E` |
| Text Secondary | **Stone** | `#8888A0` |
| Accent | **Komma Violet** | `#7C6BEB` | *Slightly darker for contrast on white* |

**Vibe:** Polished, confident, Silicon Valley craft tool. The safe bet.

---

### Option B: Komma Indigo *(Deeper, richer)*

A deeper, more saturated blue-indigo. Feels like midnight focus — ties back to the concentration and precision that good writing demands. More unique than violet.

| Role | Name | Hex | Note |
|------|------|-----|------|
| Accent | **Indigo** | `#6366F1` | Rich, saturated, punchy |
| Accent Light | **Periwinkle** | `#A5B4FC` | Hover, secondary |
| Background | **Abyss** | `#08090E` | Deep blue-black |
| Surface | **Depths** | `#10111A` | Cards, panels |
| Border | **Current** | `#1A1B2E` | Subtle blue in the borders |
| Text Primary | **Foam** | `#E8E9F0` | Slightly cool white |
| Text Secondary | **Drift** | `#5E6078` | Blue-gray muted text |

**Signature gradient:** `linear-gradient(135deg, #6366F1, #818CF8, #38BDF8)` — indigo to sky.

**Glow:** `box-shadow: 0 0 16px rgba(99, 102, 241, 0.3)`

**Light mode:**

| Role | Name | Hex |
|------|------|-----|
| Background | **Horizon** | `#FAFBFE` | *Blue-tinted white* |
| Surface | **Shallows** | `#EFF1F8` |
| Border | **Tide** | `#DDDFE8` |
| Text Primary | **Deep Ink** | `#111827` |
| Text Secondary | **Haze** | `#6B7280` |
| Accent | **Indigo** | `#5558E6` | *Slightly darker for legibility* |

**Vibe:** Midnight focus. Serious tool for serious work. Slightly more unique than violet.

---

### Option C: Komma White *(Monochrome, editorial)*

No color accent at all. Pure black and white with a single warm highlight for interactive states. This is the most opinionated choice — says "the writing is the product, not the chrome." Think iA Writer meets Linear.

| Role | Name | Hex | Note |
|------|------|-----|------|
| Accent | **Warm White** | `#F5F0EB` | Off-white used as accent on dark bg |
| Accent Hover | **Gold** | `#D4A574` | Warm gold for active/hover only |
| Background | **Black** | `#0C0C0C` | True near-black |
| Surface | **Charcoal** | `#161616` | Elevated surfaces |
| Border | **Graphite** | `#222222` | Minimal borders |
| Text Primary | **White** | `#EBEBEB` | Clean |
| Text Secondary | **Gray** | `#666666` | Muted |

**Signature gradient:** `linear-gradient(135deg, #F5F0EB, #D4A574)` — warm white to gold. Used sparingly.

**Glow:** None. Instead, use `border: 1px solid #F5F0EB` for focus states. Restraint is the brand.

**Light mode:**

| Role | Name | Hex |
|------|------|-----|
| Background | **White** | `#FFFFFF` |
| Surface | **Cream** | `#F8F6F3` |
| Border | **Warm Gray** | `#E8E4DE` |
| Text Primary | **Black** | `#1A1A1A` |
| Text Secondary | **Mid Gray** | `#999999` |
| Accent Hover | **Burnt Gold** | `#B8874A` | *Darker gold for contrast* |

**Vibe:** Brutalist editorial. Maximum confidence. "We don't need color to look good." Risky but memorable.

---

### Option D: Komma Emerald *(Current direction, refined)*

Evolves your current cyan toward a richer emerald-green. Feels like focused precision — green signals clarity and correctness. Unique in the writing tool space (nobody does green well).

| Role | Name | Hex | Note |
|------|------|-----|------|
| Accent | **Emerald** | `#34D399` | Richer than current cyan, more green |
| Accent Light | **Seafoam** | `#6EE7B7` | Hover, secondary |
| Background | **Deep** | `#0A0D0F` | Dark with green undertone |
| Surface | **Hull** | `#111916` | Subtle green in surfaces |
| Border | **Kelp** | `#1A2420` | Green-tinted borders |
| Text Primary | **Salt** | `#E4E8E6` | Slightly cool white |
| Text Secondary | **Brine** | `#5A6E64` | Green-gray |

**Signature gradient:** `linear-gradient(135deg, #34D399, #5DE4C7, #2DD4BF)` — emerald to teal.

**Glow:** `box-shadow: 0 0 16px rgba(52, 211, 153, 0.25)`

**Light mode:**

| Role | Name | Hex |
|------|------|-----|
| Background | **Spray** | `#F8FDFB` | *Green-tinted white* |
| Surface | **Shoal** | `#EFF7F3` |
| Border | **Reed** | `#D6E5DD` |
| Text Primary | **Anchor** | `#0F1A15` |
| Text Secondary | **Moss** | `#5E7A6C` |
| Accent | **Emerald** | `#0D9668` | *Darker for legibility on white* |

**Vibe:** Precision instrument. Distinctive. "That green app." Closest to current, easiest migration.

---

### Semantic Colors (shared across all options)

These stay consistent regardless of which accent palette you choose:

| Semantic | Hex | Usage |
|----------|-----|-------|
| **Error** | `#EF4444` | Rejected changes, diff deletions, validation |
| **Warning** | `#F59E0B` | Pending states, caution |
| **Success** | `#22C55E` | Approved changes, diff additions |
| **Info** | `#3B82F6` | Informational highlights |

*Note: If using Option D (emerald), adjust Success to `#86EFAC` to avoid clash with the accent.*

---

### Recommendation

**Option A (Violet)** is the safest — proven by Linear, Figma, and others. You'll look premium immediately.

**Option B (Indigo)** is the sweet spot — distinctive enough to own, familiar enough to trust. Best match for the precision-focused identity.

**Option C (Monochrome)** is the boldest — memorable but polarizing. Best if you want the writing to be the star.

**Option D (Emerald)** is the easiest — closest to what you have, just more refined. Best if you like the current vibe.

---

## Typography

### App Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Document headings | **Source Serif 4** | 700 | 2.5rem (h1), 1.5rem (h2) |
| UI text (buttons, tabs, labels) | **Plus Jakarta Sans** | 500-600 | 0.875rem |
| Code / monospace | **JetBrains Mono** | 400 | 0.875rem |
| Document body | **Source Serif 4** | 400 | 1.125rem |

### Marketing Typography

- Headlines: **Plus Jakarta Sans** Bold (700) or a tighter display cut
- Body: **Plus Jakarta Sans** Regular (400), 1.125rem, 1.6 line-height
- Keep it simple — two fonts max in any given context

---

## Iconography

- **Style:** Outlined, 1.5-2px stroke, rounded caps
- **Size:** 14-16px in the app UI
- **Source:** Lucide icons or custom, matching the stroke style
- Icons should feel like precision instruments — clean, functional, no fill

---

## App Icon (macOS)

The macOS dock icon should:
- Use the **Deep Navy** background (or a very dark gradient from `#0B0D14` to `#12151E`)
- Feature the logomark in the chosen accent color with a subtle glow
- Follow Apple's rounded-rect (squircle) shape
- Have enough contrast to stand out in both light and dark dock backgrounds
- Feel premium — slight depth via shadow or inner lighting is acceptable

---

## Photography & Imagery

If used in marketing:
- Dark, moody workspaces — late night writing vibes
- Close-ups of screens showing the app (real UI, not mockups)
- Typographic details, punctuation close-ups, editorial imagery
- Grain/noise texture acceptable for editorial feel

---

## What Komma Is Not

- Not playful or whimsical (no emoji, no illustration-heavy brand)
- Not enterprise/corporate (no blue gradients, no stock photos of people pointing at screens)
- Not a generic notes app (don't position against Notion/Obsidian — Komma is a precision writing tool)
- Not AI-first branding (Claude powers it, but Komma is the product. Don't lead with "AI")

---

## Usage Examples

**Good:** "Write it in Komma." / "Komma catches what you missed." / "Every word, precisely placed."

**Bad:** "Komma empowers content creators to leverage AI-driven documentation workflows." / "Your AI copilot for writing."

---

## File Summary

- **Logo files needed:** SVG logomark, SVG wordmark, SVG combined, PNG app icon (512x512, 1024x1024), ICO favicon
- **Brand colors:** Provided as hex, need RGB and HSL variants for code
- **Fonts:** All available via Google Fonts (free, no licensing issues)
