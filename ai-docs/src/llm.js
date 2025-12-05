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

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function summarizeWithLLM({ systemPrompt = 'You are a helpful assistant that extracts functional requirements from code and documents.', userPrompt, model = 'gpt-4o-mini' }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');

  try {
    const res = await axios.post(
      OPENAI_URL,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const choice = res.data && res.data.choices && res.data.choices[0];
    if (!choice) return null;
    return choice.message?.content || choice.text || null;
  } catch (e) {
    throw new Error(`LLM request failed: ${e.message}`);
  }
}
