# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Harmony is a peer-to-peer chat and voice web app. Vite bundles the HTML/JS/CSS; Tailwind v4 (via `@tailwindcss/vite`) generates styles at build time. Trystero (v0.25, `@trystero-p2p/firebase`) handles WebRTC signaling via Firebase Realtime Database; after the handshake, all chat/voice flows directly browser-to-browser over encrypted WebRTC. Deployed to GitHub Pages via GitHub Actions (build → test → deploy → post-deploy test).

## Commands

```bash
# Dev server (hot reload)
npm run dev

# Production build → dist/
npm run build

# Preview production build locally
npm run preview

# Run all tests (Chromium + Firefox, 16 workers) — builds first, then tests against dist/
npx playwright test

# Run a single test by name
npx playwright test -g "sends a message"

# Run one browser only
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run full suite against live production site
npm run test:prod
```

## Architecture

Source files in project root, bundled by Vite into `dist/`:

- **`index.html`** — Landing page. Create/join rooms, pick username+avatar. Stores identity in localStorage. Inline `<script type="module">` is extracted and bundled by Vite.
- **`room.html`** — The chat room. Contains all room logic inline in a `<script type="module">`: Trystero room join, presence/chat/voice actions, peer list rendering, emoji picker (native + BetterTTV/7TV), mic pipeline (gain → reverb → WebRTC).
- **`shared.js`** — Shared module imported by both pages: constants (Firebase URL, RTC config, gradients), utility functions (`escapeHtml`, `initials`, `isImageUrl`, `cropImageFile`), localStorage accessors, and the settings modal component (`initSettingsModal`). Vite creates a shared chunk for this.
- **`style.css`** — Tailwind v4 entry point (`@import "tailwindcss"`) with `@theme` block defining custom colors (`base-*`, `brand`, `accent`) and Inter font. Also contains shared custom CSS.
- **`vite.config.js`** — Multi-page Vite config with `@tailwindcss/vite` plugin.

Trystero actions (P2P message channels): `pres` (presence), `chat` (messages), `mute` (mic state), `meta` (room name/image). v0.25 API uses `room.makeAction('name')` returning `{ send, onMessage }` objects, and property-assignment event handlers (`room.onPeerJoin = cb`).

`@trystero-p2p/firebase` + Firebase are bundled from npm (not loaded from CDN). Google Fonts (Inter) remains a CDN link.

## Testing

Playwright e2e tests in `tests/harmony.spec.js` run against both Chromium and Firefox (16 parallel workers). Tests use `tests/base.js` which extends Playwright's `test` fixture to gracefully skip unsupported Firefox permissions (microphone, clipboard).

For local runs, the Playwright `webServer` config runs `npm run build` then serves `dist/` with Python's http.server on port 4173. Set `BASE_URL` env var to skip the local server and test against an external URL (e.g. `npm run test:prod` tests against the live GitHub Pages site).

CI runs the full suite locally before deploy, then again against the live site after deploy. The post-deploy job polls a `version.json` file (containing the commit SHA) to confirm the new build is live before testing.

Chromium uses `--use-fake-device-for-media-stream` for synthetic audio; Firefox uses `media.navigator.streams.fake`. Firefox audio output is muted via `media.volume_scale: '0.0'`.

## Key patterns

- **All HTML rendering uses `insertAdjacentHTML`/`innerHTML`** — every piece of untrusted data (peer names, avatars, room IDs, peer IDs) must go through `escapeHtml()` before insertion. Peer-sent data arrives over the network and is fully attacker-controlled.
- **Mic pipeline**: raw mic → GainNode (volume) → dry path + ConvolverNode (reverb) wet path → MediaStreamDestination → sent to peers via `room.addStream()`. A single shared AudioContext drives all speaking-level meters.
- **Inline scripts stay inline**: both HTML files keep their `<script type="module">` blocks. Vite extracts and bundles these during build.
