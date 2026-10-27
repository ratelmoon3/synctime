---
name: Synchronous Utility
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#1d4ed8'
  on-secondary: '#ffffff'
  secondary-container: '#4069f2'
  on-secondary-container: '#fffbff'
  tertiary: '#4d556b'
  on-tertiary: '#ffffff'
  tertiary-container: '#656d84'
  on-tertiary-container: '#eef0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b5'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  time-mono:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  gutter-mobile: 0.25rem
  margin: 1rem
  margin-mobile: 0.75rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

This design system targets production crews, film sets, creative studios, and multi-team operations coordinators who handle dense, time-critical scheduling. The emotional tone is authoritative, highly disciplined, friction-free, and rapid.

The core visual style is **Utility-First Minimalist Precision**:
- Focus exclusively on information density, temporal legibility, and rapid scannability over decoration.
- Interface surfaces recede into the background, letting color-coded event semantics and dynamic heatmap overlays guide optical tracking.
- Borders, cell dividing lines, and micro-interactions prioritize pixel-exact alignment, avoiding floating visual artifacts or gratuitous whitespace.

## Colors

The palette organizes data through structural neutrals, heat-intensity blues, and unambiguous operational category tokens.

### Canvas & Structural Neutrals
- **Canvas Base**: `#FFFFFF` for primary calendar grids and modal dialogs.
- **Canvas Subdued**: `#F8FAFC` for page backgrounds, non-working hour tracks, and structural sidebars.
- **Canvas Elevated**: `#F1F5F9` for pinned table headers, disabled timeline blocks, and hover row treatments.
- **Border Default**: `#E2E8F0` for hairline 1px timetable grid lines and divider tracks.
- **Border Strong**: `#CBD5E1` for current-time indicators, column segmentations, and active form controls.
- **Text Primary**: `#0F172A` for high-contrast labels, event names, and timetable hour markings.
- **Text Secondary**: `#475569` for auxiliary details, room tags, and timezone offsets.
- **Text Muted**: `#94A3B8` for empty slot placeholders, column guides, and inactive days.

### Availability Heatmap Graduations (Primary Blue)
Availability overlays communicate collective team presence via saturation and luminance:
- **100% Concurrency (Max)**: `#1D4ED8` (Text: `#FFFFFF`)
- **75%–99% Concurrency**: `#2563EB` (Text: `#FFFFFF`)
- **50%–74% Concurrency**: `#60A5FA` (Text: `#0F172A`)
- **25%–49% Concurrency**: `#BAE6FD` (Text: `#0F172A`)
- **1%–24% Concurrency (Faint)**: `#EFF6FF` (Text: `#1E40AF`)
- **0% / Unavailable**: `#F8FAFC` (Hairline cross-hatch or solid blank)

### Semantic Production Categories
- **Practice / Rehearsal**: `#16A34A` (Surface: `#F0FDF4`, Border: `#86EFAC`, Text: `#14532D`)
- **Shoot / Recording**: `#EA580C` (Surface: `#FFF7ED`, Border: `#FDBA74`, Text: `#7C2D12`)
- **Meeting**: `#2563EB` (Surface: `#EFF6FF`, Border: `#93C5FD`, Text: `#1E40AF`)
- **Meal / Break**: `#D97706` (Surface: `#FFFBEB`, Border: `#FCD34D`, Text: `#78350F`)
- **Setup / Teardown**: `#64748B` (Surface: `#F8FAFC`, Border: `#CBD5E1`, Text: `#334155`)
- **Other / Custom**: `#9333EA` (Surface: `#FAF5FF`, Border: `#D8B4FE`, Text: `#581C87`)

## Typography

Typography prioritizes tabular clarity and high vertical density. Inter is implemented across all roles with tabular numbers (`tnum`) enabled globally for timestamps, durations, and coordinate values.

- **Scale Compression**: Titles top out at 24px desktop (`headline-lg`) to preserve maximum viewport height for schedule matrix rendering.
- **Tabular Figures**: All timetable axes, time ranges (e.g., `09:30 - 11:15`), and headcount indicators utilize open-type tabular numbers to prevent horizontal layout shift during live drag-and-drop actions.
- **Labels & Micro-data**: Micro labels (`label-sm`, 11px) handle density constraints inside 15-minute and 30-minute block heights without clipping.

## Layout & Spacing

The layout is built around a structured matrix grid configured for multi-column time tracking.

- **Matrix Grid Structure**: 
  - Desktop displays a synchronized 7-day column grid or multi-track production stage view.
  - The horizontal time axis anchors a fixed-width 48px to 64px label column (`06:00` to `24:00`), while the vertical event lanes expand fluidly to fill canvas width.
  - Granularity snaps to 15-minute standard intervals, corresponding to minimum 20px cell heights.
- **Density System**:
  - Gaps between concurrent events inside identical time slots are kept strictly to `space-xs` (2px) to maximize usable area.
  - Outer app layout utilizes a collapsed header (44px) and collapsible left utility panel (240px wide).
