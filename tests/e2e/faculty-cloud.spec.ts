import { test, expect } from "@playwright/test";

for (const [view, targetYaw] of [["front", 0], ["mirrored", Math.PI]] as const) {
test(`dragging to ${view} unlocks once and the next round resets`, async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "教授" }).click();
  const puzzle = page.getByRole("group", { name: "旋轉視角，對準正面解鎖" });
  await expect(puzzle).toBeVisible();
  await expect(puzzle.getByText("載入教授人像中…")).toBeHidden();
  await expect(puzzle.getByText(/照片載入失敗/)).toBeHidden();
  const next = page.getByText(/挑戰下/, { exact: false });
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
  await expect(page.getByText("🤔 這是系上的教授嗎？")).toBeVisible();
  const isTeacherBtn = page.getByRole("button", { name: "是教授" });
  await isTeacherBtn.click();
  await puzzle.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(1800); // Capture the existing celebration after it settles.
  await puzzle.screenshot({ path: `test-results/cloud-puzzle-${view}-solved.png` });
  if (await next.isVisible()) {
    await next.click();
    await expect(next).toBeHidden();
    await expect(puzzle.getByText("載入教授人像中…")).toBeHidden();
    await expect(puzzle.getByText(/拖曳或方向鍵旋轉/)).toBeVisible();
  }
});
}
