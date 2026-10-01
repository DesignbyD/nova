# NOVA design system

The live reference is the `/design` route (development only; it returns a 404 in production).

## Principles

- One memorable element: the four-point **nova star**. It appears in the wordmark, as the loading spinner and in empty/error states, and nowhere else.
- Everything around it is quiet: hairline borders, restrained radius, almost no shadow.
- Borders, dividers and labels exist only when they carry structure.
- Motion answers an action (open, confirm, load). Nothing animates on its own except the spinner.
- Copy is plain and specific. Errors say what happened and what to do; they never apologise or show raw error text.

## Colour (defined in `app/globals.css`)

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#EFF1EE` | Page background (cool mineral, not cream) |
| `paper-deep` | `#E4E8E3` | Footer, image wells, skeletons, hover fills |
| `surface` | `#FFFFFF` | Cards, inputs, overlays |
| `ink` / `ink-soft` | `#1B2130` / `#343C4E` | Text, primary buttons |
| `muted` | `#576070` | Secondary text (5.1:1 on `paper-deep`) |
| `line` | `#D3D8D2` | Decorative dividers |
| `edge` | `#868E84` | Control borders (3.2:1 on white, meets WCAG 1.4.11) |
| `accent` | `#4A2FE0` | The one accent: ultraviolet (7.6:1 on white) |
| `accent-soft` / `accent-deep` | `#E8E4FC` / `#2B1A99` | Tints and text on tints |
| `success` `warning` `danger` | with `-soft` backgrounds | Status only |

## Typography

- **Bricolage Grotesque** (variable, self-hosted): display, navigation, buttons, prices, forms.
- **Newsreader** (variable, self-hosted): descriptions, introductions, empty-state copy. Use `font-serif`.
- Scale: `text-display-xl`, `text-display-lg`, `text-display-md` (fluid, tightening tracking), `text-title`, `text-lead`, then Tailwind defaults.
- Keep line length under about 70 characters (`max-w-prose`).
- Prices use `tabular-nums`.

## Spacing and layout

- `Container` sets the max width (90rem) and the responsive gutter (`gutter-x`).
- `section-y` is the vertical rhythm between page sections.
- Radius: `rounded-control` (3px) for buttons and inputs, `rounded-panel` (8px) for cards and overlays, `rounded-full` for badges only.

## Components

`components/ui`: Button / ButtonLink, Spinner, NovaStar, TextField / TextArea / SelectField, Badge, Card, Alert, Skeleton / ProductCardSkeleton, EmptyState / ErrorState, Dialog / Drawer, Toast (`useToast`), Container, icons.
`components/shop`: ProductCard.
`components/layout`: Header, Footer, Logo, NavLinks, MobileMenu, SearchDialog, CartButton.

## Rules for new work

- Reuse a component before creating one. Add variants rather than one-off classes.
- Every async action uses `Button loading` so duplicate submissions are blocked.
- Every list/data view needs a loading (Skeleton), empty (EmptyState) and error (ErrorState) state.
- Never rely on colour alone to convey status.
- Overlays use `Dialog`/`Drawer` (native `<dialog>`: focus trap, Escape and inert background are built in).
