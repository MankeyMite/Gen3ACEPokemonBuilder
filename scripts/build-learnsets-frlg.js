#!/usr/bin/env node
/**
 * Build script: parse the FRLG-specific level_up_learnsets file and generate
 * a JS module containing ONLY the level-up move overrides that differ from
 * the Emerald learnsets.
 *
 * Deoxys (410) is handled specially: all three forms' level-up moves
 * (Emerald Normal, FireRed Attack, LeafGreen Defense) are merged into one
 * combined entry so the player can access every move regardless of origin game
 * (since Deoxys changes form on trade and moves can be relearned).
 *
 * Output: src/data/learnsets.frlg.js
 *   LEARNSETS_FRLG — overrides for FR/LG (speciesId → [[moveId,level],...])
 *                    Deoxys entry contains ALL three forms' moves merged.
 *
 * Usage:  node scripts/build-learnsets-frlg.js
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');

// ─── 1. Build MOVE_CONSTANT → moveId mapping ─────────────────────────────────

const moveSrc = fs.readFileSync(path.join(DATA, 'moves.gen3.data.js'), 'utf8');
const arrayBody = moveSrc.slice(moveSrc.indexOf('['), moveSrc.lastIndexOf(']') + 1);
const movesArr = JSON.parse(arrayBody);

function displayToMoveConst(name) {
  return 'MOVE_' + name.toUpperCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

const moveConstToId = {};
for (const m of movesArr) {
  const id = Number(m[''] ?? m.id);
  if (!id || !m.Move) continue;
  moveConstToId[displayToMoveConst(m.Move)] = id;
}

const moveAliases = {
  'MOVE_FAINT_ATTACK':  moveConstToId['MOVE_FEINT_ATTACK'],
  'MOVE_VICE_GRIP':     moveConstToId['MOVE_VISE_GRIP'],
  'MOVE_HI_JUMP_KICK':  moveConstToId['MOVE_HIGH_JUMP_KICK'],
  'MOVE_SMELLING_SALT':  moveConstToId['MOVE_SMELLING_SALTS'],
};
for (const [alias, id] of Object.entries(moveAliases)) {
  if (id && !moveConstToId[alias]) moveConstToId[alias] = id;
}

// ─── 2. Build species lookup ──────────────────────────────────────────────────

const specSrc = fs.readFileSync(path.join(DATA, 'species.gen3.js'), 'utf8');
const specRe = /\[\s*(\d+)\s*,\s*"([^"]+)"\s*\]/g;
let sm;
const speciesById = {};
const pascalLookup = {};

while ((sm = specRe.exec(specSrc)) !== null) {
  const id = Number(sm[1]);
  const name = sm[2];
  if (name === '?' || name === '??????????' || name === 'Pokémon Egg') continue;
  speciesById[id] = name;
}

function displayToPascal(name) {
  let s = name;
  s = s.replace(/♀/g, 'F').replace(/♂/g, 'M');
  s = s.replace(/[^A-Za-z0-9]/g, '');
  return s.toLowerCase();
}

for (const [id, name] of Object.entries(speciesById)) {
  const key = displayToPascal(name);
  if (!pascalLookup[key]) pascalLookup[key] = Number(id);
}

// ─── 3. Build pre-evolution chain (same as build-learnsets.js) ──────────────

function displayToSpeciesConst(name) {
  let s = name;
  s = s.replace(/♀/g, '_F').replace(/♂/g, '_M');
  s = s.replace(/'/g, '');
  s = s.replace(/\.\s*/g, '_');
  s = s.replace(/[\s\-]+/g, '_');
  s = s.replace(/[^A-Za-z0-9_]/g, '');
  return 'SPECIES_' + s.toUpperCase();
}

const speciesConstToId = {};
for (const [id, name] of Object.entries(speciesById)) {
  const c = displayToSpeciesConst(name);
  if (!speciesConstToId[c]) speciesConstToId[c] = Number(id);
}

