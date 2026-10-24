import type { MembershipRole } from "@prisma/client";
import { isOrganizationAdmin } from "@/lib/organization-role";
import type { AppRole } from "@/lib/roles";

export const TICKET_TRIAGE_ERRORS = {
  statusUnauthorized:
    "Only the assignee, or an owner or admin of this organization, can change this issue's status",
} as const;

export type CanChangeTicketStatusParams = {
  actorId?: string | null;
  actorRole?: AppRole | null;
  membershipRole?: MembershipRole | null;
  currentAssigneeId?: string | null;
  reporterId?: string | null;
  isConfirmed?: boolean;
  targetStatus?: string | null;
};

/**
 * Checks whether a user may change an issue's status.
 *
 * Allowed: the issue's assignee of record, or an owner / admin of its organization.
 * The site super admin counts. A site-wide admin who is only a member does not.
 *
 * Note that this is deliberately evaluated against `currentAssigneeId` - the
 * assignee the issue has *now* - and never against the assignee the request is
 * trying to set. Otherwise a user could self-assign an unassigned issue and, in
 * the same request, close it.
 *
 * #649: An issue's reporter may also close their own issue, provided it is
 * currently unassigned, not yet confirmed, and the requested status is "closed".
 */
export function canChangeTicketStatus({
  actorId,
  actorRole,
  membershipRole,
  currentAssigneeId,
  reporterId,
  isConfirmed = false,
  targetStatus,
}: CanChangeTicketStatusParams): boolean {
  if (!actorId) return false;
  if (isOrganizationAdmin(membershipRole, actorRole)) return true;
  if (currentAssigneeId && actorId === currentAssigneeId) return true;
  if (
    reporterId &&
    actorId === reporterId &&
    !currentAssigneeId &&
    !isConfirmed &&
    targetStatus === "closed"
  ) {
    return true;
  }
  return false;
}
