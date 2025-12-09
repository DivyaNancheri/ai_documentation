import { summarizeWithLLM } from './llm.js';

function describeFileByName(name) {
  const n = name.toLowerCase();
  if (n.includes('searchpage')) return 'Top-level page that composes the SearchForm and results grid; orchestrates layout and interactions.';
  if (n.includes('searchform')) return 'Search form: captures filters, validation, and triggers searches.';
  if (n.includes('datatable')) return 'Results table: renders paginated results, sorting, selection, and bulk actions.';
  if (n.includes('savedsearch')) return 'Saved searches UI: load, save, and delete saved search configurations.';
  if (n.includes('recentactivity')) return 'Recent activity panel: displays recent user actions like Search, Export, Filter.';
  if (n.includes('mockapi')) return 'Mock API layer: simulates backend search responses for development and tests.';
  if (n.includes('mockdata')) return 'Mock data fixtures used by the mock API and storybook/testing.';
  if (n.includes('validation')) return 'Form validation utilities and rules used by the SearchForm.';
  if (n.includes('hooks') || n.includes('keyboard')) return 'Custom hooks for keyboard shortcuts and small UI behaviors.';
  if (n.includes('slice') || n.includes('store')) return 'Redux slice / store configuration: handles search state, filters, pagination, and async thunks.';
  if (n.endsWith('.css')) return 'Styling for the associated component/page.';
  if (n.endsWith('.md')) return 'Documentation or requirements artifact.';
  return 'Referenced resource (component, util, or doc) relevant to the search feature.';
}

function generateArchitectureSection(searchResults) {
  const lines = [];
  lines.push('## Architecture (high-level)\n');
  lines.push('The Search feature is a client-side React page composed of UI components, a Redux store for state, and an API layer that provides search results.');
  lines.push('\n### Key layers\n');
  lines.push('- UI: `SearchPage`, `SearchForm`, `DataTable`, supporting widgets (SavedSearchDropdown, RecentActivity)');
  lines.push('- State: Redux `searchSlice` (filters, pagination, results), `tableSlice` (selection), global `store`');
  lines.push('- API: `mockApi.js` currently simulates backend calls; replace with real endpoints');
  lines.push('\n### Simple ASCII flow\n');
  lines.push('```\nUser -> SearchForm -> dispatch(executeSearch) -> searchSlice thunk -> API -> store.results -> DataTable\n```\n');
  return lines.join('\n');
}
function generateStateAndDataFlow(searchResults) {
  const lines = [];
  lines.push('## State & Data Flow\n');
  lines.push('Primary state shape (approx):\n');
  lines.push('```json\n{\n  "search": {\n    "criteria": {...},\n    "pagination": { "page": 1, "size": 25 },\n    "sorting": {...},\n    "results": [...],\n    "loading": false,\n    "error": null\n  },\n  "table": {\n    "selectedRows": [],\n    "selectionMode": "multiple"\n  }\n}\n```\n');
  lines.push('Notes:\n- `executeSearch` is an async thunk that calls the API and populates `results` and pagination metadata.\n- Components subscribe to store slices via `useSelector` and dispatch actions to update criteria and pagination.');
  return lines.join('\n');
}

function generateApiContractExample() {
  return ['## API (mock contract)\n', 'The codebase currently uses `mockApi.js` with a contract similar to:', '```json', '{', '  "request": { "filters": {"q":"text","status":"open"}, "page": 1, "size": 25, "sort": {"field":"name","dir":"asc"} },', '  "response": { "items": [ /* objects */ ], "total": 123, "page": 1, "size": 25 }', '}', '```', '\n'].join('\n');
}

