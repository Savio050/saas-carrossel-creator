---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Use when: designing pages, dashboards, components, choosing color schemes, typography, reviewing UI code for accessibility, implementing navigation, animations, or responsive behavior. Triggers: 'build a landing page', 'design dashboard', 'create component', 'choose style', 'review UX', 'fix accessibility', 'make this look professional', 'add dark mode', 'add charts'. Covers 67 styles (Glassmorphism, Minimalism, Brutalism, etc.), 161 color palettes, 57 font pairings, 99 UX guidelines across Next.js, React, Tailwind, shadcn/ui."
metadata:
  version: 2.0.0
  source: nextlevelbuilder/ui-ux-pro-max-skill
---

# UI/UX Pro Max — Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 67 UI styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across technology stacks including Next.js, React, Tailwind, shadcn/ui.

## When to Apply

### Must Use
- Designing new pages (Landing Page, Dashboard, Admin, SaaS)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)

### Recommended
- UI looks "not professional enough" but the reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Building design systems or reusable component libraries

### Skip
- Pure backend logic development
- Only involving API or database design
- Infrastructure or DevOps work

---

## CarrosselCreator Design Context

When working on the CarrosselCreator platform, apply these specific design rules:

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui

**Established Design System:**
- Background: `#08080f` cinematic dark
- Mesh gradients: `radial-gradient(ellipse at 15% 25%, rgba(99,102,241,0.06)...), rgba(16,185,129,0.04)`
- Glassmorphism panels: `bg-white/[0.04]`, `backdrop-blur-xl`, `border-white/[0.08]`
- Sidebar: `rgba(8,8,15,0.9)` + `backdropFilter: blur(24px)`
- Typography: `font-extralight` / `font-light` for large headings
- Accent: No orange — use indigo/emerald gradient system
- Satori images: 1080×1080px, Edge runtime, all styles inline, `display: flex` required

**Breakpoints:** 375px, 768px, 1024px, 1440px

---

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks |
|----------|----------|--------|-----------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav |
| 2 | Touch & Interaction | CRITICAL | Min 44×44px targets, Loading feedback |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, CLS < 0.1 |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons |
| 5 | Layout & Responsive | HIGH | Mobile-first, No horizontal scroll |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic tokens |
| 7 | Animation | MEDIUM | 150–300ms, transform/opacity only |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5 |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors |

---

## Quick Reference

### Accessibility (CRITICAL)
- `color-contrast` — Minimum 4.5:1 ratio for normal text
- `focus-states` — Visible focus rings on interactive elements (2–4px)
- `aria-labels` — aria-label for icon-only buttons
- `keyboard-nav` — Tab order matches visual order; full keyboard support
- `reduced-motion` — Respect prefers-reduced-motion

### Touch & Interaction (CRITICAL)
- `touch-target-size` — Min 44×44px (extend hit area beyond visual bounds if needed)
- `cursor-pointer` — Add cursor-pointer to all clickable elements (Web)
- `loading-buttons` — Disable button during async operations; show spinner
- `error-feedback` — Clear error messages near problem

### Performance (HIGH)
- `image-optimization` — Use WebP/AVIF, lazy load non-critical assets
- `font-loading` — Use font-display: swap/optional to avoid invisible text
- `bundle-splitting` — Split code by route/feature
- `progressive-loading` — Use skeleton screens for >1s operations

### Style Selection (HIGH)
- `no-emoji-icons` — Use SVG icons (Lucide, Heroicons), not emojis
- `color-palette-from-product` — Choose palette from product/industry
- `effects-match-style` — Shadows, blur, radius aligned with chosen style
- `primary-action` — Each screen should have only one primary CTA

