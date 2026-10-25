import { describe, expect, it } from "vitest";
import { ApiError, backoffMs } from "./ziki-agent.mjs";
import { execSync } from "child_process";

const scriptPath = new URL("./ziki-agent.mjs", import.meta.url).pathname;

describe("ApiError", () => {
  it("creates an error with status and message", () => {
    const error = new ApiError(404, "Issue not found.");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Issue not found.");
  });

  it("is an instance of Error", () => {
    const error = new ApiError(500, "boom");
    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of ApiError", () => {
    const error = new ApiError(500, "boom");
    expect(error).toBeInstanceOf(ApiError);
  });

  it("has name ApiError", () => {
    const error = new ApiError(500, "boom");
    expect(error.name).toBe("ApiError");
  });

  it("has a non-empty string stack", () => {
    const error = new ApiError(500, "boom");
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe("string");
    expect(error.stack!.length).toBeGreaterThan(0);
  });

  it("supports common HTTP status codes", () => {
    expect(new ApiError(400, "x").status).toBe(400);
    expect(new ApiError(401, "x").status).toBe(401);
    expect(new ApiError(403, "x").status).toBe(403);
    expect(new ApiError(404, "x").status).toBe(404);
    expect(new ApiError(422, "x").status).toBe(422);
    expect(new ApiError(500, "x").status).toBe(500);
  });

  it("can be thrown and caught by type", () => {
    expect(() => {
      throw new ApiError(418, "I'm a teapot");
    }).toThrow(ApiError);
  });

  it("preserves the message in its string form", () => {
    const error = new ApiError(404, "not found");
    expect(String(error)).toContain("not found");
  });

  it("accepts an empty message", () => {
    const error = new ApiError(400, "");
    expect(error.message).toBe("");
    expect(error.status).toBe(400);
  });
});

describe("backoffMs", () => {
  it("returns a jittered base delay for attempt 1", () => {
    const delay = backoffMs(1);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1_500);
  });

  it("grows exponentially with each attempt", () => {
    const d1 = backoffMs(1);
    const d2 = backoffMs(2);
    const d3 = backoffMs(3);
    expect(d2).toBeGreaterThan(d1 * 0.8);
    expect(d3).toBeGreaterThan(d2 * 0.8);
  });

  it("caps the delay at max", () => {
    const delay = backoffMs(100, { base: 1_000, max: 500 });
    expect(delay).toBeGreaterThanOrEqual(250);
    expect(delay).toBeLessThanOrEqual(750);
  });

  it("respects a custom base", () => {
    const delay = backoffMs(1, { base: 100, max: 10_000 });
    expect(delay).toBeGreaterThanOrEqual(50);
    expect(delay).toBeLessThanOrEqual(150);
  });

  it("respects a custom max", () => {
    const delay = backoffMs(10, { base: 100, max: 500 });
    expect(delay).toBeGreaterThanOrEqual(250);
    expect(delay).toBeLessThanOrEqual(750);
  });

  it("always returns an integer", () => {
    expect(Number.isInteger(backoffMs(1))).toBe(true);
    expect(Number.isInteger(backoffMs(7))).toBe(true);
  });

  it("treats attempt 0 like attempt 1", () => {
    const delay = backoffMs(0);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1_500);
  });

  it("treats a negative attempt like attempt 1", () => {
    const delay = backoffMs(-1);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1_500);
  });

  it("stays within jitter bounds for a high attempt", () => {
    // base 1000, attempt 5 => 1000 * 2^4 = 16_000, jittered to 8_000..24_000
    for (let i = 0; i < 50; i++) {
      const delay = backoffMs(5);
      expect(delay).toBeGreaterThanOrEqual(8_000);
      expect(delay).toBeLessThanOrEqual(24_000);
    }
  });

  it("returns different values across calls (jitter is applied)", () => {
    const values = new Set<number>();
    for (let i = 0; i < 20; i++) values.add(backoffMs(3));
    expect(values.size).toBeGreaterThan(1);
  });

  it("works with default options", () => {
    const delay = backoffMs(2);
    expect(delay).toBeGreaterThanOrEqual(1_000);
    expect(delay).toBeLessThanOrEqual(3_000);
  });

  it("never exceeds max even for very large attempts", () => {
    const delay = backoffMs(1_000_000, { base: 1, max: 42 });
    expect(delay).toBeGreaterThanOrEqual(21);
    expect(delay).toBeLessThanOrEqual(63);
  });
});

describe("CLI", () => {
  it("prints usage with --help", () => {
    const output = execSync(`node "${scriptPath}" --help`, { encoding: "utf8" });
    expect(output).toContain("Usage");
    expect(output).toContain("ziki-agent");
  });

  it("exits with code 0 when --help is passed", () => {
    expect(() =>
      execSync(`node "${scriptPath}" --help`, { encoding: "utf8" })
    ).not.toThrow();
  });

  it("prints usage when run with no arguments", () => {
    const output = execSync(`node "${scriptPath}"`, { encoding: "utf8" });
    expect(output).toContain("Usage");
  });

  it("lists the --help option in its output", () => {
    const output = execSync(`node "${scriptPath}" --help`, { encoding: "utf8" });
    expect(output).toContain("--help");
  });

  it("still prints usage when unknown arguments are passed", () => {
    const output = execSync(
      `node "${scriptPath}" --unknown-flag`,
      { encoding: "utf8" }
    );
    expect(output).toContain("Usage");
  });
});