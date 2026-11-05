import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { settableLevels } from "@/lib/agents/levels";
import { MAX_ACTIVE_AGENTS_PER_OWNER } from "@/lib/agents/registry-limits";
import { isTenantAdminRole } from "@/lib/agents/membership";
import { projectContextFor } from "@/lib/project-context";
import { currentTenantIdFor } from "@/lib/tenant-context";
import { openSecret } from "@/lib/secret-box";
import { materializeApprovedPairings } from "@/lib/agents/pairing";
import { isAgentPlatformEnabled } from "@/lib/feature-flags";
import { FirstAgentEmptyState } from "@/components/first-agent-empty-state";
import { ManageAgentsList, type ManageAgentItem } from "@/app/(app)/settings/agents/manage-agents-list";
import {
  agentsMutedClass,
  agentsPrimaryBtn,
  agentsSecondaryBtn,
  agentsSurface,
} from "@/app/(app)/settings/agents/agents-ui";
import { agentActivity, agentEarnings } from "@/lib/points/agent-earnings";
import { AGENT_WORKING_WINDOW_MS, classifyAgentStatus } from "@/lib/dashboard-overview";
import { sendAgentRequestAction } from "@/app/actions/agent-requests";

function latest(...dates: (Date | null | undefined)[]): Date | null {
  let newest: Date | null = null;
  for (const date of dates) {
    if (date && (!newest || date.getTime() > newest.getTime())) newest = date;
  }
  return newest;
}

/** Decrypts a stored agent key for display; a missing or unreadable seal yields null so the row still renders. */
function revealAgentKey(sealed: string | null): string | null {
  if (!sealed) return null;
  try {
    return openSecret(sealed);
  } catch {
    return null;
  }
}

export const metadata = { title: "Agent Fleet Command" };

/**
 * Where "Create agent" goes. Creating an agent is its own page (built under a
 * separate ticket), so this page only links to it. Change this one line when
 * that page has a route.
 */
const CREATE_AGENT_HREF = "/settings/connect";

/**
 * Agent Fleet Command & Health Center:
 * Real-time monitoring, heartbeat status, active mission tracking, rate budget
 * gauges, priority task dispatch, and key lifecycle for your autonomous agents.
 */
