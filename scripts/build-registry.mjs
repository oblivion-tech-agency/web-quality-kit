#!/usr/bin/env node
/**
 * Arma el registry de efectos (formato shadcn) y el catálogo desde
 * packages/fx/src/effects/<efecto>/meta.json, que es la única fuente.
 *
 *   pnpm build && pnpm registry
 *   npx shadcn add <REGISTRY_URL>/count-up.json
 *
 * Salida:
 * - registry/r/<efecto>.json y registry/r/fx-core.json (registry:lib)
 * - registry/registry.json (índice)
 * - docs/CATALOG.md (tabla generada; no editar a mano)
 *
 * REGISTRY_URL: dónde se publica registry/r (por defecto, raw de GitHub en main).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'packages/fx/src');
const DIST = join(ROOT, 'packages/fx/dist');
const OUT = join(ROOT, 'registry/r');
const BASE = process.env.REGISTRY_URL ?? 'https://raw.githubusercontent.com/oblivion-tech-agency/web-quality-kit/main/registry/r';
const TARGET = 'components/fx';
const NPM_WEIGHT_KB = { three: 'three ≈ 160 KB gz (carga diferida)', gsap: 'gsap ≈ 25 KB gz', lenis: 'lenis ≈ 5 KB gz' };

const read = (p) => readFileSync(p, 'utf8');
// En el proyecto destino (Next.js) los imports relativos van sin extensión.
const portable = (code) => code.replace(/(from\s+|import\()(['"])(\.{1,2}\/[^'"]+)\.ts\2/g, '$1$2$3$2');

/** Archivos locales que importa un archivo (recursivo), relativos a SRC. */
function localImports(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = read(join(SRC, file));
  for (const m of code.matchAll(/(?:from\s+|import\()['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const next = posix.normalize(posix.join(posix.dirname(file), m[1]));
    if (existsSync(join(SRC, next))) localImports(next, seen);
  }
  return seen;
}

const gzKb = (files) => {
  const code = files
    .map((f) => join(DIST, f.replace(/\.ts$/, '.js')))
    .filter((f) => existsSync(f))
    .map(read)
    .join('\n');
  return code ? Math.round((gzipSync(code).length / 1024) * 10) / 10 : null;
};

const item = (name, extra, files) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name,
  type: 'registry:lib',
  ...extra,
  files: files.map((f) => ({
    path: `packages/fx/src/${f}`,
    type: 'registry:lib',
    target: `${TARGET}/${f}`,
    content: portable(read(join(SRC, f))),
  })),
});

mkdirSync(OUT, { recursive: true });

// Núcleo compartido: lo instala cualquier efecto como dependencia.
const coreFiles = readdirSync(join(SRC, 'core')).filter((f) => f.endsWith('.ts')).map((f) => `core/${f}`);
writeFileSync(
  join(OUT, 'fx-core.json'),
  JSON.stringify(
    item('fx-core', { title: 'Núcleo de @oblivion/fx', description: 'Contrato compartido: reduced motion en vivo, restauración del DOM, loop, tokens --fx-* y useFx.' }, coreFiles),
    null,
    2,
  ),
);

const effects = readdirSync(join(SRC, 'effects')).filter((d) => statSync(join(SRC, 'effects', d)).isDirectory()).sort();
const index = [];
for (const name of effects) {
  const dir = `effects/${name}`;
  const meta = JSON.parse(read(join(SRC, dir, 'meta.json')));
  const entry = [`${dir}/index.ts`, ...(existsSync(join(SRC, dir, 'react.ts')) ? [`${dir}/react.ts`] : [])];
  const all = new Set();
  for (const f of entry) localImports(f, all);
  const files = [...all].filter((f) => !f.startsWith('core/')).sort();
  const weight = gzKb([...all].filter((f) => !f.endsWith('react.ts')));
  const deps = meta.deps ?? [];
  const reg = item(
    name,
    {
      title: meta.title,
      description: meta.description,
      dependencies: deps,
      devDependencies: deps.includes('three') ? ['@types/three'] : [],
      registryDependencies: [`${BASE}/fx-core.json`],
      meta: { ...meta, weightKb: weight },
    },
    files,
  );
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(reg, null, 2));
  index.push({ ...meta, weightKb: weight });
}

writeFileSync(
  join(ROOT, 'registry/registry.json'),
  JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'oblivion-fx',
      homepage: 'https://github.com/oblivion-tech-agency/web-quality-kit',
      items: [{ name: 'fx-core', type: 'registry:lib' }, ...index.map(({ name }) => ({ name, type: 'registry:lib' }))],
    },
    null,
    2,
  ),
);

// Catálogo para humanos y para la skill fx-catalog.
const FAMILIES = ['texto', 'imagen', 'scroll', '3d', 'interacción', 'transiciones', 'fondo'];
const rows = (list) =>
  list
    .map(
      (e) =>
        `| \`${e.name}\` | ${e.title}${e.signature ? ' · **firma posible**' : ''} | ${'●'.repeat(e.intensity)}${'○'.repeat(4 - e.intensity)} | ${e.weightKb ?? '–'} KB${e.deps.length ? ` + ${e.deps.map((d) => NPM_WEIGHT_KB[d] ?? d).join(', ')}` : ''} | ${e.goodFor.join(', ')} | ${e.pairsWith.join(', ') || '–'} | ${e.avoidWith.join(', ') || '–'} |`,
    )
    .join('\n');
let md = `# Catálogo de efectos

> Generado por \`scripts/build-registry.mjs\` desde los \`meta.json\` de cada efecto. No editar a mano.

Instalar en un proyecto Next.js: \`npx shadcn add ${BASE}/<efecto>.json\` (se copia a \`${TARGET}/\`).
Intensidad: ● sutil · ●● editorial · ●●● alto impacto · ●●●● show. El peso es del código propio, gzip.

`;
for (const fam of FAMILIES) {
  const list = index.filter((e) => e.family === fam);
  if (!list.length) continue;
  md += `## ${fam[0].toUpperCase()}${fam.slice(1)}\n\n| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |\n|---|---|---|---|---|---|---|\n${rows(list)}\n\n`;
}
writeFileSync(join(ROOT, 'docs/CATALOG.md'), md);
console.log(`registry: ${index.length} efectos + fx-core → ${relative(ROOT, OUT)}`);
