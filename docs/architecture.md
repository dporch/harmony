# Harmony — Architecture & Tech Stack

## What it is

A peer-to-peer chat and voice web app. No accounts, no servers, no downloads. Users pick a name, create or join a room, and talk — text, emoji, images, and voice — directly browser-to-browser.

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Signaling** | [Trystero](https://github.com/dmotz/trystero) v0.18 (MQTT strategy) | Handles WebRTC peer discovery via public MQTT brokers — no backend needed |
| **Voice & data** | WebRTC (browser-native) | P2P mesh for audio streams and data channels |
| **Styling** | Tailwind CSS (CDN) + custom dark theme | Utility-first, no build step, consistent with the dark/purple brand |
| **Fonts** | Inter (Google Fonts) | Clean sans-serif, loaded via CDN |
| **Persistence** | localStorage | Username, avatar, room history — all client-side |
| **Hosting** | GitHub Pages (static files) | Free, HTTPS by default (required for mic access), zero config |

No build step. No npm. No framework. Three files.

## How it works

### Signaling (the bootstrapping problem)

Two browsers can't connect peer-to-peer out of thin air — they need to exchange connection info (SDP offers/answers + ICE candidates) before the link exists. Trystero solves this by using **public MQTT brokers** (HiveMQ, EMQX, Mosquitto, etc.) as a rendezvous point:

```
Browser A                    Public MQTT broker                    Browser B
    │                              │                                   │
    ├── subscribe to room topic ──►│◄── subscribe to room topic ───────┤
    │                              │                                   │
    ├── publish SDP offer ────────►│──── forward to B ────────────────►│
    │◄──────────── forward to A ───│◄── publish SDP answer ────────────┤
    │                              │                                   │
    ├── ICE candidates ───────────►│◄── ICE candidates ────────────────┤
    │                              │                                   │
    ╰──────── direct P2P connection established ──────────────────────╯
              (MQTT broker no longer involved)
```

Once connected, all data flows directly between browsers, encrypted by WebRTC's built-in DTLS.

### Room lifecycle

1. **Create**: landing page generates `crypto.randomUUID()`, redirects to `room.html#<uuid>`
2. **Join**: paste a room URL or code → same redirect
3. **Connect**: Trystero joins the MQTT topic for that room ID, discovers peers, forms P2P mesh
4. **Chat**: `makeAction('chat')` sends `{ text }` over WebRTC DataChannel
5. **Presence**: `makeAction('pres')` exchanges `{ name, avatar, inVoice }` on peer join
6. **Voice**: `getUserMedia({ audio: true })` → `room.addStream(mic)` → peers receive via `onPeerStream`
7. **Leave**: `room.leave()` + stop mic tracks on page unload

### Mesh topology

Every participant connects directly to every other participant. Each person uploads their audio N-1 times. This works well for **up to ~5 people** — beyond that, bandwidth and CPU degrade and you'd need an SFU (Selective Forwarding Unit).

```
    A ──── B
    │╲   ╱│
    │  ╲╱  │
    │  ╱╲  │
    │╱   ╲│
    C ──── D
```

## File structure

```
harmony/
├── index.html      Landing page — username, avatar picker, create/join room
├── room.html       Chat room — sidebar (peers, voice controls), chat area, emoji picker
├── shared.js       Shared config — palette, helpers, localStorage API, image URL detection
└── docs/
    └── architecture.md   (this file)
```

## Data flow

### Chat messages

```
sender: sendChat({ text: "hello" })
  → WebRTC DataChannel → all peers
  → receiver: onChat callback → render in message list
```

Image/GIF URLs are detected client-side (by extension or known hosts like giphy.com, tenor.com, i.imgur.com) and rendered as inline `<img>` tags. The image bytes load from the original CDN, not through the P2P channel.

### Presence

```
on peer join:
  → new peer added to Map with temporary ID-based name
  → broadcast own { name, avatar, inVoice } to new peer
  → receive their presence → update sidebar with real name/avatar
```

### Voice

```
user clicks "Join voice"
  → getUserMedia({ audio: true })
  → room.addStream(micStream)
  → peers receive stream via onPeerStream
  → create <audio> element with srcObject, autoplay
  → speaking detection via AudioContext + AnalyserNode
```

Mute toggles `track.enabled` locally and broadcasts mute state via `makeAction('mute')`.

## localStorage schema

| Key | Value | Purpose |
|---|---|---|
| `harmony:name` | `string` | Last used username |
| `harmony:avatar` | `string` (JPEG data-URL, ~96px) | Profile image, downscaled on pick |
| `harmony:rooms` | `JSON array` of `{ id, lastVisited }` | Room history for "Recently joined" list |

## NAT traversal

WebRTC uses STUN servers (Google's public ones) to discover the browser's public IP. This works for most home networks. For users behind strict/symmetric NATs (corporate wifi, some mobile networks), a **TURN relay** is needed — currently not configured. ~10-20% of connections may silently fail without it.

**Future**: add Cloudflare TURN credentials to the `rtcConfig` in `shared.js`.

## Security model

- **End-to-end encrypted**: WebRTC encrypts all media and data via DTLS/SRTP. The MQTT brokers only see the signaling handshake, never message content.
- **No authentication**: anyone with the room URL can join. Room IDs are UUIDs — unguessable but not access-controlled.
- **Avatars are data-URLs**: stored in localStorage and sent via the P2P presence channel. No server ever sees them.
- **Ephemeral rooms**: no server-side state. When everyone leaves, the room ceases to exist. No chat history persists.
