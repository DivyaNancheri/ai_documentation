import axios from 'axios';
import { URL } from 'url';

// Publish a markdown content to Confluence Cloud as a new page.
// Requires env:
// - CONFLUENCE_BASE_URL (e.g. https://your-domain.atlassian.net/wiki)
// - CONFLUENCE_USERNAME
// - CONFLUENCE_API_TOKEN

function getAuth() {
  const base = process.env.CONFLUENCE_BASE_URL;
  const user = process.env.CONFLUENCE_USERNAME;
  const token = process.env.CONFLUENCE_API_TOKEN;
  if (!base || !user || !token) throw new Error('CONFLUENCE_BASE_URL, CONFLUENCE_USERNAME and CONFLUENCE_API_TOKEN must be set');
  return { base, user, token };
}

function normalizeBaseUrl(raw) {
  if (!raw) return raw;
  let out = raw.trim();
  // ensure protocol
  if (!out.startsWith('http://') && !out.startsWith('https://')) out = 'https://' + out;
  // remove trailing slash
  out = out.replace(/\/$/, '');
  try {
    const u = new URL(out);
    // For Atlassian Cloud instances, API is typically under /wiki
    if (u.hostname && u.hostname.endsWith('.atlassian.net') && !u.pathname.startsWith('/wiki')) {
      out = `${u.origin}/wiki`;
    }
  } catch (e) {
    // ignore URL parse errors; return original trimmed value
  }
  return out;
}


export async function publishToConfluence({ space, title, content, isHtml = false }) {
  const { base: rawBase, user, token } = getAuth();
  const base = normalizeBaseUrl(rawBase);
  const url = `${base}/rest/api/content`;
  const bodyValue = isHtml ? content : markdownToStorageFormat(content);
  const data = {
    type: 'page',
    title: title || `AI Docs - ${new Date().toISOString()}`,
    space: { key: space || 'DOCS' },
    body: {
      storage: {
        value: bodyValue,
        representation: 'storage'
      }
    }
  };

  const auth = { username: user, password: token };

  // Build axios request options with timeout and optional proxy support.
  const timeout = parseInt(process.env.CONFLUENCE_REQUEST_TIMEOUT_MS || '15000', 10);
  const proxyFromEnv = parseProxyEnv();
  const axiosOpts = {
    auth,
    headers: { 'Content-Type': 'application/json' },
    timeout
  };
  if (proxyFromEnv) {
    axiosOpts.proxy = proxyFromEnv;
  }

  // Retry logic for transient network issues
  const maxRetries = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.post(url, data, axiosOpts);
      return res.data;
    } catch (e) {
      lastErr = e;
      const code = e.code || (e.response && e.response.status) || 'UNKNOWN';
      // For timeout/network errors, retry with backoff
      if (['ECONNABORTED', 'ETIMEDOUT', 'ENETUNREACH', 'EAI_AGAIN', 'ECONNRESET'].includes(e.code) || (e.response && e.response.status >= 500)) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      // For 4xx errors or other permanent failures, break and throw
      // break and handle below
      break;
    }
  }

  // If we reach here, publishing failed after retries
  const friendly = friendlyConfluenceError(lastErr, url);
  // include server response body when available to aid debugging
  if (lastErr && lastErr.response && lastErr.response.data) {
    const body = typeof lastErr.response.data === 'string' ? lastErr.response.data : JSON.stringify(lastErr.response.data);
    throw new Error(`${friendly} Response body: ${body}`);
  }
  throw new Error(friendly);
}

export async function validateConfluenceSpace(spaceKey) {
  const { base, user, token } = getAuth();
  const baseNormalized = normalizeBaseUrl(base);
  const url = `${baseNormalized}/rest/api/space/${encodeURIComponent(spaceKey)}`;
  const timeout = parseInt(process.env.CONFLUENCE_REQUEST_TIMEOUT_MS || '15000', 10);
  const proxyFromEnv = parseProxyEnv();
  const axiosOpts = { auth: { username: user, password: token }, timeout };
  if (proxyFromEnv) axiosOpts.proxy = proxyFromEnv;

  try {
    const res = await axios.get(url, axiosOpts);
    return res && res.status === 200;
  } catch (e) {
    if (e.response && e.response.status === 404) {
      // If 404, include helpful advice: check base URL and space key
      throw new Error(`Confluence space not found (404) for key '${spaceKey}'. Verify CONFLUENCE_SPACE_KEY in .env, that the space exists, and that CONFLUENCE_BASE_URL is correct (include '/wiki' for Atlassian Cloud). Request URL: ${url}`);
    }
    throw new Error(friendlyConfluenceError(e, url));
  }
}

function parseProxyEnv() {
  // Read HTTPS_PROXY or HTTP_PROXY environment var if present and return axios proxy config
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const proxy = { host: u.hostname, port: parseInt(u.port || (u.protocol === 'https:' ? '443' : '80'), 10) };
    if (u.username || u.password) proxy.auth = { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) };
    // axios expects protocol-less proxy config; protocol is optional
    return proxy;
  } catch (e) {
    return null;
  }
}

function friendlyConfluenceError(err, url) {
  if (!err) return `Failed to publish to Confluence at ${url}`;
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return `Failed to publish to Confluence: request timed out when connecting to ${url}. Check network connectivity, proxy settings (HTTPS_PROXY), and that '${process.env.CONFLUENCE_BASE_URL}' is reachable from this machine.`;
  }
  if (err.code === 'ENOTFOUND') {
    return `Failed to publish to Confluence: DNS lookup failed for ${url}. Verify CONFLUENCE_BASE_URL and network/DNS settings.`;
  }
  if (err.response && err.response.status) {
    const status = err.response.status;
    const statusText = err.response.statusText || '';
    // Provide more guidance for common 4xx errors
    if (status === 401 || status === 403) {
      return `Failed to publish to Confluence: HTTP ${status} ${statusText}. Authentication failed or permission denied. Verify CONFLUENCE_USERNAME/CONFLUENCE_API_TOKEN and that the user has permission to create pages in the space.`;
    }
    if (status === 404) {
      return `Failed to publish to Confluence: HTTP 404 Not Found when calling ${url}. Verify CONFLUENCE_BASE_URL (include /wiki for Atlassian Cloud) and that the space key is correct.`;
    }
    return `Failed to publish to Confluence: HTTP ${status} - ${statusText}. Check credentials and space permissions.`;
  }
  return `Failed to publish to Confluence: ${err.message || String(err)}.`;
}

function markdownToStorageFormat(md) {
  // Very simple converter: wrap in <pre> so the markdown remains readable in Confluence.
  // For production, use a full markdown->confluence storage format converter.
  return `<pre>${escapeHtml(md)}</pre>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
