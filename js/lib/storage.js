/**
 * storage.js
 * 轻量存储封装：统一 localStorage / chrome.storage 读取与写入
 * - 遵循 SOLID：单一职责（仅负责存储抽象），依赖倒置（上层依赖抽象而非具体）
 */

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

async function get(key) {
  if (hasChromeStorage()) {
    return await new Promise(resolve => {
      chrome.storage.local.get([key], result => resolve(result[key]));
    });
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

async function set(key, value) {
  if (hasChromeStorage()) {
    await new Promise(resolve => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

async function remove(key) {
  if (hasChromeStorage()) {
    await new Promise(resolve => {
      chrome.storage.local.remove([key], resolve);
    });
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

// 同步读取（仅用于无需等待的场景，如初始化 UI 文案）
function getSync(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export const storage = { get, set, remove, getSync };
export default storage;