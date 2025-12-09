import axios from 'axios';
import fs from 'fs';
import path from 'path';

function loadDotEnvIfPresent() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    // ignore
  }
}

loadDotEnvIfPresent();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const key = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

console.log('Using:');
console.log('AZURE_OPENAI_ENDPOINT=', endpoint || '<not-set>');
console.log('AZURE_OPENAI_DEPLOYMENT=', deployment || '<not-set>');
console.log('AZURE_OPENAI_API_KEY=', key ? '***REDACTED***' : '<not-set>');

if (!endpoint || !deployment || !key) {
  console.error('Missing required env vars: ensure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_KEY are set');
  process.exit(2);
}

async function tryRoot() {
  try {
    const url = endpoint.replace(/\/$/, '');
    console.log('\n1) GET root endpoint: ' + url);
    const res = await axios.get(url, { headers: { 'api-key': key }, timeout: 10000 });
    console.log('GET status:', res.status);
    console.log('GET data:', JSON.stringify(res.data, null, 2).slice(0, 2000));
    return true;
  } catch (e) {
    if (e.response) {
      console.log('GET response status:', e.response.status);
      try { console.log('GET response data:', JSON.stringify(e.response.data, null, 2)); } catch (err) { console.log('GET response data (raw):', e.response.data); }
    } else {
      console.log('GET error:', e.message);
    }
    return false;
  }
}

async function tryPost(apiVersion) {
  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${apiVersion}`;
  console.log(`\n2) POST to deployment (api-version=${apiVersion}): ${url}`);
  try {
    const res = await axios.post(url,
      {
        messages: [
          { role: 'system', content: 'You are a ping responder.' },
          { role: 'user', content: 'Ping' }
        ],
        max_tokens: 3,
        temperature: 0
      },
      {
        headers: { 'api-key': key, 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    console.log('POST status:', res.status);
    console.log('POST data:', JSON.stringify(res.data, null, 2).slice(0, 2000));
    return true;
  } catch (e) {
    if (e.response) {
      console.log('POST response status:', e.response.status);
      try { console.log('POST response data:', JSON.stringify(e.response.data, null, 2)); } catch (err) { console.log('POST response data (raw):', e.response.data); }
    } else {
      console.log('POST error:', e.message);
    }
    return false;
  }
}

(async function main(){
  const rootOk = await tryRoot();
  const versions = ['2023-10-01', '2023-05-15'];
  let anyOk = false;
  for (const v of versions) {
    const ok = await tryPost(v);
    anyOk = anyOk || ok;
  }

  if (!rootOk && !anyOk) {
    console.error('\nAll checks failed. Review endpoint, deployment name, and API key.');
    process.exit(2);
  }
  console.log('\nAt least one check passed (or root reachable).');
  process.exit(0);
})();
