# harmony — TODO

## Deploy
- [x] Verify favicon 404 is gone once Pages redeploys

## Nice-to-haves / future
- [ ] Custom emojis — Twitch / BetterTTV emotes in chat (fetch emote sets,
      render in messages + the picker)
- [x] Self speaking indicator — your own avatar circle lights up when you talk
      (meter your own mic; today only peers' circles light up)
- [ ] Request mic permission on room join — prompt up front instead of waiting
      for the Join voice click
- [x] Settings menu on the landing page — edit name/avatar before joining,
      mirroring the in-room settings
- [ ] TURN server for restrictive NATs (Cloudflare TURN) — voice/data can fail
      behind symmetric NATs with STUN only; also the only way to hide peer IPs
- [ ] Cross-browser test run (currently chromium only in playwright.config.js)
- [x] Signaling reliability — moved MQTT → Nostr → Firebase Realtime Database
      (own backend, scoped to the `__trystero__` subtree). Fast, no dead-relay
      flakes. Anonymous auth was evaluated and skipped (fights the no-build CDN
      setup + weak protection since anyone can mint an anon token).
- [x] Voice end-to-end test — verified between 2 computers (2026-06-18), audio heard

## Done
- [x] P2P chat + voice (Trystero v0.18.0 — Firebase signaling)
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
