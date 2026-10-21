import { test, expect, expectNoHorizontalScroll } from "./fixtures";

test.describe("agent lifecycle and settings (#587)", () => {
  test.use({ as: "admin" });

  test("registers an agent, issues a key, and exercises the agent API", async ({ page, playwright, baseURL, uniq }) => {
    const agentName = uniq("TestBot").slice(0, 30);

    // 1. Navigate to Settings -> Agents
    await page.goto("/settings/agents");
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();

    // 2. Fill the create agent form
    await page.locator("#agent-name").fill(agentName);
    const submitBtn = page.getByRole("button", { name: /create agent/i });
    await submitBtn.click();

    // 3. Verify key is issued
    const keyInput = page.locator("#new-agent-key");
    await expect(keyInput).toBeVisible();
    const rawKey = await keyInput.inputValue();
    expect(rawKey).toMatch(/^ak_/);

    // Click "I've saved it" to dismiss the banner
    await page.getByRole("button", { name: /saved it/i }).click();

    // 4. Verify agent appears in the list
    await expect(page.getByText(agentName).first()).toBeVisible();
    await expectNoHorizontalScroll(page);

    // 5. Use the issued agent key to hit the Agent API
    const apiRequest = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${rawKey}`,
      },
    });

    // Test GET /api/v1/projects
    const projectsRes = await apiRequest.get("/api/v1/projects");
    expect(projectsRes.status()).toBe(200);
    const projectsData = await projectsRes.json();
    expect(Array.isArray(projectsData)).toBe(true);

    // Test POST /api/v1/agents/me/availability
    const availRes = await apiRequest.post("/api/v1/agents/me/availability", {
      data: { available: true },
    });
    expect([200, 204]).toContain(availRes.status());

    await apiRequest.dispose();
  });

  test("unauthenticated requests to the agent API are rejected", async ({ playwright, baseURL }) => {
    const apiRequest = await playwright.request.newContext({ baseURL });
    const res = await apiRequest.get("/api/v1/projects");
    expect([401, 403]).toContain(res.status());
    await apiRequest.dispose();
  });
});
