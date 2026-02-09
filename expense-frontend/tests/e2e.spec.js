import { test, expect } from "@playwright/test";

const LS_KEY = "expense-demo-guided-v1";

test.beforeEach(async ({ page }) => {
  // Disable first-run modal in CI
  await page.addInitScript(([k]) => localStorage.setItem(k, "seen"), [LS_KEY]);
});

async function resetDemo(page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Reset demo" }).click();

  // The reset action triggers a re-login (default: EMPLOYEE) and shows the user in header.
  // Scope to header to avoid strict-mode collisions.
  await expect(page.locator("header").getByText("Jun Employee (EMPLOYEE)")).toBeVisible();
}

async function viewAs(page, label) {
  await page.getByRole("button", { name: label }).click();

  const roleCodeByLabel = {
    Employee: "EMPLOYEE",
    Manager: "MANAGER",
    Finance: "FINANCE",
  };
  const roleCode = roleCodeByLabel[label];
  if (roleCode) {
    // Wait until header reflects the active role
    await expect(page.locator("header").getByText(new RegExp(`\\(${roleCode}\\)`))).toBeVisible();

    // Also wait for localStorage user to update (prevents race between click and navigation)
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const raw = localStorage.getItem("expense-user");
          if (!raw) return null;
          try {
            return JSON.parse(raw)?.role || null;
          } catch {
            return null;
          }
        });
      })
      .toBe(roleCode);
  }
}

test("smoke: reset demo works", async ({ page }) => {
  await resetDemo(page);
});

test("finance: reject requires per-item finance note", async ({ page, request }) => {
  test.setTimeout(90_000);
  await resetDemo(page);

  const apiBase = process.env.E2E_API_BASE_URL || "http://localhost:8080";

  // Get Finance user + seeded report id via API
  const login = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: "finance@example.com" },
  });
  expect(login.ok()).toBeTruthy();
  const financeUser = await login.json();

  const qs = new URLSearchParams({
    requesterId: String(financeUser.id),
    requesterRole: "CFO",
    q: "Hotel Exception",
    sort: "activity_desc",
  });

  const search = await request.get(`${apiBase}/api/expense-reports/search?${qs.toString()}`);
  expect(search.ok()).toBeTruthy();
  const list = await search.json();
  const target = (list || []).find((r) => r.title === "Draft — Hotel Exception (needs Finance)");
  expect(target).toBeTruthy();

  // Sanity-check backend seed: special review must exist + have items
  const sr = await request.get(`${apiBase}/api/expense-reports/${target.id}/special-review`);
  expect(sr.ok()).toBeTruthy();
  const srJson = await sr.json();
  expect(Array.isArray(srJson?.items) && srJson.items.length > 0).toBeTruthy();

  // Use E2E login helper to make auth deterministic under CI.
  await page.goto(`/e2e/login?email=${encodeURIComponent("finance@example.com")}&next=${encodeURIComponent(`/special-approval/${target.id}`)}`);

  // Ensure we're not bounced to login
  await expect(page).not.toHaveURL(/\/login/);

  // Basic page shell should render for Finance
  await expect(page.getByRole("heading", { name: "Finance special approval" })).toBeVisible({ timeout: 30_000 });

  // If auth didn't stick, the page shows a Finance-only message (no checklist). Fail early.
  await expect(page.getByText("Only Finance can access this page.")).toHaveCount(0);

  // Wait for data fetch to finish (CI can be slow)
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  // Ensure review items rendered (otherwise no form controls exist)
  await expect
    .poll(
      async () => {
        return await page.getByTestId(/special-item-/).count();
      },
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);

  const firstItem = page.getByTestId(/special-item-/).first();
  await expect(firstItem).toBeVisible();

  // Fill global finance comment (stable test id)
  const commentBox = page.getByTestId("special-reviewer-comment");
  await expect(commentBox).toBeVisible();
  await commentBox.fill("Policy exception rejected in test.");

  // Set first item to Reject (do not fill finance note)
  await firstItem.getByTestId(/special-reject-/).click();

  // Should show inline required message for finance note on rejected item
  await expect(page.getByText("Required when rejecting this item.")).toBeVisible();

  // Submit button should be disabled because reject reasons missing
  const submitBtn = page.getByTestId("special-submit");
  await expect(submitBtn).toBeDisabled();
});

test("manager: approve a submitted report from approval queue", async ({ page }) => {
  await resetDemo(page);
  await viewAs(page, "Manager");

  await page.goto("/approvals");

  const row = page.getByRole("row", { name: /Submitted — NYC Trip/ });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: /View \/ Approve/ }).click();

  // On detail page, approve flow
  await expect(page).toHaveURL(/\/reports\//);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm Approve" }).click();

  // ApprovalQueuePage consumes ?toast=approved and then replaces URL back to /approvals.
  // So we only assert the toast is visible and we're on approvals.
  await expect(page).toHaveURL(/\/approvals/);
  await expect(page.getByText("Successfully approved.")).toBeVisible();
});
