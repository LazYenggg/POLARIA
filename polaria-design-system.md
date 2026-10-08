# POLARIA E-LKPD — Global Design Rules

## Project

Interactive E-LKPD web application.

Stack:
- Next.js
- React
- TypeScript
- TSX
- CSS / Tailwind where appropriate
- Vercel deployment

## Design Source of Truth

The provided Canva/reference screenshots are authoritative.

Do not redesign approved pages.

The E-LKPD uses a portrait design composition based on approximately 1414 × 2000.

Pages should preserve the visual relationship of the reference design while remaining responsive.

## Typography

Large/display headings:
- Baloo

General text:
- Times New Roman

Do not replace them with generic UI fonts.

## Shared Visual System

Standard background:
- background.png

Standard header:
- fixed_header.png

Decorative classroom artwork:
- kids_and_teacher.png

The classroom artwork is decorative only:
- it stays above the background
- it stays behind content
- it must not cover text or form controls
- its size must remain controlled and proportional

## Navigation

There are two categories of navigation:

### Primary CTA
- play_button.png
- used on Page 1
- may be larger than normal navigation

### Standard Page Navigation
- backward_icon.png
- home_icon.png
- forward.png

These standard navigation icons must share one consistent sizing system throughout the E-LKPD.

Do not define unrelated navigation sizes on individual pages.

Use a shared component, shared class, or design token.

Desktop and mobile may have different global sizes, but all standard navigation icons must remain visually consistent within each breakpoint.

Preserve aspect ratio.

Do not distort the original artwork.

Remove unwanted raster white backgrounds only when necessary, without destroying meaningful white details inside the artwork.

## Responsive Design

Use one coherent E-LKPD design system.

Do not create a completely different mobile design for each page.

Desktop and mobile may have controlled breakpoint-specific adjustments.

Mobile must:
- avoid horizontal scrolling
- avoid unintended white gaps
- keep important content visible
- preserve visual hierarchy
- keep interactive controls usable

## Approved Pages

Page 1:
APPROVED / LOCKED

Page 2:
CLIENT APPROVED / LOCKED

Page 3:
APPROVED / LOCKED

Page 4:
CURRENTLY IMPLEMENTED

Do not modify approved pages unless explicitly instructed.

When a new page requires a change that would affect an approved page, ask before changing the approved page.

## Implementation Principle

Prefer reusable shared components and design tokens over page-specific duplicated CSS.

Do not fix a global consistency problem by adding another page-specific magic number.

When adjusting a shared visual element, inspect all pages using it before changing the implementation.

## Current Priority

Navigation consistency is a global concern.

Before implementing future pages, maintain:
- consistent navigation icon dimensions
- consistent spacing
- consistent hover/focus behavior
- consistent transparent-background treatment
- consistent responsive behavior