function generateAcceptanceCriteria(query, searchResults) {
  const lines = [];
  lines.push('## Acceptance Criteria (template)\n');
  lines.push('1. Execute Search: User can enter criteria and execute a search. Results display within 2s for small data sets.');
  lines.push('2. Filters & Sorting: Filters and sorting apply correctly and are reflected in results and URL (if applicable).');
  lines.push('3. Pagination: Users can navigate pages; page size persists across navigation.');
  lines.push('4. Save Search: Users can save, load, and delete saved searches (permitted by role).');
  lines.push('5. Selection & Bulk Actions: Row selection supports bulk actions; actions operate on selected item IDs.');
  lines.push('6. Keyboard Shortcuts: Ctrl+Enter executes search; Ctrl+R clears form; Ctrl+S saves search; focus shortcut works.');
  lines.push('7. Error Handling: API or network errors surface user-friendly messages and retry options.');
  lines.push('8. Accessibility: Keyboard navigable, screen-reader friendly labels, and color contrast meet WCAG AA.');
  return lines.join('\n');
}

function generateDetailedTestCases() {
  const lines = [];
  lines.push('## Detailed Test Cases\n');
  lines.push('- Search Correctness: Verify that given filter combinations return expected results (unit + integration).');
  lines.push('- Pagination: Verify total count, page numbers, and page size edge cases (last page, empty page).');
  lines.push('- Save/Load/Delete: Create a saved search, reload it, and check criteria persisted; delete and confirm removal.');
  lines.push('- Bulk Actions: Select multiple rows, run an action, verify effect and API payload contains selected IDs.');
  lines.push('- Keyboard Shortcuts: Verify each shortcut triggers the intended behavior in focus and non-focus states.');
  lines.push('- Validation: Enter invalid criteria and assert validation messages prevent search submission.');
  lines.push('- Performance: Measure response/render latency for 1k items (with pagination) and ensure acceptable UX.');
  lines.push('- Accessibility: Tab order, ARIA attributes, screen reader announcements for search start/complete.');
  return lines.join('\n');
}

function generateNonFunctionalConsiderations() {
  const lines = [];
  lines.push('## Non-functional Considerations\n');
  lines.push('### Performance\n- Consider server-side pagination, index support on backend, and caching for repeated queries.');
  lines.push('### Security\n- Ensure Confluence tokens and API credentials are not embedded in client bundles. Use server-side proxies for protected tokens.');
  lines.push('### Accessibility\n- Labels, ARIA roles, and keyboard interactions should be tested; color contrast should meet WCAG AA.');
  return lines.join('\n');
}

