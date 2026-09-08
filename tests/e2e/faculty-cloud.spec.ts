import { test, expect } from "@playwright/test";

for (const [view, targetYaw] of [["front", 0], ["mirrored", Math.PI]] as const) {
test(`dragging to ${view} unlocks once and the next round resets`, async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "3D 雲點猜教授" }).click();
  const puzzle = page.getByRole("group", { name: "旋轉點雲，讓人像成形通關" });
  await expect(puzzle).toBeVisible();
  await expect(puzzle.getByText("載入人像點雲中…")).toBeHidden();
  await expect(puzzle.getByText(/照片載入失敗/)).toBeHidden();
  const next = page.getByText("挑戰下一位教授（連勝中 🔥）", { exact: true });
  await expect(next).toBeHidden();
  await puzzle.screenshot({ path: `test-results/cloud-puzzle-${view}-start.png` });
  const box = (await puzzle.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // Yaw reaches the target, but pitch is still wrong: must not unlock.
  const targetX = x + (targetYaw - 1.05) / 0.009;
  await page.mouse.move(targetX, y, { steps: 15 });
  await expect(next).toBeHidden();
  await page.mouse.move(targetX, y + 0.3 / 0.009, { steps: 15 });
  await page.mouse.up();
  await expect(next).toBeVisible();
  await expect(page.getByText("🔥 連勝 1", { exact: true })).toBeVisible();
  await puzzle.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("🔥 連勝 1", { exact: true })).toBeVisible();
  await page.waitForTimeout(1800); // Capture the existing celebration after it settles.
  await puzzle.screenshot({ path: `test-results/cloud-puzzle-${view}-solved.png` });
  await next.click();
  await expect(next).toBeHidden();
  await expect(puzzle.getByText("載入人像點雲中…")).toBeHidden();
  await expect(puzzle.getByText(/讓人像成形即可通關/)).toBeVisible();
});
}
