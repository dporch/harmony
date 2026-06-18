# harmony — TODO

## Deploy
- [ ] Verify favicon 404 is gone once Pages redeploys

## Nice-to-haves / future
- [ ] TURN server for restrictive NATs (Cloudflare TURN) — voice/data can fail
      behind symmetric NATs with STUN only
- [ ] MQTT broker resilience — only 3 of 5 default brokers are alive; consider
      a self-hosted or paid broker for reliability
- [x] Voice end-to-end test — verified between 2 computers (2026-06-18), audio heard
- [ ] Cross-browser test run (currently chromium only in playwright.config.js)

## Done
- [x] P2P chat + voice (Trystero MQTT v0.18.0)
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
