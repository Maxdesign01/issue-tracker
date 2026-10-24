import { describe, expect, it, vi } from "vitest";
import { releaseClaimsOnReassign } from "./claims-on-reassign";

vi.mock("@/lib/agent-api/events", () => ({
  publish: vi.fn(),
}));

import { publish } from "@/lib/agent-api/events";

describe("releaseClaimsOnReassign (#651)", () => {
  it("does nothing when assignee has not changed", async () => {
    const tx = {
      issueClaim: { findMany: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
      bug: { updateMany: vi.fn() },
    } as any;

    const result = await releaseClaimsOnReassign(tx, {
      bugId: "bug-1",
      tenantId: "tenant-1",
      oldAssigneeId: "user-1",
      newAssigneeId: "user-1",
    });

    expect(result).toEqual({ releasedCount: 0, reopened: false });
    expect(tx.issueClaim.findMany).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("releases active claims and publishes events when unassigning", async () => {
    const activeClaims = [
      { id: "claim-1", agentId: "agent-1", beneficiaryUserId: "user-1" },
    ];
    const tx = {
      issueClaim: {
        findMany: vi.fn().mockResolvedValue(activeClaims),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        count: vi.fn().mockResolvedValue(0),
      },
      bug: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;

    const result = await releaseClaimsOnReassign(tx, {
      bugId: "bug-1",
      tenantId: "tenant-1",
      oldAssigneeId: "user-1",
      newAssigneeId: null,
    });

    expect(result).toEqual({ releasedCount: 1, reopened: true });
    expect(tx.issueClaim.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["claim-1"] } },
      data: expect.objectContaining({
        status: "released",
        releaseReason: "unassigned",
      }),
    });
    expect(publish).toHaveBeenCalledWith(tx, {
      tenantId: "tenant-1",
      type: "claim.released",
      actorAgentId: "agent-1",
      bugId: "bug-1",
      payload: {
        claimId: "claim-1",
        issueId: "bug-1",
        beneficiaryUserId: "user-1",
        reason: "unassigned",
      },
    });
    expect(tx.bug.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["bug-1"] }, tenantId: "tenant-1", status: "in_progress", isDeleted: false },
      data: { status: "open", assigneeId: null },
    });
  });

  it("releases claims when reassigning to a different user", async () => {
    const activeClaims = [
      { id: "claim-2", agentId: "agent-2", beneficiaryUserId: "user-1" },
    ];
    const tx = {
      issueClaim: {
        findMany: vi.fn().mockResolvedValue(activeClaims),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        count: vi.fn().mockResolvedValue(0),
      },
      bug: {
        updateMany: vi.fn(),
      },
    } as any;

    const result = await releaseClaimsOnReassign(tx, {
      bugId: "bug-1",
      tenantId: "tenant-1",
      oldAssigneeId: "user-1",
      newAssigneeId: "user-2",
      releaseReason: "reassigned",
    });

    expect(result).toEqual({ releasedCount: 1, reopened: false });
    expect(tx.bug.updateMany).not.toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith(tx, {
      tenantId: "tenant-1",
      type: "claim.released",
      actorAgentId: "agent-2",
      bugId: "bug-1",
      payload: {
        claimId: "claim-2",
        issueId: "bug-1",
        beneficiaryUserId: "user-1",
        reason: "reassigned",
      },
    });
  });
});
