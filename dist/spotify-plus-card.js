/**
 * Spotify Plus Card — Lovelace Custom Card
 * Phase 2: Playback control + device switching + search via spotify_plus integration
 *
 * Installation:
 *   1. Copy this file to /config/www/spotify-plus-card.js
 *   2. Add resource in HA: Settings > Dashboards > Resources
 *      URL: /local/spotify-plus-card.js  |  Type: JavaScript module
 *   3. Add card to dashboard (YAML or UI editor)
 *
 * Card config (YAML):
 *   type: custom:spotify-plus-card
 *   entity: media_player.spotify_<your_username>
 */

const CARD_VERSION = "1.0.0";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');

  :host {
    --sp-green: #1DB954;
    --sp-green-dim: #1aa34a;
    --sp-black: #0a0a0a;
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

  /* Ambient glow from album art */
  .ambient {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 1.2s ease;
    pointer-events: none;
    z-index: 0;
    filter: blur(60px) saturate(1.5);
    transform: scale(1.1);
  }
  .ambient.visible { opacity: 0.12; }

  .inner {
    position: relative;
    z-index: 1;
    padding: 20px;
  }

  /* ── NOW PLAYING ── */
  .now-playing {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 14px;
    align-items: center;
    margin-bottom: 18px;
  }

  .album-art-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }

  .album-art {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    object-fit: cover;
    display: block;
    background: var(--sp-surface2);
    transition: transform 0.3s ease;
  }
  .album-art:hover { transform: scale(1.04); }

  .album-art-placeholder {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    background: var(--sp-surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sp-text-dim);
  }

  .track-info { overflow: hidden; }

  .track-name {
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.2px;
    margin-bottom: 3px;
  }

  .track-artist {
    font-size: 12px;
    color: var(--sp-text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 400;
    margin-bottom: 6px;
  }

  .playing-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-family: var(--sp-mono);
    color: var(--sp-green);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .playing-dots {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 10px;
  }
  .playing-dots span {
    display: block;
    width: 2px;
    border-radius: 1px;
    background: var(--sp-green);
    animation: equalizer 1.1s ease-in-out infinite;
  }
  .playing-dots span:nth-child(1) { height: 4px; animation-delay: 0s; }
  .playing-dots span:nth-child(2) { height: 8px; animation-delay: 0.15s; }
  .playing-dots span:nth-child(3) { height: 5px; animation-delay: 0.3s; }
  .playing-dots span:nth-child(4) { height: 9px; animation-delay: 0.1s; }

  .paused-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-family: var(--sp-mono);
    color: var(--sp-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @keyframes equalizer {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1); }
  }

  /* ── PROGRESS ── */
  .progress-section { margin-bottom: 16px; }

  .progress-track {
    height: 3px;
    background: var(--sp-surface3);
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
    margin-bottom: 6px;
    position: relative;
  }
  .progress-track:hover { height: 5px; margin-bottom: 4px; transition: height 0.1s; }

  .progress-fill {
    height: 100%;
    background: var(--sp-green);
    border-radius: 2px;
    transition: width 1s linear;
    pointer-events: none;
  }

  .progress-times {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    font-family: var(--sp-mono);
    color: var(--sp-text-dim);
  }

  /* ── CONTROLS ── */
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 18px;
  }

  .ctrl-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sp-text-dim);
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .ctrl-btn:hover { color: var(--sp-text); background: var(--sp-surface2); }
  .ctrl-btn:active { transform: scale(0.9); }
  .ctrl-btn.active { color: var(--sp-green); }

  .ctrl-btn.play-pause {
    width: 48px;
    height: 48px;
    background: var(--sp-green);
    color: #000;
    border-radius: 50%;
    padding: 0;
  }
  .ctrl-btn.play-pause:hover { background: #1ed760; color: #000; transform: scale(1.04); }
  .ctrl-btn.play-pause:active { transform: scale(0.95); }

  /* ── VOLUME ── */
  .volume-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .volume-icon { color: var(--sp-text-dim); flex-shrink: 0; }

  .volume-slider {
    flex: 1;
    -webkit-appearance: none;
    height: 3px;
    background: var(--sp-surface3);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--sp-text);
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
  }
  .volume-slider:hover::-webkit-slider-thumb {
    background: var(--sp-green);
    transform: scale(1.2);
  }
  .volume-slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--sp-text);
    cursor: pointer;
    border: none;
  }

  .volume-pct {
    font-size: 10px;
    font-family: var(--sp-mono);
    color: var(--sp-text-dim);
    width: 28px;
    text-align: right;
    flex-shrink: 0;
  }

  /* ── DIVIDER ── */
  .divider {
    height: 1px;
    background: var(--sp-border);
    margin-bottom: 14px;
  }

  /* ── DEVICE SELECTOR ── */
  .section-label {
    font-size: 10px;
    font-family: var(--sp-mono);
    color: var(--sp-text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .devices-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .device-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
    border: 1px solid transparent;
  }
  .device-item:hover { background: var(--sp-surface2); }
  .device-item.active {
    background: var(--sp-surface2);
    border-color: var(--sp-border);
  }
  .device-item.active .device-name { color: var(--sp-green); }

  .device-icon { color: var(--sp-text-dim); flex-shrink: 0; }
  .device-item.active .device-icon { color: var(--sp-green); }

  .device-name {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .device-active-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sp-green);
    flex-shrink: 0;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* ── OFFLINE / IDLE STATE ── */
  .idle-state {
    padding: 32px 20px;
    text-align: center;
  }
  .idle-icon { color: var(--sp-text-dim); margin-bottom: 12px; }
  .idle-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--sp-text-mid);
    margin-bottom: 4px;
  }
  .idle-sub {
    font-size: 12px;
    color: var(--sp-text-dim);
  }

  /* ── ERROR ── */
  .error-state {
    padding: 16px 20px;
    background: rgba(255,60,60,0.08);
    border-radius: 10px;
    border: 1px solid rgba(255,60,60,0.2);
    margin: 20px;
    font-size: 12px;
    color: rgba(255,120,120,0.9);
  }

  /* ── SEARCH ── */
  .search-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }

  .search-input {
    flex: 1;
    padding: 9px 12px;
    background: var(--sp-surface2);
    border: 1px solid var(--sp-border);
    border-radius: 10px;
    color: var(--sp-text);
    font-family: var(--sp-font);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--sp-green); }
  .search-input::placeholder { color: var(--sp-text-dim); }

  .search-btn {
    padding: 9px 14px;
    background: var(--sp-green);
    color: #000;
    border: none;
    border-radius: 10px;
    font-family: var(--sp-font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .search-btn:hover { background: #1ed760; }
  .search-btn:active { transform: scale(0.95); }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    overflow-y: auto;
  }
  .search-results::-webkit-scrollbar { width: 3px; }
  .search-results::-webkit-scrollbar-track { background: transparent; }
  .search-results::-webkit-scrollbar-thumb { background: var(--sp-surface3); border-radius: 2px; }

  .search-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .search-result:hover { background: var(--sp-surface2); }

  .search-result img {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .search-result-img-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    background: var(--sp-surface3);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sp-text-dim);
  }

  .search-result-info { flex: 1; overflow: hidden; }

  .search-result-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .search-result-sub {
    font-size: 11px;
    color: var(--sp-text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .search-play-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sp-text-dim);
    padding: 6px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .search-play-btn:hover { color: var(--sp-green); background: var(--sp-surface3); }
`;

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icon = {
  play: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  prev: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
  next: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zm2.5-6 8.5 6V6z"/><path d="M16 6h2v12h-2z"/></svg>`,
  shuffle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
  repeat: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
  volHigh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
  volLow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`,
  volMute: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>`,
  speaker: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-9H9V6h6v2z"/></svg>`,
  tv: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
  computer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
  phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`,
  music: `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  playSmall: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getDeviceIcon(type) {
  if (!type) return icon.speaker;
  const t = type.toLowerCase();
  if (t.includes("speaker") || t.includes("echo") || t.includes("alexa")) return icon.speaker;
  if (t.includes("tv") || t.includes("cast") || t.includes("chromecast")) return icon.tv;
  if (t.includes("computer") || t.includes("desktop") || t.includes("laptop")) return icon.computer;
  if (t.includes("smartphone") || t.includes("phone")) return icon.phone;
  return icon.speaker;
}

// ── Web Component ──────────────────────────────────────────────────────────
class SpotifyPlusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._progressInterval = null;
    this._localPosition = 0;
    this._lastUpdate = Date.now();
    this._searchResults = [];
    this._searchQuery = "";
    this._initialized = false;
    this._unsubSearch = null;
  }

  disconnectedCallback() {
    if (this._unsubSearch) this._unsubSearch();
  }

  setConfig(config) {
    if (!config.entity) throw new Error("spotify-plus-card: 'entity' é obrigatório");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._subscribeEvents();
    }
    this._render();
  }

  _subscribeEvents() {
    this._hass.connection.subscribeEvents((event) => {
      this._searchResults = event.data;
      this._render();
    }, "spotify_plus_search_results").then((unsub) => {
      this._unsubSearch = unsub;
    });
  }

  _search(query) {
    if (!query || !this._hass) return;
    this._searchQuery = query;
    this._hass.callService("spotify_plus", "search", { query, limit: 10 });
  }

  _playUri(uri) {
    if (!this._hass) return;
    this._hass.callService("spotify_plus", "play_uri", { uri });
  }

  _getState() {
    const entity = this._hass?.states[this._config.entity];
    if (!entity) return null;
    return entity;
  }

  _getMediaPlayers() {
    if (!this._hass) return [];
    return Object.entries(this._hass.states)
      .filter(([id, s]) => id.startsWith("media_player.") && s.state !== "unavailable")
      .map(([id, s]) => ({
        entity_id: id,
        name: s.attributes.friendly_name || id,
        type: s.attributes.device_class || s.attributes.source || "",
        active: id === this._config.entity && ["playing", "paused"].includes(s.state),
      }))
      .sort((a, b) => b.active - a.active);
  }

  _callService(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  _handlePlayPause() {
    const s = this._getState();
    if (!s) return;
    const service = s.state === "playing" ? "media_pause" : "media_play";
    this._callService("media_player", service, { entity_id: this._config.entity });
  }

  _handlePrev() {
    this._callService("media_player", "media_previous_track", { entity_id: this._config.entity });
  }

  _handleNext() {
    this._callService("media_player", "media_next_track", { entity_id: this._config.entity });
  }

  _handleShuffle() {
    const s = this._getState();
    if (!s) return;
    this._callService("media_player", "shuffle_set", {
      entity_id: this._config.entity,
      shuffle: !s.attributes.shuffle,
    });
  }

  _handleRepeat() {
    const s = this._getState();
    if (!s) return;
    const modes = ["off", "one", "all"];
    const current = s.attributes.repeat || "off";
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    this._callService("media_player", "repeat_set", {
      entity_id: this._config.entity,
      repeat: next,
    });
  }

  _handleVolume(val) {
    this._callService("media_player", "volume_set", {
      entity_id: this._config.entity,
      volume_level: val / 100,
    });
  }

  _handleDeviceSwitch(entityId) {
    // Transfer playback to another media_player
    // If it's the same spotify entity just set source; otherwise join/switch
    this._callService("media_player", "media_play", { entity_id: entityId });
  }

  _render() {
    if (!this._config.entity) return;

    const state = this._getState();
    const players = this._getMediaPlayers();

    const isPlaying = state?.state === "playing";
    const isPaused = state?.state === "paused";
    const isIdle = !state || !["playing", "paused"].includes(state.state);

    const attr = state?.attributes || {};
    const title = attr.media_title || "";
    const artist = attr.media_artist || "";
    const albumArt = attr.entity_picture || "";
    const duration = attr.media_duration || 0;
    const position = attr.media_position || 0;
    const volume = Math.round((attr.volume_level || 0) * 100);
    const shuffle = attr.shuffle || false;
    const repeat = attr.repeat || "off";

    const volIconHtml = volume === 0 ? icon.volMute : volume < 50 ? icon.volLow : icon.volHigh;
    const progress = duration > 0 ? (position / duration) * 100 : 0;

    const spotifyPlayers = players.filter(p => p.entity_id.includes("spotify"));
    const otherPlayers = players.filter(p => !p.entity_id.includes("spotify")).slice(0, 6);
    const allDevices = [...spotifyPlayers, ...otherPlayers];

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card class="card">
        ${albumArt ? `<div class="ambient" style="background: url('${albumArt}') center/cover"></div>` : ""}
        ${isIdle ? `
          <div class="inner">
            <div class="idle-state" style="padding: 24px 0 20px;">
              <div class="idle-icon">${icon.music}</div>
              <div class="idle-title">Spotify Plus</div>
              <div class="idle-sub">Nenhuma música tocando</div>
            </div>
            <div class="divider"></div>
            <div class="section-label">Buscar</div>
            <div class="search-row">
              <input class="search-input" id="search-input" type="text"
                placeholder="Música, artista, álbum..." value="${this._searchQuery}" />
              <button class="search-btn" id="search-btn">${icon.search}</button>
            </div>
            ${this._searchResults && (this._searchResults.tracks?.items?.length || this._searchResults.albums?.items?.length || this._searchResults.playlists?.items?.length) ? `
              <div class="search-results">
                ${[
                  ...(this._searchResults.tracks?.items || []),
                  ...(this._searchResults.albums?.items || []),
                  ...(this._searchResults.playlists?.items || []),
                ].slice(0, 12).map(item => {
                  const img = item.album?.images?.[0]?.url || item.images?.[0]?.url || "";
                  const sub = item.artists?.map(a => a.name).join(", ") || item.owner?.display_name || item.type || "";
                  return `
                    <div class="search-result" data-uri="${item.uri}">
                      ${img ? `<img src="${img}" alt="" />` : `<div class="search-result-img-placeholder">${icon.music.replace("32", "18")}</div>`}
                      <div class="search-result-info">
                        <div class="search-result-name">${item.name}</div>
                        <div class="search-result-sub">${sub}</div>
                      </div>
                      <button class="search-play-btn" data-uri="${item.uri}" title="Tocar">${icon.playSmall}</button>
                    </div>
                  `;
                }).join("")}
              </div>
            ` : ""}
          </div>
        ` : `
          <div class="inner">
            <!-- Now Playing -->
            <div class="now-playing">
              <div class="album-art-wrap">
                ${albumArt
                  ? `<img class="album-art" src="${albumArt}" alt="Album art" />`
                  : `<div class="album-art-placeholder">${icon.music}</div>`
                }
              </div>
              <div class="track-info">
                <div class="track-name" title="${title}">${title || "—"}</div>
                <div class="track-artist">${artist || "—"}</div>
                ${isPlaying
                  ? `<div class="playing-badge">
                      <div class="playing-dots">
                        <span></span><span></span><span></span><span></span>
                      </div>
                      Tocando
                    </div>`
                  : `<div class="paused-badge">⏸ Pausado</div>`
                }
              </div>
            </div>

            <!-- Progress -->
            <div class="progress-section">
              <div class="progress-track" id="progress-track">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="progress-times">
                <span>${formatTime(position)}</span>
                <span>${formatTime(duration)}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="controls">
              <button class="ctrl-btn ${shuffle ? "active" : ""}" id="btn-shuffle" title="Shuffle">
                ${icon.shuffle}
              </button>
              <button class="ctrl-btn" id="btn-prev" title="Anterior">
                ${icon.prev}
              </button>
              <button class="ctrl-btn play-pause" id="btn-playpause" title="${isPlaying ? "Pausar" : "Tocar"}">
                ${isPlaying ? icon.pause : icon.play}
              </button>
              <button class="ctrl-btn" id="btn-next" title="Próxima">
                ${icon.next}
              </button>
              <button class="ctrl-btn ${repeat !== "off" ? "active" : ""}" id="btn-repeat" title="Repeat: ${repeat}">
                ${icon.repeat}
              </button>
            </div>

            <!-- Volume -->
            <div class="volume-row">
              <div class="volume-icon">${volIconHtml}</div>
              <input type="range" class="volume-slider" id="vol-slider"
                min="0" max="100" value="${volume}" />
              <span class="volume-pct">${volume}%</span>
            </div>

            ${allDevices.length > 1 ? `
              <div class="divider"></div>
              <div class="section-label">Dispositivos</div>
              <div class="devices-list">
                ${allDevices.map(d => `
                  <div class="device-item ${d.active ? "active" : ""}" data-entity="${d.entity_id}">
                    <div class="device-icon">${getDeviceIcon(d.type)}</div>
                    <div class="device-name">${d.name}</div>
                    ${d.active ? `<div class="device-active-dot"></div>` : ""}
                  </div>
                `).join("")}
              </div>
            ` : ""}

            <!-- Search -->
            <div class="divider"></div>
            <div class="section-label">Buscar</div>
            <div class="search-row">
              <input
                class="search-input"
                id="search-input"
                type="text"
                placeholder="Música, artista, álbum..."
                value="${this._searchQuery}"
              />
              <button class="search-btn" id="search-btn">${icon.search}</button>
            </div>
            ${this._searchResults && (this._searchResults.tracks?.items?.length || this._searchResults.albums?.items?.length || this._searchResults.playlists?.items?.length) ? `
              <div class="search-results">
                ${[
                  ...(this._searchResults.tracks?.items || []),
                  ...(this._searchResults.albums?.items || []),
                  ...(this._searchResults.playlists?.items || []),
                ].slice(0, 12).map(item => {
                  const img = item.album?.images?.[0]?.url || item.images?.[0]?.url || "";
                  const sub = item.artists?.map(a => a.name).join(", ") || item.owner?.display_name || item.type || "";
                  return `
                    <div class="search-result" data-uri="${item.uri}">
                      ${img
                        ? `<img src="${img}" alt="" />`
                        : `<div class="search-result-img-placeholder">${icon.music.replace("32", "18")}</div>`
                      }
                      <div class="search-result-info">
                        <div class="search-result-name">${item.name}</div>
                        <div class="search-result-sub">${sub}</div>
                      </div>
                      <button class="search-play-btn" data-uri="${item.uri}" title="Tocar">${icon.playSmall}</button>
                    </div>
                  `;
                }).join("")}
              </div>
            ` : ""}
          </div>
        `}
      </ha-card>
    `;

    // Attach ambient glow
    if (albumArt) {
      requestAnimationFrame(() => {
        const amb = this.shadowRoot.querySelector(".ambient");
        if (amb) setTimeout(() => amb.classList.add("visible"), 100);
      });
    }

    // Event listeners
    this.shadowRoot.getElementById("btn-playpause")?.addEventListener("click", () => this._handlePlayPause());
    this.shadowRoot.getElementById("btn-prev")?.addEventListener("click", () => this._handlePrev());
    this.shadowRoot.getElementById("btn-next")?.addEventListener("click", () => this._handleNext());
    this.shadowRoot.getElementById("btn-shuffle")?.addEventListener("click", () => this._handleShuffle());
    this.shadowRoot.getElementById("btn-repeat")?.addEventListener("click", () => this._handleRepeat());

    this.shadowRoot.getElementById("vol-slider")?.addEventListener("change", (e) => {
      this._handleVolume(parseInt(e.target.value));
    });
    this.shadowRoot.getElementById("vol-slider")?.addEventListener("input", (e) => {
      const pct = this.shadowRoot.querySelector(".volume-pct");
      if (pct) pct.textContent = `${e.target.value}%`;
    });

    this.shadowRoot.querySelectorAll(".device-item").forEach(el => {
      el.addEventListener("click", () => {
        this._handleDeviceSwitch(el.dataset.entity);
      });
    });

    const searchInput = this.shadowRoot.getElementById("search-input");
    const searchBtn = this.shadowRoot.getElementById("search-btn");
    searchBtn?.addEventListener("click", () => this._search(searchInput?.value.trim()));
    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._search(searchInput.value.trim());
    });

    this.shadowRoot.querySelectorAll(".search-play-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._playUri(btn.dataset.uri);
      });
    });
    this.shadowRoot.querySelectorAll(".search-result").forEach(el => {
      el.addEventListener("click", () => this._playUri(el.dataset.uri));
    });
  }

  getCardSize() { return 4; }

  static getConfigElement() {
    return document.createElement("spotify-plus-card-editor");
  }

  static getStubConfig() {
    return { entity: "media_player.spotify" };
  }
}

customElements.define("spotify-plus-card", SpotifyPlusCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "spotify-plus-card",
  name: "Spotify Plus Card",
  description: "Controle o Spotify com estilo — playback, volume e dispositivos.",
  preview: true,
});

console.info(`%c 🎵 SPOTIFY PLUS CARD %c v${CARD_VERSION} `, 
  "background:#1DB954;color:#000;font-weight:700;padding:2px 4px;border-radius:3px 0 0 3px",
  "background:#111;color:#1DB954;font-weight:500;padding:2px 4px;border-radius:0 3px 3px 0"
);