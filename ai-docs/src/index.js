#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import readline from 'readline';
import { searchCodebase } from './indexer.js';
import { generateDocumentation } from './analyzer.js';
import { publishToConfluence } from './confluence.js';

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
    // ignore errors reading .env
  }
}

loadDotEnvIfPresent();

const argv = minimist(process.argv.slice(2));

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function readUserDocsInteractive() {
  const docs = [];
  // Ask user for zero or more file paths (comma-separated) or press enter to skip
  const ans = await ask('Enter comma-separated paths to additional documents (or press Enter to skip): ');
  if (!ans || !ans.trim()) return docs;
  const parts = ans.split(',').map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    try {
      const content = fs.readFileSync(path.resolve(p), 'utf-8');
      docs.push({ path: p, content });
      console.log(`Loaded document: ${p}`);
    } catch (e) {
      console.warn(`Could not read ${p}: ${e.message}`);
    }
  }
  return docs;
}

async function main() {
  const query = argv.query || argv.q;
  const codepath = argv.codepath || argv.c || '../react-search-dashboard';
  const publishFlag = argv.publish || argv.p || false;
  const noPublish = argv['no-publish'] || argv.np || false;
  const docsPaths = argv['docsPaths'] || argv.docs || '';

  if (!query) {
    console.log('Usage: node src/index.js --query "search text" [--codepath "../react-search-dashboard"] [--publish] [--docsPaths "path1,path2"] [--no-publish]');
    process.exit(1);
  }

  const absoluteCodepath = path.resolve(codepath);
  if (!fs.existsSync(absoluteCodepath)) {
    console.error(`Code path not found: ${absoluteCodepath}`);
    process.exit(1);
  }

  console.log(`Searching in ${absoluteCodepath} for query: "${query}"`);
  const searchResults = await searchCodebase(absoluteCodepath, query);
  console.log(`Found matches in ${searchResults.length} files.`);

  let userDocs = [];
  if (docsPaths && docsPaths.trim()) {
    const parts = docsPaths.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      try {
        const content = fs.readFileSync(path.resolve(p), 'utf-8');
        userDocs.push({ path: p, content });
        console.log(`Loaded document: ${p}`);
      } catch (e) {
        console.warn(`Could not read ${p}: ${e.message}`);
      }
    }
  } else {
    userDocs = await readUserDocsInteractive();
  }

  const doc = await generateDocumentation({ query, searchResults, userDocs, codebasePath: absoluteCodepath });

  // write output
  const outDir = path.resolve('output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(outDir, `ai-docs-${timestamp}.md`);
  fs.writeFileSync(outPath, doc, 'utf-8');
  console.log(`Saved accumulated documentation to ${outPath}`);

  // Also save an HTML version (simple wrapper with escaped markdown inside a <pre>)
  const htmlOutDir = outDir;
  const htmlPath = path.join(htmlOutDir, `ai-docs-${timestamp}.html`);
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const htmlContent = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<title>AI Docs - ${timestamp}</title>\n<style>body{font-family:system-ui,Arial,Helvetica,sans-serif;padding:20px}pre{white-space:pre-wrap;word-wrap:break-word;background:#f8f8f8;padding:16px;border-radius:6px}</style>\n</head>\n<body>\n<h1>AI Docs - ${timestamp}</h1>\n<pre>${escapeHtml(doc)}</pre>\n</body>\n</html>`;
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Saved HTML documentation to ${htmlPath}`);

  if (noPublish) {
    console.log('Skipping publish (--no-publish flag set).');
    return;
  }

  const doPublish = publishFlag || (await ask('Publish to Confluence now? (y/N): '));
  if (doPublish && (doPublish === true || (typeof doPublish === 'string' && doPublish.toLowerCase().startsWith('y')))) {
    const space = await ask('Confluence space key (e.g. DOCS): ');
    const title = await ask('Confluence page title: ');
    try {
      await publishToConfluence({ space, title, content: doc });
      console.log('Published to Confluence successfully.');
    } catch (e) {
      console.error('Failed to publish to Confluence:', e.message);
    }
  } else {
    console.log('Skipping publish.');
  }
}

main();
