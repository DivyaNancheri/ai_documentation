import { summarizeWithLLM } from './llm.js';

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
  lines.push('This document summarizes findings for the query and maps code locations to functional requirements and testable acceptance criteria.');
  lines.push('\n');

  // Purpose & Scope
  lines.push('## Purpose\n');
  lines.push(`Provide a concise, implementation-focused documentation package for the feature(s) related to the query \"${query}\".`);
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

  // Functional Requirements and Acceptance Criteria (LLM-assisted)
  lines.push('## Functional Requirements\n');
  lines.push('The following is a compact set of functional requirements and acceptance criteria synthesized from code and user documents.');

  let llmResult = null;
  if (process.env.OPENAI_API_KEY) {
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

      llmResult = await summarizeWithLLM({ userPrompt: prompt });
      if (llmResult) {
        lines.push('\n### LLM Summary\n');
        lines.push('```\n' + llmResult.trim() + '\n```\n');
      }
    } catch (e) {
      lines.push('\n_Notice: LLM synthesis failed: ' + e.message + '_\n');
    }
  } else {
    lines.push('\n_An LLM key was not detected (set OPENAI_API_KEY to enable automated synthesis)._\n');
  }

  // Code References (compact, sample snippets without line numbers)
  lines.push('\n## Code References (compact)\n');
  for (const r of searchResults) {
    const name = r.path.split('/').pop();
    const sample = r.snippets && r.snippets.length ? r.snippets[0].context : '';
    lines.push(`### ${name}\n`);
    if (sample) lines.push('```\n' + sample + '\n```\n');
  }

  // Test Cases (if LLM produced any earlier, it will be in LLM summary; keep placeholder)
  lines.push('\n## Suggested Test Cases\n');
  lines.push('- Review LLM Summary above for suggested tests, or derive tests from acceptance criteria.');

  // Assumptions & Open Questions
  lines.push('\n## Assumptions & Open Questions\n');
  lines.push('- Review code snippets and LLM output; note any missing domain context.');

  // Next Steps
  lines.push('\n## Next Steps\n');
  lines.push('- Finalize requirements and acceptance criteria.');
  lines.push('- Create test cases and automation.');
  lines.push('- Review with stakeholders and publish to Confluence.');

  lines.push('\n---\n');
  lines.push('## Annex: Full Collated Content\n');
  for (const r of searchResults) {
    lines.push(`### File: ${r.path}\n`);
    for (const s of r.snippets) {
      lines.push('```\n' + s.context + '\n```\n');
    }
  }
  for (const d of userDocs) {
    lines.push(`### Document: ${d.path}\n`);
    lines.push('```\n' + d.content + '\n```\n');
  }

  return lines.join('\n');
}
