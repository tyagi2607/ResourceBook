# 03 — Theme and navigation

## Theme (system + toggle)

**Files**

- `src/components/providers/ThemeProvider.tsx` — stores choice, applies `.dark` on `<html>`
- `src/components/layout/ThemeToggle.tsx` — button that cycles modes
- `src/app/globals.css` — color tokens for light/dark

**Modes**

| Stored value | Behavior |
| --- | --- |
| `system` | Follow OS light/dark (`prefers-color-scheme`) |
| `light` | Force light |
| `dark` | Force dark |

Preference is saved in `localStorage` under key `resourcebook-theme`.

**Why `.dark` on `<html>`?**  
Tailwind’s `dark:` classes look for that class (see `@custom-variant dark` in `globals.css`). That lets the toggle override the OS when needed.

## Commodity navigation

**Data:** `src/lib/commodities.ts`  
**UI:** `src/components/layout/CommodityNav.tsx` inside `SiteHeader`

| Action | Result |
| --- | --- |
| Click **Gold** | Go to `/gold` (Overview) |
| Hover **Gold** (desktop) | Simple dropdown: Overview, Physical, Companies |
| Tap chevron (mobile) | Same dropdown without leaving the page |
| Click **Silver** (etc.) | Stub “Coming soon” page |

This is intentionally **not** a 3-column mega-menu (see PLAN.md).

## Changing the menu later

1. Edit `COMMODITIES` or `GOLD_NAV_LINKS` in `src/lib/commodities.ts`
2. Add a matching `page.tsx` under `src/app/...` if the link should be real

## Related PLAN decisions

- Theme: system preference + toggle  
- Nav: click = hub home; hover = single page list  
- Non-gold hubs: stubs so the nav never 404s  

Back: [docs index](./README.md)
