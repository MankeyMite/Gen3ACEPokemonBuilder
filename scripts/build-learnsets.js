#!/usr/bin/env node
/**
 * Build script: parse .h learnset files from the pokeemerald decomp and
 * generate a single JS module (src/data/learnsets.gen3.js) mapping each
 * speciesId to a categorised learnset:
 *
 *   speciesId → {
 *     levelUp: [[moveId, learnLevel], ...],   // sorted by level then id
 *     egg:     [moveId, ...],                  // sorted
 *     tm:      [moveId, ...],                  // sorted
 *     tutor:   [moveId, ...],                  // sorted
 *   }
 *
 * Sources:
 *   src/data/level_up_learnsets.h   — level-up moves
 *   src/data/egg_moves.h            — egg moves
 *   src/data/tmhm_learnsets.h       — TM/HM moves
 *   src/data/tutor_learnsets.h      — tutor moves
 *
 * Usage:  node scripts/build-learnsets.js
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');

// ─── 1. Build MOVE_CONSTANT → moveId mapping ─────────────────────────────────

// Parse the moves.gen3.data.js ES module manually (extract the JSON array)
const moveSrc = fs.readFileSync(path.join(DATA, 'moves.gen3.data.js'), 'utf8');
const arrayBody = moveSrc.slice(moveSrc.indexOf('['), moveSrc.lastIndexOf(']') + 1);
const movesArr = JSON.parse(arrayBody);

/** Convert display name → MOVE_UPPER_SNAKE e.g. "Karate Chop" → "MOVE_KARATE_CHOP" */
function displayToMoveConst(name) {
  return 'MOVE_' + name.toUpperCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

const moveConstToId = {};   // "MOVE_POUND" → 1
for (const m of movesArr) {
  const id = Number(m[''] ?? m.id);
  if (!id || !m.Move) continue;
  moveConstToId[displayToMoveConst(m.Move)] = id;
}

// Decomp constant names that differ from display names (older vs newer spelling)
const moveAliases = {
  'MOVE_FAINT_ATTACK':  moveConstToId['MOVE_FEINT_ATTACK'],    // Feint Attack
  'MOVE_VICE_GRIP':     moveConstToId['MOVE_VISE_GRIP'],       // Vise Grip
  'MOVE_HI_JUMP_KICK':  moveConstToId['MOVE_HIGH_JUMP_KICK'],  // High Jump Kick
  'MOVE_SMELLING_SALT':  moveConstToId['MOVE_SMELLING_SALTS'],  // Smelling Salts
};
for (const [alias, id] of Object.entries(moveAliases)) {
  if (id && !moveConstToId[alias]) moveConstToId[alias] = id;
}

// ─── 2. Build species lookup tables ──────────────────────────────────────────

const specSrc = fs.readFileSync(path.join(DATA, 'species.gen3.js'), 'utf8');
// Extract [id, "Name"] pairs
const specRe = /\[\s*(\d+)\s*,\s*"([^"]+)"\s*\]/g;
let sm;
const speciesById = {};       // id → displayName
const speciesNameToId = {};   // "Bulbasaur" → 1

while ((sm = specRe.exec(specSrc)) !== null) {
  const id = Number(sm[1]);
  const name = sm[2];
  if (name === '?' || name === '??????????' || name === 'Pokémon Egg') continue;
  speciesById[id] = name;
  // Use first occurrence for duplicate names (Unown forms all share name but only first id 201 matters)
  if (!speciesNameToId[name]) speciesNameToId[name] = id;
}

