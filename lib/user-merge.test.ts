import { describe, expect, it, vi } from "vitest";
import { mergeUserAccounts } from "./user-merge";

describe("mergeUserAccounts (#651)", () => {
  it("throws if source or target user is missing or identical", async () => {
    const mockDb = {
      user: { findUnique: vi.fn() },
    } as unknown as Parameters<typeof mergeUserAccounts>[0];

    await expect(
      mergeUserAccounts(mockDb, { sourceUserId: "u1", targetUserId: "u1" }),
    ).rejects.toThrow("Cannot merge a user into themselves");

    mockDb.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      mergeUserAccounts(mockDb, { sourceUserId: "u1", targetUserId: "u2" }),
    ).rejects.toThrow('Source user "u1" not found');

    mockDb.user.findUnique
      .mockResolvedValueOnce({ id: "u1", role: "user" })
      .mockResolvedValueOnce(null);
    await expect(
      mergeUserAccounts(mockDb, { sourceUserId: "u1", targetUserId: "u2" }),
    ).rejects.toThrow('Target user "u2" not found');
  });

  it("safely transfers points, agents, and bugs without loss", async () => {
    const tx = {
      membership: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          if (where.userId === "source-1") {
            return [{ id: "m-src", tenantId: "tenant-1", role: "admin" }];
          }
          return [{ id: "m-tgt", tenantId: "tenant-1", role: "member" }];
        }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      vote: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          if (where.userId === "source-1") {
            return [{ id: "v-src1", bugId: "bug-1" }, { id: "v-src2", bugId: "bug-2" }];
          }
          return [{ id: "v-tgt1", bugId: "bug-1" }];
        }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      issueWatch: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          if (where.userId === "source-1") {
            return [{ bugId: "bug-1", watching: true }];
          }
          return [];
        }),
        create: vi.fn(),
        delete: vi.fn(),
      },
      pointEntry: {
        updateMany: vi.fn().mockResolvedValue({ count: 5 }),
      },
      pointDispute: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      agent: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      agentPairing: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      bug: {
        updateMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
      issueClaim: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      issueBid: { updateMany: vi.fn() },
      issueInterest: { updateMany: vi.fn() },
      issueValidation: { updateMany: vi.fn() },
      testVerdict: { updateMany: vi.fn() },
      reviewOffer: { updateMany: vi.fn() },
      redesignProposal: { updateMany: vi.fn() },
      issueApproval: { updateMany: vi.fn() },
      comment: { updateMany: vi.fn() },
      bugActivity: { updateMany: vi.fn() },
      bugRevision: { updateMany: vi.fn() },
      attachment: { updateMany: vi.fn() },
      job: { updateMany: vi.fn() },
      goal: { updateMany: vi.fn() },
      jobSubmission: { updateMany: vi.fn() },
      jobReview: { updateMany: vi.fn() },
      jobReviewOffer: { updateMany: vi.fn() },
      agentAuditEvent: { updateMany: vi.fn() },
      agentQuestion: { updateMany: vi.fn() },
      agentMessage: { updateMany: vi.fn() },
      projectAuditEvent: { updateMany: vi.fn() },
      tenantInvite: { updateMany: vi.fn() },
      tenantShareLink: { updateMany: vi.fn() },
      tenantShareRedemption: { updateMany: vi.fn() },
      tenantJoinRequest: { updateMany: vi.fn() },
      membershipChange: { updateMany: vi.fn() },
      passwordResetToken: { deleteMany: vi.fn() },
      totpCredential: { deleteMany: vi.fn() },
      totpBackupCode: { deleteMany: vi.fn() },
      securityAuditEvent: { deleteMany: vi.fn() },
      notification: { deleteMany: vi.fn() },
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "source-1") {
            return { id: "source-1", role: "admin", walletAddress: "0x1234567890123456789012345678901234567890" };
          }
          if (where.id === "target-1") {
            return { id: "target-1", role: "user", walletAddress: null };
          }
          return null;
        }),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
    } as unknown as Parameters<typeof mergeUserAccounts>[0];

    const result = await mergeUserAccounts(tx, {
      sourceUserId: "source-1",
      targetUserId: "target-1",
    });

    expect(result.success).toBe(true);
    expect(result.pointsTransferred).toBe(5);
    expect(result.agentsTransferred).toBe(2);
    expect(result.bugsTransferred).toBe(9); // 3 * 3

    // Points transferred to target
    expect(tx.pointEntry.updateMany).toHaveBeenCalledWith({
      where: { userId: "source-1" },
      data: { userId: "target-1" },
    });

    // Agents transferred to target
    expect(tx.agent.updateMany).toHaveBeenCalledWith({
      where: { ownerUserId: "source-1" },
      data: { ownerUserId: "target-1" },
    });

    // Membership upgraded & deduplicated
    expect(tx.membership.update).toHaveBeenCalledWith({
      where: { id: "m-tgt" },
      data: { role: "admin" },
    });
    expect(tx.membership.delete).toHaveBeenCalledWith({
      where: { id: "m-src" },
    });

    // Vote deduplicated: bug-1 already voted by target -> deleted, bug-2 moved
    expect(tx.vote.delete).toHaveBeenCalledWith({ where: { id: "v-src1" } });
    expect(tx.vote.update).toHaveBeenCalledWith({
      where: { id: "v-src2" },
      data: { userId: "target-1" },
    });

    // Watch recreated for target
    expect(tx.issueWatch.delete).toHaveBeenCalledWith({
      where: { userId_bugId: { userId: "source-1", bugId: "bug-1" } },
    });
    expect(tx.issueWatch.create).toHaveBeenCalledWith({
      data: { userId: "target-1", bugId: "bug-1", watching: true },
    });

    // Wallet address and role upgraded on target
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "target-1" },
      data: {
        role: "admin",
        walletAddress: "0x1234567890123456789012345678901234567890",
      },
    });

    // Source user deleted
    expect(tx.user.delete).toHaveBeenCalledWith({
      where: { id: "source-1" },
    });
  });
});
