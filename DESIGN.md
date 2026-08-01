# LMS Mr. Ole Design System

## 1. Atmosphere & Identity

A quiet study sanctuary. Soft, dimensional surfaces that feel like molded clay — warm, tactile, and unhurried. The signature is **soft structuralism**: airy floating components with ultra-diffuse ambient shadows on a silver-grey canvas, accented by salmon-pink warmth and punctuated by vibrant green calls-to-action. Every surface breathes; nothing feels flat or sterile. The LMS is not a dashboard — it is a well-lit reading room where content floats just above the desk.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #F7F8FA | #0F1117 | Page background |
| Surface/secondary | --surface-secondary | #FFFFFF | #1A1D26 | Cards, panels |
| Surface/elevated | --surface-elevated | #FFFFFF | #242836 | Modals, popovers |
| Text/primary | --text-primary | #1A1D26 | #F2F3F5 | Headlines, body |
| Text/secondary | --text-secondary | #6B7280 | #9CA3AF | Captions, hints |
| Text/tertiary | --text-tertiary | #9CA3AF | #6B7280 | Disabled, muted |
| Border/default | --border-default | rgba(0,0,0,0.06) | rgba(255,255,255,0.06) | Dividers, outlines |
| Border/subtle | --border-subtle | rgba(0,0,0,0.03) | rgba(255,255,255,0.03) | Soft separations |
| Accent/primary | --accent-primary | #FDBCB4 | #FDBCB4 | Secondary CTAs, badges, links |
| Accent/hover | --accent-hover | #F5A094 | #F5A094 | Hover state |
| CTA/primary | --cta-primary | #22C55E | #22C55E | Primary CTAs |
| CTA/hover | --cta-hover | #16A34A | #16A34A | CTA hover |
| Status/success | --status-success | #22C55E | #22C55E | Confirmations |
| Status/warning | --status-warning | #F59E0B | #F59E0B | Cautions |
| Status/error | --status-error | #EF4444 | #EF4444 | Errors, destructive |
| Status/info | --status-info | #ADD8E6 | #ADD8E6 | Informational |

### Rules
- Surface hierarchy creates depth through tonal shift and ultra-diffuse shadows.
- CTA green is ONLY for primary interactive actions. Accent pink is for secondary elements.
- Never introduce a color not in this table. Extend the table first.

## 3. Typography

### Font Stack
- **Primary**: `Geist, system-ui, -apple-system, sans-serif`
- **Mono**: `Geist Mono, JetBrains Mono, monospace`

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 40px / 2.5rem | 600 | 1.1 | -0.025em | Page titles |
| H1 | 30px / 1.875rem | 600 | 1.2 | -0.02em | Section headers |
| H2 | 24px / 1.5rem | 600 | 1.3 | -0.015em | Subsection headers |
| H3 | 20px / 1.25rem | 600 | 1.4 | -0.01em | Card titles |
| Body/lg | 18px / 1.125rem | 450 | 1.6 | 0 | Lead paragraphs |
| Body | 16px / 1rem | 450 | 1.6 | 0 | Default text |
| Body/sm | 14px / 0.875rem | 450 | 1.5 | 0 | Secondary info |
| Caption | 13px / 0.8125rem | 500 | 1.4 | 0.01em | Labels, metadata |
| Overline | 11px / 0.6875rem | 600 | 1.3 | 0.08em | Section labels, uppercase |

### Rules
- Geist weight 450 (between regular and medium) is the default body weight.
- Headings always use weight 600 with negative tracking.
- Body text never below 14px.

## 4. Spacing & Layout

### Base Unit
All spacing derives from a base of **4px**.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight: icon-to-label |
| --space-2 | 8px | Compact: list items |
| --space-3 | 12px | Default: form padding |
| --space-4 | 16px | Standard: card padding |
| --space-5 | 20px | Comfortable |
| --space-6 | 24px | Generous card padding |
| --space-8 | 32px | Between card groups |
| --space-10 | 40px | Sections within a page |
| --space-12 | 48px | Major section breaks |
| --space-16 | 64px | Page-level vertical rhythm |
| --space-20 | 80px | Hero spacing |
| --space-24 | 96px | Maximum section separation |

### Grid
- Max content width: 1280px
- Column system: CSS Grid, responsive. Dashboard uses asymmetric bento.
- Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px

### Rules
- Dashboard sections use `py-10` to `py-16` vertical spacing.
- Cards breathe: `p-6` default padding.

## 5. Components

### Card
- **Structure**: Double-Bezel — outer shell (`bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-[1.5rem] ring-1 ring-black/5 dark:ring-white/5`) + inner core (`bg-white dark:bg-gray-800 rounded-[calc(1.5rem-0.375rem)]`)
- **Variants**: default, hover (shadow deepens)
- **Spacing**: --space-6 inner padding
- **States**: default, hover (shadow-clay-lg), active
- **Motion**: transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]

### Button
- **Structure**: rounded-xl, px-6 py-3, generous touch target
- **Variants**: primary (cta green), secondary (pink), outline, ghost, danger
- **States**: default, hover (brightness shift), active (scale-[0.98]), disabled
- **Motion**: transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)], active: scale-[0.98]
- **Accessibility**: min-h-[44px], focus ring visible