/** Convert display name → SPECIES_UPPER_SNAKE e.g. "Mr. Mime" → "SPECIES_MR_MIME" */
function displayToSpeciesConst(name) {
  let s = name;
  // Special cases
  s = s.replace(/♀/g, '_F').replace(/♂/g, '_M');
  s = s.replace(/'/g, '');    // Farfetch'd → Farfetchd
  s = s.replace(/\.\s*/g, '_'); // Mr. Mime → Mr_Mime
  s = s.replace(/[\s\-]+/g, '_');
  s = s.replace(/[^A-Za-z0-9_]/g, '');
  return 'SPECIES_' + s.toUpperCase();
}

const speciesConstToId = {};  // "SPECIES_BULBASAUR" → 1
for (const [id, name] of Object.entries(speciesById)) {
  const c = displayToSpeciesConst(name);
  if (!speciesConstToId[c]) speciesConstToId[c] = Number(id);
}

/** Build PascalCase lookup for level_up arrays: "Bulbasaur" → id */
// Strip everything except alphanumeric from display name
function displayToPascal(name) {
  let s = name;
  s = s.replace(/♀/g, 'F').replace(/♂/g, 'M');
  s = s.replace(/[^A-Za-z0-9]/g, '');
  return s.toLowerCase();
}

const pascalLookup = {}; // "bulbasaur" → 1, "nidoranf" → 29, "mrmime" → 122
for (const [id, name] of Object.entries(speciesById)) {
  const key = displayToPascal(name);
  if (!pascalLookup[key]) pascalLookup[key] = Number(id);
}

// ─── 3. Parse evolution.h to build pre-evolution chains ─────────────────────
// We need to know each species' pre-evolution(s) so that evolved Pokémon
// inherit level-up moves from their entire pre-evolution chain.
// evolution.h maps  parent → child(ren).  We invert that to  child → parent.

const preEvoOf = {};   // speciesId → direct pre-evolution speciesId (or undefined)
{
  const src = fs.readFileSync(path.join(DATA, 'evolution.h'), 'utf8');
  // Each entry: [SPECIES_XXX] = {{EVO_..., ..., SPECIES_YYY}, ...}
  // One parent can have multiple children (branched evos like Eevee, Gloom, etc.)
  const entryRe = /\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\{((?:\{[^}]*\},?\s*)+)\}/g;
  let em;
  while ((em = entryRe.exec(src)) !== null) {
    const parentConst = 'SPECIES_' + em[1];
    const parentId = speciesConstToId[parentConst];
    if (!parentId) continue;
    // Extract all target species from the branches
    const childRe = /SPECIES_([A-Z0-9_]+)/g;
    let cm;
    while ((cm = childRe.exec(em[2])) !== null) {
      const childConst = 'SPECIES_' + cm[1];
      const childId = speciesConstToId[childConst];
      if (childId && childId !== parentId) {
        preEvoOf[childId] = parentId;
      }
    }
  }
}

/** Return the full pre-evolution chain for a species (oldest ancestor first). */
function getPreEvoChain(speciesId) {
  const chain = [];
  let cur = preEvoOf[speciesId];
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);   // oldest ancestor first
    cur = preEvoOf[cur];
  }
  return chain;
}

// ─── 4. Parse each .h file into categorised buckets ─────────────────────────

// speciesId → { levelUp: [[moveId, level], ...], egg: Set, tm: Set, tutor: Set }
const learnsets = {};

function ensureEntry(speciesId) {
  if (!learnsets[speciesId]) {
    learnsets[speciesId] = { levelUp: [], egg: new Set(), tm: new Set(), tutor: new Set() };
  }
  return learnsets[speciesId];
}

