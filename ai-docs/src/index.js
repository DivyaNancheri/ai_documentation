#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import readline from 'readline';
import { searchCodebase } from './indexer.js';
import { generateDocumentation } from './analyzer.js';
import { publishToConfluence } from './confluence.js';
import { findReactComponent, generateReactComponentDocumentation } from './react-component-analyzer.js';

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
  const component = argv.component || argv.comp;
  const codepath = argv.codepath || argv.c || '../react-search-dashboard';
  const publishFlag = argv.publish || argv.p || false;
  const noPublish = argv['no-publish'] || argv.np || false;
  const docsPaths = argv['docsPaths'] || argv.docs || '';
  const mode = component ? 'component' : 'search';

  if (!query && !component) {
    console.log('Usage:');
    console.log('  React Component Analysis:');
    console.log('    node src/index.js --component "ComponentName" [--codepath "../react-project"]');
    console.log('');
    console.log('  General Search:');
    console.log('    node src/index.js --query "search text" [--codepath "../react-project"]');
    console.log('');
    console.log('  Options:');
    console.log('    --publish, -p         Auto-publish to Confluence');
    console.log('    --no-publish, --np    Skip publish prompt');
    console.log('    --docs "path1,path2"  Include additional documentation files');
    process.exit(1);
  }

  const absoluteCodepath = path.resolve(codepath);
  if (!fs.existsSync(absoluteCodepath)) {
    console.error(`Code path not found: ${absoluteCodepath}`);
    process.exit(1);
  }

  let doc;
  
  if (mode === 'component') {
    // React Component Analysis Mode
    console.log(`🔍 Analyzing React component "${component}" in ${absoluteCodepath}`);
    const componentResults = await findReactComponent(absoluteCodepath, component);
    
    if (componentResults.length === 0) {
      console.log(`❌ Component "${component}" not found in the codebase.`);
      console.log('💡 Tips:');
      console.log('  - Check component name spelling and casing');
      console.log('  - Ensure the component exists in the specified path');
      console.log('  - Component might be in a different directory structure');
      process.exit(1);
    }
    
    console.log(`✅ Found ${componentResults.length} file(s) related to "${component}"`);
    for (const result of componentResults) {
      console.log(`   📁 ${result.fileName} (${result.components.length} components, ${result.hooks.length} hooks)`);
    }
    
    // Load user docs if provided
    let userDocs = [];
    if (docsPaths && docsPaths.trim()) {
      const parts = docsPaths.split(',').map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        try {
          const content = fs.readFileSync(path.resolve(p), 'utf-8');
          userDocs.push({ path: p, content });
          console.log(`📄 Loaded document: ${p}`);
        } catch (e) {
          console.warn(`⚠️  Could not read ${p}: ${e.message}`);
        }
      }
    } else {
      console.log('📝 No additional documentation files provided');
      userDocs = []; // Skip interactive prompt for component mode
    }
    
    doc = await generateReactComponentDocumentation({ 
      componentName: component, 
      codebasePath: absoluteCodepath, 
      componentResults, 
      userDocs 
    });
    
  } else {
    // General Search Mode
    console.log(`🔍 Searching in ${absoluteCodepath} for query: "${query}"`);
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

    doc = await generateDocumentation({ query, searchResults, userDocs, codebasePath: absoluteCodepath });
  }

  // write output
  const outDir = path.resolve('output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = mode === 'component' ? `react-component-${component}` : 'ai-docs';
  const outPath = path.join(outDir, `${prefix}-${timestamp}.md`);
  fs.writeFileSync(outPath, doc, 'utf-8');
  console.log(`Saved accumulated documentation to ${outPath}`);

  // Also save an HTML version (simple wrapper with escaped markdown inside a <pre>)
  const htmlOutDir = outDir;
  const htmlPath = path.join(htmlOutDir, `${prefix}-${timestamp}.html`);
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const title = mode === 'component' ? `React Component: ${component}` : `AI Docs`;
  const htmlContent = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<title>${title} - ${timestamp}</title>\n<style>body{font-family:system-ui,Arial,Helvetica,sans-serif;padding:20px;max-width:1200px;margin:0 auto}pre{white-space:pre-wrap;word-wrap:break-word;background:#f8f8f8;padding:16px;border-radius:6px;border-left:4px solid #007acc}h1,h2,h3{color:#333}code{background:#f1f1f1;padding:2px 4px;border-radius:3px}</style>\n</head>\n<body>\n<h1>${title} - ${timestamp}</h1>\n<pre>${escapeHtml(doc)}</pre>\n</body>\n</html>`;
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
