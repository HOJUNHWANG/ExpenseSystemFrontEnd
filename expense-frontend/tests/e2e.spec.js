/* eslint-env node */
import { test, expect } from "@playwright/test";

const LS_KEY = "expense-demo-guided-v1";

test.beforeEach(async ({ page }) => {
  // Disable first-run modal in CI
  await page.addInitScript(([k]) => localStorage.setItem(k, "seen"), [LS_KEY]);
});

async function resetDemo(page) {
  await page.goto("/dashboard");
  await page.getByTestId("demo-reset").click();

  // The reset action triggers a re-login (default: EMPLOYEE) and shows the user in sidebar/header.
  await expect(page.getByTestId("current-user").getByText("Jun Employee")).toBeVisible();
  await expect(page.getByTestId("current-user").getByText("(EMPLOYEE)")).toBeVisible();
}

async function viewAs(page, label) {
  await page.getByRole("button", { name: label }).click();

  const roleCodeByLabel = {
    Employee: "EMPLOYEE",
    Manager: "MANAGER",
    CFO: "CFO",
    CEO: "CEO",
  };
  const roleCode = roleCodeByLabel[label];
  if (roleCode) {
    // Wait until sidebar/header reflects the active role
    await expect(page.getByTestId("current-user").getByText(new RegExp(`\\(${roleCode}\\)`))).toBeVisible();

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

test("CFO: reject requires per-item note", async ({ page, request }) => {
  test.setTimeout(90_000);
  await resetDemo(page);

  const apiBase = process.env.E2E_API_BASE_URL || "http://localhost:8080";

  // Get Finance user + seeded report id via API
  const login = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: "finance@example.com" },
  });
  expect(login.ok()).toBeTruthy();
  const financeUser = await login.json();
  const financeToken = financeUser.token;

  const qs = new URLSearchParams({
    requesterId: String(financeUser.id),
    requesterRole: "CFO",
    q: "Hotel Exception",
    sort: "activity_desc",
  });

  const search = await request.get(`${apiBase}/api/expense-reports/search?${qs.toString()}`, {
    headers: { "Authorization": `Bearer ${financeToken}` },
  });
  expect(search.ok()).toBeTruthy();
  const list = await search.json();
  const target = (list || []).find((r) => r.title === "Draft — Hotel Exception (needs Finance)");
  expect(target).toBeTruthy();

  // Sanity-check backend seed: special review must exist + have items
  const sr = await request.get(`${apiBase}/api/expense-reports/${target.id}/special-review`, {
    headers: { "Authorization": `Bearer ${financeToken}` },
  });
  expect(sr.ok()).toBeTruthy();
  const srJson = await sr.json();
  expect(Array.isArray(srJson?.items) && srJson.items.length > 0).toBeTruthy();

  // Use E2E login helper to make auth deterministic under CI.
  await page.goto(`/e2e/login?email=${encodeURIComponent("finance@example.com")}&next=${encodeURIComponent(`/policy-exceptions/${target.id}`)}`);

  // Ensure we're not bounced to login
  await expect(page).not.toHaveURL(/\/login/);

  // Basic page shell should render for CFO
  await expect(page.getByRole("heading", { name: "Exception review" })).toBeVisible({ timeout: 30_000 });

  // If auth didn't stick, the page shows a CFO-only message (no checklist). Fail early.
  await expect(page.getByText("Only CFO can access this page.")).toHaveCount(0);

  // Wait for data fetch to finish (CI can be slow)
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  // Ensure review items rendered (otherwise no form controls exist)
  await expect
    .poll(
      async () => {
        return await page.getByTestId(/exception-item-/).count();
      },
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);

  const firstItem = page.getByTestId(/exception-item-/).first();
  await expect(firstItem).toBeVisible();

  // Fill global finance comment (stable test id)
  const commentBox = page.getByTestId("exception-reviewer-comment");
  await expect(commentBox).toBeVisible();
  await commentBox.fill("Policy exception rejected in test.");

  // Set first item to Reject (do not fill finance note)
  await firstItem.getByTestId(/exception-reject-/).click();

  // Should show inline required message for finance note on rejected item
  await expect(page.getByText("Required when rejecting this item.")).toBeVisible();

  // Submit button should be disabled because reject reasons missing
  const submitBtn = page.getByTestId("exception-submit");
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
  await expect(page.getByText("Successfully approved.").first()).toBeVisible();
});

