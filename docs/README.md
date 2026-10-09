# ResourceBook docs

Living documentation for building the portal. Read these in order when onboarding.

| Doc | What it covers |
| --- | --- |
| [01 — Getting started](./01-getting-started.md) | Install Node, run the app, first commands |
| [02 — Project structure](./02-project-structure.md) | Folders, App Router mental model, where to edit |
| [03 — Theme and navigation](./03-theme-and-navigation.md) | Light/dark/system theme + commodity hover menu |
| [04 — Commodity colors](./04-commodity-colors.md) | Per-commodity accent palette (gold, silver, copper, …) |
| [05 — Database setup](./05-database-setup.md) | Connect Supabase, create tables, load and verify seed data |
| [06 — Data model](./06-data-model.md) | Every table and column explained (data dictionary) |
| [07 — Gold Overview](./07-gold-overview.md) | `/gold` sections, data sources, freshness, how to edit content |
| [08 — Gold Overview data plan](./08-gold-overview-data-plan.md) | Per-datapoint plan: display, source, storage, refresh, citations, licensing (implemented; see "As built") |
| [09 — Data jobs](./09-data-jobs.md) | The Yahoo, FRED, and IMF scripts: how to run them, schedules, GitHub secrets, data-quality rules |
| [BUILD_LOG.md](./BUILD_LOG.md) | Step-by-step progress log (what we shipped when) |

**Product plan (decisions):** [`../PLAN.md`](../PLAN.md)
