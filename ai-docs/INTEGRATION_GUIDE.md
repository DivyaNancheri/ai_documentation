# AI Docs Integration Guide

This guide shows how to integrate the `ai-docs` CLI into your development workflow, CI/CD pipelines, and documentation processes.

## Overview

The `ai-docs` project consists of three main workflows:

1. **Step 1: Generate Documentation** (`src/index.js`) — Search a React codebase for a query, optionally include user documents, run LLM synthesis to extract functional requirements, and save as `.md` and `.html`.
2. **Step 2: Extract, Render & Publish** (`src/extract_render_publish.js`) — Extract synthesized requirements to JSON, render markdown to richer HTML, and publish to Confluence.
3. **Environment Configuration** (`ai-docs/.env`) — Manage API credentials for OpenAI and Confluence.

## Setup

### Prerequisites

- Node.js 16+
- `npm`
- OpenAI API key (for LLM synthesis; optional)
- Confluence REST API credentials (for publishing; optional)

### Installation

```bash
cd ai-docs
npm install
```

## Configuration

Create or update `ai-docs/.env`:

```dotenv
# OpenAI API (required for LLM synthesis)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Confluence API (required for publishing)
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USERNAME=your-email@example.com
CONFLUENCE_API_TOKEN=your-token-here

# Anthropic (optional alternative to OpenAI)
ANTHROPIC_API_KEY=
ENABLE_CLAUDE_HAIKU=false
```

**Security note:** Never commit real credentials to version control. Use local-only `.env` and ensure `.gitignore` includes `.env`.

## Usage Workflows

### Workflow 1: Interactive (Manual)

Best for exploratory analysis and review before publishing.

#### Step 1: Generate Documentation

```bash
node src/index.js --query "search" --codepath "../react-search-dashboard"
```

Prompts:
- **Additional documents** (optional): Enter comma-separated paths to user-supplied documents (functional requirements, design specs), or press Enter to skip.
- **Publish to Confluence** (optional): Answer `y` to publish now or `n` to skip (you can publish later).

Outputs:
- `ai-docs/output/ai-docs-<timestamp>.md` — Markdown document with matched code snippets, LLM synthesis, and collated content.
- `ai-docs/output/ai-docs-<timestamp>.html` — Simple HTML snapshot (markdown wrapped in `<pre>`).

#### Step 2: Extract, Render & Publish

```bash
node src/extract_render_publish.js
```

Actions:
1. Extracts LLM-synthesized requirements from latest `.md` file → `ai-docs/output/ai-docs-<timestamp>-requirements.json`
2. Renders markdown to richer HTML → `ai-docs/output/ai-docs-<timestamp>-rendered.html`
3. Prompts to publish rendered HTML to Confluence (interactive prompts for space key and page title).

### Workflow 2: Non-Interactive (CI/CD Automation)

Best for scheduled runs, Pull Requests, and CI/CD pipelines.

#### Step 1: Generate Documentation (Non-Interactive)

```bash
node src/index.js \
  --query "search" \
  --codepath "../react-search-dashboard" \
  --docsPaths "path/to/requirements.md,path/to/design.md" \
  --no-publish
```

Flags:
- `--query "text"` — Search term (required).
- `--codepath "../path"` — Codebase path (default: `../react-search-dashboard`).
- `--docsPaths "path1,path2"` — Comma-separated paths to user documents (auto-load; skips interactive prompt).
- `--no-publish` — Skip publish prompt; exit after saving `.md` and `.html`.

Example:
```bash
# Generate docs without prompting
node src/index.js \
  --query "authentication" \
  --codepath "../react-search-dashboard" \
  --docsPaths "docs/security-requirements.md" \
  --no-publish
```

#### Step 2: Extract, Render & Publish (Non-Interactive)

```bash
# Approve publish and provide space/title via stdin
printf 'y\nDOCS\nSearch Implementation Docs\n' | node src/extract_render_publish.js
```

Or decline publish:
```bash
printf 'n\n' | node src/extract_render_publish.js
```

### Workflow 3: Full End-to-End (One Command)

```bash
# Generate, extract, render, publish in one go
printf '\n n\n' | node src/index.js \
  --query "search" \
  --codepath "../react-search-dashboard" && \
printf 'y\nDOCS\nSearch Analysis\n' | node src/extract_render_publish.js
```

## Query Examples

### Search by Feature
```bash
node src/index.js --query "keyboard shortcuts"
node src/index.js --query "bulk actions"
node src/index.js --query "filters"
```

### Search by Component
```bash
node src/index.js --query "SearchForm"
node src/index.js --query "DataTable"
node src/index.js --query "Dashboard"
```

### Search by Functionality
```bash
node src/index.js --query "pagination"
node src/index.js --query "sorting"
node src/index.js --query "validation"
```

## Output Artifacts

After running the workflows, the following files are generated in `ai-docs/output/`:

