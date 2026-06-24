# Design System Inspired by Reference Image (Orange Theme)

## 1. Visual Theme & Atmosphere

Clean, minimal, and product-focused with deliberate use of whitespace and a warm, inviting color palette inspired by the provided reference image.

**Key Characteristics:**
- Inter as the heading font
- Times New Roman as the body font for all running text
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#E87A3D` (Vibrant Orange) used for CTAs, main buttons, and brand highlights
- Subtle peach backgrounds (`#FEF2ED`) for prominent cards and secondary surfaces
- 3 shadow level(s) detected — tinted shadows
- Rounded corners (6px+) creating a friendly, approachable feel
- Tags: light, rounded, warm, orange, peach, minimal

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#E87A3D`) · `--color-primary`: Brand color, CTA backgrounds, active states, progress bars.
- **Secondary Accent** (`#FEF2ED`) · `--color-secondary`: Soft peach used for backgrounds of prominent cards (like the "Assignment Tersubmit" card) and subtle highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Card Background** (`#ffffff`) · `--color-card`: Default background for standard cards and containers.

### Text
- **Text Primary** (`#111111`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders, subtitles.

### Borders & Surfaces
- **Border** (`#E2E8F0`) · `--color-border`: Dividers, outlines, input borders.
- **Muted** (`#F3F4F6`) · `--color-muted`: Disabled states, neutral backgrounds.

## 3. Typography Rules

- **Heading Font:** `Inter`, sans-serif
- **Body Font:** `Times New Roman`, sans-serif

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `48px` | large metrics |
| H1 | `24px` | headings |
| H2 | `20px` | headings |
| H3 | `18px` | headings |
| H4 | `16px` | sub-headings |
| Body L | `14px` | body / supporting text |
| Body | `12px` | small text / labels |

## 4. Component Stylings

### Primary Button
```css
.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```

### Card (Prominent / Peach)
```css
.card-prominent {
  background: var(--color-secondary);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(232, 122, 61, 0.1);
}
```

### Card (Standard / White)
```css
.card-standard {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
```

## 5. Layout Principles

- **Base spacing unit:** `8px` — use multiples (16px, 24px, 32px, etc.)
- **Border Radius:** `6px` for small interactive elements, `16px` for cards.

## 6. Do's and Don'ts

### Do
- Use `#ffffff` as the primary page background.
- Use `Inter` for headings and `Times New Roman` for body text.
- Use `#E87A3D` (Orange) as the primary brand/action color.
- Use `#FEF2ED` (Peach) to highlight important summary cards.
- Maintain `8px` as the base spacing unit.
- Use rounded corners (`16px` for cards, `6px` for buttons/inputs).

### Don't
- Don't use generic blue or green as primary actions unless indicating success/error.
- Don't substitute Inter/Times New Roman with generic alternatives.
- Don't use pitch black (`#000000`) for text, use a very dark gray (`#111111`) instead.

## 7. Agent Prompt Guide

### Quick Color Reference
```
Background:     #ffffff
Primary Accent: #E87A3D
Secondary:      #FEF2ED
Text Primary:   #111111
Text Secondary: #666666
Border:         #E2E8F0
```
