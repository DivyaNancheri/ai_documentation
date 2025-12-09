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
  const hasLLMConfig = process.env.OPENAI_API_KEY || 
    (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
  
  if (hasLLMConfig) {
    console.log('✅ LLM configuration detected, starting AI analysis...');
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
      
      console.log(`📊 Analyzing ${searchResults.length} files with ${searchResults.reduce((acc, r) => acc + (r.snippets?.length || 0), 0)} code snippets...`);

      const enhancedPrompt = `Analyze the "${query}" functionality in this React codebase and provide:

## 1. Functional Requirements
List 3-5 key requirements with acceptance criteria.

## 2. Technical Architecture  
Key components and their interactions.

## 3. Implementation Guide
How the feature works and key code patterns.

## 4. Test Recommendations
Important test cases to implement.

**Context:**
${coll.join('\n')}

**Key Files Found:**
${searchResults.slice(0, 8).map(r => `- ${r.path.split('/').pop()}: ${r.snippets?.length || 0} matches`).join('\n')}
${searchResults.length > 8 ? `\n... and ${searchResults.length - 8} more files` : ''}

**Sample Code Snippets:**
${searchResults.slice(0, 5).map(r => {
  const fileName = r.path.split('/').pop();
  const firstSnippet = r.snippets?.[0]?.context?.slice(0, 200) || 'No content';
  return `${fileName}:\n${firstSnippet}${firstSnippet.length > 200 ? '...' : ''}`;
}).join('\n\n')}

Generate detailed, actionable documentation that a developer could use to understand and extend this functionality.`;

      console.log('🤖 Generating AI-powered documentation using Azure OpenAI...');
      console.log(`📝 Prompt length: ${enhancedPrompt.length} characters`);
      
      llmResult = await summarizeWithLLM({ 
        userPrompt: enhancedPrompt,
        systemPrompt: 'You are a senior software architect specializing in React applications and technical documentation. Provide detailed, practical analysis that helps developers understand and extend the codebase.'
      });
      
      console.log('📋 LLM Response received:', llmResult ? `${llmResult.length} characters` : 'null/empty');
      
      if (llmResult && llmResult.trim()) {
        lines.push('\n### 🤖 AI-Powered Analysis\n');
        lines.push(llmResult.trim() + '\n');
        console.log('✅ AI analysis successfully added to documentation');
      } else {
        lines.push('\n### ⚠️ AI Analysis Issue\n');
        lines.push('AI analysis returned empty or null response.\n');
        console.log('⚠️ AI analysis returned empty result');
      }
    } catch (e) {
      console.error('❌ LLM synthesis failed:', e.message);
      lines.push('\n_Notice: AI-powered analysis failed: ' + e.message + '_\n');
    }
  } else {
    lines.push('\n_AI-powered analysis disabled. Configure either:_\n');
    lines.push('_- Azure OpenAI: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT_NAME_\n');
    lines.push('_- OpenAI: OPENAI_API_KEY_\n');
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
