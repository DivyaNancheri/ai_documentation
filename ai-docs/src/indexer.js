import fs from 'fs';
import path from 'path';

const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.md', '.json']);

function isTextFile(file) {
  return TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

export async function searchCodebase(rootDir, query) {
  const results = [];
  const q = query.toLowerCase();

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist' || ent.name === 'build') continue;
        walk(full);
      } else if (ent.isFile()) {
        if (!isTextFile(ent.name)) continue;
        try {
          const content = fs.readFileSync(full, 'utf-8');
          const lower = content.toLowerCase();
          if (lower.includes(q)) {
            // collect line snippets where match occurs
            const lines = content.split(/\r?\n/);
            const snippets = [];
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(q)) {
                const start = Math.max(0, i - 3);
                const end = Math.min(lines.length - 1, i + 3);
                snippets.push({ line: i + 1, context: lines.slice(start, end + 1).join('\n') });
              }
            }
            results.push({ path: full, snippets });
          }
        } catch (e) {
          // ignore unreadable files
        }
      }
    }
  }

  walk(rootDir);
  return results;
}
