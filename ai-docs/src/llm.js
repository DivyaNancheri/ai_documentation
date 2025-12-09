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

function buildLLMConfig() {
  // Azure OpenAI configuration
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  // Regular OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY;

  if (azureEndpoint && azureKey && azureDeployment) {
    // Use Azure OpenAI
    const url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    return {
      url,
      headers: {
        'api-key': azureKey,
        'Content-Type': 'application/json'
      },
      provider: 'azure'
    };
  } else if (openaiKey) {
    // Use OpenAI
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      provider: 'openai'
    };
  } else {
    throw new Error('LLM configuration missing. Set either:\n' +
      '- Azure: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT_NAME\n' +
      '- OpenAI: OPENAI_API_KEY');
  }
}

export async function summarizeWithLLM({ 
  systemPrompt = 'You are a helpful assistant that extracts functional requirements from code and documents.', 
  userPrompt, 
  model = 'gpt-4o-mini' 
}) {
  const config = buildLLMConfig();
  
  console.log(`Using ${config.provider.toUpperCase()} for LLM requests...`);

  try {
    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 8000  // Increased for comprehensive analysis
    };

    // Determine the actual model name for Azure (from deployment) or OpenAI
    const actualModel = config.provider === 'azure' ? 
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME : model;
    
    // Only add temperature for models that support it (not gpt-5-nano)
    if (!actualModel?.includes('nano')) {
      requestBody.temperature = 0.2;
    }

    // Only add model for OpenAI (Azure uses deployment name in URL)
    if (config.provider === 'openai') {
      requestBody.model = model;
    }

    console.log(`🚀 Making ${config.provider} API call...`);
    
    const res = await axios.post(
      config.url,
      requestBody,
      {
        headers: config.headers,
        timeout: 120000
      }
    );

    console.log(`📊 API Response Status: ${res.status}`);
    console.log(`📈 Response data structure:`, {
      hasData: !!res.data,
      hasChoices: !!(res.data && res.data.choices),
      choicesLength: res.data?.choices?.length || 0
    });

    const choice = res.data && res.data.choices && res.data.choices[0];
    if (!choice) {
      console.log('⚠️ No choice found in response:', JSON.stringify(res.data, null, 2));
      return null;
    }
    
    console.log('🔍 Choice structure:', JSON.stringify(choice, null, 2));
    
    const content = choice.message?.content || choice.text || null;
    console.log(`📝 Content extracted:`, content ? `${content.length} characters` : 'null/empty');
    
    if (!content) {
      console.log('🔍 Full response for debugging:', JSON.stringify(res.data, null, 2));
    }
    
    return content;
  } catch (e) {
    if (e.response) {
      console.error('❌ LLM API Error:', {
        status: e.response.status,
        statusText: e.response.statusText,
        data: e.response.data
      });
    } else {
      console.error('❌ LLM Network Error:', e.message);
    }
    throw new Error(`LLM request failed: ${e.message}`);
  }
}
