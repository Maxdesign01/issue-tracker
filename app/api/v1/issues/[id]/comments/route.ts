import { NextResponse, type NextRequest } from "next/server";
import { agentIssueRequest, commentOnAgentIssue, issueProject, listAgentIssueComments } from "@/lib/agent-api/issues";

/** GET ?projectId=&after=&limit= lists comments for an issue, oldest first. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return agentIssueRequest(request, "comments.read", "observer", id, async (agent) => {
    const scope = await issueProject(agent, request.nextUrl.searchParams);
    return NextResponse.json(await listAgentIssueComments(scope, id, request.nextUrl.searchParams));
  });
}

/** POST { body, parentId? }; projectId in query or body. Records the owner and agent. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return agentIssueRequest(request, "comments.create", "contributor", id,
    (agent) => commentOnAgentIssue(agent, request, id));
}
