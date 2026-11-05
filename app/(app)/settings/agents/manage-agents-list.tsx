"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import type { AgentLevel } from "@prisma/client";
import { AGENT_LEVEL_LABELS } from "@/lib/agents/levels";
import { agentPageHref } from "@/lib/header-nav";
import { AgentAvatar } from "@/components/agent-avatar";
import { LocalTime } from "@/components/local-time";
import { RelativeTime } from "@/components/relative-time";
import { useToast } from "@/components/ui/toast";
import { formatZ } from "@/lib/points/rules";
import { AGENT_REQUEST_MAX_CHARS } from "@/lib/agent-requests";
import { AgentControls } from "./agent-controls";
import { AgentRowKey } from "./agent-row-key";
import type { AgentProjectChoice } from "./create-agent-form";
import {
  agentsMutedClass,
  agentsPrimaryBtn,
  agentsSecondaryBtn,
  agentsSurface,
  levelBadgeClass,
} from "./agents-ui";

export type ManageAgentItem = {
  id: string;
  name: string;
  model: string | null;
  level: AgentLevel;
  burst: boolean;
  burstUntil: string | null;
  createdAt: string;
  revokedAt: string | null;
  personal: boolean;
  /** The owner's avatar pick; null wears the automatic robot. */
  avatar: string | null;
  currentProjectId: string | null;
  recent: boolean;
  status: "working" | "waiting" | "idle" | "offline";
  activity: string;
  activeClaim: {
    number: number;
    title: string;
    status: string;
    projectSlug: string | null;
    claimedAt: string;
    lastHeartbeatAt: string | null;
  } | null;
  unansweredQuestion: {
    id: string;
    body: string;
    createdAt: string;
  } | null;
  instructions: string | null;
  reputation: number;
  earnedPoints: number;
  pointsToday: number;
  bidsCount: number;
  commentsCount: number;
  pendingRequests: number;
  lastSeenAt: string | null;
  apiKeys: {
    id: string;
    prefix: string;
    apiKey: string | null;
    projectId: string | null;
    projectName: string | null;
    lastUsedAt: string | null;
  }[];
};

const STATUS_CONFIG: Record<
  ManageAgentItem["status"],
  { label: string; dot: string; badge: string; motion: string }
> = {
  working: {
    label: "Working",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    motion: "motion-safe:animate-[zk-agent-work_0.9s_ease-in-out_infinite]",
  },
  waiting: {
    label: "Waiting for you",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    motion: "motion-safe:animate-[zk-agent-wave_1.6s_ease-in-out_infinite]",
  },
  idle: {
    label: "Standing by",
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    motion: "motion-safe:animate-[zk-agent-breathe_3.2s_ease-in-out_infinite]",
  },
  offline: {
    label: "Offline",
    dot: "bg-zk-border",
    badge: "bg-zk-chip text-zk-muted border border-zk-border",
    motion: "opacity-40 grayscale",
  },
};

type StatusFilter = "all" | ManageAgentItem["status"];

