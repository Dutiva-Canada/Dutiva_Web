-- 0246 — signal dismissed_at
--
-- Dismissal used to free the dedupe key instantly, so a hovering rule
-- re-emitted the identical signal on the very next sweep — "dismiss"
-- meant nothing. The column stamps when a signal was dismissed; the
-- sweep's dedupe read keeps the key suppressed for a re-arm window
-- (7 days) before the same hit can resurface.
--
-- Written by the app's setSignalStatus (dismiss stamps, reopen clears).
-- Rows dismissed before this column have no timestamp — they re-arm
-- immediately, which is the old behavior and safe.
--
-- Rollback (manual):
--   alter table public.invest_signals drop column if exists dismissed_at;

alter table public.invest_signals
  add column if not exists dismissed_at timestamptz;

comment on column public.invest_signals.dismissed_at is
  'When the user dismissed the signal. Suppresses the identical signal for the re-arm window; cleared when the status leaves dismissed.';