- **Responsive Handling**:
  - **Desktop (≥ 1024px)**: Full weekly multi-column matrix with side-by-side crew selector.
  - **Tablet (768px – 1023px)**: 3-day or 5-day sliding window with horizontal scroll snap; crew selector moves to an overlay drawer.
  - **Mobile (< 768px)**: Single-day view with a mini 7-day selector ribbon fixed at top; event blocks span full container width with inline availability counters.

## Elevation & Depth

This system avoids heavy shadows and glassmorphic blurs in favor of **structural line boundaries and subtle tonal stacking**:

- **Level 0 (Base Canvas)**: `#F8FAFC` background; unassigned calendar space uses `#FFFFFF` with 1px `#E2E8F0` solid borders.
- **Level 1 (Timetable Blocks & Cards)**: Static event blocks use crisp 1px borders matching their semantic hue tint; no drop shadow.
- **Level 2 (Hover & Focus States)**: Subtle micro-elevation for interactive blocks via `0 1px 3px 0 rgba(15, 23, 42, 0.08)`.
- **Level 3 (Drag Preview & Moving Slots)**: Active drag items pick up an elevated physical presence using `0 8px 16px -4px rgba(15, 23, 42, 0.12)`, a primary blue outline (`#2563EB`), and 95% opacity to show the destination slot underneath.
- **Level 4 (Tooltips, Flyouts, Popovers)**: `#FFFFFF` surface with `0 4px 12px -2px rgba(15, 23, 42, 0.1)` and a solid 1px `#CBD5E1` containment border.

## Shapes

The interface uses compact, precise geometries (`roundedness: 1`):

- **Grid Cells & Time Blocks**: `0.25rem` (4px) corner radius. This balances edge definition on small 15-minute blocks without creating visual clutter where blocks touch.
- **Controls, Badges, & Inputs**: `0.25rem` (4px) corner radius for visual uniformity across dense toolbar rows.
- **Status Pills & Count Chips**: Fully rounded pill shapes (`9999px`) are reserved strictly for circular profile count bubbles and unread notification indicators.
- **Modal Containers & Sheets**: `0.5rem` (8px) corner radius to subtly frame elevated configuration contexts without drifting into soft consumer styling.

## Components

### Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, border none, 32px height, padding 0 12px, font size 13px, font weight 500. Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Secondary / Outline**: Background `#FFFFFF`, text `#0F172A`, border 1px solid `#CBD5E1`, 32px height. Hover: `#F1F5F9`.
- **Ghost Utility**: Background transparent, text `#475569`, 28px height, 8px padding. Used for grid magnification, date navigation chevrons, and view toggles.

### Time Slot Heatmap Cells
- Unoccupied matrix slots show an empty white base (`#FFFFFF`) with a 1px border (`#E2E8F0`).
- Collective availability cells fill dynamically based on participant thresholds, using the graduated blue tokens (`#EFF6FF` through `#1D4ED8`).
- Hovering over a heatmap cell displays a high-contrast floating indicator showing the fractional availability (e.g., `8/9 Available`) and a list of conflicting members.

### Schedule Event Blocks
- Composed of: 
  1. A left indicator border (3px solid semantic token).
  2. A tinted background fill using the semantic surface token.
  3. A primary title in matching semantic dark text (`title-sm`).
  4. Monospaced time range (`time-mono`).
- Drag handles sit on top and bottom borders (6px invisible touch targets, displaying cursor `ns-resize`).

### Chips & Semantic Tags
- Height: 20px; font size: 11px; padding: 0 6px.
- Practice: background `#F0FDF4`, border 1px solid `#86EFAC`, text `#14532D`.
- Shoot/Recording: background `#FFF7ED`, border 1px solid `#FDBA74`, text `#7C2D12`.
- Meeting: background `#EFF6FF`, border 1px solid `#93C5FD`, text `#1E40AF`.
- Meal: background `#FFFBEB`, border 1px solid `#FCD34D`, text `#78350F`.
- Setup: background `#F8FAFC`, border 1px solid `#CBD5E1`, text `#334155`.
- Other: background `#FAF5FF`, border 1px solid `#D8B4FE`, text `#581C87`.

### Form Inputs & Selectors
- Height: 32px; background `#FFFFFF`; border 1px solid `#CBD5E1`; font size 13px; text `#0F172A`.
- Focus: border 1px solid `#2563EB` with `0 0 0 1px #2563EB`. Error: border `#DC2626`.
- Compact numeric stepper controls for duration inputs (`15m`, `30m`, `1h`, `2h`).

### Checkboxes & Member Availability Toggles
- Box: 14px x 14px; border 1px solid `#94A3B8`; corner radius 2px. Checked state: `#2563EB` with white check icon.
- Crew list rows: 28px height, including colored avatar circle (18px), crew member name (`body-sm`), and a quick-mute availability eye-toggle.

### Timetable Headers & Hour Ruler
- Pinned horizontal day header: height 40px, background `#F8FAFC`, border-bottom 1px solid `#CBD5E1`.
- Current day indicator: blue accent line (2px solid `#2563EB`) below the column header with day number highlighted in `#2563EB`.
- Vertical time gutter: width 56px, right border 1px solid `#E2E8F0`, timestamps right-aligned with 8px inset.