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
  }
}

test("smoke: reset demo works", async ({ page }) => {
  await resetDemo(page);
});

test("finance: reject requires per-item finance note", async ({ page, request }) => {
  test.setTimeout(90_000);
  await resetDemo(page);
  await viewAs(page, "Finance");

  const apiBase = process.env.E2E_API_BASE_URL || "http://localhost:8080";

  // Fetch seeded report id via API (more reliable than UI search/table matching)
  const login = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: "finance@example.com" },
  });
  expect(login.ok()).toBeTruthy();
  const financeUser = await login.json();

  const qs = new URLSearchParams({
    requesterId: String(financeUser.id),
    requesterRole: "FINANCE",
    q: "Hotel Exception",
    sort: "activity_desc",
  });

  const search = await request.get(`${apiBase}/api/expense-reports/search?${qs.toString()}`);
  expect(search.ok()).toBeTruthy();
  const list = await search.json();
  const target = (list || []).find((r) => r.title === "Draft — Hotel Exception (needs Finance)");
  expect(target).toBeTruthy();

  // Navigate via dashboard so header/auth state is definitely initialized
  await page.goto("/dashboard");
  await expect(page.locator("header").getByText(/\(FINANCE\)/)).toBeVisible();

  await page.goto(`/special-approval/${target.id}`);

  // Ensure we're not bounced to login
  await expect(page).not.toHaveURL(/\/login/);

  // Basic page shell should render immediately for Finance
  await expect(page.getByRole("heading", { name: "Finance special approval" })).toBeVisible();

  // Wait for data fetch to finish
  await expect(page.getByText("Loading…")).toHaveCount(0);

  // Fill global finance comment
  const commentBox = page.locator("textarea").first();
  await expect(commentBox).toBeVisible();
  await commentBox.fill("Policy exception rejected in test.");

  // Set first item to Reject (do not fill finance note)
  await page.getByRole("button", { name: /Reject/ }).first().click();

  // Should show inline required message for finance note on rejected item
  await expect(page.getByText("Required when rejecting this item.")).toBeVisible();

  // Submit button should be disabled because reject reasons missing
  const submitBtn = page.getByRole("button", { name: /Reject special approval|Approve special approval/ });
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
