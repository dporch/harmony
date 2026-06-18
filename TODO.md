# harmony — TODO

## Deploy
- [ ] Load SSH key so `git push` works (passphrase + no ssh-askpass):
      run in your terminal → `eval (ssh-agent -c); and ssh-add ~/.ssh/id_ed25519`
- [ ] Push `main` to `git@github.com:dporch/harmony.git`
- [ ] Enable GitHub Pages: Settings → Pages → Deploy from branch `main` / root
- [ ] Verify favicon 404 is gone once Pages redeploys

## Uncommitted
- [ ] Commit favicon: `favicon.svg` + the `<link rel="icon">` edits in
      `index.html` and `room.html` ("Add favicon with harmony wave logo")

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
- [x] 6 Playwright E2E tests passing
- [x] README + architecture docs
- [x] favicon.svg created
