import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type Db = Prisma.TransactionClient | PrismaClient;

export type MergeUsersOptions = {
  sourceUserId: string;
  targetUserId: string;
  actorUserId?: string | null;
};

export type MergeUsersResult = {
  success: boolean;
  sourceUserId: string;
  targetUserId: string;
  pointsTransferred: number;
  agentsTransferred: number;
  bugsTransferred: number;
  error?: string;
};

const ROLE_RANK: Record<string, number> = {
  super_admin: 3,
  admin: 2,
  user: 1,
};

const MEMBERSHIP_ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Merges a source user (e.g. phantom account created by Google sign-in mismatch)
 * into a target user account (#651).
 *
 * All associated records, especially PointEntry rows, are safely reassigned
 * to the target account so zero points or work history are lost.
 * Constraint-sensitive relations (memberships, votes, watches) are deduplicated.
 * The source user is deleted once all references have been moved.
 */
export async function mergeUserAccounts(
  client: Db = defaultPrisma,
  options: MergeUsersOptions,
): Promise<MergeUsersResult> {
  const { sourceUserId, targetUserId, actorUserId } = options;

  if (!sourceUserId || !targetUserId) {
    throw new Error("Both sourceUserId and targetUserId are required.");
  }

  if (sourceUserId === targetUserId) {
    throw new Error("Cannot merge a user into themselves.");
  }

  const sourceUser = await client.user.findUnique({
    where: { id: sourceUserId },
    select: { id: true, name: true, email: true, role: true, walletAddress: true },
  });
  if (!sourceUser) {
    throw new Error(`Source user "${sourceUserId}" not found.`);
  }

  const targetUser = await client.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, role: true, walletAddress: true },
  });
  if (!targetUser) {
    throw new Error(`Target user "${targetUserId}" not found.`);
  }

  // Execute entire merge in a single transaction
  const executeInTransaction = async (tx: Prisma.TransactionClient): Promise<MergeUsersResult> => {
    // 1. Memberships (@@unique([tenantId, userId]))
    const sourceMemberships = typeof tx.membership?.findMany === "function"
      ? await tx.membership.findMany({ where: { userId: sourceUserId } })
      : [];
    const targetMemberships = typeof tx.membership?.findMany === "function"
      ? await tx.membership.findMany({ where: { userId: targetUserId } })
      : [];
    const targetTenantMap = new Map(targetMemberships.map((m) => [m.tenantId, m]));

    for (const sm of sourceMemberships) {
      const tm = targetTenantMap.get(sm.tenantId);
      if (tm) {
        // Upgrade role if source has higher rank
        const sRank = MEMBERSHIP_ROLE_RANK[sm.role] ?? 0;
        const tRank = MEMBERSHIP_ROLE_RANK[tm.role] ?? 0;
        if (sRank > tRank) {
          await tx.membership.update({
            where: { id: tm.id },
            data: { role: sm.role },
          });
        }
        await tx.membership.delete({ where: { id: sm.id } });
      } else {
        await tx.membership.update({
          where: { id: sm.id },
          data: { userId: targetUserId },
        });
      }
    }

    // 2. Votes (@@unique([userId, bugId]))
    const sourceVotes = typeof tx.vote?.findMany === "function"
      ? await tx.vote.findMany({ where: { userId: sourceUserId } })
      : [];
    const targetVotes = typeof tx.vote?.findMany === "function"
      ? await tx.vote.findMany({ where: { userId: targetUserId } })
      : [];
    const targetVotedBugs = new Set(targetVotes.map((v) => v.bugId));

    for (const sv of sourceVotes) {
      if (targetVotedBugs.has(sv.bugId)) {
        await tx.vote.delete({ where: { id: sv.id } });
      } else {
        await tx.vote.update({
          where: { id: sv.id },
          data: { userId: targetUserId },
        });
      }
    }

    // 3. Issue Watches (@@unique([userId, bugId]))
    const sourceWatches = typeof tx.issueWatch?.findMany === "function"
      ? await tx.issueWatch.findMany({ where: { userId: sourceUserId } })
      : [];
    const targetWatches = typeof tx.issueWatch?.findMany === "function"
      ? await tx.issueWatch.findMany({ where: { userId: targetUserId } })
      : [];
    const targetWatchedBugs = new Set(targetWatches.map((w) => w.bugId));

    for (const sw of sourceWatches) {
      await tx.issueWatch.delete({
        where: { userId_bugId: { userId: sourceUserId, bugId: sw.bugId } },
      });
      if (!targetWatchedBugs.has(sw.bugId)) {
        await tx.issueWatch.create({
          data: { userId: targetUserId, bugId: sw.bugId, watching: sw.watching },
        });
      }
    }

    // 4. Points (PointEntry & PointDispute)
    let pointsTransferred = 0;
    if (typeof tx.pointEntry?.updateMany === "function") {
      const pe = await tx.pointEntry.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      });
      pointsTransferred = pe.count;
    }
    if (typeof tx.pointDispute?.updateMany === "function") {
      await tx.pointDispute.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      });
      await tx.pointDispute.updateMany({
        where: { resolvedById: sourceUserId },
        data: { resolvedById: targetUserId },
      });
    }

    // 5. Agents & Pairings
    let agentsTransferred = 0;
    if (typeof tx.agent?.updateMany === "function") {
      const ag = await tx.agent.updateMany({
        where: { ownerUserId: sourceUserId },
        data: { ownerUserId: targetUserId },
      });
      agentsTransferred = ag.count;
    }
    if (typeof tx.agentPairing?.updateMany === "function") {
      await tx.agentPairing.updateMany({
        where: { ownerUserId: sourceUserId },
        data: { ownerUserId: targetUserId },
      });
    }

    // 6. Bugs (reported, assigned, beneficiary)
    let bugsTransferred = 0;
    if (typeof tx.bug?.updateMany === "function") {
      const b1 = await tx.bug.updateMany({
        where: { reporterId: sourceUserId },
        data: { reporterId: targetUserId },
      });
      const b2 = await tx.bug.updateMany({
        where: { assigneeId: sourceUserId },
        data: { assigneeId: targetUserId },
      });
      const b3 = await tx.bug.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
      bugsTransferred = b1.count + b2.count + b3.count;
    }

    // 7. Claims, Bids, Interests
    if (typeof tx.issueClaim?.updateMany === "function") {
      await tx.issueClaim.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
      await tx.issueClaim.updateMany({
        where: { dispatcherUserId: sourceUserId },
        data: { dispatcherUserId: targetUserId },
      });
    }
    if (typeof tx.issueBid?.updateMany === "function") {
      await tx.issueBid.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }
    if (typeof tx.issueInterest?.updateMany === "function") {
      await tx.issueInterest.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }

    // 8. Validations, Test Verdicts, Review Offers, Redesigns, Approvals
    if (typeof tx.issueValidation?.updateMany === "function") {
      await tx.issueValidation.updateMany({
        where: { onBehalfOfUserId: sourceUserId },
        data: { onBehalfOfUserId: targetUserId },
      });
    }
    if (typeof tx.testVerdict?.updateMany === "function") {
      await tx.testVerdict.updateMany({
        where: { onBehalfOfUserId: sourceUserId },
        data: { onBehalfOfUserId: targetUserId },
      });
    }
    if (typeof tx.reviewOffer?.updateMany === "function") {
      await tx.reviewOffer.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }
    if (typeof tx.redesignProposal?.updateMany === "function") {
      await tx.redesignProposal.updateMany({
        where: { onBehalfOfUserId: sourceUserId },
        data: { onBehalfOfUserId: targetUserId },
      });
      await tx.redesignProposal.updateMany({
        where: { approverId: sourceUserId },
        data: { approverId: targetUserId },
      });
    }
    if (typeof tx.issueApproval?.updateMany === "function") {
      await tx.issueApproval.updateMany({
        where: { decidedByUserId: sourceUserId },
        data: { decidedByUserId: targetUserId },
      });
    }

    // 9. Comments, Activities, Revisions, Attachments
    if (typeof tx.comment?.updateMany === "function") {
      await tx.comment.updateMany({
        where: { authorId: sourceUserId },
        data: { authorId: targetUserId },
      });
    }
    if (typeof tx.bugActivity?.updateMany === "function") {
      await tx.bugActivity.updateMany({
        where: { actorId: sourceUserId },
        data: { actorId: targetUserId },
      });
    }
    if (typeof tx.bugRevision?.updateMany === "function") {
      await tx.bugRevision.updateMany({
        where: { editedById: sourceUserId },
        data: { editedById: targetUserId },
      });
    }
    if (typeof tx.attachment?.updateMany === "function") {
      await tx.attachment.updateMany({
        where: { uploaderId: sourceUserId },
        data: { uploaderId: targetUserId },
      });
    }

    // 10. Jobs & Goals
    if (typeof tx.job?.updateMany === "function") {
      await tx.job.updateMany({
        where: { createdById: sourceUserId },
        data: { createdById: targetUserId },
      });
    }
    if (typeof tx.goal?.updateMany === "function") {
      await tx.goal.updateMany({
        where: { createdById: sourceUserId },
        data: { createdById: targetUserId },
      });
    }
    if (typeof tx.jobSubmission?.updateMany === "function") {
      await tx.jobSubmission.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }
    if (typeof tx.jobReview?.updateMany === "function") {
      await tx.jobReview.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }
    if (typeof tx.jobReviewOffer?.updateMany === "function") {
      await tx.jobReviewOffer.updateMany({
        where: { beneficiaryUserId: sourceUserId },
        data: { beneficiaryUserId: targetUserId },
      });
    }

    // 11. Audits, Questions, Messages, Invites, Share Links
    if (typeof tx.agentAuditEvent?.updateMany === "function") {
      await tx.agentAuditEvent.updateMany({
        where: { actorUserId: sourceUserId },
        data: { actorUserId: targetUserId },
      });
    }
    if (typeof tx.agentQuestion?.updateMany === "function") {
      await tx.agentQuestion.updateMany({
        where: { ownerUserId: sourceUserId },
        data: { ownerUserId: targetUserId },
      });
    }
    if (typeof tx.agentMessage?.updateMany === "function") {
      await tx.agentMessage.updateMany({
        where: { fromUserId: sourceUserId },
        data: { fromUserId: targetUserId },
      });
    }
    if (typeof tx.projectAuditEvent?.updateMany === "function") {
      await tx.projectAuditEvent.updateMany({
        where: { actorUserId: sourceUserId },
        data: { actorUserId: targetUserId },
      });
    }
    if (typeof tx.tenantInvite?.updateMany === "function") {
      await tx.tenantInvite.updateMany({
        where: { invitedById: sourceUserId },
        data: { invitedById: targetUserId },
      });
    }
    if (typeof tx.tenantShareLink?.updateMany === "function") {
      await tx.tenantShareLink.updateMany({
        where: { invitedById: sourceUserId },
        data: { invitedById: targetUserId },
      });
    }
    if (typeof tx.tenantShareRedemption?.updateMany === "function") {
      await tx.tenantShareRedemption.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      });
    }
    if (typeof tx.tenantJoinRequest?.updateMany === "function") {
      await tx.tenantJoinRequest.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      });
      await tx.tenantJoinRequest.updateMany({
        where: { reviewedById: sourceUserId },
        data: { reviewedById: targetUserId },
      });
    }
    if (typeof tx.membershipChange?.updateMany === "function") {
      await tx.membershipChange.updateMany({
        where: { actorUserId: sourceUserId },
        data: { actorUserId: targetUserId },
      });
      await tx.membershipChange.updateMany({
        where: { targetUserId: sourceUserId },
        data: { targetUserId: targetUserId },
      });
    }

    // 12. Transient auth credentials / notifications on source user
    if (typeof tx.passwordResetToken?.deleteMany === "function") {
      await tx.passwordResetToken.deleteMany({ where: { userId: sourceUserId } });
    }
    if (typeof tx.totpCredential?.deleteMany === "function") {
      await tx.totpCredential.deleteMany({ where: { userId: sourceUserId } });
    }
    if (typeof tx.totpBackupCode?.deleteMany === "function") {
      await tx.totpBackupCode.deleteMany({ where: { userId: sourceUserId } });
    }
    if (typeof tx.securityAuditEvent?.deleteMany === "function") {
      await tx.securityAuditEvent.deleteMany({ where: { userId: sourceUserId } });
    }
    if (typeof tx.notification?.deleteMany === "function") {
      await tx.notification.deleteMany({ where: { userId: sourceUserId } });
    }

    // 13. Merge user profile fields
    const targetUpdates: Prisma.UserUpdateInput = {};
    if (!targetUser.walletAddress && sourceUser.walletAddress) {
      targetUpdates.walletAddress = sourceUser.walletAddress;
    }
    const sourceRank = ROLE_RANK[sourceUser.role] ?? 0;
    const targetRank = ROLE_RANK[targetUser.role] ?? 0;
    if (sourceRank > targetRank) {
      targetUpdates.role = sourceUser.role;
    }
    if (Object.keys(targetUpdates).length > 0) {
      await tx.user.update({
        where: { id: targetUserId },
        data: targetUpdates,
      });
    }

    // 14. Delete source user
    await tx.user.delete({
      where: { id: sourceUserId },
    });

    logger.info("[user-merge] Successfully merged user accounts", {
      sourceUserId,
      targetUserId,
      actorUserId,
      pointsTransferred,
      agentsTransferred,
      bugsTransferred,
    });

    return {
      success: true,
      sourceUserId,
      targetUserId,
      pointsTransferred,
      agentsTransferred,
      bugsTransferred,
    };
  };

  if ("$transaction" in client && typeof client.$transaction === "function") {
    return client.$transaction(async (tx) => executeInTransaction(tx));
  }
  return executeInTransaction(client as Prisma.TransactionClient);
}
