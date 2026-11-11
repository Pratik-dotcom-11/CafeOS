import fs from 'fs';
import path from 'path';

function findDollarInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Check if line contains $ not followed by { (template literal)
    const directDollar = line.match(/\$[0-9]+|'\$'|"\$"|>\$|\$\s|`\$/);
    if (directDollar) {
      console.log(`${filePath}:${i + 1}: ${line.trim()}`);
    }
  });
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      findDollarInFile(full);
    }
  }
}

walk('src');

