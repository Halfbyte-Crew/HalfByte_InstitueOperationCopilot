# UI/UX Standards, Design Tokens & Guidelines - EduPilot

## 1. Design Philosophy
EduPilot's user interface is engineered for enterprise operational productivity. It adheres to four key principles:

1. **Information Density with High Legibility**: Screens present critical metrics, rosters, and financial tables cleanly without overwhelming users with unnecessary decorative clutter.
2. **Predictable Role-Aware Navigation**: Navigational sidebars dynamically filter options based on the authenticated user's role while preserving a consistent spatial layout.
3. **Continuous Action Feedback**: Every user interaction (saving a record, marking attendance, submitting an approval) produces immediate, deterministic UI feedback.
4. **State Completeness**: Every view explicitly implements Loading, Empty, Error, and Success states.

---

## 2. Design Tokens & Color Palette

EduPilot utilizes a tailored Tailwind CSS palette rooted in Slate neutrals and Indigo brand accents:

| Token Category | Tailwind Classes | Hex / RGB Representation | Usage Guideline |
|---|---|---|---|
| **Primary Brand** | `indigo-600`, `indigo-700` | `#4F46E5`, `#4338CA` | Primary buttons, active nav links, focus rings, key charts |
| **Dark Canvas** | `slate-900`, `slate-800` | `#0F172A`, `#1E293B` | Sidebar background, modal headers, primary typography |
| **Surface Background** | `slate-50`, `slate-100` | `#F8FAFC`, `#F1F5F9` | Main layout canvas, table hover rows, card containers |
| **Card Surface** | `white` | `#FFFFFF` | Metric stat cards, modal dialogs, data table wrappers |
| **Border / Divider** | `slate-200`, `slate-300` | `#E2E8F0`, `#CBD5E1` | Table borders, input outlines, card delimiters |
| **Success / Positive** | `emerald-600`, `emerald-50` | `#059669`, `#ECFDF5` | "Paid", "Present", "Active", approval confirmations |
| **Warning / At-Risk** | `amber-500`, `amber-50` | `#F59E0B`, `#FFFBEB` | "Late", "Pending Approval", low attendance (<75%) |
| **Danger / Critical** | `rose-600`, `rose-50` | `#E11D48`, `#FFF1F2` | "Absent", "Overdue", delete actions, error banners |
| **Neutral Informational**| `sky-600`, `sky-50` | `#0284C7`, `#F0F9FF` | Informational callouts, active batch badges, citation chips |

---

## 3. Typography Scale & Hierarchy

EduPilot relies on system-native font stacks prioritizing clarity and zero render delay:
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

| Text Scale | Tailwind Class | Weight | Application |
|---|---|---|---|
| **Display H1** | `text-2xl` (24px) | `font-bold` (700) | Top-level page headers (`PageHeader`) |
| **Section H2** | `text-lg` (18px) | `font-semibold` (600) | Card headings, modal titles, table section titles |
| **Subheading H3**| `text-base` (16px) | `font-medium` (500) | Filter labels, dialog subheaders |
| **Body Text** | `text-sm` (14px) | `font-normal` (400) | Data table cells, body copy, descriptions |
| **Small / Meta** | `text-xs` (12px) | `font-medium` (500) | Badges, timestamps, helper validation labels |

---

## 4. Reusable UI Components Specification

### 4.1 Button (`src/components/ui/Button.jsx`)
- **Variants**: `primary`, `secondary`, `danger`, `ghost`, `outline`.
- **States**: Default, Hover, Active, Disabled, Loading (`isLoading={true}`).
- **Behavior**: When loading, button automatically disables, renders an inline spinning SVG, and suppresses duplicate click submissions.

### 4.2 Data Table (`src/components/ui/Table.jsx`)
- **Structure**: Semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
- **Features**: Alternating row hover highlights, responsive horizontal scrolling wrapper (`overflow-x-auto`), customizable column widths.
- **Empty State Binding**: Renders a dedicated `EmptyState` component when records array length is zero.

### 4.3 Modal & Dialogs (`src/components/ui/Modal.jsx`)
- **Backdrop**: Semi-transparent darkened backdrop with blur effect (`bg-slate-900/50 backdrop-blur-sm`).
- **Dismissal**: Close button (`X`), clicking backdrop, or pressing the `Escape` key.
- **Accessibility**: Trapped keyboard focus and auto-focus on the primary form input.

### 4.4 Badge (`src/components/ui/Badge.jsx`)
- **Variants**: `success`, `warning`, `danger`, `info`, `neutral`.
- **Pill Shape**: Rounded border radius (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).

---

## 5. View State Representation Standards

Every data-driven view in EduPilot must implement the four canonical states:

```
┌────────────────────────────────────────────────────────┐
│                      VIEW STATE                        │
├─────────────────┬──────────────────┬───────────────────┤
│ 1. LOADING      │ Skeleton Cards / │ Pulsing placeholders│
│                 │ Table Skeleton   │ preserving layout │
├─────────────────┼──────────────────┼───────────────────┤
│ 2. SUCCESS      │ Data Render      │ Interactive tables│
│                 │                  │ & KPI metric cards│
├─────────────────┼──────────────────┼───────────────────┤
│ 3. EMPTY        │ EmptyState.jsx   │ Icon, description,│
│                 │                  │ Primary CTA button│
├─────────────────┼──────────────────┼───────────────────┤
│ 4. ERROR        │ ErrorMessage.jsx │ Alert banner with │
│                 │                  │ Retry button      │
└─────────────────┴──────────────────┴───────────────────┘
```

---

## 6. Role-Specific UX Paradigms

1. **Owner / Admin**: High overview cards, urgent conflict alerts banner, and dual-control approval actions.
2. **Counselor**: Pipeline stages rendered as status pills with rapid phone/email action buttons and follow-up checkboxes.
3. **Trainer**: Timetable timeline, quick-toggle attendance buttons (`P`, `A`, `L`, `E`) with instant color change, and student invite generator.
4. **Finance**: Aging buckets (Current, 1-30 days, 31-60 days, 60+ days) with instant payment recording dialog and printable receipt views.
5. **Student**: Visual attendance gauge ring, timetable cards with room numbers, and fee installment checklist.
