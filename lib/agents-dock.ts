import { isReservedProjectSlug } from "@/lib/project-slug";

/** The agents strip's height (#agents-dock); the page keeps this much free at its foot. */
export const AGENTS_DOCK_HEIGHT = 76;

/** The workspace's own pages that are work pages (#2724). */
const WORK_ROOTS = new Set(["home", "feed", "inbox", "activity"]);

/**
 * A project's pages that are work pages (#2724): its lists and ideas, its
 * issues, an issue's page and the workstream (the work feed). A project's
 * organization area and its notes are not work pages.
 */
const WORK_PROJECT_PAGES = new Set(["ideas", "issues", "workstream", "work"]);

/**
 * Whether the agents bar belongs on this page (#2724): the workspace's home,
 * feed, inbox and activity, and a project's lists, ideas, issues, issue pages
 * and workstream. Settings, admin, docs, the agents' own pages and everything
 * else leave it off.
 */
export function isAgentsDockWorkPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const [first, second] = pathname.split("/").filter(Boolean);
  if (!first) return false;
  if (WORK_ROOTS.has(first)) return true;
  if (isReservedProjectSlug(first)) return false;
  // A project's landing page: its issues and ideas list.
  if (!second) return true;
  if (WORK_PROJECT_PAGES.has(second)) return true;
  // An issue's page: /<project>/<number>, and its own subpages.
  return /^\d+$/.test(second);
}
