import fs from 'fs';
import path from 'path';

export function readTextSafe(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch (e) {
    return null;
  }
}

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
