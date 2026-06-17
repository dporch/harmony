import { test, expect } from '@playwright/test';
import path from 'path';

const AVATAR_PATH = path.join(import.meta.dirname, 'fixtures', 'avatar.png');

test.describe('Avatar upload + persistence + display', () => {
  test('uploaded avatar persists through refresh and shows in room', async ({ page }) => {
    await page.goto('/index.html');

    const fileInput = page.locator('#avatarFile');
    await fileInput.setInputFiles(AVATAR_PATH);

    const avatarImg = page.locator('#avatarImg');
    await expect(avatarImg).toBeVisible();
    const src = await avatarImg.getAttribute('src');
    expect(src).toMatch(/^data:image\//);

    // persists through refresh
    await page.reload();
    await expect(page.locator('#avatarImg')).toBeVisible();
    const srcAfter = await page.locator('#avatarImg').getAttribute('src');
    expect(srcAfter).toMatch(/^data:image\//);

    // shows in room sidebar
    await page.locator('button', { hasText: 'Create a room' }).click();
    await expect(page).toHaveURL(/room\.html#/);
    const sidebarAvatar = page.locator('#peerList img').first();
    await expect(sidebarAvatar).toBeVisible();

    // shows on chat messages
    const composer = page.locator('#composer');
    await composer.fill('test message');
    await composer.press('Enter');
    const msgAvatar = page.locator('#messages .group img').first();
    await expect(msgAvatar).toBeVisible();
  });
});

test.describe('Room creation + joining', () => {
  test('can create a room and join it by code', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#username').fill('tester');
    await page.locator('button', { hasText: 'Create a room' }).click();

    await expect(page).toHaveURL(/room\.html#[0-9a-f-]{36}/);
    const roomUrl = page.url();
    const roomId = new URL(roomUrl).hash.slice(1);

    // room title shows truncated UUID (module script sets it async)
    await expect(page.locator('#roomTitle')).toContainText(roomId.slice(0, 8), { timeout: 5000 });

    // join the same room by pasting the UUID
    await page.goto('/index.html');
    await page.locator('#joinInput').fill(roomId);
    await page.locator('button', { hasText: 'Join' }).click();
    await expect(page).toHaveURL(new RegExp(`room\\.html#${roomId}`));
  });
});

test.describe('Room history', () => {
  test('recently joined rooms appear on the landing page', async ({ page }) => {
    await page.goto('/index.html');

    // create first room
    await page.locator('button', { hasText: 'Create a room' }).click();
    await expect(page).toHaveURL(/room\.html#/);
    const room1Id = new URL(page.url()).hash.slice(1);

    await page.goto('/index.html');
    const recentSection = page.locator('#recentSection');
    await expect(recentSection).toBeVisible();
    await expect(recentSection).toContainText(room1Id.slice(0, 8));

    // create second room
    await page.locator('button', { hasText: 'Create a room' }).click();
    await expect(page).toHaveURL(/room\.html#/);
    const room2Id = new URL(page.url()).hash.slice(1);

    await page.goto('/index.html');
    await expect(recentSection).toContainText(room2Id.slice(0, 8));
    await expect(recentSection).toContainText(room1Id.slice(0, 8));

    // most recent first
    const entries = recentSection.locator('a');
    const firstHref = await entries.first().getAttribute('href');
    expect(firstHref).toContain(room2Id);
  });
});

test.describe('Username persistence', () => {
  test('username persists across page loads', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#username').fill('testuser42');
    await page.locator('button', { hasText: 'Create a room' }).click();

    // name shows in sidebar
    await expect(page.locator('#peerList')).toContainText('testuser42');

    // name restored on landing page
    await page.goto('/index.html');
    const nameValue = await page.locator('#username').inputValue();
    expect(nameValue).toBe('testuser42');
  });
});

test.describe('Emoji picker', () => {
  test('can open picker, select emoji, and send it', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('button', { hasText: 'Create a room' }).click();
    await expect(page).toHaveURL(/room\.html#/);

    // wait for module to wire up the toggle handler
    await page.waitForFunction(() => typeof window.toggleEmoji === 'function', { timeout: 10_000 });

    // open picker
    await page.locator('#emojiToggle').click();
    const panel = page.locator('#emojiPanel');
    await expect(panel).toBeVisible();

    // pick the first emoji in the grid
    const firstEmoji = page.locator('#emojiGrid button').first();
    const emojiText = await firstEmoji.textContent();
    await firstEmoji.click();

    // emoji appears in composer
    const composerValue = await page.locator('#composer').inputValue();
    expect(composerValue).toContain(emojiText);

    // send it
    await page.locator('#composer').press('Enter');

    // message appears in chat
    const messages = page.locator('#messages .group');
    await expect(messages.last()).toContainText(emojiText);
  });
});

test.describe('P2P chat between two users', () => {
  test('two users can exchange messages', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Alice creates a room
    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('alice');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomUrl = pageA.url();

    // Bob joins the same room
    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('bob');
    const roomId = new URL(roomUrl).hash.slice(1);
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();
    await expect(pageB).toHaveURL(new RegExp(`room\\.html#${roomId}`));

    // wait for peer discovery (MQTT signaling can take several seconds)
    await expect(pageA.locator('#peerList')).toContainText('bob', { timeout: 30_000 });
    await expect(pageB.locator('#peerList')).toContainText('alice', { timeout: 30_000 });

    // Alice sends a message
    await pageA.locator('#composer').fill('hello from alice');
    await pageA.locator('#composer').press('Enter');

    // Bob sees it
    await expect(pageB.locator('#messages')).toContainText('hello from alice', { timeout: 15_000 });

    // Bob replies
    await pageB.locator('#composer').fill('hey alice!');
    await pageB.locator('#composer').press('Enter');

    // Alice sees it
    await expect(pageA.locator('#messages')).toContainText('hey alice!', { timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });
});
