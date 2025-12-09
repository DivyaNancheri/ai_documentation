import fs from 'fs';
import path from 'path';
import axios from 'axios';

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

export async function summarizeWithLLM({ systemPrompt = 'You are a helpful assistant that extracts functional requirements from code and documents.', userPrompt, model = 'gpt-4o-mini' }) {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://<resource>.openai.azure.com
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT; // deployment name configured in Azure

  console.log('summarizeWithLLM called with model:');
  if (!azureEndpoint || !azureKey || !azureDeployment) {
    console.log('Missing Azure OpenAI configuration:');
    throw new Error('Azure OpenAI configuration not found. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in the environment to enable LLM support. Public OpenAI (OPENAI_API_KEY) is disabled in this build.');
  }

  const url = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(azureDeployment)}/chat/completions?api-version=2023-10-01`;
  console.log('Using Azure OpenAI endpoint:', url);
  // Helper to POST to a URL
  async function postTo(urlToPost, msgs, apiKey) {
    return axios.post(
      urlToPost,
      {
        messages: msgs,
        max_tokens: 1200,
        temperature: 0.2
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
  }

  // Helper to try listing deployments for diagnostics
  async function listDeployments(endpointHost, apiVersion) {
    const listUrl = `${endpointHost.replace(/\/$/, '')}/openai/deployments?api-version=${apiVersion}`;
    try {
      const r = await axios.get(listUrl, { headers: { 'api-key': azureKey }, timeout: 10000 });
      return { ok: true, url: listUrl, status: r.status, data: r.data };
    } catch (err) {
      return { ok: false, url: listUrl, status: err.response && err.response.status, data: err.response && err.response.data, error: err.message };
    }
  }

  try {
    const res = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.2
      },
      {
        headers: {
          'api-key': azureKey,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    console.log('---------------------------------');
    console.log('request URL:', url);
    console.log('request body:', JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.2
    }, null, 2).slice(0, 2000));
    const choice = res.data && res.data.choices && res.data.choices[0];
    console.log('LLM raw response:', JSON.stringify(res.data, null, 2).slice(0, 2000));
    console.log('---------------------------------');
    if (!choice) return null;
    return choice.message?.content || choice.text || null;
  } catch (e) {
    const respStatus = e.response && e.response.status;
    const respData = e.response && e.response.data;
    console.log('Initial Azure call failed:', respStatus, respData || e.message);

    // Try to get deployment list for diagnostics and to check for correct deployment name
    const tried = [];
    const apiVersionsToTry = ['2023-10-01', '2023-05-15', '2024-12-01-preview'];
    for (const v of apiVersionsToTry) {
      const r = await listDeployments(azureEndpoint, v);
      tried.push(r);
      if (r.ok && r.data && Array.isArray(r.data.value)) {
        // deployments listed - check if requested deployment exists
        const names = r.data.value.map(d => d.name);
        if (!names.includes(azureDeployment)) {
          throw new Error(`Deployment '${azureDeployment}' not found on resource. Available deployments: ${names.join(', ')} (checked api-version=${v}).`);
        }
        // if it exists but POST failed, include diagnostic
        throw new Error(`Deployment '${azureDeployment}' is present but POST failed. Deployment list response: ${JSON.stringify(r.data)}; original error: ${respData || e.message}`);
      }
    }

    // If endpoint looks like a cognitive services host, try inferred openai.azure.com host and list there
    if (azureEndpoint && azureEndpoint.includes('cognitiveservices.azure.com')) {
      const inferredHost = azureEndpoint.replace('cognitiveservices.azure.com', 'openai.azure.com');
      for (const v of apiVersionsToTry) {
        const r = await listDeployments(inferredHost, v);
        tried.push(r);
        if (r.ok && r.data && Array.isArray(r.data.value)) {
          const names = r.data.value.map(d => d.name);
          if (!names.includes(azureDeployment)) {
            throw new Error(`Deployment '${azureDeployment}' not found on inferred resource ${inferredHost}. Available deployments: ${names.join(', ')} (checked api-version=${v}).`);
          }
          throw new Error(`Deployment '${azureDeployment}' exists on inferred host ${inferredHost} but POST failed. Deployment list response: ${JSON.stringify(r.data)}; original error: ${respData || e.message}`);
        }
      }
    }

    // Nothing worked - include the diagnostic attempts in the thrown error for clarity
    const summary = tried.map(t => `${t.url} -> status:${t.status} data:${t.data ? JSON.stringify(t.data) : '<no-data>'}`).join(' | ');
    throw new Error(`Azure LLM request failed: ${respData ? JSON.stringify(respData) : e.message}. Deployment/listing attempts: ${summary}`);
  }
}
