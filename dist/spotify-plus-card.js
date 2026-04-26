/**
 * Spotify Plus Card — Lovelace Custom Card
 * v3.1.0 — Service responses (compat app) + playlist shuffle play
 */

const CARD_VERSION = "3.1.0";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');

  :host {
    --sp-green: #1DB954;
    --sp-surface: #111111;
    --sp-surface2: #1a1a1a;
    --sp-surface3: #222222;
    --sp-border: rgba(255,255,255,0.07);
    --sp-text: #ffffff;
    --sp-text-dim: rgba(255,255,255,0.45);
    --sp-text-mid: rgba(255,255,255,0.7);
    --sp-radius: 20px;
    --sp-font: 'DM Sans', sans-serif;
    --sp-mono: 'DM Mono', monospace;
    display: block;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .card {
    background: var(--sp-surface);
    border-radius: var(--sp-radius);
    border: 1px solid var(--sp-border);
    font-family: var(--sp-font);
    color: var(--sp-text);
    overflow: hidden;
    position: relative;
    user-select: none;
  }

  .ambient {
    position: absolute; inset: 0;
    opacity: 0; transition: opacity 1.2s ease;
    pointer-events: none; z-index: 0;
    filter: blur(60px) saturate(1.5);
    transform: scale(1.1);
  }
  .ambient.visible { opacity: 0.12; }

  .inner { position: relative; z-index: 1; padding: 20px; }

  /* ── NOW PLAYING ── */
  .now-playing {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 14px; align-items: center;
    margin-bottom: 18px;
  }

  .album-art {
    width: 72px; height: 72px;
    border-radius: 10px; object-fit: cover;
    display: block; background: var(--sp-surface2);
    transition: transform 0.3s ease;
  }
  .album-art:hover { transform: scale(1.04); }

  .album-art-placeholder {
    width: 72px; height: 72px;
    border-radius: 10px; background: var(--sp-surface2);
    display: flex; align-items: center; justify-content: center;
    color: var(--sp-text-dim);
  }

  .track-info { overflow: hidden; }

  .track-name {
    font-size: 15px; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.2px; margin-bottom: 3px;
  }

  .track-artist {
    font-size: 12px; color: var(--sp-text-dim);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-weight: 400; margin-bottom: 6px;
  }

  .playing-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-family: var(--sp-mono);
    color: var(--sp-green); text-transform: uppercase;
    letter-spacing: 0.5px; font-weight: 500;
  }
  .playing-dots { display: flex; gap: 2px; align-items: flex-end; height: 10px; }
  .playing-dots span {
    display: block; width: 2px; border-radius: 1px;
    background: var(--sp-green);
    animation: equalizer 1.1s ease-in-out infinite;
  }
  .playing-dots span:nth-child(1) { height: 4px; animation-delay: 0s; }
  .playing-dots span:nth-child(2) { height: 8px; animation-delay: 0.15s; }
  .playing-dots span:nth-child(3) { height: 5px; animation-delay: 0.3s; }
  .playing-dots span:nth-child(4) { height: 9px; animation-delay: 0.1s; }

  .paused-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-family: var(--sp-mono);
    color: var(--sp-text-dim); text-transform: uppercase; letter-spacing: 0.5px;
  }

  @keyframes equalizer {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1); }
  }

  /* ── PROGRESS ── */
  .progress-section { margin-bottom: 16px; }

  .progress-track {
    height: 3px; background: var(--sp-surface3);
    border-radius: 2px; cursor: pointer;
    margin-bottom: 6px; transition: height 0.1s;
  }
  .progress-track:hover { height: 5px; }

  .progress-fill {
    height: 100%; background: var(--sp-green);
    border-radius: 2px; pointer-events: none;
    will-change: width;
  }

  .progress-times {
    display: flex; justify-content: space-between;
    font-size: 10px; font-family: var(--sp-mono); color: var(--sp-text-dim);
  }

  /* ── CONTROLS ── */
  .controls {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 18px;
  }

  .ctrl-btn {
    background: none; border: none; cursor: pointer;
    color: var(--sp-text-dim); padding: 8px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .ctrl-btn:hover { color: var(--sp-text); background: var(--sp-surface2); }
  .ctrl-btn:active { transform: scale(0.9); }
  .ctrl-btn.active { color: var(--sp-green); }

  .ctrl-btn.play-pause {
    width: 48px; height: 48px;
    background: var(--sp-green); color: #000;
    border-radius: 50%; padding: 0;
  }
  .ctrl-btn.play-pause:hover { background: #1ed760; transform: scale(1.04); }
  .ctrl-btn.play-pause:active { transform: scale(0.95); }

  /* ── VOLUME ── */
  .volume-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }
  .volume-icon { color: var(--sp-text-dim); flex-shrink: 0; }

  .volume-slider {
    flex: 1; -webkit-appearance: none;
    height: 3px; background: var(--sp-surface3);
    border-radius: 2px; outline: none; cursor: pointer;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 13px; height: 13px;
    border-radius: 50%; background: var(--sp-text); cursor: pointer;
    transition: background 0.15s, transform 0.15s;
  }
  .volume-slider:hover::-webkit-slider-thumb { background: var(--sp-green); transform: scale(1.2); }
  .volume-slider::-moz-range-thumb {
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--sp-text); cursor: pointer; border: none;
  }

  .volume-pct {
    font-size: 10px; font-family: var(--sp-mono);
    color: var(--sp-text-dim); width: 28px; text-align: right; flex-shrink: 0;
  }

  /* ── DIVIDER / LABELS ── */
  .divider { height: 1px; background: var(--sp-border); margin-bottom: 14px; }

  .section-label {
    font-size: 10px; font-family: var(--sp-mono);
    color: var(--sp-text-dim); text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 10px;
  }

  /* ── DEVICES ── */
  .devices-list { display: flex; flex-direction: column; gap: 4px; }

  .device-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px; cursor: pointer;
    transition: background 0.15s; border: 1px solid transparent;
  }
  .device-item:hover { background: var(--sp-surface2); }
  .device-item.active { background: var(--sp-surface2); border-color: var(--sp-border); }
  .device-item.active .device-name { color: var(--sp-green); }
  .device-icon { color: var(--sp-text-dim); flex-shrink: 0; }
  .device-item.active .device-icon { color: var(--sp-green); }
  .device-name {
    font-size: 13px; font-weight: 500; flex: 1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .device-active-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sp-green); flex-shrink: 0;
    animation: pulse-dot 2s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* ── TAB BAR ── */
  .tab-bar { display: flex; gap: 4px; margin-bottom: 12px; }

  .tab-btn {
    flex: 1; background: var(--sp-surface2);
    border: 1px solid var(--sp-border); border-radius: 8px;
    color: var(--sp-text-dim); font-family: var(--sp-font);
    font-size: 12px; font-weight: 500; padding: 7px 0; cursor: pointer;
    transition: color 0.15s, background 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .tab-btn:hover { color: var(--sp-text); background: var(--sp-surface3); }
  .tab-btn.active { background: var(--sp-green); color: #000; border-color: transparent; }

  /* ── SEARCH ── */
  .search-row { display: flex; gap: 8px; margin-bottom: 4px; }

  .search-input {
    flex: 1; padding: 9px 12px;
    background: var(--sp-surface2); border: 1px solid var(--sp-border);
    border-radius: 10px; color: var(--sp-text);
    font-family: var(--sp-font); font-size: 13px;
    outline: none; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--sp-green); }
  .search-input::placeholder { color: var(--sp-text-dim); }

  .search-btn {
    padding: 9px 14px; background: var(--sp-green); color: #000;
    border: none; border-radius: 10px; font-family: var(--sp-font);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    display: flex; align-items: center; justify-content: center;
  }
  .search-btn:hover { background: #1ed760; }
  .search-btn:active { transform: scale(0.95); }

  .search-history {
    background: var(--sp-surface2); border: 1px solid var(--sp-border);
    border-radius: 10px; overflow: hidden; margin-bottom: 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .history-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px; cursor: pointer; font-size: 13px;
    transition: background 0.15s;
  }
  .history-item:hover { background: var(--sp-surface3); }
  .history-icon { color: var(--sp-text-dim); flex-shrink: 0; }
  .history-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .search-results {
    display: flex; flex-direction: column; gap: 2px;
    max-height: 280px; overflow-y: auto; margin-top: 8px;
  }
  .search-results::-webkit-scrollbar { width: 3px; }
  .search-results::-webkit-scrollbar-thumb { background: var(--sp-surface3); border-radius: 2px; }

  /* ── RESULT / TRACK ITEMS ── */
  .result-item {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 6px; border-radius: 8px; cursor: pointer;
    transition: background 0.15s;
  }
  .result-item:hover { background: var(--sp-surface2); }
  .result-item img {
    width: 40px; height: 40px; border-radius: 5px;
    object-fit: cover; flex-shrink: 0;
  }
  .result-img-placeholder {
    width: 40px; height: 40px; border-radius: 5px;
    background: var(--sp-surface3); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: var(--sp-text-dim);
  }
  .result-info { flex: 1; overflow: hidden; }
  .result-name {
    font-size: 13px; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .result-sub {
    font-size: 11px; color: var(--sp-text-dim);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .result-play-btn {
    background: none; border: none; cursor: pointer;
    color: var(--sp-text-dim); padding: 6px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s; flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .result-play-btn:hover { color: var(--sp-green); background: var(--sp-surface3); }

  /* ── PLAYLISTS ── */
  .playlist-list {
    display: flex; flex-direction: column; gap: 4px;
    max-height: 320px; overflow-y: auto;
  }
  .playlist-list::-webkit-scrollbar { width: 3px; }
  .playlist-list::-webkit-scrollbar-thumb { background: var(--sp-surface3); border-radius: 2px; }

  .playlist-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 6px; border-radius: 8px; cursor: pointer;
    transition: background 0.15s;
  }
  .playlist-item:hover { background: var(--sp-surface2); }
  .playlist-item img {
    width: 44px; height: 44px; border-radius: 6px;
    object-fit: cover; flex-shrink: 0;
  }
  .playlist-img-placeholder {
    width: 44px; height: 44px; border-radius: 6px;
    background: var(--sp-surface3); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: var(--sp-text-dim);
  }
  .playlist-info { flex: 1; overflow: hidden; }
  .playlist-name {
    font-size: 13px; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .playlist-sub { font-size: 11px; color: var(--sp-text-dim); }
  .playlist-play-btn {
    background: none; border: none; cursor: pointer;
    color: var(--sp-text-dim); padding: 6px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s; flex-shrink: 0;
  }
  .playlist-play-btn:hover { color: var(--sp-green); background: var(--sp-surface3); }

  /* tracks view */
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; color: var(--sp-text-dim);
    font-family: var(--sp-font); font-size: 12px; cursor: pointer;
    padding: 0 0 10px 0; transition: color 0.15s;
  }
  .back-btn:hover { color: var(--sp-text); }

  .track-list {
    display: flex; flex-direction: column; gap: 2px;
    max-height: 320px; overflow-y: auto;
  }
  .track-list::-webkit-scrollbar { width: 3px; }
  .track-list::-webkit-scrollbar-thumb { background: var(--sp-surface3); border-radius: 2px; }

  /* ── IDLE ── */
  .idle-header { padding: 24px 0 16px; text-align: center; }
  .idle-icon { color: var(--sp-text-dim); margin-bottom: 12px; }
  .idle-title { font-size: 14px; font-weight: 500; color: var(--sp-text-mid); margin-bottom: 4px; }
  .idle-sub { font-size: 12px; color: var(--sp-text-dim); }

  /* ── UTILITY ── */
  .loading-text, .empty-text, .error-text {
    font-size: 12px; color: var(--sp-text-dim); padding: 10px 4px;
  }
  .error-text { color: rgba(255,100,100,0.8); }
`;

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icon = {
  play:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  prev:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
  next:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zm2.5-6 8.5 6V6z"/><path d="M16 6h2v12h-2z"/></svg>`,
  shuffle:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
  repeat:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
  volHigh:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
  volLow:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`,
  volMute:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>`,
  speaker:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-9H9V6h6v2z"/></svg>`,
  tv:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
  computer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
  phone:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`,
  music:    `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  musicSm:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  search:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  playSm:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  clock:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
  playlist: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>`,
  back:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function getSourceIcon(name) {
  if (!name) return icon.speaker;
  const n = name.toLowerCase();
  if (n.includes("echo") || n.includes("alexa")) return icon.speaker;
  if (n.includes("web player") || n.includes("computer") || n.includes("desktop") || n.includes("laptop")) return icon.computer;
  if (n.includes("iphone") || n.includes("android") || n.includes("phone") || n.includes("mobile")) return icon.phone;
  if (n.includes("tv") || n.includes("cast") || n.includes("chromecast")) return icon.tv;
  return icon.speaker;
}

const HISTORY_KEY = "spotify_plus_search_history";

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(query) {
  const h = [query, ...loadHistory().filter(q => q !== query)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// ── Web Component ──────────────────────────────────────────────────────────
class SpotifyPlusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._shellRendered = false;
    this._initialized = false;
    // progress
    this._progressInterval = null;
    this._positionBase = 0;
    this._positionBaseTime = 0;
    // tabs
    this._currentTab = "search";
    // playlists
    this._playlists = [];
    this._unsubs = [];
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────
  setConfig(config) {
    if (!config.entity) throw new Error("spotify-plus-card: 'entity' é obrigatório");
    this._config = config;
    if (!this._shellRendered) {
      this._renderShell();
      this._shellRendered = true;
    }
  }

  set hass(hass) {
    const newState = hass.states[this._config?.entity];
    const oldState = this._hass?.states[this._config?.entity];

    const stateChanged    = newState?.state !== oldState?.state;
    const titleChanged    = newState?.attributes?.media_title !== oldState?.attributes?.media_title;
    const posChanged      = newState?.attributes?.media_position !== oldState?.attributes?.media_position;
    const volChanged      = newState?.attributes?.volume_level !== oldState?.attributes?.volume_level;
    const shuffleChanged  = newState?.attributes?.shuffle !== oldState?.attributes?.shuffle;
    const repeatChanged   = newState?.attributes?.repeat !== oldState?.attributes?.repeat;
    const sourceChanged   = newState?.attributes?.source !== oldState?.attributes?.source;
    const sourceListChanged = JSON.stringify(newState?.attributes?.source_list) !== JSON.stringify(oldState?.attributes?.source_list);
    const pictureChanged  = newState?.attributes?.entity_picture !== oldState?.attributes?.entity_picture;

    const relevantChanged = stateChanged || titleChanged || posChanged || volChanged ||
      shuffleChanged || repeatChanged || sourceChanged || sourceListChanged;

    this._hass = hass;

    if (!this._shellRendered) return;

    // Event bus (Home Assistant < 2023.2 / sem return_response). O app móvel costuma
    // exigir resposta do serviço em vez de evento WebSocket.
    if (!this._initialized) {
      this._initialized = true;
      this._hass.connection.subscribeEvents((event) => {
        this._renderSearchResults(event.data);
      }, "spotify_plus_search_results").then(u => this._unsubs.push(u));

      this._hass.connection.subscribeEvents((event) => {
        if (event.data?.error) {
          if (this._currentTab === "playlists") {
            this._q("#sp-playlists-list").innerHTML = `<div class="error-text">Erro: ${event.data.error}</div>`;
          }
          return;
        }
        this._playlists = event.data?.items || [];
        if (this._currentTab === "playlists") {
          this._renderPlaylistsList();
        }
      }, "spotify_plus_playlists").then(u => this._unsubs.push(u));
    }

    // Sync position base when HA sends a fresh position
    if (newState?.attributes?.media_position_updated_at && (posChanged || stateChanged)) {
      this._positionBase = newState.attributes.media_position || 0;
      this._positionBaseTime = new Date(newState.attributes.media_position_updated_at).getTime();
    }

    // Manage progress interval only on state transitions
    if (stateChanged) {
      if (newState?.state === "playing") {
        this._startProgressInterval();
      } else {
        this._stopProgressInterval();
      }
    }

    if (!relevantChanged && !pictureChanged) return;

    this._updateDynamicParts(pictureChanged);
  }

  disconnectedCallback() {
    this._stopProgressInterval();
    this._unsubs.forEach(u => (typeof u === "function" ? u() : null));
  }

  // ── DOM helper ────────────────────────────────────────────────────────
  _q(sel) { return this.shadowRoot.querySelector(sel); }

  /** Resposta de serviço com return_response (HA envolve em { context, response } ou { data }) */
  _serviceRes(res) {
    if (res == null) return null;
    if (typeof res === "object") {
      if (res.response !== undefined && res.response !== null) return res.response;
      if (res.data !== undefined && res.data !== null) return res.data;
    }
    return res;
  }

  // ── State helpers ─────────────────────────────────────────────────────
  _getState() { return this._hass?.states[this._config?.entity] || null; }

  _currentPosition() {
    const state = this._getState();
    if (!state) return 0;
    if (state.state !== "playing") return state.attributes?.media_position || 0;
    return Math.max(0, this._positionBase + (Date.now() - this._positionBaseTime) / 1000);
  }

  // ── Progress interval ─────────────────────────────────────────────────
  _startProgressInterval() {
    if (this._progressInterval) return;
    this._progressInterval = setInterval(() => this._tickProgress(), 1000);
  }

  _stopProgressInterval() {
    if (!this._progressInterval) return;
    clearInterval(this._progressInterval);
    this._progressInterval = null;
  }

  _tickProgress() {
    const state = this._getState();
    if (!state || state.state !== "playing") { this._stopProgressInterval(); return; }
    const duration = state.attributes?.media_duration || 0;
    const pos = this._currentPosition();
    const pct = duration > 0 ? Math.min((pos / duration) * 100, 100) : 0;
    const fill = this._q("#sp-progress-fill");
    const posEl = this._q("#sp-pos");
    if (fill) fill.style.width = `${pct}%`;
    if (posEl) posEl.textContent = formatTime(pos);
  }

  // ── Shell (rendered once) ─────────────────────────────────────────────
  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        <div class="ambient" id="sp-ambient"></div>
        <div class="inner">

          <!-- Idle state -->
          <div id="sp-idle" style="display:none">
            <div class="idle-header">
              <div class="idle-icon">${icon.music}</div>
              <div class="idle-title">Spotify Plus</div>
              <div class="idle-sub">Nenhuma música tocando</div>
            </div>
          </div>

          <!-- Now playing -->
          <div id="sp-nowplaying" style="display:none">
            <div class="now-playing">
              <div id="sp-art-wrap" class="album-art-placeholder">${icon.music}</div>
              <div class="track-info">
                <div class="track-name" id="sp-track-name">—</div>
                <div class="track-artist" id="sp-track-artist">—</div>
                <div id="sp-playing-status"></div>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-track">
                <div class="progress-fill" id="sp-progress-fill" style="width:0%"></div>
              </div>
              <div class="progress-times">
                <span id="sp-pos">0:00</span>
                <span id="sp-dur">0:00</span>
              </div>
            </div>

            <div class="controls">
              <button class="ctrl-btn" id="btn-shuffle" title="Shuffle">${icon.shuffle}</button>
              <button class="ctrl-btn" id="btn-prev" title="Anterior">${icon.prev}</button>
              <button class="ctrl-btn play-pause" id="btn-playpause">${icon.play}</button>
              <button class="ctrl-btn" id="btn-next" title="Próxima">${icon.next}</button>
              <button class="ctrl-btn" id="btn-repeat" title="Repeat">${icon.repeat}</button>
            </div>

            <div class="volume-row">
              <div class="volume-icon" id="sp-vol-icon">${icon.volHigh}</div>
              <input type="range" class="volume-slider" id="vol-slider" min="0" max="100" value="50" />
              <span class="volume-pct" id="sp-vol-pct">50%</span>
            </div>

            <div id="sp-devices-section"></div>
          </div>

          <!-- Tabs (always visible) -->
          <div class="divider" id="sp-tab-divider" style="margin-top:0"></div>
          <div class="tab-bar">
            <button class="tab-btn active" id="tab-search-btn">${icon.search} Buscar</button>
            <button class="tab-btn" id="tab-playlists-btn">${icon.playlist} Playlists</button>
          </div>

          <!-- Search tab content -->
          <div id="tab-search-content">
            <div class="search-row">
              <input class="search-input" id="search-input" type="search" enterkeyhint="search"
                placeholder="Música, artista, álbum..." autocomplete="off" autocorrect="off" autocapitalize="off" />
              <button class="search-btn" id="search-btn">${icon.search}</button>
            </div>
            <div id="search-history-wrap"></div>
            <div id="search-results-wrap"></div>
          </div>

          <!-- Playlists tab content -->
          <div id="tab-playlists-content" style="display:none">
            <div id="sp-playlists-view">
              <div class="playlist-list" id="sp-playlists-list"></div>
            </div>
          </div>

        </div>
      </ha-card>
    `;

    this._attachShellListeners();
  }

  _attachShellListeners() {
    // Playback controls
    this._q("#btn-playpause").addEventListener("click", () => {
      const s = this._getState();
      if (!s) return;
      this._hass.callService("media_player", s.state === "playing" ? "media_pause" : "media_play", { entity_id: this._config.entity });
    });
    this._q("#btn-prev").addEventListener("click", () => {
      this._hass.callService("media_player", "media_previous_track", { entity_id: this._config.entity });
    });
    this._q("#btn-next").addEventListener("click", () => {
      this._hass.callService("media_player", "media_next_track", { entity_id: this._config.entity });
    });
    this._q("#btn-shuffle").addEventListener("click", () => {
      const s = this._getState();
      if (!s) return;
      this._hass.callService("media_player", "shuffle_set", { entity_id: this._config.entity, shuffle: !s.attributes.shuffle });
    });
    this._q("#btn-repeat").addEventListener("click", () => {
      const s = this._getState();
      if (!s) return;
      const modes = ["off", "one", "all"];
      const next = modes[(modes.indexOf(s.attributes.repeat || "off") + 1) % modes.length];
      this._hass.callService("media_player", "repeat_set", { entity_id: this._config.entity, repeat: next });
    });

    // Volume
    const volSlider = this._q("#vol-slider");
    volSlider.addEventListener("change", (e) => {
      this._hass.callService("media_player", "volume_set", { entity_id: this._config.entity, volume_level: parseInt(e.target.value) / 100 });
    });
    volSlider.addEventListener("input", (e) => {
      this._q("#sp-vol-pct").textContent = `${e.target.value}%`;
    });

    // Tabs
    this._q("#tab-search-btn").addEventListener("click", () => this._switchTab("search"));
    this._q("#tab-playlists-btn").addEventListener("click", () => this._switchTab("playlists"));

    // Search
    const searchInput = this._q("#search-input");
    this._q("#search-btn").addEventListener("click", () => {
      const q = searchInput.value.trim();
      if (q) this._search(q);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) this._search(q);
      } else if (e.key === "Escape") {
        searchInput.value = "";
        this._q("#search-history-wrap").innerHTML = "";
        this._q("#search-results-wrap").innerHTML = "";
      }
    });
    searchInput.addEventListener("focus", () => {
      if (!searchInput.value.trim()) this._showSearchHistory();
    });
    searchInput.addEventListener("input", () => {
      if (!searchInput.value.trim()) {
        this._showSearchHistory();
      } else {
        this._q("#search-history-wrap").innerHTML = "";
      }
    });
    // Hide history on blur (delay allows click on history item to fire first)
    searchInput.addEventListener("blur", () => {
      setTimeout(() => { this._q("#search-history-wrap").innerHTML = ""; }, 200);
    });

  }

  // ── Dynamic updates (surgical DOM mutations) ──────────────────────────
  _updateDynamicParts(pictureChanged = false) {
    const state = this._getState();
    const isPlaying = state?.state === "playing";
    const isActive  = isPlaying || state?.state === "paused";
    const attr = state?.attributes || {};

    // Show/hide idle vs nowplaying
    this._q("#sp-idle").style.display      = isActive ? "none"  : "block";
    this._q("#sp-nowplaying").style.display = isActive ? "block" : "none";
    this._q("#sp-tab-divider").style.marginTop = isActive ? "14px" : "0";

    if (!isActive) return;

    // Album art + ambient glow (only when picture changes)
    if (pictureChanged) {
      const artWrap = this._q("#sp-art-wrap");
      const amb = this._q("#sp-ambient");
      if (attr.entity_picture) {
        artWrap.className = "";
        artWrap.innerHTML = `<img class="album-art" src="${attr.entity_picture}" alt="" />`;
        amb.style.background = `url('${attr.entity_picture}') center/cover`;
        // Small delay so the CSS transition runs
        requestAnimationFrame(() => setTimeout(() => amb.classList.add("visible"), 50));
      } else {
        artWrap.className = "album-art-placeholder";
        artWrap.innerHTML = icon.music;
        amb.classList.remove("visible");
      }
    }

    // Track info
    this._q("#sp-track-name").textContent  = attr.media_title  || "—";
    this._q("#sp-track-artist").textContent = attr.media_artist || "—";

    const statusEl = this._q("#sp-playing-status");
    statusEl.innerHTML = isPlaying
      ? `<div class="playing-badge"><div class="playing-dots"><span></span><span></span><span></span><span></span></div>Tocando</div>`
      : `<div class="paused-badge">⏸ Pausado</div>`;

    // Progress
    const duration = attr.media_duration || 0;
    const pos = this._currentPosition();
    this._q("#sp-progress-fill").style.width = duration > 0 ? `${Math.min((pos / duration) * 100, 100)}%` : "0%";
    this._q("#sp-pos").textContent = formatTime(pos);
    this._q("#sp-dur").textContent = formatTime(duration);

    // Controls active states
    this._q("#btn-shuffle").classList.toggle("active", !!attr.shuffle);
    this._q("#btn-repeat").classList.toggle("active", (attr.repeat || "off") !== "off");
    this._q("#btn-playpause").innerHTML = isPlaying ? icon.pause : icon.play;

    // Volume
    const vol = Math.round((attr.volume_level || 0) * 100);
    this._q("#vol-slider").value = vol;
    this._q("#sp-vol-pct").textContent = `${vol}%`;
    this._q("#sp-vol-icon").innerHTML = vol === 0 ? icon.volMute : vol < 50 ? icon.volLow : icon.volHigh;

    // Devices from source_list
    this._updateDevices(attr);
  }

  _updateDevices(attr) {
    const sourceList  = attr.source_list || [];
    const activeSource = attr.source || "";
    const section = this._q("#sp-devices-section");

    if (!sourceList.length) { section.innerHTML = ""; return; }

    section.innerHTML = `
      <div class="divider"></div>
      <div class="section-label">Dispositivos</div>
      <div class="devices-list">
        ${sourceList.map(src => `
          <div class="device-item ${src === activeSource ? "active" : ""}" data-source="${src.replace(/"/g, "&quot;")}">
            <div class="device-icon">${getSourceIcon(src)}</div>
            <div class="device-name">${src}</div>
            ${src === activeSource ? `<div class="device-active-dot"></div>` : ""}
          </div>
        `).join("")}
      </div>
    `;

    section.querySelectorAll(".device-item").forEach(el => {
      el.addEventListener("click", () => {
        this._hass.callService("media_player", "select_source", { entity_id: this._config.entity, source: el.dataset.source });
      });
    });
  }

  // ── Tab switching ─────────────────────────────────────────────────────
  _switchTab(tab) {
    this._currentTab = tab;
    const isSearch = tab === "search";

    this._q("#tab-search-content").style.display    = isSearch ? "block" : "none";
    this._q("#tab-playlists-content").style.display = isSearch ? "none"  : "block";
    this._q("#tab-search-btn").classList.toggle("active", isSearch);
    this._q("#tab-playlists-btn").classList.toggle("active", !isSearch);

    if (!isSearch && !this._playlists.length) {
      this._loadPlaylists();
    }
  }

  // ── Search ────────────────────────────────────────────────────────────
  async _search(query) {
    if (!query || !this._hass) return;
    saveHistory(query);
    this._q("#search-history-wrap").innerHTML = "";
    const out = this._q("#search-results-wrap");
    try {
      const raw = await this._hass.callService(
        "spotify_plus", "search", { query, limit: 10 },
        undefined, undefined, true
      );
      const data = this._serviceRes(raw);
      if (data && (data.tracks || data.albums || data.playlists)) {
        this._renderSearchResults(data);
      }
    } catch (e) {
      out.innerHTML = `<div class="error-text">Busca falhou. Tente de novo.</div>`;
    }
  }

  async _playUri(uri, options = {}) {
    if (!this._hass || !uri) return;
    try {
      await this._hass.callService("spotify_plus", "play_uri", { uri, shuffle: !!options.shuffle });
    } catch (e) {
      // Erro já notificado nativamente pelo HomeAssistantError
    }

    // Spotify integration polls /me/player every ~30s. Force a refresh so the card
    // reflects the new track within ~1s instead of waiting for the next poll.
    // Slight delay so Spotify has time to update its state before HA polls.
    setTimeout(() => {
      this._hass.callService("homeassistant", "update_entity", {
        entity_id: this._config.entity,
      });
    }, 800);

    if (options.clearSearch !== false) {
      this._q("#search-input").value = "";
      this._q("#search-history-wrap").innerHTML = "";
      this._q("#search-results-wrap").innerHTML = "";
    }
  }

  _showSearchHistory() {
    const history = loadHistory();
    const wrap = this._q("#search-history-wrap");
    if (!history.length) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = `
      <div class="search-history">
        ${history.map(q => `
          <div class="history-item" data-query="${q.replace(/"/g, "&quot;")}">
            <span class="history-icon">${icon.clock}</span>
            <span class="history-label">${q}</span>
          </div>
        `).join("")}
      </div>
    `;
    wrap.querySelectorAll(".history-item").forEach(el => {
      // mousedown fires before blur so history item click is not swallowed
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this._q("#search-input").value = el.dataset.query;
        this._search(el.dataset.query);
      });
    });
  }

  _renderSearchResults(data) {
    const container = this._q("#search-results-wrap");
    if (!container) return;

    const items = [
      ...(data?.tracks?.items || []),
      ...(data?.albums?.items || []),
      ...(data?.playlists?.items || []),
    ].slice(0, 12);

    if (!items.length) {
      container.innerHTML = `<div class="empty-text">Nenhum resultado encontrado.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="search-results">
        ${items.map(item => {
          const img = item.album?.images?.[0]?.url || item.images?.[0]?.url || "";
          const sub = item.artists?.map(a => a.name).join(", ") || item.owner?.display_name || item.type || "";
          const pshuffle = (item.uri || "").includes("spotify:playlist:") ? "1" : "0";
          return `
            <div class="result-item" data-uri="${item.uri}" data-pshuffle="${pshuffle}">
              ${img ? `<img src="${img}" alt="" />` : `<div class="result-img-placeholder">${icon.musicSm}</div>`}
              <div class="result-info">
                <div class="result-name">${item.name}</div>
                <div class="result-sub">${sub}</div>
              </div>
              <button type="button" class="result-play-btn" data-uri="${item.uri}" data-pshuffle="${pshuffle}">${icon.playSm}</button>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.querySelectorAll(".result-item").forEach(el => {
      el.addEventListener("click", () => {
        this._playUri(el.dataset.uri, { shuffle: el.dataset.pshuffle === "1", clearSearch: true });
      });
    });
    container.querySelectorAll(".result-play-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._playUri(btn.dataset.uri, { shuffle: btn.dataset.pshuffle === "1", clearSearch: true });
      });
    });
  }

  // ── Playlists (tocar com shuffle; listagem de faixas removida — API/Spotify) ──
  async _loadPlaylists() {
    this._q("#sp-playlists-list").innerHTML = `<div class="loading-text">Carregando playlists...</div>`;
    try {
      const raw = await this._hass.callService(
        "spotify_plus", "get_playlists", {},
        undefined, undefined, true
      );
      const data = this._serviceRes(raw);
      if (data && Array.isArray(data.items)) {
        this._playlists = data.items;
        this._renderPlaylistsList();
      }
    } catch (e) {
      this._q("#sp-playlists-list").innerHTML = `<div class="error-text">Não foi possível carregar playlists.</div>`;
    }
  }

  _renderPlaylistsList() {
    const listEl = this._q("#sp-playlists-list");
    if (!this._playlists.length) {
      listEl.innerHTML = `<div class="empty-text">Nenhuma playlist encontrada.</div>`;
      return;
    }

    listEl.innerHTML = this._playlists.map(pl => {
      const img   = pl.images?.[0]?.url || "";
      const count = pl.tracks?.total ?? "";
      const isOwned = pl.is_owned || pl.collaborative;
      const sub = isOwned
        ? (count !== "" ? `${count} músicas` : "")
        : `por ${pl.owner_name || "Spotify"}`;
      return `
        <div class="playlist-item" data-uri="${pl.uri || ""}" data-name="${(pl.name || "").replace(/"/g, "&quot;")}" data-owned="${isOwned ? "1" : "0"}">
          ${img ? `<img src="${img}" alt="" />` : `<div class="playlist-img-placeholder">${icon.musicSm}</div>`}
          <div class="playlist-info">
            <div class="playlist-name">${pl.name}</div>
            ${sub ? `<div class="playlist-sub">${sub}</div>` : ""}
          </div>
          <button type="button" class="playlist-play-btn" data-uri="${pl.uri || ""}" title="Tocar (aleatório)">${icon.playSm}</button>
        </div>
      `;
    }).join("");

    const playShuffled = (uri) => {
      if (uri) this._playUri(uri, { shuffle: true, clearSearch: false });
    };

    listEl.querySelectorAll(".playlist-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".playlist-play-btn")) return;
        playShuffled(el.dataset.uri);
      });
    });
    listEl.querySelectorAll(".playlist-play-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        playShuffled(btn.dataset.uri);
      });
    });
  }

  // ── Card metadata ─────────────────────────────────────────────────────
  getCardSize() { return 5; }

  static getConfigElement() { return document.createElement("spotify-plus-card-editor"); }

  static getStubConfig() { return { entity: "media_player.spotify" }; }
}

customElements.define("spotify-plus-card", SpotifyPlusCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "spotify-plus-card",
  name: "Spotify Plus Card",
  description: "Controle o Spotify com estilo — playback, busca e playlists.",
  preview: true,
});

console.info(
  `%c 🎵 SPOTIFY PLUS CARD %c v${CARD_VERSION} `,
  "background:#1DB954;color:#000;font-weight:700;padding:2px 4px;border-radius:3px 0 0 3px",
  "background:#111;color:#1DB954;font-weight:500;padding:2px 4px;border-radius:0 3px 3px 0"
);
