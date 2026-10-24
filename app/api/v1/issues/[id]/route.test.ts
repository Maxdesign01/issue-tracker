import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAgent: vi.fn(),
  budget: vi.fn(),
  readAgentIssue: vi.fn(),
  closeAgentIssue: vi.fn(),
  project: vi.fn(),
}));

vi.mock("@/lib/agents/require-agent", async (original) => ({
  ...(await original<typeof import("@/lib/agents/require-agent")>()),
  requireAgent: mocks.requireAgent,
}));

vi.mock("@/lib/agents/rate-budget", () => ({
  consumeAgentBudget: mocks.budget,
  agentBudgetExceededResponse: () => new Response(JSON.stringify({ error: "Too many requests." }), { status: 429 }),
}));

vi.mock("@/lib/agents/audit", () => ({ audit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { project: { findFirst: mocks.project } } }));

vi.mock("@/lib/agent-api/issues", async (original) => {
  const actual = await original<typeof import("@/lib/agent-api/issues")>();
  return {
    ...actual,
    readAgentIssue: mocks.readAgentIssue,
    closeAgentIssue: mocks.closeAgentIssue,
  };
});

import { GET, PATCH, POST, PUT, DELETE } from "./route";
import { IssueApiError } from "@/lib/agent-api/issues";

const agent = {
  agentId: "a1",
  name: "a1",
  ownerId: "o1",
  tenantId: "tenant",
  level: "observer" as const,
  burst: false,
  keyId: "k",
  projectId: null,
};
const params = { params: Promise.resolve({ id: "bug1" }) };
const PROJECT = "cmvggfa9v003yn72gfxaplftl";

function makeRequest(method: string, body?: unknown, projectId: string | null = PROJECT) {
  return new NextRequest(`http://localhost/api/v1/issues/bug1${projectId ? `?projectId=${projectId}` : ""}`, {
    method,
    headers: {
      authorization: "Bearer test-key",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("/api/v1/issues/[id] (#649)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAgent.mockResolvedValue(agent);
    mocks.budget.mockResolvedValue({ allowed: true });
    mocks.project.mockResolvedValue({ id: PROJECT });
  });

  describe("GET", () => {
    it("returns the issue details", async () => {
      mocks.readAgentIssue.mockResolvedValue({ id: "bug1", title: "A bug", status: "open" });
      const res = await GET(makeRequest("GET"), params);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ issue: { id: "bug1", title: "A bug", status: "open" } });
    });
  });

  describe("PATCH (#649: close unconfirmed issue)", () => {
    it("closes the issue when status is closed", async () => {
      mocks.closeAgentIssue.mockResolvedValue({ id: "bug1", title: "A bug", status: "closed" });
      const res = await PATCH(makeRequest("PATCH", { status: "closed", resolutionNote: "Mistake" }), params);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ issue: { id: "bug1", title: "A bug", status: "closed" } });
      expect(mocks.budget).toHaveBeenCalledWith({ id: "a1", burst: false, burstUntil: null }, "write");
      expect(mocks.closeAgentIssue).toHaveBeenCalledWith(
        agent,
        { tenantId: "tenant", projectId: PROJECT },
        "bug1",
        "Mistake",
      );
    });

    it("rejects statuses other than closed with 400", async () => {
      const res = await PATCH(makeRequest("PATCH", { status: "resolved" }), params);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual(
        expect.objectContaining({ error: "invalid_body" }),
      );
      expect(mocks.closeAgentIssue).not.toHaveBeenCalled();
    });

    it("passes through 403 when agent is not the reporter", async () => {
      mocks.closeAgentIssue.mockRejectedValue(
        new IssueApiError(403, "forbidden", { message: "Only the reporter can close an unconfirmed issue." }),
      );
      const res = await PATCH(makeRequest("PATCH", { status: "closed" }), params);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: "forbidden",
        message: "Only the reporter can close an unconfirmed issue.",
      });
    });

    it("passes through 400 when issue is already assigned or confirmed", async () => {
      mocks.closeAgentIssue.mockRejectedValue(
        new IssueApiError(400, "bad_request", { message: "Cannot close an assigned issue." }),
      );
      const res = await PATCH(makeRequest("PATCH", { status: "closed" }), params);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "bad_request",
        message: "Cannot close an assigned issue.",
      });
    });
  });

  describe("Disallowed HTTP methods", () => {
    it.each([
      ["POST", POST],
      ["PUT", PUT],
      ["DELETE", DELETE],
    ])("returns 405 for %s", async (_, handler) => {
      const res = await handler(makeRequest("POST"));
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toContain("PATCH");
    });
  });
});
