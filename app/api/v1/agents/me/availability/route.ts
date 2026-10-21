import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { agentErrorResponse, requireAgent } from "@/lib/agents/require-agent";
import { agentBudgetExceededResponse, consumeAgentBudget } from "@/lib/agents/rate-budget";
import { withAgentBudgetHeaders } from "@/lib/agents/rate-budget-headers";
import { prisma } from "@/lib/prisma";

const availabilitySchema = z
  .object({
    available: z.boolean({ error: "Send { available: boolean }." }),
  })
  .strict();

/**
 * POST /api/v1/agents/me/availability — mark an agent paused/available (#592).
 * `{ "available": false }` pauses the agent so it receives no offers.
 * `{ "available": true }` clears pausedAt so it is available again.
 */
export async function POST(req: NextRequest) {
  try {
    const agent = await requireAgent(req);
    const budget = await consumeAgentBudget(
      { id: agent.agentId, burst: agent.burst, burstUntil: agent.burstUntil ?? null },
      "write",
    );
    if (!budget.allowed) return agentBudgetExceededResponse(budget.retryAfterSeconds, budget);

    const body = await req.json().catch(() => null);
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", message: "Send { available: boolean }." },
        { status: 400 },
      );
    }

    const { available } = parsed.data;
    const now = new Date();
    const updated = await prisma.agent.update({
      where: { id: agent.agentId },
      data: { pausedAt: available ? null : now },
      select: { id: true, pausedAt: true, lastSeenAt: true },
    });

    return withAgentBudgetHeaders(
      NextResponse.json({
        id: updated.id,
        available: !updated.pausedAt,
        paused_at: updated.pausedAt ? updated.pausedAt.toISOString() : null,
      }),
      budget,
    );
  } catch (error) {
    return agentErrorResponse(error);
  }
}
