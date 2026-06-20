# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Harmony is a peer-to-peer chat and voice web app. No build step, no framework — static HTML/JS served from GitHub Pages. Trystero (v0.18, Firebase strategy) handles WebRTC signaling via Firebase Realtime Database; after the handshake, all chat/voice flows directly browser-to-browser over encrypted WebRTC.

## Commands

```bash
# Serve locally (no build step)
python3 -m http.server 8000

# Run all tests (Chromium + Firefox)
npx playwright test

# Run a single test by name
npx playwright test -g "sends a message"

# Run one browser only
npx playwright test --project=chromium
npx playwright test --project=firefox
```

## Architecture

Three source files, all served as static assets:

- **`index.html`** — Landing page. Create/join rooms, pick username+avatar. Stores identity in localStorage.
- **`room.html`** — The chat room. Contains all room logic inline in a `<script type="module">`: Trystero room join, presence/chat/voice actions, peer list rendering, emoji picker (native + BetterTTV/7TV), mic pipeline (gain → reverb → WebRTC).
- **`shared.js`** — Shared module imported by both pages: constants (Firebase URL, RTC config, gradients), utility functions (`escapeHtml`, `initials`, `isImageUrl`, `cropImageFile`), localStorage accessors, and the settings modal component (`initSettingsModal`).

Trystero actions (P2P message channels): `pres` (presence), `chat` (messages), `mute` (mic state), `meta` (room name/image).

Tailwind CSS is loaded from CDN with an inline config block duplicated in both HTML files (same color tokens: `base-*`, `brand`, `accent`).

## Testing

Playwright e2e tests in `tests/harmony.spec.js` run against both Chromium and Firefox (10 parallel workers). Tests use `tests/base.js` which extends Playwright's `test` fixture to gracefully skip unsupported Firefox permissions (microphone, clipboard).

Chromium uses `--use-fake-device-for-media-stream` for synthetic audio; Firefox uses `media.navigator.streams.fake`. Firefox audio output is muted via `media.volume_scale: '0.0'`.

## Key patterns

- **All HTML rendering uses `insertAdjacentHTML`/`innerHTML`** — every piece of untrusted data (peer names, avatars, room IDs, peer IDs) must go through `escapeHtml()` before insertion. Peer-sent data arrives over the network and is fully attacker-controlled.
- **Mic pipeline**: raw mic → GainNode (volume) → dry path + ConvolverNode (reverb) wet path → MediaStreamDestination → sent to peers via `room.addStream()`. A single shared AudioContext drives all speaking-level meters.
- **No build step**: all imports are either ESM from `esm.sh` CDN (Trystero, Firebase) or relative (`./shared.js`). No bundler, no transpiler.
