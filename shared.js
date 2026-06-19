export const APP_ID = 'harmony-chat';

export const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Firebase Realtime Database used for signaling (peer discovery + WebRTC
// handshake only — chat/voice stay P2P and never touch it). The URL is a
// public identifier, not a secret; access is governed by the database rules.
export const FIREBASE_DB_URL = 'https://webrtc-signaling-93ec5-default-rtdb.firebaseio.com';

// Fallback option: pinned Nostr relays, if you ever switch back to that strategy.
export const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
];

export const GRADIENTS = [
  'from-brand to-accent',
  'from-orange-400 to-pink-500',
  'from-sky-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-pink-500 to-brand',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-blue-500',
  'from-rose-400 to-red-500',
  'from-lime-400 to-green-500',
];

export function gradientFor(peerId) {
  let hash = 0;
  for (const ch of peerId) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function initials(name) {
  return (name?.trim() || '??').slice(0, 2).toUpperCase();
}

export function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function now() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const IMG_EXTENSIONS = /\.(gif|png|jpe?g|webp)(\?.*)?$/i;
const IMG_HOSTS = /giphy\.com|tenor\.com|i\.imgur\.com|media\d*\.giphy\.com/i;

export function isImageUrl(text) {
  try {
    const url = new URL(text.trim());
    return IMG_EXTENSIONS.test(url.pathname) || IMG_HOSTS.test(url.hostname);
  } catch { return false; }
}

export function cropImageFile(file, size = 96) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// localStorage helpers

export function getMyName() {
  return localStorage.getItem('harmony:name') || '';
}

export function setMyName(name) {
  localStorage.setItem('harmony:name', name);
}

export function getMyAvatar() {
  return localStorage.getItem('harmony:avatar') || '';
}

export function setMyAvatar(dataUrl) {
  localStorage.setItem('harmony:avatar', dataUrl);
}

export function getMicId() {
  return localStorage.getItem('harmony:micId') || '';
}

export function setMicId(id) {
  localStorage.setItem('harmony:micId', id || '');
}

export function getSpeakerId() {
  return localStorage.getItem('harmony:speakerId') || '';
}

export function setSpeakerId(id) {
  localStorage.setItem('harmony:speakerId', id || '');
}

// WebRTC audio processing — default on (matches browser defaults); a stored
// 'false' opts out. Turn these off for music / "hear everything" setups.
export function getAudioProcessing() {
  return {
    autoGainControl: localStorage.getItem('harmony:agc') !== 'false',
    noiseSuppression: localStorage.getItem('harmony:noise') !== 'false',
    echoCancellation: localStorage.getItem('harmony:echo') !== 'false',
  };
}

export function setAudioProcessing(opts) {
  localStorage.setItem('harmony:agc', String(!!opts.autoGainControl));
  localStorage.setItem('harmony:noise', String(!!opts.noiseSuppression));
  localStorage.setItem('harmony:echo', String(!!opts.echoCancellation));
}

export function getMicGain() {
  const v = parseFloat(localStorage.getItem('harmony:micGain'));
  return Number.isFinite(v) ? v : 1; // 1.0 == 100%, unity gain
}

export function setMicGain(v) {
  localStorage.setItem('harmony:micGain', String(v));
}

// subtle room reverb on outgoing voice (synthesized impulse response, no asset)
export function getReverb() {
  return localStorage.getItem('harmony:reverb') === 'true';
}

export function setReverb(on) {
  localStorage.setItem('harmony:reverb', String(!!on));
}

export function getRoomHistory() {
  try { return JSON.parse(localStorage.getItem('harmony:rooms') || '[]'); }
  catch { return []; }
}

export function addRoomToHistory(id, meta = {}) {
  const all = getRoomHistory();
  const existing = all.find(r => r.id === id) || {};
  const rooms = all.filter(r => r.id !== id);
  rooms.unshift({
    id,
    name: meta.name ?? existing.name ?? '',
    image: meta.image ?? existing.image ?? '',
    lastVisited: Date.now(),
  });
  if (rooms.length > 20) rooms.length = 20;
  localStorage.setItem('harmony:rooms', JSON.stringify(rooms));
}

export function getRoomMeta(id) {
  const room = getRoomHistory().find(r => r.id === id);
  return { name: room?.name || '', image: room?.image || '' };
}

export function setRoomMeta(id, meta) {
  addRoomToHistory(id, meta);
}

export function initSettingsModal(container, { showIdentity = false, onSave } = {}) {
  const identityHtml = showIdentity ? `
      <div class="flex items-end gap-3 mb-5">
        <button type="button" id="settingsAvatarBtn" title="Change photo"
                class="group relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden ring-soft focus:outline-none focus:ring-2 focus:ring-brand transition">
          <div id="settingsAvatarFallback" class="w-full h-full bg-gradient-to-br from-brand to-accent grid place-items-center text-base font-bold text-white">??</div>
          <img id="settingsAvatarImg" alt="" class="absolute inset-0 w-full h-full object-cover hidden" />
          <span class="absolute inset-0 grid place-items-center bg-black/45 opacity-0 group-hover:opacity-100 transition">
            <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </span>
        </button>
        <input id="settingsAvatarFile" type="file" accept="image/*" class="hidden" />
        <div class="flex-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Username</label>
          <input id="settingsName" type="text" placeholder="your name"
                 class="mt-1.5 w-full bg-base-850 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none ring-soft focus:ring-2 focus:ring-brand transition" />
        </div>
      </div>` : '';

  const modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.className = 'hidden fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-sm bg-base-900 ring-soft rounded-2xl p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-white">Settings</h2>
        <button data-action="close" title="Close" class="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-base-800 transition">
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      ${identityHtml}
      <div>
        <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Microphone</label>
        <select id="settingsMic"
                class="mt-1.5 w-full bg-base-850 rounded-xl px-4 py-3 text-white outline-none ring-soft focus:ring-2 focus:ring-brand transition appearance-none cursor-pointer">
          <option value="">Default</option>
        </select>
      </div>
      <div class="mt-4" id="settingsSpeakerWrap">
        <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Speaker</label>
        <select id="settingsSpeaker"
                class="mt-1.5 w-full bg-base-850 rounded-xl px-4 py-3 text-white outline-none ring-soft focus:ring-2 focus:ring-brand transition appearance-none cursor-pointer">
          <option value="">Default</option>
        </select>
      </div>
      <div class="mt-4">
        <label class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Mic volume</span>
          <span id="micGainLabel" class="normal-case text-slate-300">100%</span>
        </label>
        <input id="settingsMicGain" type="range" min="0" max="300" step="10" value="100"
               class="mt-2 w-full accent-brand cursor-pointer" />
      </div>
      <div class="mt-5">
        <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Audio processing</label>
        <div class="mt-2 space-y-0.5">
          <label class="flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-base-850 cursor-pointer transition">
            <span class="text-sm text-slate-200">Noise suppression</span>
            <input id="settingsNoise" type="checkbox" class="w-4 h-4 accent-brand cursor-pointer" />
          </label>
          <label class="flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-base-850 cursor-pointer transition">
            <span class="text-sm text-slate-200">Echo cancellation</span>
            <input id="settingsEcho" type="checkbox" class="w-4 h-4 accent-brand cursor-pointer" />
          </label>
          <label class="flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-base-850 cursor-pointer transition">
            <span class="text-sm text-slate-200">Auto gain control</span>
            <input id="settingsAgc" type="checkbox" class="w-4 h-4 accent-brand cursor-pointer" />
          </label>
          <label class="flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-base-850 cursor-pointer transition">
            <span class="text-sm text-slate-200">Room reverb</span>
            <input id="settingsReverb" type="checkbox" class="w-4 h-4 accent-brand cursor-pointer" />
          </label>
        </div>
        <p class="mt-1.5 px-1 text-xs text-slate-500">Turn off suppression/gain for music; reverb adds a little room ambience to your voice.</p>
      </div>
      <div class="flex gap-2 mt-6">
        <button data-action="cancel" class="flex-1 bg-base-800 hover:bg-base-700 ring-soft rounded-xl py-2.5 font-semibold text-slate-300 transition">Cancel</button>
        <button data-action="save" class="flex-1 bg-brand hover:bg-brand-600 rounded-xl py-2.5 font-semibold text-white transition">Save</button>
      </div>
    </div>`;
  container.appendChild(modal);

  const micSel = modal.querySelector('#settingsMic');
  const spkSel = modal.querySelector('#settingsSpeaker');
  const spkWrap = modal.querySelector('#settingsSpeakerWrap');
  const gainSlider = modal.querySelector('#settingsMicGain');
  const gainLabel = modal.querySelector('#micGainLabel');
  const noiseCb = modal.querySelector('#settingsNoise');
  const echoCb = modal.querySelector('#settingsEcho');
  const agcCb = modal.querySelector('#settingsAgc');
  const reverbCb = modal.querySelector('#settingsReverb');
  const nameInput = modal.querySelector('#settingsName');
  const avatarImg = modal.querySelector('#settingsAvatarImg');
  const avatarFb = modal.querySelector('#settingsAvatarFallback');
  const avatarFile = modal.querySelector('#settingsAvatarFile');

  let stagedAvatar = '';

  gainSlider.addEventListener('input', () => {
    gainLabel.textContent = gainSlider.value + '%';
  });

  if (showIdentity) {
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    modal.querySelector('#settingsAvatarBtn').addEventListener('click', () => avatarFile.click());
    avatarFile.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      stagedAvatar = await cropImageFile(file);
      avatarImg.src = stagedAvatar;
      avatarImg.classList.remove('hidden');
      avatarFb.classList.add('hidden');
    });
  }

  async function populateDevices() {
    let devices = [];
    try { devices = await navigator.mediaDevices.enumerateDevices(); } catch {}
    const fill = (sel, kind, savedId, label) => {
      const list = devices.filter(d => d.kind === kind);
      sel.innerHTML = `<option value="">Default</option>` +
        list.map((d, i) =>
          `<option value="${escapeHtml(d.deviceId)}">${escapeHtml(d.label || `${label} ${i + 1}`)}</option>`
        ).join('');
      sel.value = list.some(d => d.deviceId === savedId) ? savedId : '';
    };
    fill(micSel, 'audioinput', getMicId(), 'Microphone');
    fill(spkSel, 'audiooutput', getSpeakerId(), 'Speaker');
    spkWrap.classList.toggle('hidden', !('setSinkId' in HTMLMediaElement.prototype));
  }

  function open(state = {}) {
    if (showIdentity) {
      stagedAvatar = state.avatar || '';
      nameInput.value = state.name || '';
      if (stagedAvatar) {
        avatarImg.src = stagedAvatar;
        avatarImg.classList.remove('hidden');
        avatarFb.classList.add('hidden');
      } else {
        avatarImg.classList.add('hidden');
        avatarFb.classList.remove('hidden');
        avatarFb.textContent = initials(state.name || '');
      }
    }
    populateDevices();
    const pct = Math.round(getMicGain() * 100);
    gainSlider.value = pct;
    gainLabel.textContent = pct + '%';
    const proc = getAudioProcessing();
    noiseCb.checked = proc.noiseSuppression;
    echoCb.checked = proc.echoCancellation;
    agcCb.checked = proc.autoGainControl;
    reverbCb.checked = getReverb();
    modal.classList.remove('hidden');
    if (nameInput) nameInput.focus();
  }

  function close() {
    modal.classList.add('hidden');
  }

  async function save() {
    const values = {
      micId: micSel.value,
      speakerId: spkSel.value,
      micGain: (parseInt(gainSlider.value, 10) || 100) / 100,
      audioProcessing: { autoGainControl: agcCb.checked, noiseSuppression: noiseCb.checked, echoCancellation: echoCb.checked },
      reverb: reverbCb.checked,
    };
    if (showIdentity) {
      values.name = nameInput.value.trim() || 'guest';
      values.avatar = stagedAvatar;
      setMyName(values.name);
      setMyAvatar(values.avatar);
    }
    setMicId(values.micId);
    setSpeakerId(values.speakerId);
    setMicGain(values.micGain);
    setAudioProcessing(values.audioProcessing);
    setReverb(values.reverb);
    if (onSave) await onSave(values);
    close();
  }

  modal.querySelector('[data-action="close"]').addEventListener('click', close);
  modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
  modal.querySelector('[data-action="save"]').addEventListener('click', save);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  return { open, close };
}
