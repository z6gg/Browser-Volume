# Browser Volume

Boost quiet tabs up to 1000% and control the volume from your phone.

A Chrome MV3 extension that captures the current tab's audio, boosts it with a limiter so it stays clean, and exposes a remote page (link + QR) so any phone or second device on the internet can act as a volume remote.

## What It Does

- Per-tab volume boost from 0% to 1000% in 10% steps
- ON/OFF bypass toggle, one-click reset to 100%
- Keyboard shortcuts: `Alt+1` down, `Alt+2` up
- Remote control page: open the link or scan the QR from the popup, control volume / mute / test chime from your phone
- Test button plays a chime through the boosted tab so you can hear the level remotely

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
├── site/            # self-contained remote page (single index.html, works offline)
│   └── index.html
├── LICENSE          # GPLv3
└── README.md
```

Extension and site stay in one repo but deploy separately: the extension is installed from `extension/`, the remote page is hosted from `site/` only. Point Cloudflare Pages at `site/` (or copy `site/index.html` to any static host). The popup lets you change the base URL if you self-host.

## Install the Extension

1. Go to `chrome://extensions`, enable Developer Mode.
2. Load unpacked > select the `extension/` folder.
3. Open any normal website tab with sound, click the extension icon, allow tab capture when asked.
4. Drag the slider. If a tab says it can't be boosted, switch to a regular `https` page and click the icon again.

## Use the Phone Remote

1. Click the extension icon, copy the link or scan the QR.
2. Open it on your phone. It shows connecting, then connected.
3. Slide to set volume, toggle ON/OFF, hit Test to chime the tab.

Each install generates its own private topic id (`booster-...`). Anyone with the full link can control that browser's volume, so treat the link like a password.

## Self-Host the Remote Page

The remote page is one file with no build step. Either:

- Cloudflare Pages: create a project from this repo with the build output / root set to `site/`, or
- Any static host: upload `site/index.html` as-is.

Then in the popup, set the base URL field to your domain so the QR encodes your host. Default is `https://browservolume.pages.dev/`.

## How It Works

Tab audio is captured with `tabCapture`, routed through a gain node plus a compressor limiter in an offscreen document, then played back boosted. The browser hosts a PeerJS id equal to your topic; the remote page joins it over a reliable data channel and exchanges `{pct, on, test}` messages. No accounts, no backend of mine: signaling goes through the public PeerJS cloud.

## Privacy

Volume commands travel peer to peer over WebRTC. The topic id in the URL is the only secret. No analytics, no audio uploaded anywhere.

## License

GPLv3, see LICENSE. PeerJS (MIT) and the QR generator in `extension/` keep their own headers.
