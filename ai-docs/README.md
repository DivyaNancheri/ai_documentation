# ai-docs

A small CLI tool to:
- Search a codebase for occurrences of a user query and extract context
- Prompt for functional requirement documents to include
- Combine code analysis + user documents into an accumulated documentation output
- Optionally publish the aggregated documentation to Confluence (requires credentials)

Quickstart

1. Install dependencies

```bash
cd ai-docs
npm install
```

2. Run the CLI against the `react-search-dashboard` codebase:

```bash
node src/index.js --query "search" --codepath "../react-search-dashboard"
```

The CLI will:
- Search the codebase for matches to the `--query` text and show matched files + snippets
- Ask you (interactive) to supply paths to additional documents (functional requirements)
- Produce an accumulated markdown output and save it to `output/ai-docs-<timestamp>.md`
- Ask whether to publish to Confluence; if you confirm, it will attempt to publish (requires env vars)

Behavior change: snippets removed
- As of the latest change, generated documents no longer include embedded code snippets or imports by default — the output lists file paths only under `Code References`.
- If you prefer to include snippets in the document, update the analyzer or re-enable snippet collection in `src/indexer.js` (this is deliberate to keep documentation concise).

Confluence configuration

Set the following environment variables before publishing:

- `CONFLUENCE_BASE_URL` e.g. `https://your-domain.atlassian.net/wiki`
- `CONFLUENCE_USERNAME` (email) and `CONFLUENCE_API_TOKEN`

The publishing logic uses the Confluence REST API. See `src/confluence.js` for implementation details.

Azure OpenAI

If you use Azure OpenAI, set the following environment variables instead of `OPENAI_API_KEY`:

- `AZURE_OPENAI_ENDPOINT` e.g. `https://<resource>.openai.azure.com`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT` (the deployment name for your model)

The tool will automatically prefer Azure OpenAI when these variables are present.

Notes & next steps

- This project includes a placeholder `analyzer` that synthesizes documentation from matches. For best results, integrate a large language model to do the final synthesis (hook a function into `analyzer.generateDocumentation`).
- You can call this CLI programmatically from other scripts or wire it into a CI job that runs nightly.