test("flow: exception reject -> edit/resubmit -> approvals", async ({ page, request }) => {
  test.setTimeout(120_000);
  await resetDemo(page);

  const apiBase = process.env.E2E_API_BASE_URL || "http://localhost:8080";
  const title = `E2E — Exception resubmit (${Date.now()})`;

  // 1) Create + submit an exception report (API for speed/determinism)
  const empLogin = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: "jun@example.com" },
  });
  expect(empLogin.ok()).toBeTruthy();
  const employee = await empLogin.json();
  const employeeToken = employee.token;

  const create = await request.post(`${apiBase}/api/expense-reports`, {
    headers: { "Authorization": `Bearer ${employeeToken}` },
    data: {
      submitterId: employee.id,
      title,
      // Create DTO is intentionally minimal in this demo.
      // We follow up with PUT to set destination/dates/items (matches UI draft-save behavior).
      items: [{ date: "2026-01-10", description: "Hotel night", amount: 400, category: "Hotel" }],
    },
  });
  expect(create.ok()).toBeTruthy();
  const reportId = await create.json();

  const patch = await request.put(`${apiBase}/api/expense-reports/${reportId}`, {
    headers: { "Authorization": `Bearer ${employeeToken}` },
    data: {
      submitterId: employee.id,
      title,
      destination: "Boston, United States",
      departureDate: "2026-01-10",
      returnDate: "2026-01-10",
      items: [{ date: "2026-01-10", description: "Hotel night", amount: 400, category: "Hotel" }],
    },
  });
  expect(patch.ok()).toBeTruthy();

  const submit = await request.post(`${apiBase}/api/expense-reports/${reportId}/submit`, {
    headers: { "Authorization": `Bearer ${employeeToken}` },
    data: { submitterId: employee.id, reasons: [] },
  });
  expect(submit.ok()).toBeTruthy();

  // 2) CFO rejects exception review via UI
  await page.goto(
    `/e2e/login?email=${encodeURIComponent("finance@example.com")}&next=${encodeURIComponent(`/policy-exceptions/${reportId}`)}`
  );

  await expect(page.getByRole("heading", { name: "Exception review" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 30_000 });

  // Decide reject for all items + fill required notes
  const items = page.getByTestId(/exception-item-/);
  await expect(items.first()).toBeVisible({ timeout: 30_000 });
  const count = await items.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const it = items.nth(i);
    await it.getByTestId(/exception-reject-/).click();
    await it.getByTestId(/exception-note-/).fill("Over cap for demo.");
  }

  await page.getByTestId("exception-reviewer-comment").fill("Please reduce the amount and resubmit.");
  await expect(page.getByTestId("exception-submit")).toBeEnabled();
  await page.getByTestId("exception-submit").click();
  await expect(page).toHaveURL(new RegExp(`/reports/${reportId}$`));

  // 3) Employee edits the report and resubmits (UI)
  await page.goto(
    `/e2e/login?email=${encodeURIComponent("jun@example.com")}&next=${encodeURIComponent(`/reports/${reportId}`)}`
  );

  await expect(page.getByText('Changes Requested', { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL(new RegExp(`/reports/${reportId}/edit$`));

  // Update hotel amount to be under cap and submit.
  await page.locator('input[inputmode="decimal"]').first().fill("240");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(/\/reports\/in-progress/);

  // 4) Manager approves in approvals queue
  await page.goto(
    `/e2e/login?email=${encodeURIComponent("manager@example.com")}&next=${encodeURIComponent(`/approvals`)}`
  );
  const mgrRow = page.getByRole("row").filter({ hasText: title });
  await expect(mgrRow).toBeVisible({ timeout: 30_000 });
  await mgrRow.getByRole("link", { name: /View \/ Approve/ }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm Approve" }).click();
  await expect(page.getByText("Successfully approved.").first()).toBeVisible();

  // 5) CFO final-approves in approvals queue
  await page.goto(
    `/e2e/login?email=${encodeURIComponent("finance@example.com")}&next=${encodeURIComponent(`/approvals`)}`
  );
  const cfoRow = page.getByRole("row").filter({ hasText: title });
  await expect(cfoRow).toBeVisible({ timeout: 30_000 });
  await cfoRow.getByRole("link", { name: /View \/ Approve/ }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm Approve" }).click();
  await expect(page.getByText("Successfully approved.").first()).toBeVisible();

  // 6) Employee sees APPROVED
  await page.goto(
    `/e2e/login?email=${encodeURIComponent("jun@example.com")}&next=${encodeURIComponent(`/reports/${reportId}`)}`
  );
  await expect(page.getByText('Approved', { exact: true })).toBeVisible({ timeout: 30_000 });
});
