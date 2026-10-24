"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { mergeUserAccounts, type MergeUsersResult } from "@/lib/user-merge";

export type MergeUserActionResult =
  | { ok: true; result: MergeUsersResult }
  | { ok: false; error: string };

/**
 * Super admin merges a duplicate or phantom user account into a primary account (#651).
 * Reassigns all point entries, agents, claims, and issues without data loss.
 */
export async function mergeUserAction(
  sourceUserId: string,
  targetUserId: string,
): Promise<MergeUserActionResult> {
  const actor = await requireSuperAdmin();
  if (!sourceUserId?.trim() || !targetUserId?.trim()) {
    return { ok: false, error: "Both sourceUserId and targetUserId are required." };
  }
  if (sourceUserId === targetUserId) {
    return { ok: false, error: "Cannot merge a user into themselves." };
  }

  try {
    const result = await mergeUserAccounts(undefined, {
      sourceUserId: sourceUserId.trim(),
      targetUserId: targetUserId.trim(),
      actorUserId: actor.id,
    });
    revalidatePath("/admin/users");
    revalidatePath("/issues");
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to merge user accounts.";
    return { ok: false, error: message };
  }
}
