import { test, expect, reportIssue, expectNoHorizontalScroll } from "./fixtures";

test.describe("points and disputes (#587)", () => {
  test("files and views a points dispute", async ({ page, uniq }) => {
    // 1. Report an issue to have a valid issue number
    const title = uniq("Dispute Target Issue");
    await reportIssue(page, title);

    // 2. Open the dispute form
    await page.goto("/points/disputes/new");
    await expect(page.getByRole("heading", { name: "Open a points dispute" })).toBeVisible();

    // 3. Fill the dispute form
    await page.locator("#bugNumber").fill("1");
    await page.locator("#reason").fill("I resolved this ticket but points were not credited.");
    await page.getByRole("button", { name: /submit dispute|open dispute/i }).click();

    // 4. Confirmation appears
    await expect(page.getByText(/dispute/i)).toBeVisible();
    await expectNoHorizontalScroll(page);

    // 5. Navigate to disputes list
    await page.goto("/points/disputes");
    await expect(page.getByRole("heading", { name: /points disputes/i })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("admin views the disputes list", async ({ browser, width }) => {
    const { authFile } = await import("./users");
    const adminContext = await browser.newContext({ storageState: authFile("admin", width) });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/points/disputes");
    await expect(adminPage.getByRole("heading", { name: /points disputes/i })).toBeVisible();
    await expectNoHorizontalScroll(adminPage);

    await adminContext.close();
  });
});