function analyzeFileContent(content = '', filePath = '') {
  const ext = (filePath.split('.').pop() || '').toLowerCase();
  const s = (content || '').trim();
  const lines = s.split(/\r?\n/);
  const summaryParts = [];

  // Markdown files: extract title, first paragraph and headings
  if (['md', 'markdown'].includes(ext)) {
    const title = lines.find(l => /^#\s+/.test(l));
    if (title) summaryParts.push(`Title: ${title.replace(/^#+\s*/, '').trim()}`);
    // first paragraph (non-heading, non-empty)
    let para = null;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i].trim();
      if (!ln) continue;
      if (/^#/.test(ln)) continue;
      // accumulate until blank or heading
      const buff = [ln];
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim() || /^#/.test(lines[j].trim())) break;
        buff.push(lines[j].trim());
      }
      para = buff.join(' ');
      break;
    }
    if (para) summaryParts.push(`Summary: ${para.split(' ').slice(0,40).join(' ')}${para.split(' ').length > 40 ? '…' : ''}`);
    const headings = lines.filter(l => /^##+\s+/.test(l)).map(h => h.replace(/^##+\s*/, '').trim()).slice(0,6);
    if (headings.length) summaryParts.push(`Headings: ${headings.join(', ')}`);
    summaryParts.push(`${lines.length} lines`);
    return summaryParts.join(' — ');
  }

  // JS/TS files: detect exports, React components, propTypes
  if (['js','jsx','ts','tsx'].includes(ext)) {
    // detect exported symbols
    const exports = new Set();
    let m;
    const reList = [ /export\s+default\s+function\s+(\w+)/g, /export\s+function\s+(\w+)/g, /export\s+(?:const|let|var)\s+(\w+)/g, /export\s+\{\s*([^}]+)\s*\}/g, /export\s+default\s+(\w+)/g ];
    for (const re of reList) {
      while ((m = re.exec(s)) !== null) {
        if (re === reList[3]) {
          m[1].split(',').map(p => p.split('as')[0].trim()).forEach(n => n && exports.add(n));
        } else {
          exports.add(m[1]);
        }
      }
    }

    // detect React components (heuristic)
    const comps = new Set();
    const compRe1 = /function\s+([A-Z][A-Za-z0-9_]*)\s*\([^\)]*\)\s*\{[\s\S]*?return\s*[(<]/g;
    const compRe2 = /const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\([^\)]*\)\s*=>\s*[(<]/g;
    const compRe3 = /class\s+([A-Z][A-Za-z0-9_]*)\s+extends\s+React\.Component/g;
    let r;
    while ((r = compRe1.exec(s)) !== null) comps.add(r[1]);
    while ((r = compRe2.exec(s)) !== null) comps.add(r[1]);
    while ((r = compRe3.exec(s)) !== null) comps.add(r[1]);

    // detect propTypes keys
    const ptMatch = s.match(/\.propTypes\s*=\s*\{([\s\S]*?)\}/m);
    const propKeys = [];
    if (ptMatch) {
      const inner = ptMatch[1];
      const kv = inner.match(/([A-Za-z0-9_]+)\s*:/g);
      if (kv) kv.forEach(k => propKeys.push(k.replace(/:/,'').trim()));
    }

    if (comps.size) summaryParts.push(`Components: ${Array.from(comps).slice(0,6).join(', ')}`);
    if (exports.size) summaryParts.push(`Exports: ${Array.from(exports).slice(0,8).join(', ')}`);
    if (propKeys.length) summaryParts.push(`PropTypes: ${propKeys.slice(0,8).join(', ')}`);
    summaryParts.push(`${lines.length} lines`);
    return summaryParts.join(' — ');
  }

  // Generic fallback: show first non-empty line and file size
  const firstNonEmpty = lines.find(l => l.trim());
  if (firstNonEmpty) summaryParts.push(firstNonEmpty.trim().slice(0,200));
  summaryParts.push(`${lines.length} lines`);
  return summaryParts.join(' — ');
}

