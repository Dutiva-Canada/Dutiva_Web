---
description: "After pushing to main, verify the Vercel production deployment lands"
trigger: always_on
---

# Vercel deploy check

**Whenever you push commits to `main`, do not report the work as shipped until
you have verified that the Vercel production deployment serving `dutiva.ca`
contains those commits.**

Deploy path: GitLab `origin` is source of truth → `Dutiva-Canada/Dutiva_Web`
on GitHub receives `mirror/*` squash-merge PRs → Vercel project
`dutiva-website` auto-deploys GitHub `main` to production.

After every push:

1. `git ls-remote github main` / `git fetch github main` — check whether
   GitHub `main` contains the pushed commits (`git merge-base --is-ancestor
   <sha> github/main`).
2. If the mirror has not propagated, push a `mirror/<slug>` branch to the
   `github` remote and let the mirror PR merge — or, if asked to deploy
   immediately, create a production deployment directly from that branch
   (`create_deployment` with `gitSource.ref` = the mirror branch,
   `target: "production"`).
3. Confirm the deployment reaches `READY` and is aliased to `dutiva.ca`
   (Vercel MCP `get_deployment`, or `list_deployments` filtered to
   production). A `BUILDING`/`QUEUED` state or a GitHub-only merge is not
   "deployed".
4. Report the deployment ID/URL. If production cannot be verified, say so
   explicitly — never claim it is live on `git push` alone.
