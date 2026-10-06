const ctx = new AudioContext();
const nodes = new Map();
const conns = new Set();
let pct = 100, on = true, peer = null, peerId = null;

const SCALE = [0, 2, 4, 7, 9];
const note = (base, i) => base * Math.pow(2, (12 * Math.floor(i / 5) + SCALE[((i % 5) + 5) % 5]) / 12);

const eff = () => (on ? pct / 100 : 1);

function apply() {
  if (ctx.state !== 'running') ctx.resume();
  nodes.forEach(g => (g.gain.value = eff()));
  const st = { pct, on };
  chrome.runtime.sendMessage({ type: 'state', ...st }).catch(() => {});
  conns.forEach(c => c.open && c.send(st));
}

function setPct(p) {
  pct = Math.max(0, Math.min(1000, Math.round(p)));
  apply();
}

function beep(up) {
  if (ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  const i = (Math.round(pct / 10) % 10) + (up ? 2 : -2);
  const f = note(220, i);
  o.frequency.value = f;
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.13);
}

async function chime() {
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }
  const f = note(261.63, Math.floor(Math.random() * 10));
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  g.connect(ctx.destination);
  [[1, 1], [2, 0.25]].forEach(([m, v]) => {
    const o = ctx.createOscillator();
    const h = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * m;
    h.gain.value = v;
    o.connect(h).connect(g);
    o.start(t);
    o.stop(t + 2.3);
  });
}

function host(id) {
  if (peerId === id) return;
  peerId = id;
  const start = () => {
    peer = new Peer(id);
    peer.on('connection', c => {
      conns.add(c);
      c.on('open', () => c.send({ pct, on }));
      c.on('data', d => {
        if (d.test) { chime(); return; }
        if (typeof d.on === 'boolean') { on = d.on; apply(); }
        if (typeof d.pct === 'number') setPct(d.pct);
        else if (d.step) setPct(pct + d.step);
      });
      c.on('close', () => conns.delete(c));
    });
    peer.on('disconnected', () => peer.reconnect());
    peer.on('error', () => { try { peer.destroy(); } catch (e) {} setTimeout(start, 3000); });
  };
  start();
}

chrome.runtime.onMessage.addListener((m, _s, send) => {
  if (m.type === 'stream') {
    navigator.mediaDevices
      .getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.id } } })
      .then(s => {
        if (ctx.state !== 'running') ctx.resume();
        const g = ctx.createGain();
        g.gain.value = eff();
        const lim = ctx.createDynamicsCompressor();
        lim.threshold.value = -3;
        lim.knee.value = 0;
        lim.ratio.value = 20;
        lim.attack.value = 0.003;
        ctx.createMediaStreamSource(s).connect(g).connect(lim).connect(ctx.destination);
        nodes.set(m.tabId, g);
        s.getAudioTracks()[0].onended = () => nodes.delete(m.tabId);
        send(true);
      })
      .catch(() => send(false));
    return true;
  }
  if (m.type === 'set') setPct(m.pct);
  if (m.type === 'toggle') { on = m.on; apply(); }
  if (m.type === 'step') { setPct(pct + m.step); if (m.beep) beep(m.step > 0); }
  if (m.type === 'topic') host(m.topic);
  if (m.type === 'get') { send({ pct, on, tabs: [...nodes.keys()] }); return true; }
});

chrome.runtime.sendMessage({ type: 'ready' }).catch(() => {});
