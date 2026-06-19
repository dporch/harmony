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
