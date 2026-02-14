# CareOps Design System - Master

## Project Overview
**Project Name:** CareOps - Unified Operations Platform
**Type:** Healthcare Operations Management SaaS
**Industry:** Healthcare/Wellness Services
**Purpose:** Eliminate tool chaos for healthcare providers with unified leads, bookings, communications, forms, and inventory management.

## Design System Pattern
**Selected Pattern:** Healthcare Professional
- **Rationale:** Healthcare operations require trust, clarity, and calm efficiency
- **Core Values:** Trustworthy, Professional, Calm, Efficient, Reliable
- **User Context:** Healthcare providers managing multiple operations, need clear workflows and professional appearance

## Style Selection
**Primary Style:** Professional Minimalism
- **Rationale:** Healthcare requires clean, distraction-free interfaces that inspire confidence
- **Characteristics:** Clean lines, ample whitespace, clear typography hierarchy
- **Avoid:** Playful elements, excessive decoration, distracting animations
- **Atmosphere:** Clinical precision with human warmth

## Color System

### Base/Neutral Palette (Healthcare Professional)
- **Background:** `#F8FAFC` (slate-50) - Clean, medical white feel
- **Surface:** `#FFFFFF` (white) - Pure, sterile surfaces
- **Border/Divider:** `#E2E8F0` (slate-200) - Subtle separation
- **Text Secondary:** `#64748B` (slate-500) - Professional gray
- **Text Primary:** `#0F172A` (slate-900) - High contrast for readability

### Accent Palette (Healthcare Branding)
- **Primary (Trust Blue):** `#2563EB` (blue-600) - Professional, trustworthy
- **Primary Hover:** `#1D4ED8` (blue-700) - Deeper trust
- **Success (Medical Green):** `#16A34A` (green-600) - Health, positive outcomes
- **Warning (Amber):** `#D97706` (amber-600) - Caution, attention needed
- **Error (Alert Red):** `#DC2626` (red-600) - Critical issues requiring action
- **Info (Calm Blue):** `#3B82F6` (blue-500) - Informational, helpful

### Semantic Colors
- **Status Active:** `#10B981` (emerald-500) - Operational, working
- **Status Pending:** `#F59E0B` (amber-500) - Waiting, requires attention
- **Status Completed:** `#22C55E` (green-500) - Finished, successful
- **Status Cancelled:** `#6B7280` (gray-500) - Inactive, disabled

## Typography System

### Font Selection
**Primary Font:** Inter (Variable)
- **Rationale:** Highly legible, professional, excellent for healthcare interfaces
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- **Usage:** All body text, UI elements, forms

**Secondary Font:** System Font Stack
- **Rationale:** Fallback for maximum compatibility and performance
- **Stack:** `system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial`

### Typography Scale (Major Third - 1.25 ratio)
```
xs:    0.75rem  (12px)  - Captions, labels
sm:    0.875rem (14px)  - Small text, helper text
base:  1rem     (16px)  - Body text, default
lg:    1.125rem (18px)  - Small headings, emphasis
xl:    1.25rem  (20px)  - Medium headings
2xl:   1.5rem   (24px)  - Large headings
3xl:   1.875rem (30px)  - Section headings
4xl:   2.25rem  (36px)  - Page headings
5xl:   3rem     (48px)  - Hero headings
```

### Typography Hierarchy
- **H1 (Page Title):** 2.25rem, 700 weight, slate-900
- **H2 (Section):** 1.875rem, 600 weight, slate-800
- **H3 (Subsection):** 1.5rem, 600 weight, slate-800
- **H4 (Card Title):** 1.25rem, 600 weight, slate-700
- **Body:** 1rem, 400-500 weight, slate-700
- **Small:** 0.875rem, 400 weight, slate-600
- **Caption:** 0.75rem, 400 weight, slate-500

### Line Spacing & Readability
- **Body Text:** 1.5x line height (24px for 16px text)
- **Headings:** 1.2-1.3x line height
- **Line Length:** 45-75 characters optimal
- **Letter Spacing:** Tighter for headings (-0.02em), default for body, looser for small text (+0.01em)

## Effects & Interactions

### Animation Philosophy
**Principle:** Subtle, purposeful, healthcare-appropriate
- **Duration:** 150-250ms for UI interactions
- **Easing:** Ease-out for entrances, ease-in for exits
- **Purpose:** Feedback, guidance, not decoration

### Interaction States
- **Hover:** 150ms ease-out color transition, subtle shadow lift
- **Focus:** 2px solid blue-600 outline, 3px offset
- **Active:** 100ms scale(0.98) press effect
- **Loading:** Subtle pulse animation, not spinner overload
- **Success:** Checkmark with slide-in, green accent
- **Error:** Shake animation, red accent, clear messaging

### Micro-interactions
- **Button Press:** Scale 0.98, immediate feedback
- **Form Focus:** Border color change, subtle glow
- **Card Hover:** Lift effect, border emphasis
- **Loading:** Skeleton shimmer, not distracting spinners
- **Success/Error:** Slide-in messages, auto-dismiss after 3s

## Component Architecture

### Layout System
- **Grid:** 12-column responsive grid
- **Spacing:** 8px base unit (4, 8, 16, 24, 32, 48, 64, 96px)
- **Containers:** Max-width 1200px, fluid on mobile
- **Sidebar:** 260px default, collapsible to 72px

