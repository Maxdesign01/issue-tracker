import type { Prisma } from "@prisma/client";
import { publish } from "@/lib/agent-api/events";

export type ReassignClaimOptions = {
  bugId: string;
  tenantId: string;
  oldAssigneeId?: string | null;
  newAssigneeId?: string | null;
  releaseReason?: string;
};

export type ReassignClaimResult = {
  releasedCount: number;
  reopened: boolean;
};

/**
 * When an issue's assignee changes (e.g. unassigned or assigned to someone else),
 * active claims held for the old assignee must be released (#651).
 * If the issue is unassigned (newAssigneeId is null) and was in_progress, it is
 * reset back to open so other agents or contributors can pick it up.
 */
export async function releaseClaimsOnReassign(
  tx: Prisma.TransactionClient,
  options: ReassignClaimOptions,
): Promise<ReassignClaimResult> {
  const {
    bugId,
    tenantId,
    oldAssigneeId,
    newAssigneeId,
    releaseReason = newAssigneeId ? "reassigned" : "unassigned",
  } = options;

  if (oldAssigneeId === newAssigneeId) {
    return { releasedCount: 0, reopened: false };
  }

  const claimWhere = {
    bugId,
    status: "active" as const,
    releasedAt: null,
    ...(oldAssigneeId ? { beneficiaryUserId: oldAssigneeId } : {}),
  };

  const activeClaims = typeof tx.issueClaim?.findMany === "function"
    ? await tx.issueClaim.findMany({
        where: claimWhere,
        select: { id: true, agentId: true, beneficiaryUserId: true },
      })
    : [];

  let releasedCount = 0;
  if (activeClaims.length > 0) {
    const now = new Date();
    const updateResult = await tx.issueClaim.updateMany({
      where: {
        id: { in: activeClaims.map((c) => c.id) },
      },
      data: {
        status: "released",
        releasedAt: now,
        releaseReason,
      },
    });
    releasedCount = updateResult.count;

    for (const claim of activeClaims) {
      await publish(tx, {
        tenantId,
        type: "claim.released",
        actorAgentId: claim.agentId,
        bugId,
        payload: {
          claimId: claim.id,
          issueId: bugId,
          beneficiaryUserId: claim.beneficiaryUserId,
          reason: releaseReason,
        },
      });
    }
  }

  let reopened = false;
  if (!newAssigneeId) {
    const otherClaims = typeof tx.issueClaim?.count === "function"
      ? await tx.issueClaim.count({
          where: { bugId, status: "active", releasedAt: null },
        })
      : 0;

    if (otherClaims === 0 && typeof tx.bug?.updateMany === "function") {
      const reopenedResult = await tx.bug.updateMany({
        where: { id: { in: [bugId] }, tenantId, status: "in_progress", isDeleted: false },
        data: { status: "open", assigneeId: null },
      });
      reopened = reopenedResult.count > 0;
    }
  }

  return { releasedCount, reopened };
}
