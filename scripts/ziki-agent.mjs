#!/usr/bin/env node
/**
 * Ziki Agent CLI — command-line helper for the Ziki agent platform.
 *
 *   node scripts/ziki-agent.mjs --help
 *
 * Exports `ApiError` and `backoffMs` for use by tests and other modules.
 * The leading shebang keeps the file directly executable with `node`.
 */

/** API error carrying an HTTP status code. */
export class ApiError extends Error {
  #status;

  constructor(status, message) {
    super(message);
    this.#status = status;
    this.name = "ApiError";
  }

  get status() {
    return this.#status;
  }
}

/**
 * Exponential backoff delay in milliseconds with jitter.
 *
 *   attempt 1 -> base        * (0.5 .. 1.5)
 *   attempt 2 -> base * 2    * (0.5 .. 1.5)
 *   attempt 3 -> base * 4    * (0.5 .. 1.5)
 *   ...capped at `max`.
 */
export function backoffMs(attempt, options = {}) {
  const { base = 1_000, max = 30_000 } = options;
  const exponent = Math.max(0, Math.floor(attempt) - 1);
  const delay = Math.min(base * 2 ** exponent, max);
  return Math.floor(delay * (0.5 + Math.random()));
}

const help = `Usage: node scripts/ziki-agent.mjs [--help]

A command-line helper for the Ziki agent platform.

Options:
  --help    Show this help message and exit`;

// Only run the CLI when this file is the entry point, never when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--help")) {
    console.log(help);
    process.exit(0);
  }
  console.log(help);
}