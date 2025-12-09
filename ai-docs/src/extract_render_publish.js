#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { publishToConfluence, validateConfluenceSpace } from './confluence.js';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function findLatestOutputMd(outDir) {
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir).filter(f => f.startsWith('ai-docs-') && f.endsWith('.md'));
  if (files.length === 0) return null;
  files.sort((a,b) => fs.statSync(path.join(outDir,b)).mtimeMs - fs.statSync(path.join(outDir,a)).mtimeMs);
  return path.join(outDir, files[0]);
}

function findLatestOutputHtml(outDir) {
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir).filter(f => f.startsWith('ai-docs-') && f.endsWith('.html'));
  if (files.length === 0) return null;
  files.sort((a,b) => fs.statSync(path.join(outDir,b)).mtimeMs - fs.statSync(path.join(outDir,a)).mtimeMs);
  return path.join(outDir, files[0]);
}

function extractLLMBlockFromMarkdown(md) {
  // Look for header and code block
  const headerRegex = /### LLM-synthesized Functional Requirements\s*/i;
  const idx = md.search(headerRegex);
  if (idx === -1) return null;
  const after = md.slice(idx);
  const codeBlockMatch = after.match(/```[\s\S]*?```/);
  if (!codeBlockMatch) return null;
  const block = codeBlockMatch[0];
  // remove ``` markers
  return block.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
}

function parseNumberedRequirements(text) {
  // Very simple parser: split by lines starting with number + '.'
  const lines = text.split(/\r?\n/);
  const reqs = [];
  let current = null;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim();
    const m = line.match(/^(\d+)\.\s+(.*)/);
    if (m) {
      if (current) reqs.push(current);
      current = { id: m[1], title: m[2], details: [] };
    } else if (current) {
      if (line) current.details.push(line);
    }
  }
  if (current) reqs.push(current);
  return reqs;
}

