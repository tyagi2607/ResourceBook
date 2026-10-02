# 01 — Getting started

## What you need

- **Node.js** (LTS) — JavaScript runtime that runs the Next.js web app  
- **npm** — comes with Node; installs packages listed in `package.json`  
- A code editor (Cursor / VS Code)

Check versions in a terminal:

```powershell
node -v
npm -v
```

## Install dependencies (one-time per clone)

From the repo root (`ResourceBook`):

```powershell
npm install
```

This reads `package.json` / `package-lock.json` and fills `node_modules/` (ignored by git).

## Run the site locally

```powershell
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (catch TypeScript errors) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint checks |

## What you should see after Step 1 (scaffold)

- Home page with **ResourceBook** branding and **Explore Gold**
- Top nav: Gold, Silver, Copper, Uranium, Oil, Gas, Battery Metals
- Hover **Gold** → Overview / Physical / Companies
- Theme toggle (top right): cycles system → light → dark
- Non-gold hubs → “Coming soon” stubs
- Footer disclaimer

## Mental model (for data folks)

| Concept | Rough database analogy |
| --- | --- |
| A **page** (`page.tsx`) | A report / dashboard view |
| A **layout** (`layout.tsx`) | Shared chrome around every report |
| A **component** | A reusable chart widget or table block |
| `lib/commodities.ts` | A small dimension table for nav |
| `npm run dev` | Running a local API + UI together |

Next: [02 — Project structure](./02-project-structure.md)
