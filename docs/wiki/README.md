# Platform wiki (in-repo mirror)

This folder is a **full copy** of the [GitHub wiki](https://github.com/Dutiva-Canada/Dutiva_Web/wiki) for Dutiva Web. The wiki repo (`Dutiva_Web.wiki`) is the usual place to edit and publish; this mirror lives in the main repo so agents, reviewers, and offline readers can search it alongside `docs/` and the code.

**Start here:** [Home.md](Home.md) — platform overview and child-page index.

## Relationship to other docs

| Location                           | Role                                                                |
| ---------------------------------- | ------------------------------------------------------------------- |
| **`docs/wiki/`** (this folder)     | Broad architecture and module map — synced from GitHub wiki         |
| **`docs/`** (siblings)             | Load-bearing specs, facts, runbooks, handoffs — edited in-repo only |
| **`AGENTS.md` / `CONVENTIONS.md`** | Agent and engineering conventions at repo root                      |

Where this wiki disagrees with **`docs/CANONICAL_FACTS.md`** or the code on a load-bearing fact, **the code and CANONICAL_FACTS win** — same rule as everywhere else in the repo.

## Sync

From a sibling clone of the wiki repo (default: `../Dutiva_Web-wiki`):

```bash
# Pull latest wiki from GitHub, then copy into docs/wiki/
npm run wiki:sync -- --pull

# Copy only (wiki clone already up to date)
npm run wiki:sync
```

After editing pages **in this repo**, push the mirror back to the GitHub wiki clone, then commit and push there:

```bash
npm run wiki:sync -- --push
cd ../Dutiva_Web-wiki && git status && git commit -am "Sync from main repo" && git push
```

Set `WIKI_REPO` if your wiki clone is not at `../Dutiva_Web-wiki`.

This folder’s **`README.md`** is repo-only (not copied to GitHub wiki). All other `*.md` files mirror the wiki one-to-one.

**Last synced to wiki commit:** `7aa4b3a` (pushed 2026-10-09 — portal assistants, chat widgets, advisor evaluation layer; Woodpecker CI correction; counts as of that commit: 45 edge functions, 71 SEO pages / 142 localized URLs, 209 migrations, 19 monitored law pages — superseded by the refresh below).

**In-repo refresh (pending push):** mirror updated in-repo after the `/app` → `/workspace` and Health → Wellness renames and the live-database regeneration — current counts: 46 edge functions, 300 tables / 687 RLS policies / 206 RPCs, 234 migrations, 72 SEO pages / 144 localized URLs, 68 aggregated message modules (110 leaf files), 20 monitored law pages, 8 providers, monthly Stripe billing live (OA11). Run `npm run wiki:sync -- --push` from a wiki clone to publish.
