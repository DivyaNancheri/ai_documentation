import { AzureOpenAI } from "openai";
// Polyfill `fetch` for Node environments that don't expose it globally.
// Uses `node-fetch` which is ESM-only in v3+. Ensure `node-fetch` is installed.
import fetch from 'node-fetch';
if (!globalThis.fetch) globalThis.fetch = fetch;

const endpoint = "https://ndivy-mix63v0p-eastus2.openai.azure.com/";
const modelName = "gpt-5-nano";
const deployment = "gpt-5-nano";

export async function main() {

  const apiKey = "F6ajR9nKzh27bi9shGuEYZD6R0J89spcIvUmqKd5BCD6QqBbvd2tJQQJ99BLACHYHv6XJ3w3AAAAACOGYUBB";
  const apiVersion = "2024-12-01-preview";
  const options = { endpoint, apiKey, deployment, apiVersion }

  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages: [
      { role:"system", content: "You are a helpful assistant." },
      { role:"user", content: "I am going to Paris, what should I see?" }
    ],
    max_completion_tokens: 16384,
      model: modelName
  });

  if (response?.error !== undefined && response.status !== "200") {
    throw response.error;
  }
  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});