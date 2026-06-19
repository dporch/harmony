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
  return (name || '??').slice(0, 2).replace(/^./, c => c.toUpperCase());
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

export function getMicGain() {
  const v = parseFloat(localStorage.getItem('harmony:micGain'));
  return Number.isFinite(v) ? v : 1; // 1.0 == 100%, unity gain
}

export function setMicGain(v) {
  localStorage.setItem('harmony:micGain', String(v));
}

export function getRoomHistory() {
  try { return JSON.parse(localStorage.getItem('harmony:rooms') || '[]'); }
  catch { return []; }
}

export function addRoomToHistory(id, meta = {}) {
  const existing = getRoomHistory().find(r => r.id === id) || {};
  const rooms = getRoomHistory().filter(r => r.id !== id);
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
