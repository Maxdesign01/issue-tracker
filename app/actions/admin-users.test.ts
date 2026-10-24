import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireSuperAdmin: vi.fn(),
  mergeUserAccounts: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireSuperAdmin: mocks.requireSuperAdmin,
}));

vi.mock("@/lib/user-merge", () => ({
  mergeUserAccounts: mocks.mergeUserAccounts,
}));

import { mergeUserAction } from "./admin-users";

describe("mergeUserAction (#651)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if parameters are missing or identical", async () => {
    mocks.requireSuperAdmin.mockResolvedValueOnce({ id: "super-1", role: "super_admin" });
    expect(await mergeUserAction("", "u2")).toEqual({
      ok: false,
      error: "Both sourceUserId and targetUserId are required.",
    });

    mocks.requireSuperAdmin.mockResolvedValueOnce({ id: "super-1", role: "super_admin" });
    expect(await mergeUserAction("u1", "u1")).toEqual({
      ok: false,
      error: "Cannot merge a user into themselves.",
    });
  });

  it("calls mergeUserAccounts and returns ok on success", async () => {
    mocks.requireSuperAdmin.mockResolvedValueOnce({ id: "super-1", role: "super_admin" });
    mocks.mergeUserAccounts.mockResolvedValueOnce({
      success: true,
      sourceUserId: "src",
      targetUserId: "tgt",
      pointsTransferred: 10,
      agentsTransferred: 1,
      bugsTransferred: 2,
    });

    const res = await mergeUserAction("src", "tgt");
    expect(res).toEqual({
      ok: true,
      result: expect.objectContaining({
        success: true,
        sourceUserId: "src",
        targetUserId: "tgt",
      }),
    });
    expect(mocks.mergeUserAccounts).toHaveBeenCalledWith(undefined, {
      sourceUserId: "src",
      targetUserId: "tgt",
      actorUserId: "super-1",
    });
  });
});
