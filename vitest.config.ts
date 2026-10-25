import path from "node:path";
import { defineConfig } from "vitest/config";

/** Strips a leading `#!/usr/bin/env node` shebang from `.mjs` modules so
 *  directly-executable CLI scripts can be imported by Vitest without a
 *  SyntaxError (#671). The shebang is only meaningful at process entry. */
function shebangStripPlugin() {
  return {
    name: "shebang-strip",
    enforce: "pre",
    transform(code: string, id: string) {
      if (!id.endsWith(".mjs")) return null;
      const shebangEnd = code.indexOf("\n");
      if (shebangEnd === -1 || !code.startsWith("#!")) return null;
      return code.slice(shebangEnd + 1);
    },
  } as const;
}

export default defineConfig({
  test: {
    // Node by default: most specs are pure logic or route handlers that need
    // Node's Request/FormData globals. Component specs opt into a DOM per file
    // with a `@vitest-environment jsdom` (or happy-dom) docblock.
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "prisma", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Unit-testable code only. app/** (server actions, API routes) needs a
      // live Prisma/DB and is out of scope for jsdom unit tests.
      include: ["components/**/*.{ts,tsx}", "lib/**/*.ts"],
      // Ratchet these upward as component backfill continues. As of ENDOR-219
      // actuals are ~56% lines (lib ~83%, components ~38%); the gap is
      // untested components like app-header/login-form, not this issue's scope.
      thresholds: {
        lines: 50,
        functions: 70,
        branches: 75,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  plugins: [shebangStripPlugin()],
});
