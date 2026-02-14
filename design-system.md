# CareOps Design System

## Brand Foundation

### Identity
- **Name:** CareOps
- **Tagline:** "Unified Operations Platform"
- **Personality:** Professional, trustworthy, efficient, modern
- **Industry:** SaaS for service businesses (healthcare, home services, professional services)

### Core Message
Eliminate tool chaos. One platform for leads, bookings, communications, forms, and inventory.

---

## Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-50` | #EFF6FF | Light backgrounds |
| `--primary-100` | #DBEAFE | Hover states |
| `--primary-200` | #BFDBFE | Borders, subtle accents |
| `--primary-500` | #3B82F6 | Primary actions, links |
| `--primary-600` | #2563EB | Primary buttons, active states |
| `--primary-700` | #1D4ED8 | Hover on primary |
| `--primary-900` | #1E3A8A | Text on light backgrounds |

### Neutral Colors (Slate)
| Token | Hex | Usage |
|-------|-----|-------|
| `--neutral-50` | #F8FAFC | Page backgrounds |
| `--neutral-100` | #F1F5F9 | Card backgrounds |
| `--neutral-200` | #E2E8F0 | Borders, dividers |
| `--neutral-300` | #CBD5E1 | Disabled states |
| `--neutral-400` | #94A3B8 | Placeholder text |
| `--neutral-500` | #64748B | Secondary text |
| `--neutral-600` | #475569 | Body text |
| `--neutral-700` | #334155 | Headings |
| `--neutral-800` | #1E293B | Strong emphasis |
| `--neutral-900` | #0F172A | Primary text |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--success-50` | #F0FDF4 | Success backgrounds |
| `--success-500` | #22C55E | Success states |
| `--success-600` | #16A34A | Success hover |
| `--warning-50` | #FFFBEB | Warning backgrounds |
| `--warning-500` | #F59E0B | Warning states |
| `--warning-600` | #D97706 | Warning hover |
| `--error-50` | #FEF2F2 | Error backgrounds |
| `--error-500` | #EF4444 | Error states |
| `--error-600` | #DC2626 | Error hover |
| `--info-50` | #EFF6FF | Info backgrounds |
| `--info-500` | #3B82F6 | Info states |

---

## Typography

### Font Family
- **Primary:** Inter (system-ui fallback)
- **Mono:** JetBrains Mono (for code/data)

### Type Scale
| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| H1 | 2.25rem (36px) | 700 | 1.2 | -0.02em | Page titles |
| H2 | 1.875rem (30px) | 600 | 1.25 | -0.01em | Section headers |
| H3 | 1.5rem (24px) | 600 | 1.3 | 0 | Card titles |
| H4 | 1.25rem (20px) | 600 | 1.4 | 0 | Subsection headers |
| H5 | 1.125rem (18px) | 500 | 1.5 | 0 | Form section titles |
| H6 | 1rem (16px) | 500 | 1.5 | 0 | Small headers |
| Body | 1rem (16px) | 400 | 1.6 | 0 | Main content |
| Body-sm | 0.875rem (14px) | 400 | 1.5 | 0 | Secondary content |
| Caption | 0.75rem (12px) | 500 | 1.4 | 0.01em | Labels, badges |

---

## Spacing System

### Base Unit: 4px
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Icon gaps |
| `--space-3` | 12px | Component internal |
| `--space-4` | 16px | Standard gap |
| `--space-5` | 20px | Form spacing |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section gaps |
| `--space-10` | 40px | Large sections |
| `--space-12` | 48px | Page sections |
| `--space-16` | 64px | Major divisions |

### Layout
- **Max Content Width:** 1440px
- **Sidebar Width:** 260px (collapsed: 72px)
- **Card Border Radius:** 12px
- **Button Border Radius:** 8px
- **Input Border Radius:** 8px

---

## Shadows & Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| `--shadow-sm` | 0 1px 2px 0 rgb(0 0 0 / 0.05) | Buttons, inputs |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1) | Cards, dropdowns |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1) | Modals, popovers |
| `--shadow-xl` | 0 20px 25px -5px rgb(0 0 0 / 0.1) | Drawers, dialogs |
| `--shadow-2xl` | 0 25px 50px -12px rgb(0 0 0 / 0.25) | Feature highlights |

---

## Component Patterns

### Buttons

**Primary Button**
- Background: `--primary-600`
- Text: white
- Padding: 10px 16px
- Border Radius: 8px
- Font: 14px, 500 weight
- Hover: `--primary-700`
- Active: `--primary-800`
- Disabled: `--neutral-300` bg, `--neutral-500` text

**Secondary Button**
- Background: white
- Border: 1px solid `--neutral-200`
- Text: `--neutral-700`
- Hover: `--neutral-50` background

**Ghost Button**
- Background: transparent
- Text: `--primary-600`
- Hover: `--primary-50` background

### Cards
- Background: white
- Border: 1px solid `--neutral-200`
- Border Radius: 12px
- Padding: 24px
- Shadow: `--shadow-sm`
- Hover: `--shadow-md` (for interactive)

### Inputs
- Background: white
- Border: 1px solid `--neutral-200`
- Border Radius: 8px
- Padding: 10px 12px
- Font: 14px
- Focus: `--primary-500` border, `--primary-100` ring
- Error: `--error-500` border

### Badges
| Type | Background | Text |
|------|------------|------|
| Default | `--neutral-100` | `--neutral-700` |
| Primary | `--primary-100` | `--primary-700` |
| Success | `--success-50` | `--success-600` |
| Warning | `--warning-50` | `--warning-600` |
| Error | `--error-50` | `--error-600` |

---

## Animation Specifications

### Duration
- `--duration-instant`: 0ms
- `--duration-fast`: 150ms
- `--duration-normal`: 200ms
- `--duration-slow`: 300ms

### Easing
- `--ease-default`: cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Common Transitions
```css
/* Button hover */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Card hover lift */
transition: box-shadow 200ms ease, transform 200ms ease;

/* Input focus */
transition: border-color 150ms ease, box-shadow 150ms ease;

/* Modal appear */
animation: fadeIn 200ms ease-out, slideIn 300ms ease-out;

/* Skeleton shimmer */
animation: shimmer 2s infinite;
```

---

## Layout Patterns

### Dashboard Grid
```
+------------------+------------------+
|     Sidebar      |     Header       |
|      260px       |    64px height   |
+------------------+                  |
|                  +------------------+
|                  |                  |
|                  |    Main Content  |
|                  |                  |
|                  |                  |
+------------------+------------------+
```

### Page Structure
1. **Header:** Logo, search, notifications, user menu
2. **Sidebar:** Navigation, workspace switcher
3. **Content Area:** Page title, actions, data display
4. **Bottom:** Optional pagination, footer info

---

## Accessibility Requirements

- Color contrast ratio: 4.5:1 minimum for text
- Focus visible: 2px solid `--primary-500` outline
- Touch targets: Minimum 44x44px
- Reduced motion: Respect `prefers-reduced-motion`
- Screen reader: Proper ARIA labels on all interactive elements

---

## Dark Mode (Future)

| Token | Light | Dark |
|-------|-------|------|
| Background | `--neutral-50` | `--neutral-900` |
| Surface | white | `--neutral-800` |
| Border | `--neutral-200` | `--neutral-700` |
| Text Primary | `--neutral-900` | `--neutral-50` |
| Text Secondary | `--neutral-600` | `--neutral-400` |
