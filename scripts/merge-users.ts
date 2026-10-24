/**
 * Merge a duplicate or phantom user account into a primary account (#651).
 *
 * Usage:
 *   pnpm tsx scripts/merge-users.ts --source <sourceUserId> --target <targetUserId>
 */
import { prisma } from "../lib/prisma";
import { mergeUserAccounts } from "../lib/user-merge";

function parseArgs(): { sourceUserId: string; targetUserId: string } {
  const args = process.argv.slice(2);
  let sourceUserId = "";
  let targetUserId = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) {
      sourceUserId = args[++i];
    } else if (args[i] === "--target" && args[i + 1]) {
      targetUserId = args[++i];
    }
  }

  if (!sourceUserId || !targetUserId) {
    console.error("Usage: pnpm tsx scripts/merge-users.ts --source <sourceUserId> --target <targetUserId>");
    process.exit(1);
  }

  return { sourceUserId, targetUserId };
}

async function main() {
  const { sourceUserId, targetUserId } = parseArgs();
  console.log(`[merge-users] Merging source user ${sourceUserId} into target user ${targetUserId}...`);

  const result = await mergeUserAccounts(prisma, {
    sourceUserId,
    targetUserId,
  });

  console.log("[merge-users] Merge completed successfully:", result);
}

main()
  .catch((error) => {
    console.error("[merge-users] Merge failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