// ── 3a. level_up_learnsets.h ──
{
  const src = fs.readFileSync(path.join(DATA, 'level_up_learnsets.h'), 'utf8');
  // Match each array block
  const blockRe = /static\s+const\s+u16\s+s(\w+)LevelUpLearnset\[\]\s*=\s*\{([^}]+)\}/g;
  let bm;
  while ((bm = blockRe.exec(src)) !== null) {
    const pascalName = bm[1].toLowerCase();
    const speciesId = pascalLookup[pascalName];
    if (!speciesId) {
      console.warn(`[level_up] Unknown species pascal name: ${bm[1]}`);
      continue;
    }
    const entry = ensureEntry(speciesId);
    // Extract LEVEL_UP_MOVE(level, MOVE_XXX)
    const luRe = /LEVEL_UP_MOVE\(\s*(\d+)\s*,\s*MOVE_([A-Z0-9_]+)\s*\)/g;
    let mm;
    while ((mm = luRe.exec(bm[2])) !== null) {
      const level = Number(mm[1]);
      const moveConst = 'MOVE_' + mm[2];
      const moveId = moveConstToId[moveConst];
      if (moveId) {
        entry.levelUp.push([moveId, level]);
      } else {
        console.warn(`[level_up] Unknown move: ${moveConst} for ${bm[1]}`);
      }
    }
  }
}

// ── 3b. egg_moves.h ──
{
  const src = fs.readFileSync(path.join(DATA, 'egg_moves.h'), 'utf8');
  // Match egg_moves(SPECIES_NAME, MOVE_A, MOVE_B, ...)
  const eggRe = /egg_moves\(\s*([A-Z0-9_]+)\s*,([\s\S]*?)\)/g;
  let em;
  while ((em = eggRe.exec(src)) !== null) {
    const speciesConst = 'SPECIES_' + em[1];
    const speciesId = speciesConstToId[speciesConst];
    if (!speciesId) {
      console.warn(`[egg] Unknown species: ${speciesConst}`);
      continue;
    }
    const entry = ensureEntry(speciesId);
    const moveRe = /MOVE_([A-Z0-9_]+)/g;
    let mm;
    while ((mm = moveRe.exec(em[2])) !== null) {
      const moveConst = 'MOVE_' + mm[1];
      const moveId = moveConstToId[moveConst];
      if (moveId) entry.egg.add(moveId);
      else console.warn(`[egg] Unknown move: ${moveConst} for ${em[1]}`);
    }
  }
}

// ── 3c. tmhm_learnsets.h ──
{
  const src = fs.readFileSync(path.join(DATA, 'tmhm_learnsets.h'), 'utf8');
  // Match [SPECIES_XXX] = { .learnset = { .MOVE1 = TRUE, ... } }
  const tmRe = /\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\{\s*\.learnset\s*=\s*\{([^}]*)\}\s*\}/g;
  let tm;
  while ((tm = tmRe.exec(src)) !== null) {
    const speciesConst = 'SPECIES_' + tm[1];
    const speciesId = speciesConstToId[speciesConst];
    if (!speciesId) {
      if (tm[1] !== 'NONE') console.warn(`[tmhm] Unknown species: ${speciesConst}`);
      continue;
    }
    const entry = ensureEntry(speciesId);
    const fieldRe = /\.([A-Z0-9_]+)\s*=\s*TRUE/g;
    let fm;
    while ((fm = fieldRe.exec(tm[2])) !== null) {
      const moveConst = 'MOVE_' + fm[1];
      const moveId = moveConstToId[moveConst];
      if (moveId) entry.tm.add(moveId);
      else console.warn(`[tmhm] Unknown move: ${moveConst} for ${tm[1]}`);
    }
  }
}

