-- Fresh databases reach this migration after IssueClaim exists.
CREATE UNIQUE INDEX IF NOT EXISTS "IssueClaim_one_pending_offer_per_bug_key"
ON "IssueClaim"("bugId")
WHERE "status" = 'offered' AND "releasedAt" IS NULL;
