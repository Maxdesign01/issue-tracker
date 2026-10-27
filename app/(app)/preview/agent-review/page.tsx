import type { Metadata } from "next";
import { AgentPlanReview } from "@/components/agent-plan-review";

export const metadata: Metadata = {
  title: "Agent Resolution Proposal Review — Ziki",
  description: "Interactive Human-Agent Interaction (HAI) plan review and steering interface.",
};

export default function AgentReviewPreviewPage() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Agent Resolution Review (HAI Preview)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Demonstration of Ziki&apos;s Human-Agent Interaction (HAI) proposal. Maintains human-in-the-loop oversight with granular steering directives and git diff inspection before autonomous branch execution.
        </p>
      </div>

      <AgentPlanReview 
        issueNumber={1042}
        issueTitle="Race condition in event cursor during concurrent polling"
        agentName="agent-sentinel"
        personName="henryuks"
        branchName="fix/1042-event-cursor"
        filesChanged={2}
        additions={50}
        deletions={4}
        estimatedDuration="20m"
      />
    </main>
  );
}