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
    await expect(pageA.locator('#peerList')).toContainText('bob', { timeout: 60_000 });
    await expect(pageB.locator('#peerList')).toContainText('alice', { timeout: 60_000 });

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

test.describe('P2P voice between two users', () => {
  test('alice joins voice and bob receives her audio', async ({ browser }) => {
    // signaling + media renegotiation + a 2.5s audio sample — give it room
    test.setTimeout(120_000);

    const contextA = await browser.newContext({ permissions: ['microphone'] });
    const contextB = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Alice creates a room
    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('alice');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomId = new URL(pageA.url()).hash.slice(1);

    // Bob joins the same room
    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('bob');
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();
    await expect(pageB).toHaveURL(new RegExp(`room\\.html#${roomId}`));

    // both see each other (data channel up before we add media)
    await expect(pageA.locator('#peerList')).toContainText('bob', { timeout: 60_000 });
    await expect(pageB.locator('#peerList')).toContainText('alice', { timeout: 60_000 });

    // both join voice (fake mic tone is granted via launch flags)
    await pageA.locator('button', { hasText: 'Join voice' }).click();
    await pageB.locator('button', { hasText: 'Join voice' }).click();

    // each side flips into the "Voice connected" state
    await expect(pageA.locator('#voiceActivePanel')).toBeVisible();
    await expect(pageB.locator('#voiceActivePanel')).toBeVisible();

    // Bob receives Alice's stream → the app attaches an <audio> for her peer id
    const bobAudio = pageB.locator('#audioContainer audio');
    await expect(bobAudio).toHaveCount(1, { timeout: 60_000 });

    // measure decoded audio energy on Bob's received stream — silence ⇒ no audio
    const peakDeviation = await pageB.evaluate(async () => {
      const audio = document.querySelector('#audioContainer audio');
      const stream = audio && audio.srcObject;
      if (!stream || stream.getAudioTracks().length === 0) return -1;

      const ctx = new AudioContext();
      await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.fftSize);
      let peak = 0;
      const start = performance.now();
      await new Promise(resolve => {
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          for (const v of buf) {
            const d = Math.abs(v - 128); // 128 == silence midpoint
            if (d > peak) peak = d;
          }
          if (performance.now() - start > 2500) resolve();
          else setTimeout(tick, 50);
        };
        tick();
      });
      return peak;
    });

    // a live tone deviates well above 0; flat silence would stay at 0
    expect(peakDeviation).toBeGreaterThan(1);

    // Alice leaves voice → dock returns to join state and she drops to Lurking
    await pageA.getByTitle('Leave voice').click();
    await expect(pageA.locator('#voiceJoinPanel')).toBeVisible();
    await expect(pageA.locator('#voiceActivePanel')).toBeHidden();
    // Bob sees Alice move back into the Lurking section
    await expect(pageB.locator('#lurkingList')).toContainText('alice', { timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });

  // Regression: streams only reach peers connected when addStream is called, so
  // a peer joining *after* someone is already in voice must still receive them.
  test('a peer who joins after alice is in voice still hears her', async ({ browser }) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext({ permissions: ['microphone'] });
    const contextB = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Alice creates a room and joins voice while she is alone in it
    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('alice');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomId = new URL(pageA.url()).hash.slice(1);

    // wait for the room module to wire up before clicking the inline handler
    await pageA.waitForFunction(() => typeof window.joinVoice === 'function');
    await pageA.locator('button', { hasText: 'Join voice' }).click();
    await expect(pageA.locator('#voiceActivePanel')).toBeVisible();

    // Only now does Bob join the room — after Alice's addStream already happened
    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('bob');
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();
    await expect(pageB).toHaveURL(new RegExp(`room\\.html#${roomId}`));

    await expect(pageA.locator('#peerList')).toContainText('bob', { timeout: 60_000 });

    // Bob must still receive Alice's audio even though he joined late
    const bobAudio = pageB.locator('#audioContainer audio');
    await expect(bobAudio).toHaveCount(1, { timeout: 60_000 });

    const peakDeviation = await pageB.evaluate(async () => {
      const audio = document.querySelector('#audioContainer audio');
      const stream = audio && audio.srcObject;
      if (!stream || stream.getAudioTracks().length === 0) return -1;

      const ctx = new AudioContext();
      await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.fftSize);
      let peak = 0;
      const start = performance.now();
      await new Promise(resolve => {
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          for (const v of buf) {
            const d = Math.abs(v - 128);
            if (d > peak) peak = d;
          }
          if (performance.now() - start > 2500) resolve();
          else setTimeout(tick, 50);
        };
        tick();
      });
      return peak;
    });

    // before the onPeerJoin re-add fix this stayed at 0 (Bob got no stream)
    expect(peakDeviation).toBeGreaterThan(1);

    await contextA.close();
    await contextB.close();
  });
});

