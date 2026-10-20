-- Keep one pending offer per issue when several offer paths run at once.
-- IssueClaim is created by 20261021000000_agent_platform, which sorts after
-- this folder, so a brand-new database does not have the table yet. Databases
-- that already had the table when this migration was added still get the index
-- here. Fresh databases get it from the follow-up migration.
DO $$
BEGIN
  IF to_regclass('"IssueClaim"') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "IssueClaim_one_pending_offer_per_bug_key"
    ON "IssueClaim"("bugId")
    WHERE "status" = 'offered' AND "releasedAt" IS NULL;
  END IF;
END $$;