function simpleMarkdownToHtml(md) {
  // Basic conversions: headings, bold, italics, code blocks, lists, paragraphs
  let s = md;
  // preserve code blocks
  const codeBlocks = [];
  s = s.replace(/```([\s\S]*?)```/g, (m, p1) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${escapeHtml(p1)}</code></pre>`);
    return `___CODE_BLOCK_${idx}___`;
  });
  
  // headings
  s = s.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  s = s.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  s = s.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  s = s.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // bold/italic (must be after escaping)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // inline code
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  
  // blockquotes
  s = s.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  
  // horizontal rule
  s = s.replace(/^(---|\*\*\*|___)\s*$/gm, '<hr/>');
  
  // unordered lists (lines starting with -, *, or +)
  s = s.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>.+<\/li>)/s, (m) => '<ul>' + m + '</ul>');
  
  // ordered lists (lines starting with number.)
  s = s.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // mark ol separately (look for consecutive numbered items)
  const lines = s.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d+\.\s+/)) {
      let j = i;
      while (j < lines.length && lines[j].match(/^\s*(\d+\.|\s*<li>)/)) j++;
      const segment = lines.slice(i, j).join('\n').replace(/<li>/g, '<li>').replace(/<\/li>/g, '</li>');
      lines[i] = '<ol>' + segment + '</ol>';
      lines.splice(i + 1, j - i - 1);
    }
  }
  s = lines.join('\n');
  
  // paragraphs (lines not already wrapped in tags)
  s = s.replace(/^(?!<h|<ul|<ol|<pre|<li|<blockquote|<table|<hr)([^<].+)$/gm, '<p>$1</p>');
  
  // restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    s = s.replace(`___CODE_BLOCK_${i}___`, codeBlocks[i]);
  }
  
  return s;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const outDir = path.resolve('output');
  const mdPath = findLatestOutputMd(outDir);
  let md = null;
  if (mdPath && fs.existsSync(mdPath)) {
    md = fs.readFileSync(mdPath, 'utf8');
    console.log(`Using markdown: ${mdPath}`);
  } else {
    const htmlPath = findLatestOutputHtml(outDir);
    if (!htmlPath) {
      console.error('No output markdown or html found in output/');
      process.exit(1);
    }
    console.log(`No markdown found; extracting markdown from HTML: ${htmlPath}`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    // attempt to extract the <pre> contents
    const m = html.match(/<pre>([\s\S]*?)<\/pre>/i);
    if (m) {
      md = m[1];
      // unescape common entities
      md = md.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    } else {
      console.error('Could not extract markdown from HTML file.');
      process.exit(1);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // extract LLM block
  const llmText = extractLLMBlockFromMarkdown(md);
  if (!llmText) {
    console.warn('No LLM-synthesized block found in document. Skipping extraction.');
  } else {
    const reqs = parseNumberedRequirements(llmText);
    const outJsonPath = path.join(outDir, `ai-docs-${timestamp}-requirements.json`);
    fs.writeFileSync(outJsonPath, JSON.stringify({ extractedAt: new Date().toISOString(), requirements: reqs }, null, 2), 'utf8');
    console.log(`Wrote extracted requirements to ${outJsonPath}`);
  }

  // render the markdown nicely to HTML
  const rendered = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<title>AI Docs Rendered - ${timestamp}</title>\n<style>body{font-family:-apple-system,BlinkMacSystemFont,segoe ui,Roboto,Helvetica,Arial,sans-serif;padding:40px;max-width:1000px;margin:0 auto;line-height:1.6;color:#333}h1,h2,h3,h4,h5,h6{margin-top:1.5em;margin-bottom:0.5em;font-weight:600}h1{border-bottom:2px solid #e1e4e8;padding-bottom:0.3em}code{background:#f6f8fa;padding:2px 6px;border-radius:4px;font-family:monospace}pre{background:#f6f8fa;padding:16px;border-radius:6px;overflow-x:auto;border-left:4px solid #0366d6}pre code{background:none;padding:0}blockquote{border-left:4px solid #ddd;margin:0;padding-left:16px;color:#666}ul,ol{margin:1em 0;padding-left:2em}li{margin:0.5em 0}table{border-collapse:collapse;width:100%}table th,table td{border:1px solid #ddd;padding:8px 12px;text-align:left}table th{background:#f6f8fa;font-weight:600}hr{border:none;border-top:2px solid #e1e4e8;margin:2em 0}strong{font-weight:600}</style>\n</head>\n<body>\n${simpleMarkdownToHtml(md)}\n</body>\n</html>`;

  const renderedPath = path.join(outDir, `ai-docs-${timestamp}-rendered.html`);
  fs.writeFileSync(renderedPath, rendered, 'utf8');
  console.log(`Wrote rendered HTML to ${renderedPath}`);

  // Ask to publish
  const publishAns = (await ask('Publish rendered HTML to Confluence now? (y/N): ')).trim().toLowerCase();
  if (publishAns !== 'y' && publishAns !== 'yes') {
    console.log('Skipping publish.');
    return;
  }

  // Use `CONFLUENCE_SPACE_KEY` from env by default and do not prompt for it.
  const envSpace = process.env.CONFLUENCE_SPACE_KEY && process.env.CONFLUENCE_SPACE_KEY.trim();
  const space = envSpace;
  if (!space) {
    console.error('ERROR: CONFLUENCE_SPACE_KEY is not set in the environment. Set CONFLUENCE_SPACE_KEY in ai-docs/.env or export it in your shell. Aborting publish.');
    process.exit(2);
  }

  // Page title: use env override or default to timestamp-based title
  const title = process.env.CONFLUENCE_PAGE_TITLE || `AI Docs - ${timestamp}`;

  try {
    // Validate space before attempting to publish to provide clearer errors
    if (space) {
      await validateConfluenceSpace(space);
    } else {
      console.warn('No Confluence space key provided; proceeding without validating space.');
    }

    const res = await publishToConfluence({ space: space || process.env.CONFLUENCE_SPACE_KEY || 'DOCS', title: title || `AI Docs - ${timestamp}`, content: rendered, isHtml: true });
    console.log('Published to Confluence, id:', res.id || res);
  } catch (e) {
    console.error('Failed to publish to Confluence:', e.message || e);
    process.exitCode = 2;
  }
}

main();