test.describe('Room name + image', () => {
  test('room name shows as the title and propagates to a joiner over P2P', async ({ browser }) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Host creates a named room
    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('host');
    await pageA.locator('#roomName').fill('Game Night');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomId = new URL(pageA.url()).hash.slice(1);

    // creator sees the name as the room title (sidebar + header)
    await expect(pageA.locator('#roomTitle')).toHaveText('Game Night');
    await expect(pageA.locator('#topTitle')).toHaveText('Game Night');

    // a joiner who only has the link receives the name over the data channel
    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('guest');
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();
    await expect(pageB).toHaveURL(new RegExp(`room\\.html#${roomId}`));

    await expect(pageB.locator('#roomTitle')).toHaveText('Game Night', { timeout: 60_000 });

    // and the joiner now remembers it for their own "Recently joined" list
    await pageB.goto('/index.html');
    await expect(pageB.locator('#recentList')).toContainText('Game Night');

    await contextA.close();
    await contextB.close();
  });

  test('a room created with a name shows that name in the room', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('#username').fill('host');
    await page.locator('#roomName').fill('Movie Club');
    await page.locator('button', { hasText: 'Create a room' }).click();

    await expect(page).toHaveURL(/room\.html#/);
    await expect(page.locator('#roomTitle')).toHaveText('Movie Club');
    await expect(page.locator('#topTitle')).toHaveText('Movie Club');
  });
});

test.describe('Settings (in-room name + avatar editing)', () => {
  test('editing name and avatar updates your row and broadcasts to peers', async ({ browser }) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // two users in the same room
    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('al');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomId = new URL(pageA.url()).hash.slice(1);

    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('bee');
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();

    await expect(pageA.locator('#peerList')).toContainText('bee', { timeout: 60_000 });
    await expect(pageB.locator('#peerList')).toContainText('al', { timeout: 60_000 });

    // A opens settings, changes name + uploads an avatar, saves
    await pageA.getByTitle('Settings').click();
    await expect(pageA.locator('#settingsModal')).toBeVisible();
    await pageA.locator('#settingsName').fill('alfred');
    await pageA.locator('#settingsAvatarFile').setInputFiles(AVATAR_PATH);
    await expect(pageA.locator('#settingsAvatarImg')).toBeVisible();
    await pageA.locator('button', { hasText: 'Save' }).click();
    await expect(pageA.locator('#settingsModal')).toBeHidden();

    // A's own row reflects the new name immediately
    await expect(pageA.locator('#peerList')).toContainText('alfred');

    // B receives the new name and avatar over presence
    await expect(pageB.locator('#peerList')).toContainText('alfred', { timeout: 15_000 });
    await expect(pageB.locator('#peerList img').first()).toBeVisible({ timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });
});

test.describe('Mute', () => {
  test('muting flips your label and shows a muted icon to peers', async ({ browser }) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext({ permissions: ['microphone'] });
    const contextB = await browser.newContext({ permissions: ['microphone'] });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/index.html');
    await pageA.locator('#username').fill('al');
    await pageA.locator('button', { hasText: 'Create a room' }).click();
    await expect(pageA).toHaveURL(/room\.html#/);
    const roomId = new URL(pageA.url()).hash.slice(1);

    await pageB.goto('/index.html');
    await pageB.locator('#username').fill('bee');
    await pageB.locator('#joinInput').fill(roomId);
    await pageB.locator('button', { hasText: 'Join' }).click();
    await expect(pageB.locator('#peerList')).toContainText('al', { timeout: 60_000 });

    // both join voice so A shows up in B's Voice chat section with a mic icon
    await pageA.locator('button', { hasText: 'Join voice' }).click();
    await pageB.locator('button', { hasText: 'Join voice' }).click();
    await expect(pageA.locator('#voiceActivePanel')).toBeVisible();
    // B sees A in voice, unmuted (accent-colored mic), no muted icon yet
    await expect(pageB.locator('#voiceChatList')).toContainText('al', { timeout: 60_000 });
    await expect(pageB.locator('#voiceChatList .text-rose-400')).toHaveCount(0);

    // A mutes
    await pageA.locator('#micBtn').click();
    await expect(pageA.locator('#micBtnLabel')).toHaveText('Unmute');
    // B sees A's mic icon switch to the muted (rose) variant
    await expect(pageB.locator('#voiceChatList .text-rose-400').first()).toBeVisible({ timeout: 15_000 });

    // A unmutes → label resets and the muted icon clears for B
    await pageA.locator('#micBtn').click();
    await expect(pageA.locator('#micBtnLabel')).toHaveText('Mute');
    await expect(pageB.locator('#voiceChatList .text-rose-400')).toHaveCount(0, { timeout: 15_000 });

    await contextA.close();
    await contextB.close();
  });
});
