/**
 * A clean, known database for the end-to-end suite (#299, #587).
 *
 * Empties every table (keeping Prisma's migration history), then adds the
 * standard platforms and issue types and one account per role per width.
 * Run with `pnpm e2e:seed` against a database that has had
 * `prisma migrate deploy`. Never point it at real data: it deletes all of it,
 * so it refuses any database whose name doesn't say it's for tests
 * (AGENTS.md: never reseed a shared or demo database).
 */
import { e2eDb } from "./db";
import bcrypt from "bcryptjs";
import { E2E_PASSWORD, ROLES, STALE_EMAIL, WIDTHS, emailFor, nameFor } from "./users";

const prisma = e2eDb();

async function main() {
  const dbName = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").pathname.replace(/^\//, "");
    } catch {
      return "";
    }
  })();
  if (!/(^|[_-])(e2e|test)([_-]|$)/i.test(dbName)) {
    throw new Error(
      `Refusing to wipe "${dbName || "(no database)"}": the e2e seed only runs on a database named for tests, like bug_tracker_e2e.`,
    );
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename::text AS tablename FROM pg_tables
    WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
  if (tables.length > 0) {
    const list = tables.map((t) => `"${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  }

  // Primary tenant (Zedu / Ziki)
  const tenant = await prisma.tenant.create({
    data: { id: "tenant_zedu", slug: "zedu", name: "Ziki" },
  });
  await prisma.project.create({
    data: { id: "project_zedu", tenantId: tenant.id, slug: "zedu", name: "Ziki", workflow: { create: {} } },
  });

  for (const name of ["Desktop", "Web", "Mobile"]) {
    await prisma.category.create({ data: { tenantId: tenant.id, name, isActive: true } });
  }
  for (const [name, description] of [
    ["Fix", "Issue fixes and defect resolutions"],
    ["Feat", "New features and enhancements"],
    ["Design", "UI/UX and visual design tasks"],
    ["Marketing", "Marketing and promotion related tasks"],
  ]) {
    await prisma.issueType.create({ data: { tenantId: tenant.id, name, description, isActive: true } });
  }

  // Second tenant (Acme Corp) for multi-tenancy and isolation tests (#587)
  const acmeTenant = await prisma.tenant.create({
    data: { id: "tenant_acme", slug: "acme", name: "Acme Corp" },
  });
  await prisma.project.create({
    data: { id: "project_acme", tenantId: acmeTenant.id, slug: "acme", name: "Acme", workflow: { create: {} } },
  });

  for (const name of ["Desktop", "Web", "Mobile"]) {
    await prisma.category.create({ data: { tenantId: acmeTenant.id, name, isActive: true } });
  }
  for (const [name, description] of [
    ["Fix", "Issue fixes and defect resolutions"],
    ["Feat", "New features and enhancements"],
  ]) {
    await prisma.issueType.create({ data: { tenantId: acmeTenant.id, name, description, isActive: true } });
  }

  // Cost 4: these are throwaway test accounts and the suite signs in often.
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 4);
  const roleFor = { user: "user", admin: "admin", super: "super_admin", other: "user" } as const;
  for (const width of WIDTHS) {
    for (const role of ROLES) {
      await prisma.user.create({
        data: {
          email: emailFor(role, width),
          name: nameFor(role, width),
          role: roleFor[role],
          passwordHash,
          emailVerified: new Date(),
          emailNotifications: false,
        },
      });
    }
    await prisma.user.create({
      data: {
        email: STALE_EMAIL(width),
        name: `Stan Stale ${width === "desktop" ? "D" : "M"}`,
        role: "user",
        passwordHash,
        emailVerified: new Date(),
        emailNotifications: false,
      },
    });
  }

  // Memberships:
  // - Zedu gets: user, admin, super, and stale accounts.
  // - Acme gets: other accounts (Otto Other), exercising complete cross-tenant isolation (#587).
  const zeduUsers = await prisma.user.findMany({
    where: { NOT: { email: { contains: "e2e-other-" } } },
    select: { id: true, role: true },
  });
  await prisma.membership.createMany({
    data: zeduUsers.map((user) => ({
      tenantId: tenant.id,
      userId: user.id,
      role: user.role === "super_admin" ? "owner" : user.role === "admin" ? "admin" : "member",
    })),
  });

  const otherUsers = await prisma.user.findMany({
    where: { email: { contains: "e2e-other-" } },
    select: { id: true },
  });
  await prisma.membership.createMany({
    data: otherUsers.map((user) => ({
      tenantId: acmeTenant.id,
      userId: user.id,
      role: "owner",
    })),
  });

  console.log("e2e seed: database reset and seeded (with multi-tenant isolation)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
