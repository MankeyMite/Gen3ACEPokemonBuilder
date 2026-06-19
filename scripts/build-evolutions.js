#!/usr/bin/env node
/**
 * build-evolutions.js
 *
 * Parses evolution.h and species.gen3.js to produce evolutions.gen3.js,
 * a module exporting:
 *
 *   EVOLUTIONS          — Map<speciesId, Array<{evo, method, param}>>
 *                         Direct evolutions for each species.
 *
 *   PRE_EVOLUTIONS      — Map<speciesId, speciesId>
 *                         The immediate pre-evolution ("parent") of each species.
 *
 *   PRE_EVOLUTION_DETAILS
 *                       — Map<speciesId, {pre, method, param}>
 *                         The immediate pre-evolution plus evolution details.
 *
 *   getMinimumHatchedLevel(id, options)
 *                       — Returns the lowest legal current level for Hatched
 *                         mode, based on the evolution path.
 *
 *   getFullEvoLine(id)  — Returns the complete evolution line starting from the
 *                         base form, e.g. getFullEvoLine(12) → [10, 11, 12]
 *                         (Caterpie → Metapod → Butterfree).
 *
 *   getWildAncestor(id, WILD_ENCOUNTERS)
 *                       — Walks the pre-evolution chain to find the closest
 *                         ancestor (or self) that exists in WILD_ENCOUNTERS.
 *                         Returns the ancestor's species ID, or null.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 1. Parse species.gen3.js to build name→id map ──────────────

const speciesSource = readFileSync(join(ROOT, 'src/data/species.gen3.js'), 'utf8');
const nameToId = new Map();
const idToName = new Map();

// Matches lines like:  [277, "Treecko"],
for (const m of speciesSource.matchAll(/\[(\d+),\s*"([^"]+)"\]/g)) {
  const id = Number(m[1]);
  const name = m[2];
  if (name === '?' || name === '??????????') continue;
  // Normalise name to SPECIES_XXX form: uppercase, spaces→_, hyphens→_
  const key = name.toUpperCase().replace(/[- .'']/g, '_').replace(/_+$/, '');
  nameToId.set(key, id);
  idToName.set(id, name);
}

// Manual aliases for names that don't directly match
const ALIASES = {
  NIDORAN_F: 'NIDORAN_F',
  NIDORAN_M: 'NIDORAN_M',
  HO_OH: 'HO_OH',
  MR_MIME: 'MR__MIME',  // "Mr. Mime" → MR__MIME via the regex
};
// Fix: "Mr. Mime" normalises to "MR__MIME" (dot→_ then double _), remap it
if (nameToId.has('MR__MIME') && !nameToId.has('MR_MIME')) {
  nameToId.set('MR_MIME', nameToId.get('MR__MIME'));
}
// Nidoran♀ / Nidoran♂ in species.gen3.js might be different
// The species list has "Nidoran♀" and "Nidoran♂"
for (const [id, name] of idToName) {
  if (name.includes('♀')) nameToId.set('NIDORAN_F', id);
  if (name.includes('♂')) nameToId.set('NIDORAN_M', id);
}
// Ho-Oh → HO_OH
if (!nameToId.has('HO_OH')) {
  for (const [id, name] of idToName) {
    if (name.toLowerCase() === 'ho-oh') { nameToId.set('HO_OH', id); break; }
  }
}

function resolveSpeciesName(raw) {
  // raw is e.g. "SPECIES_BUTTERFREE" → strip prefix
  const key = raw.replace(/^SPECIES_/, '');
  if (nameToId.has(key)) return nameToId.get(key);
  // Try alias
  if (ALIASES[key] && nameToId.has(ALIASES[key])) return nameToId.get(ALIASES[key]);
  return null;
}

// ── 2. Parse evolution.h ────────────────────────────────────────

const evoSource = readFileSync(join(ROOT, 'src/data/evolution.h'), 'utf8');

// Map: parentId → [childId, ...]
const evolutions = new Map();   // parentId → [{evo: childId}, ...]
const preEvolutions = new Map(); // childId → parentId
const preEvolutionDetails = new Map(); // childId → {pre, method, param}

// Match each entry block:
// [SPECIES_BULBASAUR] = {{EVO_LEVEL, 16, SPECIES_IVYSAUR}},
// [SPECIES_GLOOM]     = {{EVO_ITEM, ITEM_LEAF_STONE, SPECIES_VILEPLUME},
//                        {EVO_ITEM, ITEM_SUN_STONE, SPECIES_BELLOSSOM}},
const lineRe = /\[(SPECIES_\w+)\]\s*=\s*(\{.*?\}\}),/gs;
const entryRe = /\{(\w+),\s*([^,]+),\s*(SPECIES_\w+)\}/g;

for (const lineMatch of evoSource.matchAll(lineRe)) {
  const parentName = lineMatch[1];
  const parentId = resolveSpeciesName(parentName);
  if (parentId == null) {
    console.warn(`Warning: unknown parent species ${parentName}`);
    continue;
  }

  const body = lineMatch[2];
  for (const evoMatch of body.matchAll(entryRe)) {
    const method = evoMatch[1];
    const paramRaw = evoMatch[2].trim();
    const param = /^\d+$/.test(paramRaw) ? Number(paramRaw) : paramRaw;
    const childName = evoMatch[3];
    const childId = resolveSpeciesName(childName);
    if (childId == null) {
      console.warn(`Warning: unknown child species ${childName} (from ${parentName})`);
      continue;
    }

    if (!evolutions.has(parentId)) evolutions.set(parentId, []);
    evolutions.get(parentId).push({ evo: childId, method, param });

    // Record pre-evolution (first parent wins for species with multiple possible parents)
    if (!preEvolutions.has(childId)) {
      preEvolutions.set(childId, parentId);
      preEvolutionDetails.set(childId, { pre: parentId, method, param });
    }
  }
}

// ── 3. Generate the output JS module ────────────────────────────

const lines = [];
lines.push('// Auto-generated by scripts/build-evolutions.js — do not edit');
lines.push('//');
lines.push('// EVOLUTIONS:     parentId → [{ evo, method, param }, ...]');
lines.push('// PRE_EVOLUTIONS: childId  → parentId');
lines.push('// PRE_EVOLUTION_DETAILS: childId → { pre, method, param }');
lines.push('');

function formatJsValue(value) {
  return typeof value === 'number' ? String(value) : JSON.stringify(value);
}

// EVOLUTIONS
lines.push('export const EVOLUTIONS = {');
for (const [parentId, children] of [...evolutions.entries()].sort((a, b) => a[0] - b[0])) {
  const parentLabel = idToName.get(parentId) || parentId;
  const childStr = children
    .map(c => `{evo:${c.evo},method:${JSON.stringify(c.method)},param:${formatJsValue(c.param)}}`)
    .join(',');
  lines.push(`  ${parentId}:[${childStr}], // ${parentLabel}`);
}
lines.push('};');
lines.push('');

// PRE_EVOLUTIONS
lines.push('export const PRE_EVOLUTIONS = {');
for (const [childId, parentId] of [...preEvolutions.entries()].sort((a, b) => a[0] - b[0])) {
  const childLabel = idToName.get(childId) || childId;
  const parentLabel = idToName.get(parentId) || parentId;
  lines.push(`  ${childId}:${parentId}, // ${childLabel} ← ${parentLabel}`);
}
lines.push('};');
lines.push('');

// PRE_EVOLUTION_DETAILS
lines.push('export const PRE_EVOLUTION_DETAILS = {');
for (const [childId, detail] of [...preEvolutionDetails.entries()].sort((a, b) => a[0] - b[0])) {
  const childLabel = idToName.get(childId) || childId;
  const parentLabel = idToName.get(detail.pre) || detail.pre;
  lines.push(`  ${childId}:{pre:${detail.pre},method:${JSON.stringify(detail.method)},param:${formatJsValue(detail.param)}}, // ${childLabel} ← ${parentLabel}`);
}
lines.push('};');
lines.push('');

lines.push(`const BASE_HATCH_LEVEL = 5;`);
lines.push(`const LEVEL_EVOLUTION_METHODS = new Set([`);
lines.push(`  'EVO_LEVEL',`);
lines.push(`  'EVO_LEVEL_ATK_LT_DEF',`);
lines.push(`  'EVO_LEVEL_ATK_GT_DEF',`);
lines.push(`  'EVO_LEVEL_ATK_EQ_DEF',`);
lines.push(`  'EVO_LEVEL_SILCOON',`);
lines.push(`  'EVO_LEVEL_CASCOON',`);
lines.push(`  'EVO_LEVEL_NINJASK',`);
lines.push(`  'EVO_LEVEL_SHEDINJA',`);
lines.push(`]);`);
lines.push(`const LEVEL_UP_CONDITION_METHODS = new Set([`);
lines.push(`  'EVO_FRIENDSHIP',`);
lines.push(`  'EVO_FRIENDSHIP_DAY',`);
lines.push(`  'EVO_FRIENDSHIP_NIGHT',`);
lines.push(`  'EVO_BEAUTY',`);
lines.push(`]);`);
lines.push('');
lines.push(`export function getMinimumHatchedLevel(speciesId, options = {}) {`);
lines.push(`  const id = Number(speciesId) || 0;`);
lines.push(`  if (id <= 0) return BASE_HATCH_LEVEL;`);
lines.push(`  const directHatchSpeciesIds = new Set(Array.from(options.directHatchSpeciesIds || []).map(Number));`);
lines.push(`  const path = [];`);
lines.push(`  const visited = new Set();`);
lines.push(`  let current = id;`);
lines.push(`  while (PRE_EVOLUTION_DETAILS[current] && !directHatchSpeciesIds.has(current) && !visited.has(current)) {`);
lines.push(`    visited.add(current);`);
lines.push(`    const detail = PRE_EVOLUTION_DETAILS[current];`);
lines.push(`    path.push(detail);`);
lines.push(`    current = detail.pre;`);
lines.push(`  }`);
lines.push('');
lines.push(`  let level = BASE_HATCH_LEVEL;`);
lines.push(`  for (const step of path.reverse()) {`);
lines.push(`    if (LEVEL_EVOLUTION_METHODS.has(step.method)) {`);
lines.push(`      level = Math.max(level, Number(step.param) || BASE_HATCH_LEVEL);`);
lines.push(`    } else if (LEVEL_UP_CONDITION_METHODS.has(step.method)) {`);
lines.push(`      level = Math.max(level + 1, BASE_HATCH_LEVEL + 1);`);
lines.push(`    }`);
lines.push(`  }`);
lines.push(`  return Math.max(BASE_HATCH_LEVEL, Math.min(100, level));`);
lines.push(`}`);
lines.push('');

// getFullEvoLine
lines.push(`/**`);
lines.push(` * Return the full evolution line for a species, from base form to final stage.`);
lines.push(` * e.g. getFullEvoLine(12) → [10, 11, 12] (Caterpie → Metapod → Butterfree)`);
lines.push(` */`);
lines.push(`export function getFullEvoLine(speciesId) {`);
lines.push(`  // Walk backwards to find the base form`);
lines.push(`  let base = speciesId;`);
lines.push(`  const visited = new Set();`);
lines.push(`  while (PRE_EVOLUTIONS[base] != null && !visited.has(base)) {`);
lines.push(`    visited.add(base);`);
lines.push(`    base = PRE_EVOLUTIONS[base];`);
lines.push(`  }`);
lines.push(`  // Walk forwards collecting the entire tree (BFS)`);
lines.push(`  const line = [base];`);
lines.push(`  const queue = [base];`);
lines.push(`  while (queue.length) {`);
lines.push(`    const cur = queue.shift();`);
lines.push(`    const children = EVOLUTIONS[cur];`);
lines.push(`    if (children) {`);
lines.push(`      for (const c of children) {`);
lines.push(`        if (!line.includes(c.evo)) {`);
lines.push(`          line.push(c.evo);`);
lines.push(`          queue.push(c.evo);`);
lines.push(`        }`);
lines.push(`      }`);
lines.push(`    }`);
lines.push(`  }`);
lines.push(`  return line;`);
lines.push(`}`);
lines.push('');

// getWildAncestor
lines.push(`/**`);
lines.push(` * Walk the pre-evolution chain to find the closest ancestor (or self)`);
lines.push(` * that has wild encounter data.  Returns the ancestor species ID, or null.`);
lines.push(` */`);
lines.push(`export function getWildAncestor(speciesId, wildEncounters) {`);
lines.push(`  let cur = speciesId;`);
lines.push(`  const visited = new Set();`);
lines.push(`  while (cur != null && !visited.has(cur)) {`);
lines.push(`    if (wildEncounters[cur]) return cur;`);
lines.push(`    visited.add(cur);`);
lines.push(`    cur = PRE_EVOLUTIONS[cur] ?? null;`);
lines.push(`  }`);
lines.push(`  return null;`);
lines.push(`}`);
lines.push('');

// ALL_WILD_EVOLUTIONS helper — precomputed set of species IDs that are evolutions of wild encounters
lines.push(`/**`);
lines.push(` * Build a Set of all species reachable by evolving any species in wildEncounters.`);
lines.push(` * Includes the wild species themselves AND all their evolutions.`);
lines.push(` */`);
lines.push(`export function buildWildWithEvolutions(wildEncounters) {`);
lines.push(`  const result = new Set();`);
lines.push(`  for (const idStr of Object.keys(wildEncounters)) {`);
lines.push(`    const id = Number(idStr);`);
lines.push(`    // Add the base wild species`);
lines.push(`    result.add(id);`);
lines.push(`    // Add all evolutions (recursively)`);
lines.push(`    const queue = [id];`);
lines.push(`    while (queue.length) {`);
lines.push(`      const cur = queue.shift();`);
lines.push(`      const children = EVOLUTIONS[cur];`);
lines.push(`      if (children) {`);
lines.push(`        for (const c of children) {`);
lines.push(`          if (!result.has(c.evo)) {`);
lines.push(`            result.add(c.evo);`);
lines.push(`            queue.push(c.evo);`);
lines.push(`          }`);
lines.push(`        }`);
lines.push(`      }`);
lines.push(`    }`);
lines.push(`  }`);
lines.push(`  return result;`);
lines.push(`}`);
lines.push('');

const outPath = join(ROOT, 'src/data/evolutions.gen3.js');
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

// Stats
const evoCount = [...evolutions.values()].reduce((s, a) => s + a.length, 0);
console.log(`Wrote ${outPath}`);
console.log(`  ${evolutions.size} species with evolutions, ${evoCount} total evolution entries`);
console.log(`  ${preEvolutions.size} species with pre-evolutions`);
