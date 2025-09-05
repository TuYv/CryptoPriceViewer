/**
 * http.js
 * 轻量 HTTP 封装：统一错误处理与 JSON 解析
 * - 遵循 SOLID：单一职责（仅负责网络请求）、开放封闭（通过 options 扩展）
 */

class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

async function request(url, options = {}) {
  const { method = 'GET', headers = {}, body } = options;
  const res = await fetch(url, { method, headers, body });
  const contentType = res.headers.get('content-type') || '';

  let payload = null;
  if (contentType.includes('application/json')) {
    try { payload = await res.json(); } catch (_) { payload = null; }
  } else {
    try { payload = await res.text(); } catch (_) { payload = null; }
  }

  if (!res.ok) {
    const msg = `HTTP ${res.status}`;
    throw new HttpError(msg, res.status, payload);
  }

  return payload;
}

function getJson(url, options = {}) {
  return request(url, { ...options, method: options.method || 'GET' });
}

function postJson(url, data, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  return request(url, { ...options, method: 'POST', headers, body: JSON.stringify(data) });
}

export const http = { request, getJson, postJson, HttpError };
export default http;