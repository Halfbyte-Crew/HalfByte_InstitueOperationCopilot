# UI/UX Standards and Guidelines - EduPilot

## 1. Design Principles
1. **Clarity & Density**: Clean enterprise admin aesthetic with balanced white-space and high information legibility.
2. **Predictable Navigation**: Consistent left sidebar with role-aware navigational links, fixed top header with user profile, breadcrumbs, and notification badges.
3. **Action Feedback**: Every user interaction must produce distinct feedback (skeleton loading, spinner in buttons, toast notifications, error alerts).
4. **No Decorative Bloat**: Functional, accessible, and high-performance UI without distracting multi-second animations.

## 2. Color Palette & Typography
- **Primary Brand**: Slate & Indigo (`slate-900`, `indigo-600`, `indigo-700`)
- **Accents**:
  - Success / Active: Emerald (`emerald-600`, `emerald-50`)
  - Warning / At-Risk: Amber (`amber-500`, `amber-50`)
  - Error / Overdue: Rose / Red (`rose-600`, `rose-50`)
  - Neutral / Background: Slate (`slate-50`, `slate-100`, `slate-200`, `slate-700`)
- **Typography**: Inter / System sans-serif with strict scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`).

## 3. Standard Component Behaviors
- **Buttons**:
  - Primary, Secondary, Danger, Ghost variants.
  - Automatic `disabled` state with spinner when `isLoading={true}`.
- **Data Tables**:
  - Paged, sortable columns, responsive horizontal scrolling on small viewports.
  - Built-in EmptyState display when datasets are empty.
- **Forms**:
  - Visible label, inline validation errors, clear help text.
  - Prevent duplicate submits on form submission.
- **Modals & Dialogs**:
  - Backdrop blur, ESC key dismiss, trapped focus, explicit cancel / confirm actions.

## 4. State Representation
- **Loading State**: Content skeletons for tables and metric cards; spinner inside buttons for inline actions.
- **Empty State**: Friendly illustration or icon, explanatory heading, and clear primary call-to-action button.
- **Error State**: Non-blocking toast for transient errors; persistent alert banner for critical blocking errors with retry action.
- **Unauthorized State**: Clear message explaining lack of permissions without exposing forbidden underlying data.
