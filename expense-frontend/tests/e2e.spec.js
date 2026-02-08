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

test("finance: reject requires per-item finance note", async ({ page }) => {
  await resetDemo(page);
  await viewAs(page, "Finance");

  await page.goto("/search");
  await page.getByPlaceholder("e.g. NYC Trip").fill("Hotel Exception");
  await page.getByRole("button", { name: "Search" }).click();

  // Click the result view link (routes to special approval when status is FINANCE_SPECIAL_REVIEW)
  await page.getByRole("link", { name: "View" }).first().click();

  // We should be on special approval page
  await expect(page).toHaveURL(/\/special-approval\//);

  // Fill global reviewer comment (required when any reject)
  await page.getByLabel(/Reviewer comment/i).fill("Policy exception rejected in test.");

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
  await page.getByText("Submitted — NYC Trip").click();

  // On detail page, approve flow
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Confirm Approve" }).click();

  // We should be redirected back to approvals with toast
  await expect(page).toHaveURL(/\/approvals\?toast=approved/);
  await expect(page.getByText("Successfully approved.")).toBeVisible();
});
