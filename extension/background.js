let creating = null;
async function ensure() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creating) {
    creating = chrome.offscreen
      .createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Boost tab audio' })
      .finally(() => { creating = null; });
  }
  await creating;
}

async function sendTopic() {
  const { topic } = await chrome.storage.local.get('topic');
  if (topic) chrome.runtime.sendMessage({ type: 'topic', topic }).catch(() => {});
}

async function boot() {
  await ensure();
  sendTopic();
}
chrome.runtime.onStartup.addListener(boot);
chrome.runtime.onInstalled.addListener(boot);

chrome.runtime.onMessage.addListener((m, _s, send) => {
  if (m.type === 'ready') { sendTopic(); return; }
  if (m.type !== 'ensure') return;
  ensure().then(() => send(true)).catch(() => send(false));
  return true;
});

chrome.commands.onCommand.addListener(async cmd => {
  await ensure();
  chrome.runtime.sendMessage({ type: 'step', step: cmd === 'vol-up' ? 10 : -10, beep: true }).catch(() => {});
});
