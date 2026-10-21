import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAgent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/agents/require-agent", async (original) => ({
  ...(await original<typeof import("@/lib/agents/require-agent")>()),
  requireAgent,
}));

const prisma = vi.hoisted(() => ({
  agent: { update: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { POST } from "./route";

describe("POST /api/v1/agents/me/availability (#592)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAgent.mockResolvedValue({
      agentId: "agent-1",
      name: "Test Agent",
      ownerId: "user-1",
      tenantId: "tenant-1",
      level: "contributor",
      burst: false,
    });
  });

  it("pauses an agent when available: false", async () => {
    const now = new Date("2026-10-21T06:00:00.000Z");
    prisma.agent.update.mockResolvedValue({
      id: "agent-1",
      pausedAt: now,
      lastSeenAt: now,
    });

    const req = new NextRequest("http://localhost:3000/api/v1/agents/me/availability", {
      method: "POST",
      body: JSON.stringify({ available: false }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.paused_at).toBe(now.toISOString());
    expect(prisma.agent.update).toHaveBeenCalledWith({
      where: { id: "agent-1" },
      data: { pausedAt: expect.any(Date) },
      select: { id: true, pausedAt: true, lastSeenAt: true },
    });
  });

  it("resumes an agent when available: true", async () => {
    prisma.agent.update.mockResolvedValue({
      id: "agent-1",
      pausedAt: null,
      lastSeenAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/agents/me/availability", {
      method: "POST",
      body: JSON.stringify({ available: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.paused_at).toBeNull();
    expect(prisma.agent.update).toHaveBeenCalledWith({
      where: { id: "agent-1" },
      data: { pausedAt: null },
      select: { id: true, pausedAt: true, lastSeenAt: true },
    });
  });

  it("rejects non-boolean available values with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/agents/me/availability", {
      method: "POST",
      body: JSON.stringify({ available: "invalid" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
