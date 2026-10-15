#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist/cli/index.js');
const srcPath = path.resolve(__dirname, '../src/cli/index.ts');

if (fs.existsSync(distPath)) {
  await import(pathToFileURL(distPath).href);
} else {
  const { register } = await import('tsx/esm/api');
  await import(pathToFileURL(srcPath).href);
}