export function ManageAgentsList({
  agents,
  activeCount,
  maxActive,
  levels,
  projects,
  now,
  canSetBurst,
  onSendInstruction,
}: {
  agents: ManageAgentItem[];
  activeCount: number;
  maxActive: number;
  levels: AgentLevel[];
  projects: AgentProjectChoice[];
  now: string;
  canSetBurst: boolean;
  onSendInstruction?: (agentId: string, text: string) => Promise<{ ok?: true; error?: string }>;
}) {
  const toast = useToast();
  const searchInputId = useId();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [instructingId, setInstructingId] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState("");
  const [isSending, startTransition] = useTransition();

  // Fleet aggregate statistics
  const workingCount = agents.filter((a) => !a.revokedAt && a.status === "working").length;
  const waitingCount = agents.filter((a) => !a.revokedAt && a.status === "waiting").length;
  const idleCount = agents.filter((a) => !a.revokedAt && a.status === "idle").length;
  const offlineCount = agents.filter((a) => a.revokedAt || a.status === "offline").length;

  const fleetPointsToday = agents.reduce((sum, a) => sum + (a.pointsToday || 0), 0);
  const fleetEarnedTotal = agents.reduce((sum, a) => sum + (a.earnedPoints || 0), 0);
  const totalBids = agents.reduce((sum, a) => sum + (a.bidsCount || 0), 0);
  const burstCount = agents.filter((a) => !a.revokedAt && a.burst).length;

  const meterPct = Math.min(100, Math.round((activeCount / Math.max(maxActive, 1)) * 100));
  const legacyCount = agents.reduce(
    (count, agent) => count + agent.apiKeys.filter((key) => !key.apiKey).length,
    0,
  );

  const visible = agents.filter((agent) => {
    if (statusFilter !== "all" && agent.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      (agent.model?.toLowerCase().includes(q) ?? false) ||
      AGENT_LEVEL_LABELS[agent.level].toLowerCase().includes(q) ||
      agent.activity.toLowerCase().includes(q) ||
      (agent.instructions?.toLowerCase().includes(q) ?? false) ||
      (agent.activeClaim?.title.toLowerCase().includes(q) ?? false)
    );
  });

  function handleSendInstruction(agentId: string, agentName: string) {
    if (!instructionText.trim() || !onSendInstruction) return;
    startTransition(async () => {
      const res = await onSendInstruction(agentId, instructionText);
      if (res?.ok) {
        toast(`Priority task dispatched to ${agentName}. It will act on next poll.`, "success");
        setInstructingId(null);
        setInstructionText("");
      } else {
        toast(res?.error ?? "Failed to send instruction.", "error");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Fleet Telemetry & Summary Matrix */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Fleet Capacity */}
        <div className={`${agentsSurface} flex flex-col justify-between p-5 transition hover:border-electric-blue/40`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.06em] text-zk-muted">
            <span>Fleet capacity</span>
            <span>Limit {maxActive}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zk-text">{activeCount}</span>
            <span className="text-sm font-semibold text-zk-muted">/ {maxActive} active</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zk-seg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-blue to-sky-400 transition-[width] duration-300"
              style={{ width: `${meterPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Live Status Breakdown */}
        <div className={`${agentsSurface} flex flex-col justify-between p-5 transition hover:border-electric-blue/40`}>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-zk-muted">Autonomous status</span>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {workingCount} Working
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {waitingCount} Waiting
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-600 dark:text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              {idleCount} Standing by
            </span>
            {offlineCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zk-chip px-2.5 py-1 text-zk-muted">
                <span className="h-2 w-2 rounded-full bg-zk-border" />
                {offlineCount} Offline
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-zk-muted">Real-time heartbeat signals</p>
        </div>

        {/* Metric 3: Fleet Productivity & Bounties */}
        <div className={`${agentsSurface} flex flex-col justify-between p-5 transition hover:border-electric-blue/40`}>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-zk-muted">Fleet earnings</span>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-zk-text">{formatZ(fleetPointsToday)} today</p>
            <p className="mt-0.5 text-xs text-zk-muted">
              {formatZ(fleetEarnedTotal)} lifetime · {totalBids} bids placed
            </p>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Automated contributor payouts
          </div>
        </div>

        {/* Metric 4: Rate Budget & Health */}
        <div className={`${agentsSurface} flex flex-col justify-between p-5 transition hover:border-electric-blue/40`}>
          <span className="text-xs font-bold uppercase tracking-[0.06em] text-zk-muted">Rate budget quota</span>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-zk-text">
              {burstCount > 0 ? `${burstCount} Burst active` : "Standard 600/h"}
            </p>
            <p className="mt-0.5 text-xs text-zk-muted">
              {burstCount > 0 ? "120k reads/h high-volume unlocked" : "600 reads/h standard safety quota"}
            </p>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-zk-accent">
            {canSetBurst ? "Admin budget controls enabled" : "Standard rate enforcement"}
          </div>
        </div>
      </div>

      {legacyCount > 0 ? (
        <div className="rounded-[20px] border border-zk-warn-bd bg-zk-warn-bg/50 px-4 py-3 text-sm text-zk-warn-fg">
          <p className="font-bold">
            {legacyCount} {legacyCount === 1 ? "key" : "keys"} can&apos;t be copied
          </p>
          <p className="mt-0.5 text-xs">
            Issued before keys were copyable. Regenerate to obtain a fresh one — the new key stays on the same row.
          </p>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter agents by status" className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-zk-seg p-1 text-xs">
          {(
            [
              { id: "all", label: `All (${agents.length})` },
              { id: "working", label: `Working (${workingCount})` },
              { id: "waiting", label: `Waiting (${waitingCount})` },
              { id: "idle", label: `Standing by (${idleCount})` },
              { id: "offline", label: `Offline (${offlineCount})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                  active
                    ? "bg-zk-surface text-zk-text shadow-sm"
                    : "text-zk-muted hover:text-zk-text"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label htmlFor={searchInputId} className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search agents</span>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents, model, activity…"
            className="h-10 w-full rounded-full border border-zk-border bg-zk-surface px-4 text-sm text-zk-text placeholder:text-zk-muted focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className={`${agentsMutedClass} ${agentsSurface} p-8 text-center`}>
          {agents.length === 0 ? "No agents registered yet." : "No agents match your filter criteria."}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((agent) => {
            const lastUsed = agent.apiKeys.find((key) => key.lastUsedAt)?.lastUsedAt ?? null;
            const cfg = STATUS_CONFIG[agent.status];
            const isInstructing = instructingId === agent.id;

            return (
              <li
                key={agent.id}
                className={`${agentsSurface} relative flex flex-col justify-between gap-4 p-5 transition hover:border-electric-blue/60 hover:shadow-[0_12px_32px_rgba(11,23,51,0.12)]`}
              >
                {/* Agent Header */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="relative shrink-0">
                      <div className={cfg.motion}>
                        <AgentAvatar agentId={agent.id} avatar={agent.avatar} size={54} />
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-zk-surface ${cfg.dot}`}
                        title={cfg.label}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={agentPageHref(agent.name)}
                          className="font-extrabold text-zk-text hover:text-zk-accent hover:underline text-base"
                        >
                          {agent.name}
                        </Link>
                        {agent.personal ? (
                          <span className="rounded-full bg-zk-chip px-2 py-0.5 text-[11px] font-medium text-zk-muted">
                            personal
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={levelBadgeClass(agent.level)}>{AGENT_LEVEL_LABELS[agent.level]}</span>
                        {agent.model ? (
                          <span className="rounded-full bg-zk-chip px-2 py-0.5 font-medium text-zk-text2">
                            {agent.model}
                          </span>
                        ) : null}
                        {agent.reputation !== 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold ${
                              agent.reputation > 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {agent.reputation > 0 ? `+${agent.reputation}` : agent.reputation} rep
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Status Chip */}
                  <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${cfg.dot} ${agent.status === "working" ? "animate-ping" : ""}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Active Mission or Telemetry Monitor */}
                {agent.activeClaim ? (
                  <div className="rounded-xl border border-electric-blue/30 bg-electric-blue/5 p-3 text-xs">
                    <div className="flex items-center justify-between text-zk-muted">
                      <span className="font-bold uppercase tracking-wider text-zk-accent">
                        🎯 Active Claim {agent.activeClaim.projectSlug ? `· ${agent.activeClaim.projectSlug}` : ""}
                      </span>
                      {agent.activeClaim.lastHeartbeatAt ? (
                        <span className="text-[11px]">
                          Heartbeat: <RelativeTime date={agent.activeClaim.lastHeartbeatAt} />
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/${agent.activeClaim.projectSlug ?? "ziki"}/${agent.activeClaim.number}`}
                      className="mt-1 block font-bold text-zk-text hover:text-zk-accent hover:underline line-clamp-1"
                    >
                      #{agent.activeClaim.number} {agent.activeClaim.title}
                    </Link>
                  </div>
                ) : agent.unansweredQuestion ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-bold">❓ Waiting for your answer:</p>
                    <p className="mt-0.5 line-clamp-2">{agent.unansweredQuestion.body}</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zk-chip/60 px-3 py-2 text-xs text-zk-muted">
                    <span className="font-semibold text-zk-text2">Telemetry:</span> {agent.activity}
                  </div>
                )}

                {/* Standing Brief / Instructions */}
                {agent.instructions ? (
                  <div className="text-xs text-zk-muted">
                    <span className="font-bold text-zk-text2">Standing brief:</span> &ldquo;{agent.instructions}&rdquo;
                  </div>
                ) : null}

                {/* Performance Micro-Metrics */}
                <div className="grid grid-cols-4 divide-x divide-zk-divider rounded-xl border border-zk-border bg-zk-chip/40 py-2 text-center text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zk-muted">Today</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatZ(agent.pointsToday)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zk-muted">Total</span>
                    <span className="font-mono font-bold text-zk-text">{formatZ(agent.earnedPoints)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zk-muted">Bids</span>
                    <span className="font-bold text-zk-text">{agent.bidsCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zk-muted">Comments</span>
                    <span className="font-bold text-zk-text">{agent.commentsCount}</span>
                  </div>
                </div>

                {/* Priority Request Dispatcher */}
                <div className="border-t border-zk-divider pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setInstructingId(isInstructing ? null : agent.id);
                        setInstructionText("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-zk-accent hover:underline focus-visible:outline-none"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      {isInstructing ? "Close task drawer" : "⚡ Dispatch task"}
                      {agent.pendingRequests > 0 ? (
                        <span className="ml-1 rounded-full bg-zk-chip px-1.5 py-0.2 text-[10px] font-semibold text-zk-muted">
                          {agent.pendingRequests} queued
                        </span>
                      ) : null}
                    </button>
                    <span className="text-[11px] text-zk-muted">
                      {lastUsed ? (
                        <>Active <RelativeTime date={lastUsed} /></>
                      ) : (
                        <>Added <LocalTime date={agent.createdAt} /></>
                      )}
                    </span>
                  </div>

                  {isInstructing ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-electric-blue/40 bg-zk-surface p-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`instruction-${agent.id}`} className="text-xs font-bold text-zk-text">
                          Priority instructions for {agent.name}:
                        </label>
                        <span className="text-[11px] text-zk-muted">
                          {instructionText.length} / {AGENT_REQUEST_MAX_CHARS}
                        </span>
                      </div>
                      <textarea
                        id={`instruction-${agent.id}`}
                        rows={2}
                        value={instructionText}
                        onChange={(e) => setInstructionText(e.target.value)}
                        placeholder="e.g. Focus on Zedu Desktop tickets today. Prioritize UI and responsive bugs."
                        className="w-full rounded-lg border border-zk-border bg-zk-chip p-2.5 text-xs text-zk-text placeholder:text-zk-muted focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setInstructionText("Focus on Zedu Desktop tickets today.")}
                            className="rounded-full bg-zk-chip px-2 py-0.5 text-zk-muted hover:text-zk-text"
                          >
                            + Desktop focus
                          </button>
                          <button
                            type="button"
                            onClick={() => setInstructionText("Triage open ideas and confirm reproducible bugs.")}
                            className="rounded-full bg-zk-chip px-2 py-0.5 text-zk-muted hover:text-zk-text"
                          >
                            + Triage ideas
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={!instructionText.trim() || isSending}
                          onClick={() => handleSendInstruction(agent.id, agent.name)}
                          className={agentsPrimaryBtn + " !min-h-8 !px-3 !text-xs"}
                        >
                          {isSending ? "Dispatching…" : "Dispatch to work feed"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* API Key Strip */}
                {!agent.revokedAt && agent.apiKeys.length ? (
                  <div className="space-y-1.5 border-t border-zk-divider pt-3">
                    {agent.apiKeys.map((key) => (
                      <AgentRowKey
                        key={key.id}
                        apiKey={key.apiKey}
                        prefix={key.prefix}
                        projectId={key.projectId}
                        projectName={key.projectName}
                      />
                    ))}
                  </div>
                ) : null}

                {/* Controls (Level, Project, Burst Quota, Revoke/Delete) */}
                <div className="mt-2 border-t border-zk-divider pt-3">
                  <AgentControls
                    personal={agent.personal}
                    revoked={Boolean(agent.revokedAt)}
                    agentId={agent.id}
                    agentName={agent.name}
                    level={agent.level}
                    levels={levels}
                    projects={projects}
                    currentProjectId={agent.currentProjectId}
                    burst={agent.burst}
                    burstUntil={agent.burstUntil}
                    now={now}
                    canSetBurst={canSetBurst}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
