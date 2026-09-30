import { expect, test } from '@playwright/test';

interface DormitoryReview {
  screenPoint(x: number, z: number): { x: number; y: number };
  state(): {
    player: { x: number; z: number };
    moving: boolean;
    walkable: boolean;
    inspection: string | null;
  };
}

declare global {
  interface Window {
    __dormitoryAAAReview?: DormitoryReview;
  }
}

// Windows has the project's target GTX 1070; other runners retain their default renderer.
test.use({
  launchOptions:
    process.platform === 'win32'
      ? { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }
      : {},
});

test('le dortoir autonome se parcourt et permet les trois observations sans modifier le dossier', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/cyberpunk-holt/dormitory-aaa.html');
  await page.waitForFunction(() => window.__dormitoryAAAReview);
  const saved = await page.evaluate(() => ({ ...localStorage }));

  const observations = [
    { x: -3.45, z: -4.42, title: 'Le casier de Franklyn' },
    { x: -3.9, z: -0.45, title: 'Un dernier réveil ici' },
    { x: 3.65, z: 1.75, title: 'La promotion' },
  ];
  for (const observation of observations) {
    const point = await page.evaluate(
      ({ x, z }) => window.__dormitoryAAAReview!.screenPoint(x, z),
      observation,
    );
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() => !window.__dormitoryAAAReview!.state().moving, null, { timeout: 30_000 });
    expect(await page.evaluate(() => window.__dormitoryAAAReview!.state().walkable)).toBe(true);
    await page.keyboard.press('e');
    await expect(page.locator('.story')).toBeVisible();
    await expect(page.locator('.story h2')).toHaveText(observation.title);
    await page.keyboard.press('Escape');
  }

  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(saved);
  expect(errors).toEqual([]);
});