### Component Variants
- **Primary:** Full color, high emphasis (main actions)
- **Secondary:** Outline, medium emphasis (secondary actions)
- **Tertiary:** Text only, low emphasis (navigation, utilities)
- **Ghost:** Minimal, for toolbars and dense interfaces
- **Destructive:** Red variant for dangerous actions

### Form Design
- **Labels:** Above inputs, required indicator (*)
- **Inputs:** 44px minimum height, clear borders
- **Validation:** Inline messages, color-coded
- **Error States:** Red border, error message below
- **Success States:** Green checkmark, subtle feedback

## Accessibility Standards

### WCAG AA Compliance
- **Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Touch Targets:** Minimum 44x44px
- **Keyboard Navigation:** Full tab order, visible focus states
- **Screen Reader:** Semantic HTML, ARIA labels where needed

### Healthcare-Specific Accessibility
- **High Contrast Mode:** Support for medical environments
- **Reduced Motion:** Respect user preferences
- **Clear Language:** Avoid medical jargon in UI text
- **Error Prevention:** Clear confirmation for critical actions

## Responsive Design

### Breakpoints
- **Mobile:** 0-640px - Single column, simplified navigation
- **Tablet:** 641-1024px - 2-3 columns, sidebar optional
- **Desktop:** 1025px+ - Full layout, multi-panel views

### Mobile-First Approach
- **Touch Targets:** 44px minimum on all devices
- **Navigation:** Bottom navigation on mobile
- **Forms:** Stacked fields, larger tap targets
- **Data Display:** Cards instead of tables on small screens

## Brand Integration

### Healthcare Branding Elements
- **Logo Placement:** Top-left, consistent across all views
- **Color Consistency:** Primary blue used for CTAs and key actions
- **Typography:** Professional, legible fonts throughout
- **Imagery:** Healthcare-related, but not clinical or intimidating

### Trust Indicators
- **Security Badges:** SSL, HIPAA compliance indicators
- **Professional Imagery:** Healthcare professionals, clean environments
- **Clear Communication:** Direct, reassuring language
- **Error Handling:** Helpful, non-alarming error messages

## Performance Considerations

### Healthcare Environment Constraints
- **Loading Speed:** Critical for medical workflows
- **Offline Support:** Graceful degradation when possible
- **Data Efficiency:** Minimize unnecessary data transfers
- **Caching:** Strategic caching for frequently accessed data

### Optimization Strategies
- **Image Optimization:** WebP format, appropriate compression
- **Code Splitting:** Route-based and component-based
- **Bundle Size:** Keep under 2MB for initial load
- **Font Loading:** Preload critical fonts, fallback fonts

## Implementation Guidelines

### Development Standards
- **Component Library:** Use shadcn/ui components with healthcare customization
- **CSS-in-JS:** Tailwind CSS with custom healthcare color palette
- **State Management:** Zustand for global state, local state for components
- **Testing:** Accessibility testing, responsive testing, performance testing

### Code Organization
- **Components:** `/components/ui/` for base components, `/components/dashboard/` for business logic
- **Styles:** Global styles in `globals.css`, component styles inline
- **Utilities:** `/lib/utils.ts` for shared functions
- **Types:** TypeScript interfaces for all props and data structures

### Quality Assurance
- **Accessibility Testing:** axe-core, manual keyboard testing
- **Cross-Browser Testing:** Chrome, Firefox, Safari, Edge
- **Performance Testing:** Lighthouse, Core Web Vitals monitoring
- **User Testing:** Healthcare professional feedback sessions

## Anti-Patterns to Avoid

### Healthcare Interface Pitfalls
- **❌ Overly Clinical:** Don't make it look like a medical device interface
- **❌ Complex Navigation:** Keep workflows simple and direct
- **❌ Dense Information:** Use whitespace and clear hierarchy
- **❌ Generic SaaS:** Avoid typical SaaS blue/purple gradients
- **❌ Slow Loading:** Healthcare workflows require speed
- **❌ Poor Contrast:** Medical environments need high visibility
- **❌ Complex Animations:** Keep animations subtle and purposeful

### Technical Anti-Patterns
- **❌ Hard-coded Colors:** Use CSS variables for theming
- **❌ Inline Styles:** Prefer Tailwind classes
- **❌ Large Images:** Optimize all visual assets
- **❌ Blocking JavaScript:** Non-critical JS should be async
- **❌ Poor Error Handling:** Always provide clear recovery paths

## Success Metrics

### User Experience Metrics
- **Task Completion Rate:** 95%+ for core workflows
- **Time to Complete:** Under 2 minutes for common tasks
- **Error Rate:** Less than 1% for critical operations
- **User Satisfaction:** 4.5/5 rating from healthcare users

### Technical Metrics
- **Page Load Time:** Under 2 seconds initial load
- **Core Web Vitals:** All "Good" scores
- **Accessibility Score:** 100% WCAG AA compliance
- **Mobile Performance:** 90+ Lighthouse score

## Version Control & Updates

### Design System Versioning
- **Major Updates:** Breaking changes to components or colors
- **Minor Updates:** New components, color additions
- **Patch Updates:** Bug fixes, accessibility improvements

### Change Management
- **Documentation:** Update this file for all changes
- **Communication:** Notify development team of updates
- **Testing:** Regression testing for all changes
- **Rollback:** Maintain ability to revert to previous versions

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Maintained By:** CareOps Design Team