export async function generateDocumentation({ query, searchResults, userDocs = [], codebasePath }) {
  const lines = [];
  const ts = new Date().toISOString();

  // Header
  lines.push(`# POSearch - Analysis for query: "${query}"\n`);
  lines.push(`**Codebase path:** ${codebasePath}`);
  lines.push(`**Generated on:** ${ts}`);
  lines.push('\n---\n');

  // Overview
  lines.push('## Overview\n');
  lines.push('This document summarizes findings for the query and maps code locations to functional requirements and testable acceptance criteria. It is intentionally concise and actionable.');
  lines.push('\n');

  // Purpose & Scope
  lines.push('## Purpose\n');
  lines.push(`Provide a concise, implementation-focused documentation package for the feature(s) related to the query "${query}".`);
  lines.push('\n');

  lines.push('## Scope\n');
  if (!searchResults || searchResults.length === 0) {
    lines.push('_No matches found in codebase._\n');
  } else {
    lines.push('Files and components touched (compact):\n');
    for (const r of searchResults) {
      const name = r.path.split('/').pop();
      lines.push(`- ${name}`);
    }
  }
  lines.push('\n');

  // Components Affected
  lines.push('## Components Affected\n');
  const components = [];
  for (const r of searchResults) {
    const name = r.path.split('/').pop();
    components.push(name);
  }
  if (components.length) lines.push(components.slice(0, 200).map(c => `- ${c}`).join('\n'));
  lines.push('\n');

  // Included file(s) analysis (if user supplied file paths via --docsPaths)
  if (userDocs && userDocs.length) {
    lines.push('\n## Included File Analysis\n');
    for (const d of userDocs) {
      const name = d.path.split('/').pop();
      const summary = analyzeFileContent(d.content || '', d.path);
      lines.push(`- **${name}**: ${summary}`);
    }
    lines.push('\n');
  }

  // Functional Requirements and Acceptance Criteria (LLM-assisted)
  lines.push('## Functional Requirements\n');
  lines.push('The following is a compact set of functional requirements and acceptance criteria synthesized from code and user documents.');

  let llmResult = null;
  const hasLLM = !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_DEPLOYMENT);
  console.log('LLM availability:', hasLLM);
  if (hasLLM) {
    try {
      const coll = [];
      coll.push(`Query: ${query}`);
      coll.push(`Codebase: ${codebasePath}`);
      coll.push('\nFiles:');
      for (const r of searchResults) coll.push(`- ${r.path}`);
      if (userDocs.length) {
        coll.push('\nUser Documents:');
        for (const d of userDocs) coll.push(`- ${d.path}`);
      }

      const prompt = `You are a concise documentation assistant. Produce a compact, structured summary for the feature(s) below. Output sections:\n1) Functional Requirements (numbered) with one-line acceptance criteria each.\n2) Suggested test cases (brief bullets).\n3) Assumptions / Open Questions (brief).\nRespond in plain text.\n\nContext:\n${coll.join('\n')}`;
      console.log('LLM Prompt:', prompt);
      llmResult = await summarizeWithLLM({ userPrompt: prompt });
      console.log('LLM Functional Requirements Result:', llmResult);
      if (llmResult) {
        lines.push('\n### LLM Summary\n');
        lines.push('```\n' + llmResult.trim() + '\n```\n');
      }
    } catch (e) {
      lines.push('\n_Notice: LLM synthesis failed: ' + e.message + '_\n');
    }
  } else {
    lines.push('\n_An Azure OpenAI configuration was not detected (set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT in the environment to enable automated synthesis)._\n');
  }

  // If LLM did not produce FRs, generate deterministic FRs based on file patterns
  if (!llmResult) {
    lines.push('\n### Deterministic Functional Requirements (fallback)\n');
    lines.push('1. Execute search with filters, sorting, and pagination; results update accordingly.');
    lines.push('2. Save, load, and delete saved searches; persistence of saved configs.');
    lines.push('3. Select rows and execute bulk actions against selected IDs.');
    lines.push('4. Keyboard shortcuts for search, clear, save, and focus.');
    lines.push('5. Recent activity list records user search/export actions.');
  }

  // Architecture
  lines.push('\n' + generateArchitectureSection(searchResults));

  // State and data flow
  lines.push('\n' + generateStateAndDataFlow(searchResults));

  // API contract example
  lines.push('\n' + generateApiContractExample());

  // Acceptance criteria
  lines.push('\n' + generateAcceptanceCriteria(query, searchResults));

  // Detailed test cases
  lines.push('\n' + generateDetailedTestCases());

  // Non-functional considerations
  lines.push('\n' + generateNonFunctionalConsiderations());

  // Implementation notes
  lines.push('\n## Implementation Notes\n');
  lines.push('- The codebase currently uses `mockApi.js` and `mockData.js` for development and testing. Replace these with backend endpoints and adapt payload shapes accordingly.');
  lines.push('- Ensure proper error handling in `searchSlice` for network failures and empty responses.');

  // The "Next Steps & Owners" section was removed per request to keep
  // the generated document focused on requirements and implementation notes.

  // Append Component Responsibilities (user requested to keep these)
  lines.push('\n## Component Responsibilities\n');
  for (const r of searchResults) {
    const name = r.path.split('/').pop();
    lines.push(`- **${name}**: ${describeFileByName(name)}`);
  }

  return lines.join('\n');
}
