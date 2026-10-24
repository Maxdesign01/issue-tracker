import { createMethodNotAllowed, createOptions } from "@/lib/agent-api/http-errors";
import { NextResponse, type NextRequest } from "next/server";
import { agentIssueRequest, closeAgentIssue, issueJson, issueProject, readAgentIssue } from "@/lib/agent-api/issues";
import { z } from "zod";

const patchBodySchema = z
  .object({
    status: z.literal("closed"),
    resolutionNote: z.string().trim().max(2000).optional(),
    projectId: z.string().optional(),
  })
  .strict();

/** GET ?projectId= returns an issue, its latest 100 comments, its validations, and whether it is confirmed. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return agentIssueRequest(request, "issues.read", "observer", id, async (agent) => {
    const scope = await issueProject(agent, request.nextUrl.searchParams);
    return NextResponse.json({ issue: await readAgentIssue(scope, id) });
  });
}

/** PATCH /api/v1/issues/{id} — close/withdraw an unconfirmed, unassigned issue (#649). */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return agentIssueRequest(
    request,
    "issues.close",
    "observer",
    id,
    async (agent) => {
      const json = await issueJson(request);
      const parsed = patchBodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "invalid_body", message: 'Only { status: "closed" } is supported.' },
          { status: 400 },
        );
      }
      const scope = await issueProject(agent, request.nextUrl.searchParams, parsed.data.projectId);
      const issue = await closeAgentIssue(agent, scope, id, parsed.data.resolutionNote);
      return NextResponse.json({ issue });
    },
    { budget: "write" },
  );
}

const apiMethodNotAllowed = createMethodNotAllowed(["GET", "HEAD", "PATCH", "OPTIONS"]);
const apiOptions = createOptions(["GET", "HEAD", "PATCH", "OPTIONS"]);
export const POST = apiMethodNotAllowed;
export const PUT = apiMethodNotAllowed;
export const DELETE = apiMethodNotAllowed;
export const OPTIONS = apiOptions;
