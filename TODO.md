# harmony — TODO

## Deploy
- [ ] Verify favicon 404 is gone once Pages redeploys

## Nice-to-haves / future
- [ ] TURN server for restrictive NATs (Cloudflare TURN) — voice/data can fail
      behind symmetric NATs with STUN only
- [ ] Signaling reliability — switched from MQTT (dead eclipse broker) to Nostr
      relays, which are healthier but still free/shared public infra. For
      rock-solid peer discovery, move to an own-backend Trystero strategy:
        - Firebase (trystero/firebase) — generous free tier, ~5 min setup, just
          embed a config object; most reliable, recommended next step
        - Supabase (trystero/supabase) — open-source equivalent
      Signaling only matters at connection setup, so this fixes "sometimes it
      won't connect", not in-call quality (that's the TURN item).
- [x] Voice end-to-end test — verified between 2 computers (2026-06-18), audio heard
- [ ] Cross-browser test run (currently chromium only in playwright.config.js)

## Done
- [x] P2P chat + voice (Trystero v0.18.0 — Nostr signaling)
- [x] Avatar upload + persistence, room history, username persistence
- [x] Emoji picker
- [x] Playwright e2e tests included
- [x] README + architecture docs
- [x] favicon.svg created
- [x] Always-visible "Leave room" button + "Leave voice" button
- [x] Settings menu — edit name / profile picture in-room (broadcasts to peers)
- [x] Sidebar split into "Voice chat" + "Lurking" sections with live counts
- [x] Create rooms with a name + image (shared P2P, shown in title/icon + recents)
- [x] Tests for P2P voice/audio, settings broadcast, mute, room-name propagation
