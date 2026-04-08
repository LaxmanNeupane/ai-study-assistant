import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePdf = path.join(__dirname, "..", "fixtures", "memory-lecture.pdf");

test("student can complete the core study flow in the browser", async ({ page }) => {
  page.on("pageerror", (error) => {
    console.log(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log(`console-error: ${message.text()}`);
    }
  });

  await page.goto("/");

  await page.getByLabel("Course name").fill("Cognitive Psychology");
  await page.getByLabel("Course code").fill("PSYC 230");
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page.getByRole("heading", { name: "Active course", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cognitive Psychology" })).toBeVisible();
  await expect(page.getByText("Study flow readiness")).toBeVisible();
  await expect(page.getByText("Course selected")).toBeVisible();

  await page.getByLabel("Choose one or more supported PDF files").setInputFiles(fixturePdf);
  await page.getByRole("button", { name: "Upload to active course" }).click();

  await expect(page.getByText(/1 PDF processed for Cognitive Psychology\./)).toBeVisible();
  await expect(page.locator("#document-list").getByText(/Retrieval cues improve recall/i)).toBeVisible();

  await page.getByRole("button", { name: "Generate notes for active course" }).click();
  await expect(
    page.getByText(/Study notes generated( with trust warnings)? from the active course only\./)
  ).toBeVisible();
  await expect(page.getByText("Course summary")).toBeVisible();

  await page.getByLabel("Ask a question using the active course only").fill(
    "What improves recall according to this course material?"
  );
  await page.getByRole("button", { name: "Ask grounded question" }).click();

  await expect(page.getByText("Answer generated from the active course only.")).toBeVisible();
  await expect(page.locator("#qa-output")).toContainText(/Retrieval cues improve recall/i);
});
