#!/usr/bin/env node
/**
 * Verifica que toda ruta del repo citada entre backticks en la documentación
 * exista. Así no vuelven las referencias a archivos que nunca se escribieron.
 *
 * Revisa README.md, skills/** /SKILL.md (y sus .md), agents/*.md y docs/**.md.
 * Una ruta "del repo" es la que empieza con una carpeta raíz conocida.
 *
 *   pnpm check:docs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOP = ['skills/', 'docs/', 'packages/', 'apps/', 'registry/', 'scripts/', 'templates/', 'reference/', 'agents/'];
// Rutas viejas o relativas: siempre se citan completas desde la raíz del repo.
const LEGACY = ['web-fx-kit/', 'effects/', 'recipes/', 'react/', 'prompts/', 'assets-pipeline/', 'demo/'];
// Archivos de skills de terceros (viven en ~/.claude/skills, no en este repo).
const EXTERNAL = ['reference/craft-floor.md', 'reference/new-work.md', 'scripts/impeccable'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = [
  join(ROOT, 'README.md'),
  ...['skills', 'agents', 'docs', 'templates'].filter((d) => existsSync(join(ROOT, d))).flatMap((d) => walk(join(ROOT, d))),
];

const problems = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/`([^`\s]+)`/g)) {
    let ref = m[1].replace(/[),.:;]+$/, '');
    if (EXTERNAL.includes(ref)) continue;
    if (!TOP.some((t) => ref.startsWith(t)) && !LEGACY.some((t) => ref.startsWith(t))) continue;
    if (/[<>*{}$]/.test(ref)) continue; // plantillas: <efecto>, *.md
    ref = ref.split('#')[0];
    if (!existsSync(join(ROOT, ref))) {
      const line = text.slice(0, m.index).split('\n').length;
      problems.push(`${relative(ROOT, file)}:${line}  ${ref}`);
    }
  }
}

if (problems.length) {
  console.error(`Rutas citadas que no existen (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`docs: ${files.length} archivos, todas las rutas citadas existen`);