### Layout & Responsive (HIGH)
- `viewport-meta` — width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` — Design mobile-first, then scale up
- `breakpoint-consistency` — 375 / 768 / 1024 / 1440
- `container-width` — Consistent max-width on desktop (max-w-6xl / 7xl)

### Typography & Color (MEDIUM)
- `line-height` — Use 1.5-1.75 for body text
- `font-scale` — Consistent type scale (12 14 16 18 24 32)
- `color-semantic` — Define semantic color tokens; not raw hex in components
- `weight-hierarchy` — Bold headings (600–700), Regular body (400)

### Animation (MEDIUM)
- `duration-timing` — 150–300ms for micro-interactions; avoid >500ms
- `transform-performance` — Use transform/opacity only; avoid animating width/height
- `loading-states` — Show skeleton or progress indicator when loading >300ms
- `motion-meaning` — Every animation must express cause-effect, not be decorative

### Forms & Feedback (MEDIUM)
- `input-labels` — Visible label per input (not placeholder-only)
- `error-placement` — Show error below the related field
- `submit-feedback` — Loading then success/error state on submit
- `confirmation-dialogs` — Confirm before destructive actions

### Navigation Patterns (HIGH)
- `bottom-nav-limit` — Bottom navigation max 5 items
- `back-behavior` — Back navigation must be predictable and consistent
- `deep-linking` — All key screens must be reachable via deep link / URL

---

## Available UI Styles (Select)

| # | Style | Best For |
|---|-------|---------|
| 1 | Minimalism & Swiss Style | Enterprise apps, dashboards |
| 2 | Glassmorphism | Modern SaaS, financial dashboards |
| 3 | Brutalism | Design portfolios, artistic projects |
| 4 | Dark Mode (OLED) | Night-mode apps, coding platforms |
| 5 | Aurora UI | Modern SaaS, creative agencies |
| 6 | Neubrutalism | Gen Z brands, startups |
| 7 | Bento Box Grid | Dashboards, product pages, portfolios |
| 8 | AI-Native UI | AI products, chatbots, copilots |
| 9 | Soft UI Evolution | Modern enterprise apps, SaaS |
| 10 | Gradient Mesh / Aurora Evolved | Hero sections, creative backgrounds |

---

## Design Workflow

### Step 1: Analyze User Requirements
Extract from user request:
- **Product type**: SaaS, Agency, E-commerce, Portfolio, Landing Page, etc.
- **Target audience**: age group, usage context
- **Style keywords**: minimal, dark, vibrant, glassmorphism, etc.
- **Stack**: Next.js, React, Tailwind, shadcn/ui (CarrosselCreator default)

### Step 2: Recommend Design System
Based on product type + style keywords, recommend:
- **Pattern**: Hero-Centric, Conversion-Optimized, Feature-Rich, Minimal & Direct
- **Style**: From the 67 available styles
- **Colors**: Semantic primary/secondary/accent + background + text tokens
- **Typography**: Heading + body font pairing with Google Fonts import
- **Key effects**: Blur, shadows, transitions, hover states
- **Anti-patterns**: What NOT to do for this product type

### Step 3: Implement with Best Practices
Apply platform-specific implementation guidelines:
- Use Tailwind utility classes, CSS variables, and semantic tokens
- Follow Next.js 15 App Router patterns
- Implement shadcn/ui components where applicable
- Ensure all interactive elements have proper states: default/hover/active/disabled/focus

### Step 4: Pre-Delivery Checklist
Before delivering UI code:
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from a consistent icon family
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] prefers-reduced-motion respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|---|---|
| Emoji as icons (🚀 ⚙️) | Use Lucide or Heroicons SVG |
| Raw hex colors in components | Use Tailwind tokens or CSS variables |
| Missing cursor-pointer | Add to all clickable elements |
| Hover-only interactions on mobile | Use click/tap as primary interaction |
| >5 items in bottom nav | Max 5, always with labels |
| Dense paragraphs on mobile | Line breaks every 2-3 lines |
| Links suppressing LinkedIn reach | Drop URLs in first comment |
| Generic purple gradient + Inter | Pick an intentional aesthetic direction |

---

## Typography Recommendations (Curated for Agencies/SaaS)

| Pairing | Mood | Use For |
|---------|------|---------|
| Inter + Inter | Clean, neutral | Default SaaS, dashboards |
| Geist + Geist Mono | Modern, technical | Dev tools, AI products |
| Playfair Display + Lato | Elegant, editorial | Premium agencies, luxury |
| Space Grotesk + DM Sans | Modern, geometric | Tech startups, creative SaaS |
| Bricolage Grotesque + Inter | Bold, distinctive | Portfolios, creative agencies |

---

## Related Skills
- **web-scraping** — extract competitor design patterns for inspiration
- **carousel-writer** — content for the designed carousel formats
