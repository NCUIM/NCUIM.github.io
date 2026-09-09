import { test, expect } from "@playwright/test";

for (const [view, targetYaw] of [["front", 0], ["mirrored", Math.PI]] as const) {
  test(`spherical cloud: ${view} alignment and fresh round`, async ({ page }) => {
    // Control only round inputs, not geometry or the alignment predicate.
    // Random-start distribution is tested separately in portrait-cloud.test.ts.
    await page.route("**/src/components/faculty/portrait-cloud.ts", async route => {
      const response = await route.fetch();
      const body = await response.text();
      expect(body).toContain("function createInitialRotation() {");
      await route.fulfill({ response, body: body.replace("function createInitialRotation() {",
        "function createInitialRotation() { window.__cloudRound = (window.__cloudRound || 0) + 1; return window.__cloudRound === 1 ? {pitch: 0.4, yaw: 1.3} : {pitch: -0.35, yaw: 2.1};") });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "教授", exact: true }).click();
    const puzzle = page.getByRole("button", { name: "旋轉視角，對準正面解鎖" });
    const question = page.getByText(/^這是.+教授嗎？$/);
    await expect(puzzle).toBeVisible();
    await expect(puzzle.getByText("載入人像中…")).toBeHidden();
    await expect(puzzle.getByText(/載入失敗/)).toBeHidden();
    await puzzle.screenshot({ path: `test-results/cloud-puzzle-${view}-start.png` });
    const drag = async (dx: number, dy: number) => {
      const box = (await puzzle.boundingBox())!;
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx / 0.009, y + dy / 0.009, { steps: 12 });
      await page.mouse.up();
    };
    await drag(targetYaw - 1.3, 0);
    await expect(question).toBeHidden(); // yaw alone is insufficient
    const box = (await puzzle.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 0.4 / 0.009, { steps: 12 });
    await expect(question).toBeHidden(); // aligned, but still holding
    await page.mouse.move(x, y + 0.2 / 0.009, { steps: 12 });
    await page.mouse.up();
    await expect(question).toBeHidden(); // passed the answer, released elsewhere
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 0.2 / 0.009, { steps: 12 });
    await expect(question).toBeHidden();
    await page.mouse.up();
    await expect(question).toBeVisible();
    await puzzle.screenshot({ path: `test-results/cloud-puzzle-${view}-solved.png` });
    await page.getByRole("button", { name: "是", exact: true }).click();
    const next = page.getByRole("button", { name: /下一|再試/ });
    await expect(next).toBeVisible();
    await next.click();
    await expect(next).toBeHidden();
    await expect(puzzle.getByText("載入人像中…")).toBeHidden();
    await expect(question).toBeHidden();
    // Replay the first round's exact gesture: it must not solve this round.
    await drag(targetYaw - 1.3, 0.4);
    await expect(question).toBeHidden();
    // Pitch has clamped to -0.6; solve the new pose, proving reset is playable.
    await drag(-0.8, -0.6);
    await expect(question).toBeVisible();
  });
}