const preEvoOf = {};
{
  const src = fs.readFileSync(path.join(DATA, 'evolution.h'), 'utf8');
  const entryRe = /\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\{((?:\{[^}]*\},?\s*)+)\}/g;
  let em;
  while ((em = entryRe.exec(src)) !== null) {
    const parentConst = 'SPECIES_' + em[1];
    const parentId = speciesConstToId[parentConst];
    if (!parentId) continue;
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

function getPreEvoChain(speciesId) {
  const chain = [];
  let cur = preEvoOf[speciesId];
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);
    cur = preEvoOf[cur];
  }
  return chain;
}

// ─── 4. Load existing Emerald learnsets for comparison ──────────────────────

const emeraldSrc = fs.readFileSync(path.join(DATA, 'learnsets.gen3.js'), 'utf8');
// Extract the LEARNSETS object content
const emeraldLearnsets = {};
// Match each species line:  123: {l:[[moveId,level],...],e:...}
// Use a balanced bracket approach: find "l:[" then collect until the matching "]"
const lineRe = /^\s*(\d+):\s*\{l:\[(.+?)\],e:/gm;
let em2;
while ((em2 = lineRe.exec(emeraldSrc)) !== null) {
  const sid = Number(em2[1]);
  const luStr = em2[2];
  const moves = [];
  const pairRe = /\[(\d+),(\d+)\]/g;
  let pm;
  while ((pm = pairRe.exec(luStr)) !== null) {
    moves.push([Number(pm[1]), Number(pm[2])]);
  }
  emeraldLearnsets[sid] = moves;
}

// ─── 5. Parse the FRLG .h file ─────────────────────────────────────────────

const frlgSrc = fs.readFileSync(path.join(DATA, 'level_up_learnsets FRLG.h'), 'utf8');

// Parse standard (non-conditional) blocks
const frlgLearnsets = {};  // speciesId → [[moveId, level], ...]
const fireRedOnly = {};    // speciesId → [[moveId, level], ...]
const leafGreenOnly = {};  // speciesId → [[moveId, level], ...]

function parseLevelUpBlock(body) {
  const moves = [];
  const luRe = /LEVEL_UP_MOVE\(\s*(\d+)\s*,\s*MOVE_([A-Z0-9_]+)\s*\)/g;
  let mm;
  while ((mm = luRe.exec(body)) !== null) {
    const level = Number(mm[1]);
    const moveConst = 'MOVE_' + mm[2];
    const moveId = moveConstToId[moveConst];
    if (moveId) {
      moves.push([moveId, level]);
    } else {
      console.warn(`[frlg] Unknown move: ${moveConst}`);
    }
  }
  return moves;
}

// Handle the #if defined(FIRERED) / #elif defined(LEAFGREEN) blocks
// Split the source by conditional compilation directives
const sections = frlgSrc.split(/^(#if\s+defined\((?:FIRERED|LEAFGREEN)\)|#elif\s+defined\((?:FIRERED|LEAFGREEN)\)|#endif)/m);

let currentCondition = null; // null = unconditional, 'FIRERED', 'LEAFGREEN'

for (const section of sections) {
  const trimmed = section.trim();
  
  if (/^#if\s+defined\(FIRERED\)/.test(trimmed)) {
    currentCondition = 'FIRERED';
    continue;
  }
  if (/^#elif\s+defined\(LEAFGREEN\)/.test(trimmed)) {
    currentCondition = 'LEAFGREEN';
    continue;
  }
  if (/^#endif/.test(trimmed)) {
    currentCondition = null;
    continue;
  }
  
  // Parse any learnset blocks in this section
  const blockRe = /static\s+const\s+u16\s+s(\w+)LevelUpLearnset\[\]\s*=\s*\{([^}]+)\}/g;
  let bm;
  while ((bm = blockRe.exec(section)) !== null) {
    const pascalName = bm[1].toLowerCase();
    const speciesId = pascalLookup[pascalName];
    if (!speciesId) {
      console.warn(`[frlg] Unknown species pascal name: ${bm[1]}`);
      continue;
    }
    
    const moves = parseLevelUpBlock(bm[2]);
    
    if (currentCondition === 'FIRERED') {
      fireRedOnly[speciesId] = moves;
    } else if (currentCondition === 'LEAFGREEN') {
      leafGreenOnly[speciesId] = moves;
    } else {
      frlgLearnsets[speciesId] = moves;
    }
  }
}

// ─── 6. Merge pre-evolution moves (same logic as Emerald build) ─────────────

function mergePreEvoMoves(learnsetMap) {
  let mergedCount = 0;
  for (const sid of Object.keys(learnsetMap).map(Number)) {
    const chain = getPreEvoChain(sid);
    if (!chain.length) continue;
    for (const preId of chain) {
      const preEntry = learnsetMap[preId];
      if (!preEntry) continue;
      for (const [mid, lvl] of preEntry) {
        learnsetMap[sid].push([mid, lvl]);
        mergedCount++;
      }
    }
  }
  return mergedCount;
}

mergePreEvoMoves(frlgLearnsets);
// Deoxys doesn't evolve, so FR/LG-only entries don't need pre-evo merging

// ─── 7. Compare with Emerald and keep only differences ─────────────────────

function normalizeMoves(moves) {
  // Deduplicate: keep lowest level per move
  const map = new Map();
  for (const [mid, lvl] of moves) {
    if (!map.has(mid) || lvl < map.get(mid)) map.set(mid, lvl);
  }
  return [...map.entries()]
    .map(([mid, lvl]) => [mid, lvl])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function movesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

const overrides = {};  // speciesId → normalized [[moveId, level], ...]
let diffCount = 0;

for (const [sidStr, moves] of Object.entries(frlgLearnsets)) {
  const sid = Number(sidStr);
  const frlgNorm = normalizeMoves(moves);
  const emeraldNorm = emeraldLearnsets[sid] ? normalizeMoves(emeraldLearnsets[sid]) : [];
  
  if (!movesEqual(frlgNorm, emeraldNorm)) {
    overrides[sid] = frlgNorm;
    diffCount++;
    console.log(`  Diff: ${speciesById[sid] || sid}`);
  }
}

// Deoxys (410): merge all three forms' level-up moves into one combined entry.
// Deoxys changes form when traded between games, so all moves should be accessible.
const DEOXYS_ID = 410;
if (fireRedOnly[DEOXYS_ID] || leafGreenOnly[DEOXYS_ID]) {
  const emeraldMoves = emeraldLearnsets[DEOXYS_ID] || [];
  const frMoves = fireRedOnly[DEOXYS_ID] || [];
  const lgMoves = leafGreenOnly[DEOXYS_ID] || [];
  const combined = [...emeraldMoves, ...frMoves, ...lgMoves];
  overrides[DEOXYS_ID] = normalizeMoves(combined);
  console.log(`  Deoxys: merged ${emeraldMoves.length} Emerald + ${frMoves.length} FR + ${lgMoves.length} LG moves`);
}

console.log(`\nFound ${Object.keys(overrides).length} species with different/merged FRLG level-up moves`);

// ─── 8. Generate output ────────────────────────────────────────────────────

function formatMoves(moves) {
  return moves.map(([id, lvl]) => `[${id},${lvl}]`).join(',');
}

const lines = [
  '// Auto-generated by scripts/build-learnsets-frlg.js — DO NOT EDIT',
  '// Level-up move overrides for FireRed/LeafGreen that differ from Emerald.',
  '// Only species whose FRLG level-up learnset differs from Emerald are included.',
  '// Pre-evolution moves are already merged.',
  '// Deoxys (410) entry contains ALL three forms\' moves merged (Normal + Attack + Defense).',
  '',
];

lines.push('export const LEARNSETS_FRLG = {');
for (const sid of Object.keys(overrides).map(Number).sort((a, b) => a - b)) {
  const name = speciesById[sid] || '???';
  lines.push(`  ${sid}: [${formatMoves(overrides[sid])}], // ${name}`);
}
lines.push('};');
lines.push('');

const outPath = path.join(DATA, 'learnsets.frlg.js');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`\nGenerated ${outPath}`);
