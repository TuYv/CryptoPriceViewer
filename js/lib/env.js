// Lightweight config loader for browser/extension runtime
// - Loads "config.properties" from the extension root (same directory level as popup.html)
// - Parses KEY=VALUE lines, ignores comments (#) and empty lines
// - Exposes Env.load() and Env.get(key, defaultValue)
// - Safe to call multiple times; subsequent calls are no-ops

export const Env = {
  _loaded: false,
  _vars: {},

  async load() {
    if (this._loaded) return;
    try {
      // Path relative to popup.html (extension root)
      const res = await fetch('config.properties', { cache: 'no-store' });
      if (!res.ok) {
        this._loaded = true; // Mark as loaded even if not found; we just have no env
        return;
      }
      const text = await res.text();
      this._vars = this._parse(text);
    } catch (_) {
      // Ignore errors silently; env is optional
    } finally {
      this._loaded = true;
    }
  },

  get(key, defaultValue = undefined) {
    if (!this._loaded) {
      // Best-effort: return default before async load completes
      // Callers that need env should await load() in advance
    }
    const v = this._vars[key];
    if (v === undefined || v === null || v === '') return defaultValue;
    return v;
  },

  _parse(text) {
    const out = {};
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Remove optional surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1);
      }
      // Unescape common sequences
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
      if (key) out[key] = value;
    });
    return out;
  }
};