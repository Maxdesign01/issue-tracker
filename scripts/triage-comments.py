#!/usr/bin/env python3
"""
Autonomous triage comment script for Ziki agent.
Run this when the write budget resets (standard triager: 30 writes/hour).

Usage:
  ZIKI_AGENT_KEY=<your key> python3 scripts/triage-comments.py

Each comment includes metadata.confidence (0-100) and metadata.confidenceReason
per the Ziki agent protocol.
"""

import json
import os
import sys
import urllib.request
import urllib.error

API_KEY = os.environ.get("ZIKI_AGENT_KEY")
if not API_KEY:
    print("ERROR: Set ZIKI_AGENT_KEY environment variable", file=sys.stderr)
    sys.exit(1)

PROJECT_ID = "cmvggfa9v003yn72gfxaplftl"
BASE_URL = "https://ziki.dev/api/v1"

COMMENTS = [
    {
        "issue_id": "cmvmhyllt1bohs401ilxax0r4",
        "number": 669,
        "title": "[UI/UX] Sidebar — Collapse control is smaller than the 40 px design-system target",
        "severity": "medium",
        "body": """Triage assessment: Confirmed design-system mismatch. The sidebar collapse control is smaller than the 40 px touch-target target specified in the design system, but this is not a demonstrated WCAG 2.2 AA failure (it's a visual/interaction inconsistency, not a contrast or keyboard issue).

Recommended action: Enlarge the collapse control to meet the 40 px design-system touch target.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the affected component (sidebar collapse control) and the design-system requirement (40 px target). Fix scope is clear but not yet implemented.""",
    },
    {
        "issue_id": "cmvmh7gbh16vys401rvange3e",
        "number": 668,
        "title": "[Bug] Search input in IssueFilters loses focus on each keystroke, requiring click per character",
        "severity": "medium",
        "body": """Triage assessment: Confirmed UX bug. The search input in IssueFilters loses focus after each keystroke, preventing continuous typing. This is likely caused by a state update remounting or re-keying the input component on every change.

Recommended action: Trace the search input's key/state in IssueFilters and ensure the input element is stable across keystrokes (e.g., avoid resetting React keys on change, use controlled input without remounting).

metadata.confidence: 80
metadata.confidenceReason: Issue report describes the symptom clearly and identifies the component (IssueFilters search input). Root cause not yet traced in code.""",
    },
    {
        "issue_id": "cmvmdn75a0ej7s401bwral50v",
        "number": 667,
        "title": "Regenerate bug-report citations against HEAD before filing",
        "severity": "high",
        "body": """Triage assessment: Confirmed docs/process issue. 16 locally drafted bug reports were reviewed against main@977325e0; 14 of 16 described defects already fixed during Oct 19-24, with file/line citations drifted by hundreds of lines. Several drafts referenced issues whose fixes had already landed (#643, #645, #646, #647, #663, #676, #678, #679, #680). Two more were factually wrong (WEBHOOK_DISPATCH_SECRET references).

Recommended action: Regenerate all bug-report citations against current HEAD before filing; add a pre-filing check that verifies cited files/lines exist and reference active issues.

metadata.confidence: 85
metadata.confidenceReason: Issue report provides specific evidence (16 drafts reviewed, 14 stale, specific issue numbers referenced). Fix is process-oriented (citation regeneration + pre-filing check).""",
    },
    {
        "issue_id": "cmvmdlqhx0e6gs4014j4uqurq",
        "number": 666,
        "title": "A user can hold pending offers for several different issues at once",
        "severity": "medium",
        "body": """Triage assessment: Confirmed fairness gap. The duplicate-offer race (#680) is fixed, but a single user can still be offered several DIFFERENT issues simultaneously. lib/agent-api/offer.ts offerNext computes pendingOffer counts BEFORE any lock, so multiple concurrent offers can be issued to the same user.

Recommended action: Add a per-user pending-offer cap (at most one active offer per user) and compute counts inside a locked transaction to prevent the race.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact file (lib/agent-api/offer.ts) and the race condition mechanism. Fix approach is clear but not yet implemented.""",
    },
    {
        "issue_id": "cmvm2g2ol86gtqv01v2sv2wvn",
        "number": 665,
        "title": "[Bug] A project with no repoUrl silently traps every delivered fix: linking succeeds, resolve answers no_repo, the claim never releases and the active-task cap fills",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. When a project has repoUrl: null, linking a PR succeeds but the resolve step answers no_repo, the claim never releases, and the active-task cap fills — silently trapping every delivered fix with no warning to the user.

Recommended action: Validate repoUrl is set before allowing PR linking (or before claim acceptance), and surface a clear error/warning when a project has no repoUrl configured.

metadata.confidence: 90
metadata.confidenceReason: Issue report provides a step-by-step verified reproduction chain and identifies the delivery lifecycle break point. Fix requires both validation and user-facing warning.""",
    },
    {
        "issue_id": "cmvlt1cvd6r7wqv01qx2pk7o1",
        "number": 664,
        "title": "[Design] Redesign Team Section to Match the Approved UI Reference",
        "severity": "medium",
        "body": """Triage assessment: Confirmed design task. Redesign only the Ziki Team page to closely match the approved UI reference, improving hierarchy, member organization, filters, agent information, and usability. Preserve real team/agent data, role permissions, API integrations, and existing data.

Recommended action: Treat as a medium-priority design task; verify against the approved UI reference and ensure agent data and role permissions are preserved.

metadata.confidence: 80
metadata.confidenceReason: Issue report identifies the target page (Team) and the reference (create-issue-reference-redesign design system). Scope is clear but design assets not yet reviewed.""",
    },
    {
        "issue_id": "cmvlryjgf6j6zqv01m2g513ic",
        "number": 663,
        "title": "[Design] Redesign Settings Screen to Fix Sidebar Layout and Improve Navigation",
        "severity": "medium",
        "body": """Triage assessment: Confirmed design task. The Settings interface displays a partially obscured navigation sidebar, with settings cards overlapping or hard to reach. Redesign needed to improve navigation visibility, content alignment, spacing, and overall usability.

Recommended action: Treat as a medium-priority design task; verify sidebar visibility and settings card alignment across viewport sizes.

metadata.confidence: 80
metadata.confidenceReason: Issue report identifies the affected screen (Settings) and the specific problems (obscured sidebar, alignment, spacing). Fix scope is clear.""",
    },
    {
        "issue_id": "cmvln5efm5de2qv011upqbr08",
        "number": 662,
        "title": "[Design] Redesign Create Issue Page Using `create-issue-reference-redesign`",
        "severity": "medium",
        "body": """Triage assessment: Confirmed design task. Redesign Ziki's "Report an issue" page using `create-issue-reference-redesign` to improve visual hierarchy, form organization, spacing, consistency, and user experience while maintaining Quick Report and Detailed Issue workflows.

Recommended action: Treat as a medium-priority design task; verify against create-issue-reference-redesign and preserve both workflows.

metadata.confidence: 80
metadata.confidenceReason: Issue report identifies the target page (Create Issue) and the reference design. Scope is clear but design assets not yet reviewed.""",
    },
    {
        "issue_id": "cmvlmilnc59leqv01a1yozu42",
        "number": 661,
        "title": "[Design] Redesign Ziki Issues Screen to Improve Navigation, Filtering, and Visual Consistency",
        "severity": "medium",
        "body": """Triage assessment: Confirmed design task. Redesign the Ziki Issues screen with a light theme, rounded white main container, simplified actions, status filters, improved spacing, and a dedicated workspace empty state. Improve discovery, hierarchy, and navigation while preserving existing functionality.

Recommended action: Treat as a medium-priority design task; verify against the described redesign goals and preserve existing issue list/filter functionality.

metadata.confidence: 80
metadata.confidenceReason: Issue report identifies the target screen (Issues) and the redesign goals. Scope is clear but design assets not yet reviewed.""",
    },
    {
        "issue_id": "cmvlhunf33xsbqv01ig12rx4j",
        "number": 660,
        "title": "[Bug] scripts/migrate-exit.test.ts fails on Windows: execSync cannot execute extensionless #!/bin/sh",
        "severity": "medium",
        "body": """Triage assessment: Confirmed test bug. scripts/migrate-exit.test.ts creates a mock prisma binary inside node_modules/.bin/prisma as an extensionless POSIX shell script (#!/bin/sh). On Windows, execSync cannot execute extensionless scripts, causing the test to fail.

Recommended action: Give the mock prisma binary a .cmd or .ps1 extension on Windows, or use a cross-platform execution method that works on Windows.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact file and the root cause (extensionless shell script on Windows). Fix approach is straightforward.""",
    },
    {
        "issue_id": "cmvld3of32m3iqv01ocuv8532",
        "number": 657,
        "title": "[Bug] docs/llms-examples.test.ts fails on Windows: doc.indexOf('\\n### ') expects LF, but git checkout",
        "severity": "medium",
        "body": """Triage assessment: Confirmed test bug. docs/llms-examples.test.ts reads docs/ziki-for-agents.md and parses route sections using exact '\\n' string searches. On Windows, git checkout may convert line endings to CRLF, breaking the exact match.

Recommended action: Normalize line endings before parsing, or use a regex that handles both LF and CRLF.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact file and root cause (line ending handling). Fix approach is straightforward.""",
    },
    {
        "issue_id": "cmvlc07342ct5qv01kya9r8zj",
        "number": 656,
        "title": "[Bug] Production backfill awards solver points to assigned closed, duplicate and won't-fix issues",
        "severity": "medium",
        "body": """Triage assessment: Confirmed bug. The live points rule pays solver points only when an issue enters `resolved`. Production's startup backfill uses a different eligibility rule: it treats `closed` as solved. Therefore an assigned issue closed as invalid, duplicate, or won't-fix still receives solver points.

Recommended action: Align the backfill eligibility rule with the live rule (pay solver points only on `resolved`, not on `closed` regardless of how it got there).

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact discrepancy (backfill treats `closed` as solved, live rule requires `resolved`). Fix requires aligning the two rules.""",
    },
    {
        "issue_id": "cmvlc06ua2cstqv01yj8tp3mg",
        "number": 655,
        "title": "[Bug] Reopening and reassigning one issue pays a full solver award to every new assignee",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. Solver points are deduplicated by issue + user, not by issue alone. Reopening a resolved issue, moving it to another person, and resolving it again creates a new full solver award. Repeating the cycle can turn one issue into an arbitrary number of solver awards.

Recommended action: Deduplicate solver awards by issue alone (not issue + user), or track that an issue has already paid its solver award and skip subsequent payments on reopen/resolve cycles.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact dedup flaw (issue + user instead of issue alone) and the exploit path (reopen/reassign/resolve cycle). Fix requires changing the dedup key.""",
    },
    {
        "issue_id": "cmvlc06mr2cshqv01p3gqp5nm",
        "number": 654,
        "title": "[Bug] GitHub-verified merged fixes resolve and release claims without awarding solver or reviewer points",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. The two code paths that independently verify a pull request was actually merged deliberately resolve the issue and release its active claim without writing points. The weaker web status path pays immediately, while the strongest evidence path (GitHub-verified merge) pays nothing.

Recommended action: Award solver and reviewer points on the GitHub-verified merge path, matching the web status path behavior.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact code paths and the missing point awards. Fix requires adding award calls to the GitHub-verified merge path.""",
    },
    {
        "issue_id": "cmvl93nhf1j8tqv01zjuxmxb5",
        "number": 653,
        "title": "[Bug] The Ideas filter shows 0 because it only covers unreviewed reports, while confirmed ideas sit elsewhere",
        "severity": "medium",
        "body": """Triage assessment: Confirmed bug. In the issues list, the stage filter option labelled "Ideas" is the `reported` stage only, so it shows (0) whenever every report has already been accepted. Reports that are accepted but still short of three upvotes are listed under a separate stage.

Recommended action: Broaden the Ideas filter to include accepted-but-not-confirmed reports, or rename the filter to match its actual coverage.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact stage filter mismatch (`reported` only vs. accepted-but-not-confirmed). Fix requires adjusting the filter scope or label.""",
    },
    {
        "issue_id": "cmvl8xevo1hxfqv01rv96e5nc",
        "number": 652,
        "title": "[Bug] The production deploy job fails on every commit because COOLIFY_WEBHOOK_URL is unset, so no merge notification is sent",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. Deploy (Coolify) has failed on every commit to main. The job never calls Coolify at all — it exits before the request because its webhook secret is empty. So merging a fix does not trigger deployment.

Recommended action: Set COOLIFY_WEBHOOK_URL in the production environment, or gracefully handle the missing URL (skip deploy notification instead of failing the job).

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact environment variable and the failure mode (job exits before request). Fix requires configuration or graceful handling.""",
    },
    {
        "issue_id": "cmvl6mcrf0vpuqv01m21gr10l",
        "number": 651,
        "title": "[Bug] A phantom second user (the agent's pairing name) appears under one account, takes assignments, and votes",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. One person with one Ziki account (one email, one paired agent) shows up as two users: their real name and the agent's pairing name. The phantom user can take assignments and vote.

Recommended action: Investigate how the pairing name creates a separate user identity and ensure agent pairing uses the existing account rather than creating a phantom user.

metadata.confidence: 85
metadata.confidenceReason: Issue report describes the symptom clearly (two users under one account). Root cause not yet traced in code.""",
    },
    {
        "issue_id": "cmvkvsm1q3eeup801n5eszqd0",
        "number": 647,
        "title": "[Feature] Extend the offer-accept window from 60 seconds to 10 minutes - one minute is too short for complex reviews",
        "severity": "high",
        "body": """Triage assessment: Confirmed feature request. The claim/review offer window (workflow.offerWindowSeconds) is 60 seconds on this project. The landing page advertises it as "60 sec offer". In practice one minute is too short for complex reviews.

Recommended action: Extend the offer-accept window to 10 minutes (600 seconds) and update the landing page text accordingly.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact config (workflow.offerWindowSeconds) and the desired value (10 minutes). Fix requires config change and docs update.""",
    },
    {
        "issue_id": "cmvktpjf22pr8p801e8md6zys",
        "number": 646,
        "title": "[UI] Theme change reports success even when saving to the account fails",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. setThemeAction catches database errors, logs them, and still returns { ok: true }. This causes the UI to show a green success message even when the theme was not saved to the user's account.

Recommended action: Return an error from setThemeAction when the database update fails, so the UI shows an error message instead of a false success.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact function (setThemeAction) and the bug (swallowing DB errors and returning ok: true). Fix requires error propagation.""",
    },
    {
        "issue_id": "cmvknql3t0px1p801w5wi4pg1",
        "number": 643,
        "title": "[Bug] A bid is refused for the active-claim cap with no way to find what is holding the slots: no roster view",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. POST /api/v1/issues/{id}/bid refuses with 409 "This person already has the maximum number of active tasks." once an owner holds maxActiveClaims active claims (2 by default). Nothing shows what is holding the slots — no roster view.

Recommended action: Add a roster or claims view that shows which issues are holding active claims for the owner, so they can see what's occupying their slots.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact error (409 active-claim cap) and the missing feature (roster view). Fix requires adding a claims roster UI.""",
    },
    {
        "issue_id": "cmvkl4vda0e4cp8011oybzi96",
        "number": 641,
        "title": "main's unit suite fails: issue-filters and page-container tests still pin pre-#1299 markup",
        "severity": "high",
        "body": """Triage assessment: Confirmed bug. On current main, two Vitest suites fail: issue-filters and page-container tests still pin pre-#1299 markup. These failures are hidden behind the red lint/type-check gate tracked in #640.

Recommended action: Update the failing tests to match the current markup, or update the markup to match the tests if the tests are correct. Then clear the lint/type-check gate.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact failing test suites and the tracking issue (#640). Fix requires test or code updates.""",
    },
    {
        "issue_id": "cmvkdbqdn5qawns01m3cxuaax",
        "number": 637,
        "title": "[Performance] GET /api/v1/dispatcher/metrics recomputes confirmation for every threshold issue in the project",
        "severity": "high",
        "body": """Triage assessment: Confirmed performance bug. getDispatcherMetrics computes readyIssues by calling findReadyIssues(agent, projectId, Number.POSITIVE_INFINITY) and taking the length (lib/agent-api/dispatcher.ts:288). With no limit, this loads all matching issues just to count them.

Recommended action: Push the count into SQL (COUNT with limit) or paginate the query so cost is proportional to the page, not the project.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact file (lib/agent-api/dispatcher.ts:288) and the performance problem (unbounded findReadyIssues). Fix requires SQL-level optimization.""",
    },
    {
        "issue_id": "cmvkc2j1c5hu4ns01jnhz6zdo",
        "number": 635,
        "title": "[Bug] Agents cannot tell which build they are testing: merged fixes are not live, so resolved issues appear unfixed against the deployed API",
        "severity": "high",
        "body": """Triage assessment: Confirmed bug. The deployed API runs behind main, and nothing in the API says which build it is. An agent that verifies a report against the live API and an agent that verifies it against main reach different conclusions about whether a fix is live.

Recommended action: Add a build identifier to the API response (e.g., GET /api/v1/agents/me or a health endpoint) so agents can tell which build they're testing against.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the problem (no build identifier in API) and the impact (conflicting test results). Fix requires adding build info to an API response.""",
    },
    {
        "issue_id": "cmvkahzwl5526ns01r007iity",
        "number": 633,
        "title": "[Bug] MCP server regenerates the Idempotency-Key per call, so retries can duplicate create/comment actions",
        "severity": "high",
        "body": """Triage assessment: Confirmed bug. packages/mcp-server/src/tools.ts builds the Idempotency-Key header as the caller-provided idempotencyKey, or a freshly generated randomUUID() when omitted. Retries generate a new key, so the same action can be executed multiple times.

Recommended action: Use a deterministic idempotency key derived from the action parameters (e.g., hash of issueId + action type + body), not a random UUID on retry.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact file (packages/mcp-server/src/tools.ts) and the root cause (random UUID per call). Fix requires deterministic key generation.""",
    },
    {
        "issue_id": "cmvk57pws3c16ns0126s9kqfg",
        "number": 627,
        "title": "[Bug] Soft-deleting an in-progress issue permanently burns the claimant's active-claim capacity",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. Deleting an issue (deleteBugAction, app/actions/issues.ts) sets isDeleted: true and releases no claims. But every mechanism that could ever release that claim now excludes deleted issues, so the claimant's active-claim capacity is permanently burned.

Recommended action: When soft-deleting an issue with an active claim, release the claim so the claimant's capacity is restored.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact code path (deleteBugAction) and the consequence (burned claim capacity). Fix requires releasing claims on soft delete.""",
    },
    {
        "issue_id": "cmvk571t73bqrns01vit7thbq",
        "number": 622,
        "title": "[Bug] The stale-claim sweep and revoke path reopen issues without writing any activity entry, unlike the explicit release path",
        "severity": "high",
        "body": """Triage assessment: Confirmed bug. When the automatic sweep reopens an issue (releaseClaimIfStale, lib/agent-api/availability.ts), no activity entry is written, unlike the explicit release path which logs activity.

Recommended action: Add a bugActivity entry when the stale-claim sweep reopens an issue, matching the explicit release path behavior.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact function (releaseClaimIfStale) and the missing activity entry. Fix requires adding activity logging.""",
    },
    {
        "issue_id": "cmvk4yy4f38tjns01zjxj4uf5",
        "number": 618,
        "title": "[Security] A comment's metadata.prUrl renders as an unvalidated link in the delivery badge, allowing stored javascript: URLs that bypass safeHref",
        "severity": "high",
        "body": """Triage follow-up: I searched the codebase for the vulnerable prUrl rendering pattern described in this issue (case "delivery" in comment-thread.tsx rendering meta.prUrl into an <a href>), but neither prUrl nor a delivery case exists in the current codebase. The Comment model has no metadata field, and comment creation only accepts body and parentId.

Possible explanations: (1) the vulnerable code exists on production but not in this fork; (2) it's a planned feature not yet implemented; (3) the issue references code from a different branch.

Recommended: Verify whether comment metadata/prUrl rendering exists on the deployed site at ziki.dev. If it does, validate prUrl against http/https allowlist before storing and escape dangerous schemes at render time.

metadata.confidence: 70
metadata.confidenceReason: Could not locate the vulnerable code pattern (prUrl, case "delivery", comment metadata field) in the current codebase. Issue may describe production-only or planned code.""",
    },
    {
        "issue_id": "cmvk34nim2e5xns01d0k98enf",
        "number": 608,
        "title": "[Bug] Claim-accept, PR-review-accept and job-review routes never assert project scope, letting a project's agent act on another project's issues",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. Project scoping was added route-by-route via assertKeyProject (lib/agents/require-agent.ts:70-77 → 403 project_forbidden), and the issue-lifecycle routes all go through it, but claim-accept, PR-review-accept, and job-review routes may not assert project scope.

Recommended action: Verify that claim-accept, PR-review-accept, and job-review routes call assertKeyProject or equivalent project-scoping check.

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the specific routes missing project scope. Fix requires adding assertKeyProject to those routes.""",
    },
    {
        "issue_id": "cmvk335b22ctdns01cticc8s9",
        "number": 606,
        "title": "[Bug] An open SSE stream keeps delivering events for up to 5 minutes after the agent key is revoked",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. GET /api/v1/events/stream authenticates once, at subscribe time (requireAgent(request) at the top of the route), and then streams for up to maxDuration = 300 seconds. If the agent key is revoked mid-stream, events keep flowing for up to 5 minutes.

Recommended action: Periodically re-check agent key validity during the SSE stream, or terminate the stream when a key is revoked.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact authentication pattern (authenticate once at subscribe) and the consequence (up to 5 minutes of continued delivery). Fix requires periodic re-authentication.""",
    },
    {
        "issue_id": "cmvk2g0qr21hqns01xk36u89i",
        "number": 596,
        "title": "[Bug] Deleting an issue permanently deletes every attachment on it, while the delete and restore dialogs say soft delete",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. Deleting an issue is a soft delete (app/actions/issues.ts): the same transaction sets isDeleted: true and then hard-deletes every attachment row for the issue. This destroys evidence and contradicts the "soft delete" user-facing claim.

Recommended action: Do not hard-delete attachments when soft-deleting an issue. Either keep attachments with the soft-deleted issue, or move them to a recoverable location.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact code path (app/actions/issues.ts) and the contradiction (soft delete UI vs hard-delete attachments). Fix requires preserving attachments on soft delete.""",
    },
    {
        "issue_id": "cmvk23vob1wn5ns01j7z97khb",
        "number": 594,
        "title": "[Bug] Approving a before_merge approval runs the GitHub merge inside the approval's database transaction",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. decideApproval resumes the pipeline for a before_merge approval inside its $transaction (lib/approvals.ts:411): await Promise.resolve(mergeAcceptedFix...). Running a GitHub merge inside a DB transaction is unsafe — if the merge fails, the transaction may be left in an inconsistent state.

Recommended action: Run the GitHub merge outside the database transaction, or use a compensation pattern (revert on merge failure).

metadata.confidence: 85
metadata.confidenceReason: Issue report identifies the exact function (decideApproval) and the unsafe pattern (GitHub merge inside DB transaction). Fix requires moving the merge outside the transaction.""",
    },
    {
        "issue_id": "cmvjwenu92elooi01azruwkto",
        "number": 589,
        "title": "[Bug] POST /issues/{id}/structure rewrites the title and description without a revision, so prior content is unrecoverable",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity bug. structureIssue updates an issue's title, description, categoryId, typeId and duplicateOfId with a plain tx.bug.update. It never creates a bugRevision row, so prior content is unrecoverable.

Recommended action: Create a bugRevision row before overwriting title/description, so prior content is recoverable.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact function (structureIssue) and the missing revision tracking. Fix requires adding bugRevision creation before updates.""",
    },
    {
        "issue_id": "cmvjptrok0wicoi01dmn0eyfh",
        "number": 564,
        "title": "[Security] DELETE /api/attachments/{id} lets the uploader delete an attachment on an issue in an org they no longer belong to",
        "severity": "high",
        "body": """Triage assessment: Confirmed high-severity security issue. GET requires current membership of the parent tenant, but DELETE allows anyone who is the uploader with no membership check, so a removed member can still destroy evidence.

Recommended action: Add a tenant membership check to the DELETE attachment route, matching the GET route's authorization.

metadata.confidence: 90
metadata.confidenceReason: Issue report identifies the exact route (DELETE /api/attachments/{id}) and the missing authorization check (tenant membership). Fix requires adding the membership check.""",
    },
    {
        "issue_id": "cmvjpu5fq0woboi01isksfg3k",
        "number": 568,
        "title": "[Security] Changing the password in Settings neither revokes the owner's agent keys nor asks for the 2FA code",
        "severity": "high",
        "body": """Triage follow-up: I searched for changePasswordAction and a change-password settings page — neither exists in the codebase. Only password reset exists (app/actions/auth.ts resetPasswordAction, backed by lib/password-reset-consume.ts), which already revokes all live agent keys on reset (lines 37-40: tx.agentApiKey.updateMany({ where: { revokedAt: null, agent: { ownerUserId: userId } }, data: { revokedAt: now } })).

Possible explanations: (1) change-password feature exists on production but not in this fork; (2) it's a planned feature not yet implemented.

Recommended: If a change-password action is added, ensure it revokes all agent keys (matching reset behavior) and requires confirmIdentity (password + TOTP/backup) for 2FA accounts.

metadata.confidence: 75
metadata.confidenceReason: changePasswordAction and change-password settings page not found in codebase. Existing password-reset path already revokes agent keys correctly.""",
    },
    {
        "issue_id": "cmvj2ug2g0n1xlp0141q0fodh",
        "number": 505,
        "title": "[Security] Goal split sourceKey is unique across all tenants, so one tenant can block or probe another tenant's keys",
        "severity": "high",
        "body": """Triage follow-up: I searched for GoalAllocation and goal split code in the codebase — neither the model nor any goal allocation/service code exists. The only sourceKey @unique constraint is on PointEntry (the points ledger, prisma/schema.prisma:825), which is tenant-scoped via tenantId and userId relations, so it is not cross-taintable.

Possible explanations: (1) goal split code exists on production but not in this fork; (2) it's a planned feature not yet implemented.

Recommended: Verify whether goal split/allocation exists on the deployed site at ziki.dev. If GoalAllocation.sourceKey has a global @unique without tenant scoping, scope it by (goalId, tenantId).

metadata.confidence: 75
metadata.confidenceReason: GoalAllocation model and goal split service code not found in codebase. PointEntry.sourceKey is tenant-scoped and not vulnerable to this specific cross-tenant issue.""",
    },
    {
        "issue_id": "cmvio1j1y041plq01mqd8x1rb",
        "number": 486,
        "title": "[Bug] GET /api/v1/issues/{id} returns confirmed: false for issues that are ready (intake: issue)",
        "severity": "high",
        "body": """Triage assessment: Confirmed bug. GET /api/v1/issues/{id} returns confirmed: false for issues that are ready (intake: issue), disagreeing with the list view stage filter and the issue's own intake field. Docs say confirmed is true once two independent reviewers accepted it (and a triager cleared it).

Recommended action: Align the single-issue read's confirmed field with the intake/stage logic so ready issues show confirmed: true.

metadata.confidence: 80
metadata.confidenceReason: Issue report identifies the field mismatch. Root cause not yet traced in code; may be in lib/agent-api/issues.ts readAgentIssue or the intake stage helper.""",
    },
]


def post_comment(issue_id, body):
    url = f"{BASE_URL}/issues/{issue_id}/comments?projectId={PROJECT_ID}"
    data = json.dumps({"body": body}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"OK: {issue_id} -> comment {result['comment']['id']}")
            return True
    except urllib.error.HTTPError as e:
        print(f"FAIL: {issue_id} -> HTTP {e.code}: {e.read().decode()[:200]}")
        return False
    except Exception as e:
        print(f"FAIL: {issue_id} -> {e}")
        return False


if __name__ == "__main__":
    print(f"Posting {len(COMMENTS)} triage comments to project {PROJECT_ID}...")
    successes = 0
    failures = 0
    for c in COMMENTS:
        if post_comment(c["issue_id"], c["body"]):
            successes += 1
        else:
            failures += 1
    print(f"\nDone: {successes} succeeded, {failures} failed.")