export default async function AgentsPage() {
  if (!isAgentPlatformEnabled()) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-zk-text">Agent Fleet Command</h1>
          <p className={agentsMutedClass}>The agent platform feature is not enabled in this environment.</p>
        </div>
      </div>
    );
  }

  const user = await requireUser();
  const tenantId = await currentTenantIdFor(user.id);
  const context = await projectContextFor(prisma, tenantId);
  const membership = tenantId
    ? await prisma.membership.findUnique({
        where: { tenantId_userId: { tenantId, userId: user.id } },
        select: { role: true },
      })
    : null;
  const isAdmin = isTenantAdminRole(membership?.role, user.role);
  const projects = context.projects;
  const now = new Date();

  if (tenantId) {
    try {
      await materializeApprovedPairings(user.id, tenantId);
    } catch (error) {
      console.error("[agents] approved agents were not listed", error);
    }
  }

  const mine = tenantId
    ? await prisma.agent.findMany({
        where: { ownerUserId: user.id, tenantId },
        orderBy: [{ revokedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          avatar: true,
          model: true,
          level: true,
          burst: true,
          burstUntil: true,
          createdAt: true,
          revokedAt: true,
          defaultProjectId: true,
          instructions: true,
          reputation: true,
          apiKeys: {
            where: { revokedAt: null },
            select: {
              id: true,
              prefix: true,
              sealedKey: true,
              lastUsedAt: true,
              project: { select: { id: true, name: true } },
            },
          },
          claims: {
            where: { releasedAt: null, status: "active" },
            orderBy: [{ claimedAt: "desc" }, { id: "desc" }],
            take: 1,
            select: {
              claimedAt: true,
              lastHeartbeatAt: true,
              bug: {
                select: {
                  number: true,
                  title: true,
                  status: true,
                  isDeleted: true,
                  project: { select: { slug: true, name: true } },
                },
              },
            },
          },
          questions: {
            where: { answeredAt: null },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
            select: { id: true, body: true, createdAt: true },
          },
        },
      })
    : [];

  const ownLevels = settableLevels({ isOwner: true, isTenantAdmin: isAdmin });
  const activeCount = mine.filter((agent) => !agent.revokedAt).length;
  const recentCutoff = now.getTime() - 24 * 60 * 60 * 1000;
  const ids = mine.map((agent) => agent.id);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [earned, activity, pendingRequests, latestEvents] =
    tenantId && ids.length > 0
      ? await Promise.all([
          agentEarnings(prisma, tenantId, ids),
          agentActivity(prisma, tenantId, ids, startOfToday),
          prisma.agentRequest.groupBy({
            by: ["agentId"],
            where: { agentId: { in: ids }, doneAt: null },
            _count: { _all: true },
          }),
          prisma.agentEvent.groupBy({
            by: ["actorAgentId"],
            where: { actorAgentId: { in: ids } },
            _max: { createdAt: true },
          }),
        ])
      : [new Map<string, number>(), new Map(), [], []];

  const pendingBy = new Map(pendingRequests.map((row) => [row.agentId, row._count._all]));
  const eventById = new Map(latestEvents.map((row) => [row.actorAgentId, row._max.createdAt ?? null]));
  const workingCutoff = now.getTime() - AGENT_WORKING_WINDOW_MS;

  const manageItems: ManageAgentItem[] = mine.map((agent) => {
    const lastUsedMs = agent.apiKeys
      .map((key) => (key.lastUsedAt ? key.lastUsedAt.getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);

    const unanswered = agent.questions[0] ?? null;
    const claim = agent.claims[0] ?? null;
    const claimedBug = claim?.bug ?? null;
    const heartbeat = claim?.lastHeartbeatAt ?? claim?.claimedAt ?? null;
    const claimIsLive =
      claim !== null &&
      heartbeat !== null &&
      heartbeat.getTime() >= workingCutoff &&
      claimedBug !== null &&
      !claimedBug.isDeleted &&
      claimedBug.status === "in_progress";

    const lastSeenAt = latest(
      heartbeat,
      eventById.get(agent.id) ?? null,
      ...agent.apiKeys.map((key) => key.lastUsedAt),
    );

    const status = classifyAgentStatus({
      hasUnansweredQuestion: unanswered !== null,
      hasActiveClaim: claimIsLive,
      lastSeenAt,
      now,
    });

    let activityText: string;
    if (status === "waiting") {
      activityText = "Waiting for your answer";
    } else if (status === "working" && claimedBug) {
      activityText = `Working on #${claimedBug.number} ${claimedBug.title}`;
    } else if (status === "idle") {
      activityText = "Standing by";
    } else {
      activityText = "No recent activity";
    }

    return {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      model: agent.model,
      level: agent.level,
      burst: agent.burst,
      burstUntil: agent.burstUntil ? agent.burstUntil.toISOString() : null,
      createdAt: agent.createdAt.toISOString(),
      revokedAt: agent.revokedAt ? agent.revokedAt.toISOString() : null,
      personal: Boolean(agent.defaultProjectId),
      currentProjectId: agent.apiKeys.find((key) => key.project)?.project?.id ?? null,
      recent: lastUsedMs >= recentCutoff,
      status,
      activity: activityText,
      activeClaim:
        claimIsLive && claimedBug
          ? {
              number: claimedBug.number,
              title: claimedBug.title,
              status: claimedBug.status,
              projectSlug: claimedBug.project?.slug ?? null,
              claimedAt: (claim.claimedAt ?? now).toISOString(),
              lastHeartbeatAt: heartbeat ? heartbeat.toISOString() : null,
            }
          : null,
      unansweredQuestion: unanswered
        ? {
            id: unanswered.id,
            body: unanswered.body,
            createdAt: unanswered.createdAt.toISOString(),
          }
        : null,
      instructions: agent.instructions,
      reputation: agent.reputation,
      earnedPoints: earned.get(agent.id) ?? 0,
      pointsToday: activity.get(agent.id)?.pointsToday ?? 0,
      bidsCount: activity.get(agent.id)?.bids ?? 0,
      commentsCount: activity.get(agent.id)?.comments ?? 0,
      pendingRequests: pendingBy.get(agent.id) ?? 0,
      lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
      apiKeys: agent.apiKeys.map((key) => ({
        id: key.id,
        prefix: key.prefix,
        apiKey: revealAgentKey(key.sealedKey),
        projectId: key.project?.id ?? null,
        projectName: key.project?.name ?? null,
        lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
      })),
    };
  });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-zk-text">Agent Fleet Command</h1>
            </div>
            <p className={agentsMutedClass}>
              Live autonomous fleet health, real-time mission telemetry, rate quotas, and instant instruction dispatch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/settings/agents/pair" className={agentsSecondaryBtn}>
              Pair code
            </Link>
            <Link href={CREATE_AGENT_HREF} className={agentsPrimaryBtn}>
              Connect agent
            </Link>
          </div>
        </div>
      </div>

      {!tenantId ? (
        <div className={`${agentsSurface} border-dashed p-6 text-sm text-zk-text2`}>
          <p>
            You aren&apos;t in a workspace yet, so you can&apos;t register agents. Join a workspace via an invite from
            your team, or create your own workspace to start managing agents.
          </p>
          <div className="mt-3">
            <Link href="/tenants" className={agentsPrimaryBtn}>
              Create or join a workspace →
            </Link>
          </div>
        </div>
      ) : (
        <section aria-labelledby="mine-heading" className="space-y-4">
          <h2 id="mine-heading" className="sr-only">
            Your agents
          </h2>
          {mine.length === 0 ? (
            <FirstAgentEmptyState />
          ) : (
            <ManageAgentsList
              agents={manageItems}
              activeCount={activeCount}
              maxActive={MAX_ACTIVE_AGENTS_PER_OWNER}
              levels={ownLevels}
              projects={projects}
              now={now.toISOString()}
              canSetBurst={isAdmin}
              onSendInstruction={sendAgentRequestAction}
            />
          )}
        </section>
      )}
    </div>
  );
}
