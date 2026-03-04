#!/usr/bin/env node
/**
 * One-shot script: parses PKHeX C# shadow/team-lock files and generates
 * src/data/cxdLocks.gen3.js with all the data the CXD worker needs.
 *
 * Run:  node scripts/gen_cxd_locks.js
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');

function read(name) { return fs.readFileSync(path.join(DATA, name), 'utf8'); }

// ─── 1. Parse NPCLock / TeamLock definitions ─────────────────────────

/** Parse a single NPCLock constructor call.
 *  Regular: new NPCLock(species, nature, gender, ratio)
 *  Shadow-unseen: new NPCLock(species)
 *  Shadow-seen: new NPCLock(species, true)
 */
function parseLockCall(s) {
  const m = s.match(/new\s+NPCLock\(([^)]+)\)/);
  if (!m) return null;
  const args = m[1].split(',').map(a => a.trim());
  const species = parseInt(args[0]);
  if (args.length === 1) return { s: species, shadow: true, seen: false };
  if (args.length === 2 && args[1] === 'true') return { s: species, shadow: true, seen: true };
  // Regular: (species, nature, gender, ratio)
  return { s: species, n: parseInt(args[1]), g: parseInt(args[2]), r: parseInt(args[3]), shadow: false };
}

/** Parse TeamLock definitions from a *Shadow.cs file.
 *  Returns Map<name, { target, locks }>.
 */
function parseShadowFile(src) {
  const defs = new Map();
  // Match blocks like: public static readonly TeamLock VarName = new(\n target, //comment \n [optional detail,]  [\n ...\n ]);
  const re = /public\s+static\s+readonly\s+TeamLock\s+(\w+)\s*=\s*new\(([\s\S]*?)\]\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    const body = m[2];
    // First numeric arg in body is the target species
    const targetMatch = body.match(/^\s*(\d+)/);
    const target = targetMatch ? parseInt(targetMatch[1]) : 0;
    // Extract all NPCLock(...) calls
    const lockRe = /new\s+NPCLock\([^)]+\)/g;
    const locks = [];
    let lm;
    while ((lm = lockRe.exec(body)) !== null) {
      const lock = parseLockCall(lm[0]);
      if (lock) locks.push(lock);
    }
    defs.set(name, { target, locks });
  }
  return defs;
}

// ─── 2. Parse Teams files ─────────────────────────────────────────────

/** Parse Encounters3*Teams.cs → Map<teamArrayName, [lockDefName, ...]> */
function parseTeamsFile(src) {
  const teams = new Map();
  const re = /public\s+static\s+readonly\s+TeamLock\[\]\s+(\w+)\s*=\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    const refs = m[2].split(',').map(s => s.trim()).filter(Boolean);
    teams.set(name, refs);
  }
  return teams;
}

// ─── 3. Parse Encounters files ────────────────────────────────────────

/** Parse EncounterShadow3* entries → [{ shadowIndex, species, teamName }] */
function parseEncountersFile(src) {
  const entries = [];
  // new(shadowIdx, purifyCount, TeamName) { Species = N, ...
  const re = /new\(\s*(\d+)\s*,\s*\d+\s*,\s*(\w+)\s*\)\s*\{[^}]*Species\s*=\s*(\d+)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    entries.push({
      shadowIndex: parseInt(m[1]),
      teamName: m[2],
      species: parseInt(m[3]),
    });
  }
  return entries;
}

// ─── Run ──────────────────────────────────────────────────────────────

const coloShadowDefs = parseShadowFile(read('Encounters3ColoShadow.cs'));
const xdShadowDefs   = parseShadowFile(read('Encounters3XDShadow.cs'));
const allDefs = new Map([...coloShadowDefs, ...xdShadowDefs]);

const coloTeams = parseTeamsFile(read('Encounters3ColoTeams.cs'));
const xdTeams   = parseTeamsFile(read('Encounters3XDTeams.cs'));
const allTeams = new Map([...coloTeams, ...xdTeams]);

const coloEnc = parseEncountersFile(read('Encounters3Colo.cs'));
const xdEnc   = parseEncountersFile(read('Encounters3XD.cs'));

// Resolve: for each encounter, find which lock patterns apply.
// Key: "colo" or "xd" → species → [ [pattern1_locks], [pattern2_locks], ... ]

function resolveLocks(encounterList, game) {
  // species → Set of serialized patterns (to deduplicate)
  const speciesMap = new Map();

  for (const enc of encounterList) {
    // Lookup teamName in allTeams → [lockDefName, ...]
    const teamDefs = allTeams.get(enc.teamName);
    if (!teamDefs) {
      // teamName not found in teams file — might be "First" (empty)
      continue;
    }
    if (teamDefs.length === 0) continue; // First = no locks

    for (const defName of teamDefs) {
      const def = allDefs.get(defName);
      if (!def) {
        console.warn(`  Warning: lock def "${defName}" not found`);
        continue;
      }
      const key = JSON.stringify(def.locks);
      if (!speciesMap.has(enc.species)) speciesMap.set(enc.species, new Map());
      speciesMap.get(enc.species).set(key, def.locks);
    }
  }

  // Convert to { species: [ [locks], [locks], ... ] }
  const result = {};
  for (const [sp, patternsMap] of speciesMap) {
    result[sp] = [...patternsMap.values()];
  }
  return result;
}