// ── 3d. tutor_learnsets.h ──
{
  const src = fs.readFileSync(path.join(DATA, 'tutor_learnsets.h'), 'utf8');
  // Each entry looks like:
  //   [SPECIES_XXX] = (TUTOR(MOVE_A)
  //                   | TUTOR(MOVE_B)
  //                   | ...),
  // The inner TUTOR(...) calls contain ')' so we can't use [^)].
  // Use lazy [\s\S]*? and terminate with )\s*, (the entry-ending comma)
  // to avoid the outer ) consuming the last TUTOR()'s closing paren.
  const tutorRe = /\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\(([\s\S]*?)\)\s*,/g;
  let tr;
  while ((tr = tutorRe.exec(src)) !== null) {
    const speciesConst = 'SPECIES_' + tr[1];
    const speciesId = speciesConstToId[speciesConst];
    if (!speciesId) {
      if (tr[1] !== 'NONE') console.warn(`[tutor] Unknown species: ${speciesConst}`);
      continue;
    }
    // Skip entries that are just (0) — no tutor moves
    if (/^\s*0\s*$/.test(tr[2])) continue;
    const entry = ensureEntry(speciesId);
    const moveRe = /TUTOR\(MOVE_([A-Z0-9_]+)\)/g;
    let mm;
    while ((mm = moveRe.exec(tr[2])) !== null) {
      const moveConst = 'MOVE_' + mm[1];
      const moveId = moveConstToId[moveConst];
      if (moveId) entry.tutor.add(moveId);
      else console.warn(`[tutor] Unknown move: ${moveConst} for ${tr[1]}`);
    }
  }
}

// ─── 5. Merge pre-evolution level-up moves into evolved species ─────────────
// An evolved Pokémon can know any level-up move its pre-evolution(s) could
// have learned at or below its current level.  We merge the entire chain's
// level-up entries so that the runtime level filter handles legality.
{
  let mergedCount = 0;
  for (const sid of Object.keys(learnsets).map(Number)) {
    const chain = getPreEvoChain(sid);
    if (!chain.length) continue;
    const entry = learnsets[sid];
    for (const preId of chain) {
      const preEntry = learnsets[preId];
      if (!preEntry) continue;
      for (const [mid, lvl] of preEntry.levelUp) {
        entry.levelUp.push([mid, lvl]);
        mergedCount++;
      }
    }
  }
  console.log(`Merged ${mergedCount} pre-evolution level-up moves`);
}

// ─── 6. Generate output module ──────────────────────────────────────────────

// Build JS source — categorised learnset object per species
const lines = [
  '// Auto-generated by scripts/build-learnsets.js — DO NOT EDIT',
  '// Maps speciesId → { levelUp: [[moveId,level],...], egg: [...], tm: [...], tutor: [...] }',
  '// Sources: level_up_learnsets.h, egg_moves.h, tmhm_learnsets.h, tutor_learnsets.h',
  '',
  'export const LEARNSETS = {',
];

const sortedSpeciesIds = Object.keys(learnsets).map(Number).sort((a, b) => a - b);
let totalEntries = 0;
for (const sid of sortedSpeciesIds) {
  const e = learnsets[sid];
  const name = speciesById[sid] || '???';
  // Sort level-up by level then moveId; deduplicate (keep lowest level per move)
  const luMap = new Map();
  for (const [mid, lvl] of e.levelUp) {
    if (!luMap.has(mid) || lvl < luMap.get(mid)) luMap.set(mid, lvl);
  }
  const lu = [...luMap.entries()]
    .map(([mid, lvl]) => [mid, lvl])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const egg   = [...e.egg].sort((a, b) => a - b);
  const tm    = [...e.tm].sort((a, b) => a - b);
  const tutor = [...e.tutor].sort((a, b) => a - b);

  const luStr    = lu.map(([id, lvl]) => `[${id},${lvl}]`).join(',');
  const eggStr   = egg.join(',');
  const tmStr    = tm.join(',');
  const tutorStr = tutor.join(',');
  totalEntries += lu.length + egg.length + tm.length + tutor.length;

  lines.push(`  ${sid}: {l:[${luStr}],e:[${eggStr}],t:[${tmStr}],u:[${tutorStr}]}, // ${name}`);
}

lines.push('};');
lines.push('');
lines.push('export default LEARNSETS;');
lines.push('');

const outPath = path.join(DATA, 'learnsets.gen3.js');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`\nGenerated ${outPath}`);
console.log(`Species with learnsets: ${sortedSpeciesIds.length}`);
console.log(`Total categorised entries: ${totalEntries}`);
