# Platform wiki (in-repo mirror)

This folder is a **full copy** of the [GitHub wiki](https://github.com/Dutiva-Canada/Dutiva_Web/wiki) for Dutiva Web. The wiki repo (`Dutiva_Web.wiki`) is the usual place to edit and publish; this mirror lives in the main repo so agents, reviewers, and offline readers can search it alongside `docs/` and the code.

**Start here:** [Home.md](Home.md) — platform overview and child-page index.

## Relationship to other docs

| Location | Role |
| --- | --- |
| **`docs/wiki/`** (this folder) | Broad architecture and module map — synced from GitHub wiki |
| **`docs/`** (siblings) | Load-bearing specs, facts, runbooks, handoffs — edited in-repo only |
| **`AGENTS.md` / `CONVENTIONS.md`** | Agent and engineering conventions at repo root |

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

**Last synced from wiki commit:** `05d6143` (2026-08-29 — live signup notifications, 18 kinds, migration 0093).
