/**
 * Paginated reads for PostgREST selects. Hosted Supabase silently caps an
 * un-ranged select at max_rows (1000) — no error, just a truncated result —
 * so a single .select() over a growing table is a latent truncation bug:
 * an org past the cap would have its compliance score computed from an
 * arbitrary slice of its rows (and the write-on-read snapshot would persist
 * that wrong number over the scheduled job's correct one). Every list the
 * score is computed from reads through this instead. The snapshot edge
 * function carries its own copy of the same loop (record-score-snapshots/
 * index.ts) — it cannot import across the runtime boundary.
 */

export const SUPABASE_PAGE_SIZE = 1000

interface PageResult<T> {
  data: T[] | null
  error: { code?: string; message?: string } | null
}

/**
 * Fetch every row of a select, page by page, until a short page.
 *
 * The `page` callback must rebuild the query for the given range AND apply
 * a deterministic total order, tie-broken on a unique column (e.g.
 * `.order('name').order('id')`) — with ties left unbroken, rows can repeat
 * or vanish across page boundaries.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await page(from, from + SUPABASE_PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if ((data ?? []).length < SUPABASE_PAGE_SIZE) return rows
  }
}