| File | Purpose | Use Case |
|------|---------|----------|
| `ai-docs-<ts>.md` | Raw markdown with code snippets, LLM synthesis, collated content | Archive, version control, detailed review |
| `ai-docs-<ts>.html` | Simple HTML snapshot (markdown in `<pre>`) | Quick browser preview |
| `ai-docs-<ts>-rendered.html` | Richer HTML (headings, lists, code blocks, styling) | Sharing with non-technical stakeholders, Confluence publish |
| `ai-docs-<ts>-requirements.json` | Parsed functional requirements (if LLM synthesis included) | Import into test generation, requirement trackers |

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Generate AI Docs

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install ai-docs
        run: cd ai-docs && npm install
      
      - name: Generate documentation
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd ai-docs
          node src/index.js \
            --query "search" \
            --codepath "../react-search-dashboard" \
            --no-publish
      
      - name: Publish to Confluence
        env:
          CONFLUENCE_BASE_URL: ${{ secrets.CONFLUENCE_BASE_URL }}
          CONFLUENCE_USERNAME: ${{ secrets.CONFLUENCE_USERNAME }}
          CONFLUENCE_API_TOKEN: ${{ secrets.CONFLUENCE_API_TOKEN }}
        run: |
          cd ai-docs
          printf 'y\nDOCS\nWeekly Search Docs\n' | node src/extract_render_publish.js
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ai-docs
          path: ai-docs/output/
```

### GitLab CI Example

```yaml
generate_ai_docs:
  stage: docs
  image: node:18
  script:
    - cd ai-docs && npm install
    - node src/index.js --query "search" --codepath "../react-search-dashboard" --no-publish
    - 'printf "y\nDOCS\nSearch Docs\n" | node src/extract_render_publish.js'
  artifacts:
    paths:
      - ai-docs/output/
    expire_in: 30 days
  only:
    - schedules
```

## Confluence Integration Details

### Prerequisites

1. **Confluence Cloud instance** with REST API enabled.
2. **API Token** generated in your Confluence settings (Account > Security > API tokens).
3. **Base URL** (e.g., `https://your-org.atlassian.net/wiki`).
4. **Space key** (e.g., `DOCS`) where you want to publish pages.

### Manual Publishing

After generating documentation:

```bash
node src/extract_render_publish.js
# Answer: y (publish)
# Enter: DOCS (space key)
# Enter: AI Docs - Search Analysis (page title)
```

The page is created as a new page in the specified space with the rendered HTML content.

### Automatic Publishing

Provide all prompts via stdin:

```bash
printf 'y\nDOCS\nSearch Analysis - $(date +%Y-%m-%d)\n' | node src/extract_render_publish.js
```

### Updating Existing Pages

Currently, the publisher creates new pages. To update existing pages, you can:
1. Delete or archive the old page in Confluence manually.
2. Re-run the publisher to create a new page with the same title (or different title).
3. Or extend `src/confluence.js` to support page updates via the `PUT /rest/api/content/{id}` endpoint.

## Troubleshooting

### "Cannot find package 'dotenv'"

The CLI loads `.env` without requiring the `dotenv` package (using a built-in parser). If you see this error, delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### "LLM synthesis failed"

Possible causes:
- `OPENAI_API_KEY` is not set or invalid.
- OpenAI API quota exceeded.
- Network connectivity issue.

Solution:
- Verify `OPENAI_API_KEY` is correct in `.env`.
- Check OpenAI usage dashboard for quota/billing issues.
- Ensure internet connectivity.

### "Failed to publish to Confluence"

Possible causes:
- `CONFLUENCE_BASE_URL`, `CONFLUENCE_USERNAME`, or `CONFLUENCE_API_TOKEN` is incorrect.
- The space key does not exist.
- Confluence API is unreachable.

Solution:
- Verify credentials in `.env`.
- Ensure space key exists in your Confluence instance.
- Test connectivity: `curl https://your-domain.atlassian.net/wiki/rest/api/content -u user:token`

### "No matches found in codebase"

The query didn't match any files. Try:
- Using a simpler query (e.g., `"search"` instead of `"search AND validation"`).
- Verifying the codepath is correct.
- Using a different query term.

## Advanced Usage

### Custom LLM Prompts

Edit `src/analyzer.js` and modify the `prompt` variable in the `generateDocumentation` function to customize the LLM synthesis request.

### Extended Markdown Renderer

For richer HTML (e.g., tables, footnotes), integrate a full markdown parser like `markdown-it`:

```bash
npm install markdown-it
```

Then update `src/extract_render_publish.js` to use it:

```javascript
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();
const rendered = md.render(mdContent);
```

### Multiple Queries

Run the generator multiple times with different queries and merge outputs:

```bash
node src/index.js --query "search" --no-publish
node src/index.js --query "dashboard" --no-publish
node src/index.js --query "auth" --no-publish

# Then extract/render all together
node src/extract_render_publish.js
```

## Best Practices

1. **Use meaningful queries** — Focus on features, components, or functionality, not generic terms.
2. **Supply functional requirement documents** — Use `--docsPaths` to enrich synthesis with user-supplied docs.
3. **Review before publishing** — Always check the rendered HTML and extracted requirements before publishing to Confluence.
4. **Schedule regular runs** — Integrate into CI/CD for nightly or weekly documentation updates.
5. **Version outputs** — Commit generated `.md` files to your repo for historical tracking.
6. **Secure credentials** — Never commit API keys; use environment variables or secret management.

## Support & Contribution

For issues, enhancements, or questions:
- Check this guide for common troubleshooting.
- Review generated output in `ai-docs/output/` for diagnostic information.
- Extend the CLI by editing `src/index.js`, `src/analyzer.js`, or `src/confluence.js`.
