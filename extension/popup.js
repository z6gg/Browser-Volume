const $ = id => document.getElementById(id);
const DEFAULT_BASE = 'https://browservolume.pages.dev/';
const s = $('s'), v = $('v'), t = $('t');
let on = true, cur = 100, raf = 0, topic = '', link = '', drag = false, lp = 0, lo = 0;
const send = m => chrome.runtime.sendMessage(m).catch(() => {});
function paint(p) { s.value = p; v.textContent = Math.round(p / 10) * 10; s.style.setProperty('--p', p / 10 + '%'); }
function animateTo(p) {
  cancelAnimationFrame(raf);
  const from = cur, t0 = performance.now(), d = 300;
  const step = n => {
    const k = Math.min(1, (n - t0) / d), e = 1 - Math.pow(1 - k, 3);
    cur = from + (p - from) * e; paint(cur);
    if (k < 1) raf = requestAnimationFrame(step); else cur = p;
  };
  raf = requestAnimationFrame(step);
}
function setOn(x) { on = x; t.className = 'tg ' + (on ? 'on' : 'off'); t.querySelector('span').textContent = on ? 'ON' : 'OFF'; }
function show(x) { if (typeof x.pct === 'number' && !drag && Date.now() - lp > 800) animateTo(x.pct); if (typeof x.on === 'boolean' && Date.now() - lo > 800) setOn(x.on); }
s.oninput = () => { const p = Math.round(s.value / 10) * 10; lp = Date.now(); cancelAnimationFrame(raf); cur = +s.value; v.textContent = p; s.style.setProperty('--p', s.value / 10 + '%'); send({ type: 'set', pct: p }); };
const release = () => { drag = false; lp = Date.now(); animateTo(Math.round(s.value / 10) * 10); };
s.addEventListener('pointerdown', () => { drag = true; });
s.addEventListener('pointerup', release); s.addEventListener('pointercancel', release); s.onchange = release;
let rot = 0;
$('r').onclick = () => { lp = Date.now(); rot += 360; $('r').firstChild.style.transform = 'rotate(' + rot + 'deg)'; animateTo(100); send({ type: 'set', pct: 100 }); };
$('at').onclick = () => { $('at').classList.toggle('open'); $('ab').classList.toggle('open'); };
t.onclick = () => { lo = Date.now(); setOn(!on); send({ type: 'toggle', on }); };
chrome.runtime.onMessage.addListener(m => { if (m.type === 'state') show(m); });

function render() {
  const base = ($('base').value.trim() || DEFAULT_BASE).replace(/#.*$/, '');
  link = base + '#' + topic;
  $('u').innerHTML = '';
  const a = document.createElement('a');
  a.href = link; a.textContent = link; a.target = '_blank'; a.rel = 'noopener';
  $('u').appendChild(a);
  try {
    const q = qrcode(0, 'M');
    q.addData(link);
    q.make();
    $('qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0 });
  } catch (e) {}
}
$('base').oninput = () => { chrome.storage.local.set({ base: $('base').value.trim() }); render(); };
$('c').onclick = async () => {
  try { await navigator.clipboard.writeText(link); } catch (e) {}
  $('c').classList.add('done');
  $('ci').innerHTML = '<path d="M5 13l4 4L19 7"/>';
  setTimeout(() => {
    $('c').classList.remove('done');
    $('ci').innerHTML = '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>';
  }, 1400);
};

(async () => {
  const d = await chrome.storage.local.get(['topic', 'base']);
  topic = d.topic;
  if (!topic || topic.length < 40) {
    topic = 'booster-' + crypto.randomUUID().replace(/-/g, '');
    await chrome.storage.local.set({ topic });
  }
  $('base').value = d.base || DEFAULT_BASE;
  render();
  const msg = $('msg');
  const say = x => { msg.textContent = x; msg.classList.toggle('on', !!x); };
  try {
    await chrome.runtime.sendMessage({ type: 'ensure' });
    send({ type: 'topic', topic });
    const st = await chrome.runtime.sendMessage({ type: 'get' });
    show(st);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!st.tabs.includes(tab.id)) {
      const id = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      const ok = await chrome.runtime.sendMessage({ type: 'stream', id, tabId: tab.id });
      if (!ok) throw new Error('capture failed');
    }
    say('');
  } catch (e) {
    say("Can't boost this tab. Open a normal website tab and click the icon again.");
  }
})();
