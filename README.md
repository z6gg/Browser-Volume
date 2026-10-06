# Browser Volume

Boosts any tab up to 1000% and lets you control it from your phone.

Chrome MV3 extension. Captures tab audio, runs it through a limiter, and provides a private remote page (link + QR) so a phone can control the volume.

## Features

- Per-tab boost from 0% to 1000%, in 10% steps
- ON/OFF bypass toggle, reset to 100%
- Shortcuts: `Alt+1` down, `Alt+2` up
- Phone remote: open the link or scan the QR in the popup to adjust volume, mute, or test
- Test button plays a chime through the tab

## Repo Layout

```text
Browser-Volume/
├── extension/       # load this folder in chrome://extensions (Developer Mode > Load unpacked)
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html / popup.js
│   ├── offscreen.html / offscreen.js
│   ├── peerjs.min.js / qrcode.js
│   └── icons/
├── site/            # self-contained remote page
│   └── index.html
├── LICENSE          # GPLv3
└── README.md
```

Extension and site are in one repo but deploy separately. Install from `extension/`, host only `site/`. For Cloudflare Pages set the project root to `site/` (or copy `site/index.html` to any static host). The base URL can be changed in the popup when self-hosting.

## Install the Extension

1. Open `chrome://extensions`, enable Developer Mode.
2. Load unpacked > select the `extension/` folder.
3. Open a standard website tab with audio, click the icon, allow capture when prompted.
4. Drag the slider. If the tab cannot be boosted, open a regular `https` page and click the icon again.

## Use the Phone Remote

1. Click the extension icon, copy the link or scan the QR.
2. Open it on a phone. Status changes from connecting to connected.
3. Adjust the slider, toggle ON/OFF, or press Test to play a chime.

Each install generates a private topic id (`booster-...`). Anyone with the full link can control that browser's volume.

## Self-Host the Remote Page

Single file, no build step:

- Cloudflare Pages: create a project from this repo with the root set to `site/`, or
- Any static host: upload `site/index.html` as-is.

Set that domain in the popup base URL field so the QR uses the correct host. Default is `https://browservolume.pages.dev/`.

## How It Works

`tabCapture` routes into a gain node and compressor in an offscreen document, then outputs the boosted audio. The browser hosts a PeerJS id matching the topic, the remote page connects over a reliable data channel and exchanges `{pct, on, test}` messages. No accounts or custom backend. Signaling uses the public PeerJS cloud.

## Privacy

Volume commands go peer to peer over WebRTC. The topic id in the URL is the only credential. No analytics, no audio uploaded anywhere.

## License

GPLv3, see LICENSE. PeerJS (MIT) and the QR generator in `extension/` keep their own headers.

---

*Vibe coded with Claude Sonnet 5.5.*