### Input
- **Structure**: rounded-xl border, px-4 py-2.5
- **States**: default, focus (ring-2 ring-primary-300), error, disabled
- **Variants**: default, with icon

### Badge
- **Structure**: rounded-full px-3 py-1 text-xs uppercase tracking-[0.05em]
- **Variants**: default, primary, secondary, success, warning, danger

### Navbar
- **Structure**: floating glass pill — mt-4 mx-auto w-[95%] max-w-7xl rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-white/10 shadow-clay
- **Responsive**: horizontal links on desktop, hamburger drawer on mobile
- **Safe area**: fixed above page content with the greater of the 16px top inset or `env(safe-area-inset-top)` on notched devices; page backgrounds continue behind the glass surface
- **Controls**: language uses a two-option segmented control; language, theme, and menu targets remain at least 44px with visible active and focus states

### Skeleton
- **Structure**: animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700

### Achievement Share Card
- **Structure**: two fixed-canvas variants sharing the atmospheric primary/secondary/lavender gradient, verified score focal point, compact result metadata, green challenge CTA, and high-contrast QR quiet zone
- **Feed variant**: 4:5 composition for social feeds with the score, two-column metadata, CTA, and compact QR
- **Story variant**: 9:16 composition for WhatsApp and Instagram stories; content stays inside 168px top and 144px bottom export safe areas, the QR renders at least 288px in the exported image, and score-aware copy frames low scores as completed practice, medium scores as progress, and high scores as mastery
- **Export**: canonical 1080x1350 Feed PNG or 1080x1920 Story PNG generated on demand; responsive previews reuse the same component without letterboxing
- **Privacy**: first-name display is opt-in per share, answers and account identifiers never appear, and every public token is revocable
- **States**: preparing, preview, native share, download fallback, copied, and revoked

### Share Result Modal
- **Structure**: bottom sheet on mobile and centered dialog on desktop, with a Feed/Story segmented format control, achievement preview, and three primary actions: share image, copy link, and download PNG
- **Format behavior**: Story is the initial format below the 768px breakpoint, Feed is the initial format on larger screens, and the most recent explicit choice is stored locally
- **Accessibility**: focus trap, Escape close, restored focus, scroll lock, labelled dialog, and minimum 44px controls

### Quiz Result Hero
- **Structure**: score ring and contextual encouragement lead the page, followed by a three-cell correct/accuracy/duration insight bar and one full-width share CTA
- **Progress states**: low scores use supportive salmon, medium scores use warning amber, and mastered scores use success green; red remains reserved for individual wrong answers
- **Responsive**: centered stack on mobile, horizontal score-and-message composition from small tablet upward

### Answer Review
- **Structure**: next-step recommendation, answer-type insight, all/correct/wrong segmented filter, one focused question card, discussion, and previous/next navigation
- **Loading**: the score renders immediately from navigation state while answer details load into shaped skeletons; recoverable fetch errors preserve the score and expose retry

### Quiz Session
- **Structure**: one server-assigned question at a time, stable 20-question navigator, progress, elapsed/deadline timer, optional supporting stimulus, prompt, and answer controls
- **Persistence**: server snapshots own question and option order; lightweight local progress is keyed by session ID and never stores answer keys
- **Modes**: normal, adaptive, and timed use 20 questions; retry is a non-streak remediation set; challenge reproduces the source question set
- **States**: starting/resuming, active, locally saved, server saved, submitting, submitted, expired, insufficient pool, and recoverable network error

### Supporting Stimulus
- **Structure**: optional quiet inset block above the prompt with preserved whitespace and no visible "Teks", "Transkrip", or "Pertanyaan" labels
- **Content**: plain text only in the initial implementation; transcript semantics remain available to assistive technology through an accessible name
- **Accessibility**: semantic section, readable line height, escaped React text, and no HTML injection

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | cubic-bezier(0.32,0.72,0,1) | Button press, toggle |
| Standard | 300ms | cubic-bezier(0.32,0.72,0,1) | Panel open, tab switch |
| Emphasis | 500ms | cubic-bezier(0.16,1,0.3,1) | Page transition, hero entry |
| Scroll-driven | tied to scroll | ease-out | Reveal animations |

### Rules
- Only animate `transform` and `opacity`. Never animate layout properties.
- Every interactive element has hover + active + focus states.
- Scroll-triggered entries use IntersectionObserver, not scroll listeners.
- Respect `prefers-reduced-motion`.

## 7. Depth & Surface

### Strategy
**Shadows + tonal-shift** (mixed).

| Level | Value | Usage |
|-------|-------|-------|
| Subtle | 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) | Cards at rest |
| Default | 0 8px 24px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03) | Elevated cards |
| Prominent | 0 12px 36px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04) | Modals, popovers |

Borders: `1px solid var(--border-default)` on cards, `ring-1 ring-black/5` on Double-Bezel outer shell.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA target — contrast floor 4.5:1 body / 3:1 large text
- Visible focus ring on every interactive element
- Full keyboard reachability
- prefers-reduced-motion respected
- Touch targets minimum 44x44px

### Accepted Debt
| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Dark mode color ramp | Global | Initial palette uses Tailwind grays; perceptual OKLCH ramp deferred | Future iteration |
| Loading skeletons | Common | Present but not individually shaped per component | Future iteration |
