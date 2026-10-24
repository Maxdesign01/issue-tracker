import { describe, expect, it } from "vitest";
import { canChangeTicketStatus } from "@/lib/ticket-triage";

describe("canChangeTicketStatus", () => {
  it("allows an organization admin regardless of assignment", () => {
    expect(
      canChangeTicketStatus({
        actorId: "admin-1",
        actorRole: "user",
        membershipRole: "admin",
        currentAssigneeId: null,
      }),
    ).toBe(true);
    expect(
      canChangeTicketStatus({
        actorId: "admin-1",
        actorRole: "super_admin",
        membershipRole: "member",
        currentAssigneeId: "someone-else",
      }),
    ).toBe(true);
  });

  it("denies a site-wide admin who is only a member of this organization", () => {
    expect(
      canChangeTicketStatus({
        actorId: "admin-1",
        actorRole: "admin",
        membershipRole: "member",
        currentAssigneeId: null,
      }),
    ).toBe(false);
  });

  it("allows the current assignee", () => {
    expect(
      canChangeTicketStatus({
        actorId: "assignee-1",
        actorRole: "user",
        currentAssigneeId: "assignee-1",
      }),
    ).toBe(true);
  });

  // Regression test for #202.
  it("denies a non-assignee on an unassigned issue", () => {
    expect(
      canChangeTicketStatus({
        actorId: "random-user",
        actorRole: "user",
        currentAssigneeId: null,
      }),
    ).toBe(false);
  });

  it("denies a non-assignee on someone else's issue", () => {
    expect(
      canChangeTicketStatus({
        actorId: "random-user",
        actorRole: "user",
        currentAssigneeId: "assignee-1",
      }),
    ).toBe(false);
  });

  it("denies an anonymous actor", () => {
    expect(
      canChangeTicketStatus({
        actorId: null,
        actorRole: "user",
        currentAssigneeId: null,
      }),
    ).toBe(false);
  });

  // #649: Reporter closing their own unconfirmed, unassigned issue
  describe("reporter closing unconfirmed, unassigned issue (#649)", () => {
    it("allows the reporter to close an unassigned, unconfirmed issue", () => {
      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "closed",
        }),
      ).toBe(true);
    });

    it("denies the reporter from setting any status other than closed", () => {
      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "resolved",
        }),
      ).toBe(false);

      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "in_progress",
        }),
      ).toBe(false);

      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "open",
        }),
      ).toBe(false);
    });

    it("denies the reporter if the issue is already assigned to someone", () => {
      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: "assignee-1",
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "closed",
        }),
      ).toBe(false);
    });

    it("denies the reporter if the issue is already confirmed", () => {
      expect(
        canChangeTicketStatus({
          actorId: "reporter-1",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: true,
          targetStatus: "closed",
        }),
      ).toBe(false);
    });

    it("denies a non-reporter on an unassigned, unconfirmed issue", () => {
      expect(
        canChangeTicketStatus({
          actorId: "random-user",
          actorRole: "user",
          membershipRole: "member",
          currentAssigneeId: null,
          reporterId: "reporter-1",
          isConfirmed: false,
          targetStatus: "closed",
        }),
      ).toBe(false);
    });
  });
});
