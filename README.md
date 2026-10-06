# Browser Volume

Some tabs are just too quiet. This fixes that. It boosts any tab up to 1000% and lets you control it from your phone.

It's a Chrome MV3 extension. It grabs the tab's audio, pushes it through a limiter so it doesn't fall apart at high gain, and gives you a private remote page (link + QR) so your phone works as a volume remote.

## What It Does

- Per-tab boost from 0% to 1000%, in 10% steps
- ON/OFF bypass toggle, one click reset back to 100%
- Shortcuts: `Alt+1` down, `Alt+2` up
- Phone remote: open the link or scan the QR in the popup, then slide / mute / test from your phone
- Test button plays a chime through the boosted tab so you can hear the level from the other room

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

Extension and site live together but deploy separately. Install from `extension/`, host only `site/`. For Cloudflare Pages point the project at `site/` (or copy `site/index.html` to any static host). You can change the base URL in the popup if you self-host.

## Install the Extension

1. Go to `chrome://extensions`, flip on Developer Mode.
2. Load unpacked > pick the `extension/` folder.
3. Open a normal site tab with sound, click the icon, allow capture when it asks.
4. Drag the slider. If it says it can't boost the tab, jump to a regular `https` page and click the icon again.

## Use the Phone Remote

1. Click the extension icon, copy the link or scan the QR.
2. Open it on your phone. You'll see connecting, then connected.
3. Slide for volume, toggle ON/OFF, hit Test to chime the tab.

Every install makes its own private topic id (`booster-...`). Anyone with the full link can drive that browser's volume, so don't share it around.

## Self-Host the Remote Page

It's a single file, no build step. Two options:

- Cloudflare Pages: new project from this repo with the root set to `site/`, or
- Any static host: just upload `site/index.html` as-is.

Then set that domain in the popup's base URL field so the QR points at your host. Default is `https://browservolume.pages.dev/`.

## How It Works

`tabCapture` feeds into a gain node plus a compressor in an offscreen doc, then back out boosted. The browser hosts a PeerJS id matching your topic, the remote page joins it on a reliable data channel and swaps `{pct, on, test}` messages. No accounts, no backend on my end. Signaling goes through the public PeerJS cloud.

## Privacy

Volume commands go peer to peer over WebRTC. The topic id in the URL is the only secret. No analytics, no audio uploaded anywhere.

## License

GPLv3, see LICENSE. PeerJS (MIT) and the QR generator in `extension/` keep their own headers.

---

*Vibe coded with Claude Sonnet 5.5.*
