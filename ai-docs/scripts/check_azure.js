import { summarizeWithLLM } from '../src/llm.js';

(async function() {
  try {
    console.log('Reading .env and environment variables...');
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_API_KEY ? '***REDACTED***' : undefined;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    console.log(`AZURE_OPENAI_ENDPOINT=${endpoint ? endpoint : '<not-set>'}`);
    console.log(`AZURE_OPENAI_API_KEY=${key ? key : '<not-set>'}`);
    console.log(`AZURE_OPENAI_DEPLOYMENT=${deployment ? deployment : '<not-set>'}`);

    const resp = await summarizeWithLLM({
      systemPrompt: 'You are a test assistant that responds with a single short token "OK" to indicate reachability.',
      userPrompt: 'Ping: please respond with the single token OK to confirm connectivity.'
    });

    console.log('LLM response (truncated):');
    console.log((resp || '<no-response>').toString().slice(0,1000));
    process.exit(0);
  } catch (e) {
    console.error('Azure connectivity test failed:');
    console.error(e && e.message ? e.message : e);
    process.exit(2);
  }
})();