// Also track which encounters have NO locks (First)
function findNoLockSpecies(encounterList) {
  const noLock = new Set();
  for (const enc of encounterList) {
    const teamDefs = allTeams.get(enc.teamName);
    if (!teamDefs || teamDefs.length === 0) {
      noLock.add(enc.species);
    }
  }
  return noLock;
}

const coloLocks = resolveLocks(coloEnc, 'colo');
const xdLocks = resolveLocks(xdEnc, 'xd');

const coloNoLock = findNoLockSpecies(coloEnc);
const xdNoLock = findNoLockSpecies(xdEnc);

// ─── Generate JS ──────────────────────────────────────────────────────

function lockToJS(lock) {
  if (lock.shadow) {
    return `{ s:${lock.s}, shadow:true, seen:${lock.seen} }`;
  }
  return `{ s:${lock.s}, n:${lock.n}, g:${lock.g}, r:${lock.r} }`;
}

function patternToJS(locks) {
  return '[\n      ' + locks.map(lockToJS).join(',\n      ') + '\n    ]';
}

let out = `/**
 * CXD Shadow Team-Lock Data
 * Auto-generated from PKHeX source files — DO NOT EDIT BY HAND
 *
 * Each lock entry:
 *   Regular NPC mon: { s: species, n: nature, g: gender(0=F,1=M,2=genderless), r: genderRatio }
 *   Shadow (unseen): { s: species, shadow: true, seen: false }
 *   Shadow (seen):   { s: species, shadow: true, seen: true  }
 *
 * FramesConsumed: seen ? 5 : 7
 *   - non-shadow / unseen shadow: fakePID(2) + IV(2) + ability(1) + PID(2) = 7
 *   - seen shadow:                 IV(2) + ability(1) + PID(2) = 5
 *
 * A lock's MatchesLock(pid):
 *   if (shadow) → always true (no nature/gender constraint on shadows)
 *   else → check nature === pid%25  AND  gender matches (pid&0xFF vs ratio)
 *
 * CXD Method sequence from origin seed:
 *   advance → IV1 (15-bit: (state>>16)&0x7FFF)
 *   advance → IV2 (15-bit)
 *   advance → ability (bit 0 of upper 16)
 *   advance → PID_hi (upper 16)
 *   advance → PID_lo (upper 16)
 *   If noShiny and PID is shiny for trainer ID, re-consume PID_hi + PID_lo until not shiny.
 *
 * XD shadows: noShiny is ALWAYS true (no shiny XD shadows).
 * Colo shadows: noShiny is true (anti-shiny rerolling for all shadow mons).
 *
 * For team-lock validation:
 *   The "origin seed" is the state BEFORE IV1 for the shadow Pokémon.
 *   Walk backward (Prev) to check each prior NPC team member's PID.
 *   Locks are ordered first→last (index 0 = first team slot, last = closest to shadow).
 *   Validation processes them in REVERSE (last first, walking backward from shadow seed).
 */

`;

function emitGameLocks(varName, locks, noLockSet) {
  out += `/**\n * Species that have at least one encounter with NO locks ("First"):\n * ${[...noLockSet].sort((a,b)=>a-b).join(', ')}\n */\n`;
  out += `export const ${varName} = {\n`;
  const species = Object.keys(locks).map(Number).sort((a,b) => a - b);
  for (const sp of species) {
    const patterns = locks[sp];
    out += `  ${sp}: [ // ${patterns.length} pattern(s)\n`;
    for (let i = 0; i < patterns.length; i++) {
      out += `    ${patternToJS(patterns[i])}${i < patterns.length - 1 ? ',' : ''}\n`;
    }
    out += `  ],\n`;
  }
  out += `};\n\n`;
}

emitGameLocks('COLO_SHADOW_LOCKS', coloLocks, coloNoLock);
emitGameLocks('XD_SHADOW_LOCKS', xdLocks, xdNoLock);

// Also emit a set of species that have a "no-lock" encounter variant
out += `/** Species in Colo that have at least one lock-free encounter variant */\n`;
out += `export const COLO_NO_LOCK_SPECIES = new Set([${[...coloNoLock].sort((a,b)=>a-b).join(', ')}]);\n\n`;
out += `/** Species in XD that have at least one lock-free encounter variant */\n`;
out += `export const XD_NO_LOCK_SPECIES = new Set([${[...xdNoLock].sort((a,b)=>a-b).join(', ')}]);\n`;

const outPath = path.join(DATA, 'cxdLocks.gen3.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  Colo: ${Object.keys(coloLocks).length} species with locks, ${coloNoLock.size} species lock-free`);
console.log(`  XD:   ${Object.keys(xdLocks).length} species with locks, ${xdNoLock.size} species lock-free`);
