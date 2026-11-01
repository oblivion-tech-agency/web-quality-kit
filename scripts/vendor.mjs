#!/usr/bin/env node
/**
 * Copia efectos del registry a un proyecto sin shadcn (o con el kit privado):
 *
 *   node scripts/vendor.mjs <carpeta-destino> <efecto> [<efecto> …]
 *   node scripts/vendor.mjs ../cliente/src/fx-kit split-reveal stacked-cards
 *
 * Escribe el núcleo (fx-core) y los archivos de cada efecto con la misma
 * estructura que `npx shadcn add` (core/, lib/, effects/<efecto>/) y lista las
 * dependencias npm que hay que instalar. Lee registry/r: corré `pnpm registry` antes.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [dest, ...effects] = process.argv.slice(2);
if (!dest || !effects.length) {
  console.error('Uso: node scripts/vendor.mjs <carpeta-destino> <efecto> [<efecto> …]');
  process.exit(1);
}

const out = resolve(dest);
const deps = new Set();
const written = new Set();
const writeItem = (name) => {
  const file = join(ROOT, 'registry/r', `${name}.json`);
  if (!existsSync(file)) throw new Error(`No existe el efecto "${name}" en registry/r`);
  const item = JSON.parse(readFileSync(file, 'utf8'));
  (item.dependencies ?? []).forEach((d) => deps.add(d));
  for (const f of item.files) {
    const rel = f.target.replace(/^components\/fx\//, '');
    if (written.has(rel)) continue;
    const target = join(out, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, f.content);
    written.add(rel);
  }
};

writeItem('fx-core');
effects.forEach(writeItem);
console.log(`${written.size} archivos en ${out}`);
if (deps.size) console.log(`Dependencias: ${[...deps].join(' ')}`);
