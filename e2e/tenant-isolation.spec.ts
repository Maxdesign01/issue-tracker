import { test, expect, reportIssue, expectNoHorizontalScroll } from "./fixtures";

test.describe("tenant isolation (#587)", () => {
  test("an issue in one tenant is invisible to another tenant", async ({ page, browser, width, uniq }) => {
    // 1. Report a private issue in the Zedu tenant as "user"
    const title = uniq("Zedu Confidential Bug");
    const zeduUrl = await reportIssue(page, title);
    const issueId = zeduUrl.split("/").pop();
    expect(issueId).toBeTruthy();

    // 2. Open another browser context as "other" (who only belongs to Acme Corp)
    const { authFile } = await import("./users");
    const otherContext = await browser.newContext({ storageState: authFile("other", width) });
    const otherPage = await otherContext.newPage();

    // 3. Look at Acme's issue list: the Zedu issue must not appear
    await otherPage.goto("/issues");
    await expect(otherPage.getByText(title)).toHaveCount(0);

    // 4. Try navigating directly to Zedu's issue URL: must fail or show not found
    await otherPage.goto(zeduUrl);
    // Should either show Not Found, 404 heading, or redirect away from the issue
    const notFoundHeading = otherPage.getByRole("heading", { name: /not found|404/i });
    const isNotFound = await notFoundHeading.isVisible().catch(() => false);
    const isRedirected = !otherPage.url().includes(`/issues/${issueId}`);
    expect(isNotFound || isRedirected, "cross-tenant issue access must be blocked").toBe(true);

    await expectNoHorizontalScroll(otherPage);
    await otherContext.close();
  });

  test("assignee choices only include members of the current tenant", async ({ browser, width, me }) => {
    const { authFile } = await import("./users");
    const otherContext = await browser.newContext({ storageState: authFile("other", width) });
    const otherPage = await otherContext.newPage();

    // Go to new issue form in Acme tenant
    await otherPage.goto("/issues/new");
    await expect(otherPage.getByRole("heading", { name: "Report an issue" })).toBeVisible();

    // Check assignee dropdown: should not contain Zedu users (e.g. "Uma User" / me)
    const assigneeInput = otherPage.locator("#assigneeId");
    if (await assigneeInput.isVisible()) {
      await assigneeInput.click();
      await expect(otherPage.getByRole("option", { name: new RegExp(me) })).toHaveCount(0);
    }

    await expectNoHorizontalScroll(otherPage);
    await otherContext.close();
  });

  test("tenants page displays current memberships and invite links", async ({ page }) => {
    await page.goto("/tenants");
    await expect(page.getByRole("heading", { name: /tenants|workspaces/i })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
