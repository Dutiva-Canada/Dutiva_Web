-- 0188: one auto-provisioned paper book per user.
--
-- InvestDataProvider seeds a 'Paper book' account on a user's first
-- authorized visit. Two tabs racing can both observe zero accounts before
-- either insert lands, double-seeding the user. A partial unique index on
-- the `seeded` marker makes the seed idempotent: the loser gets 23505,
-- reloads, and picks up the winner's book. User-created accounts never set
-- the flag, so multiple user-named paper books stay allowed.

ALTER TABLE public.invest_accounts
  ADD COLUMN IF NOT EXISTS seeded boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.invest_accounts.seeded IS
  'Auto-provisioned first-run account — one per user (0188).';

CREATE UNIQUE INDEX IF NOT EXISTS invest_accounts_seed_unique
  ON public.invest_accounts (user_id)
  WHERE seeded;
