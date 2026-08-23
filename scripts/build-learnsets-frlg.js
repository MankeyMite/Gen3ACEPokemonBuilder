#!/usr/bin/env node
/**
 * Generate per-game level-up overrides relative to the Emerald-based
 * LEARNSETS table.
 *
 * Inputs:
 *   src/data/level_up_learnsets RS.h    (pret/pokeruby)
 *     https://github.com/pret/pokeruby/blob/master/src/data/pokemon/level_up_learnsets.h
 *   src/data/level_up_learnsets FRLG.h  (pret/pokefirered)
 *     https://github.com/pret/pokefirered/blob/master/src/data/pokemon/level_up_learnsets.h
 *
 * Outputs:
 *   src/data/learnsets.rs.js
 *   src/data/learnsets.frlg.js
 *
 * FireRed and LeafGreen are parsed independently. This is required for their
 * Attack-form and Defense-form Deoxys learnsets and also handles conditionals
 * embedded inside another species' learnset (such as Dugtrio).
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');

function displayToMoveConst(name) {
  return 'MOVE_' + name.toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function displayToSpeciesConst(name) {
  return 'SPECIES_' + name
    .replace(/♀/g, '_F')
    .replace(/♂/g, '_M')
    .replace(/'/g, '')
    .replace(/\.\s*/g, '_')
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function displayToPascalKey(name) {
  return name
    .replace(/♀/g, 'F')
    .replace(/♂/g, 'M')
    .replace(/[^A-Za-z0-9]/g, '')
    .toLowerCase();
}

const moveSource = fs.readFileSync(path.join(DATA, 'moves.gen3.data.js'), 'utf8');
const moveRows = JSON.parse(moveSource.slice(moveSource.indexOf('['), moveSource.lastIndexOf(']') + 1));
const moveConstToId = {};
for (const move of moveRows) {
  const moveId = Number(move[''] ?? move.id);
  if (moveId && move.Move) moveConstToId[displayToMoveConst(move.Move)] = moveId;
}
const moveAliases = {
  MOVE_FAINT_ATTACK: moveConstToId.MOVE_FEINT_ATTACK,
  MOVE_VICE_GRIP: moveConstToId.MOVE_VISE_GRIP,
  MOVE_HI_JUMP_KICK: moveConstToId.MOVE_HIGH_JUMP_KICK,
  MOVE_SMELLING_SALT: moveConstToId.MOVE_SMELLING_SALTS,
};
for (const [name, moveId] of Object.entries(moveAliases)) {
  if (moveId && !moveConstToId[name]) moveConstToId[name] = moveId;
}

const speciesSource = fs.readFileSync(path.join(DATA, 'species.gen3.js'), 'utf8');
const speciesById = {};
const speciesConstToId = {};
const pascalKeyToId = {};
const speciesPattern = /\[\s*(\d+)\s*,\s*"([^"]+)"\s*\]/g;
let speciesMatch;
while ((speciesMatch = speciesPattern.exec(speciesSource)) !== null) {
  const speciesId = Number(speciesMatch[1]);
  const name = speciesMatch[2];
  if (name === '?' || name === '??????????' || name === 'Pokémon Egg') continue;
  speciesById[speciesId] = name;
  const speciesConst = displayToSpeciesConst(name);
  const pascalKey = displayToPascalKey(name);
  if (!speciesConstToId[speciesConst]) speciesConstToId[speciesConst] = speciesId;
  if (!pascalKeyToId[pascalKey]) pascalKeyToId[pascalKey] = speciesId;
}

const preEvolutionBySpecies = {};
const evolutionSource = fs.readFileSync(path.join(DATA, 'evolution.h'), 'utf8');
const evolutionEntryPattern = /\[SPECIES_([A-Z0-9_]+)\]\s*=\s*\{((?:\{[^}]*\},?\s*)+)\}/g;
let evolutionMatch;
while ((evolutionMatch = evolutionEntryPattern.exec(evolutionSource)) !== null) {
  const parentId = speciesConstToId[`SPECIES_${evolutionMatch[1]}`];
  if (!parentId) continue;
  const childPattern = /SPECIES_([A-Z0-9_]+)/g;
  let childMatch;
  while ((childMatch = childPattern.exec(evolutionMatch[2])) !== null) {
    const childId = speciesConstToId[`SPECIES_${childMatch[1]}`];
    if (childId && childId !== parentId) preEvolutionBySpecies[childId] = parentId;
  }
}

function getPreEvolutionChain(speciesId) {
  const chain = [];
  const seen = new Set();
  let current = preEvolutionBySpecies[speciesId];
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.unshift(current);
    current = preEvolutionBySpecies[current];
  }
  return chain;
}

function parseMoveBlock(body, sourceLabel) {
  const moves = [];
  const movePattern = /LEVEL_UP_MOVE\(\s*(\d+)\s*,\s*MOVE_([A-Z0-9_]+)\s*\)/g;
  let moveMatch;
  while ((moveMatch = movePattern.exec(body)) !== null) {
    const moveConst = `MOVE_${moveMatch[2]}`;
    const moveId = moveConstToId[moveConst];
    if (!moveId) throw new Error(`[${sourceLabel}] Unknown move: ${moveConst}`);
    moves.push([moveId, Number(moveMatch[1])]);
  }
  return moves;
}

function parseLevelUpSource(source, sourceLabel) {
  const learnsets = {};
  // pokeemerald/pokefirered use sName; pokeruby uses gName.
  const blockPattern = /(?:static\s+)?const\s+u16\s+[gs](\w+)LevelUpLearnset\[\]\s*=\s*\{([^}]+)\}/g;
  let blockMatch;
  while ((blockMatch = blockPattern.exec(source)) !== null) {
    const speciesId = pascalKeyToId[blockMatch[1].toLowerCase()];
    if (!speciesId) {
      if (!/^Species\d+$/.test(blockMatch[1])) {
        console.warn(`[${sourceLabel}] Unknown species: ${blockMatch[1]}`);
      }
      continue;
    }
    learnsets[speciesId] = parseMoveBlock(blockMatch[2], sourceLabel);
  }
  return learnsets;
}

function selectFrlgGame(source, game) {
  return source.replace(
    /#if\s+defined\(FIRERED\)([\s\S]*?)#elif\s+defined\(LEAFGREEN\)([\s\S]*?)#endif/g,
    (_match, fireRedBody, leafGreenBody) => game === 'firered' ? fireRedBody : leafGreenBody,
  );
}

function mergePreEvolutionMoves(learnsets) {
  for (const speciesId of Object.keys(learnsets).map(Number)) {
    for (const preEvolutionId of getPreEvolutionChain(speciesId)) {
      for (const move of learnsets[preEvolutionId] || []) learnsets[speciesId].push(move);
    }
  }
}

function normalizeMoves(moves) {
  const earliestLevelByMove = new Map();
  for (const [moveId, level] of moves || []) {
    if (!earliestLevelByMove.has(moveId) || level < earliestLevelByMove.get(moveId)) {
      earliestLevelByMove.set(moveId, level);
    }
  }
  return [...earliestLevelByMove.entries()]
    .map(([moveId, level]) => [moveId, level])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function movesEqual(left, right) {
  return left.length === right.length && left.every((move, index) =>
    move[0] === right[index][0] && move[1] === right[index][1]
  );
}

const emeraldGeneratedSource = fs.readFileSync(path.join(DATA, 'learnsets.gen3.js'), 'utf8');
const emeraldLearnsets = {};
const emeraldEntryPattern = /^\s*(\d+):\s*\{l:\[(.+?)\],e:/gm;
let emeraldMatch;
while ((emeraldMatch = emeraldEntryPattern.exec(emeraldGeneratedSource)) !== null) {
  const moves = [];
  const pairPattern = /\[(\d+),(\d+)\]/g;
  let pairMatch;
  while ((pairMatch = pairPattern.exec(emeraldMatch[2])) !== null) {
    moves.push([Number(pairMatch[1]), Number(pairMatch[2])]);
  }
  emeraldLearnsets[Number(emeraldMatch[1])] = moves;
}

const rsSource = fs.readFileSync(path.join(DATA, 'level_up_learnsets RS.h'), 'utf8');
const frlgSource = fs.readFileSync(path.join(DATA, 'level_up_learnsets FRLG.h'), 'utf8');
const rsLearnsets = parseLevelUpSource(rsSource, 'ruby-sapphire');
const fireRedLearnsets = parseLevelUpSource(selectFrlgGame(frlgSource, 'firered'), 'firered');
const leafGreenLearnsets = parseLevelUpSource(selectFrlgGame(frlgSource, 'leafgreen'), 'leafgreen');
mergePreEvolutionMoves(rsLearnsets);
mergePreEvolutionMoves(fireRedLearnsets);
mergePreEvolutionMoves(leafGreenLearnsets);

function getOverrides(learnsets, gameLabel) {
  const overrides = {};
  for (const [speciesIdText, moves] of Object.entries(learnsets)) {
    const speciesId = Number(speciesIdText);
    const normalized = normalizeMoves(moves);
    const emerald = normalizeMoves(emeraldLearnsets[speciesId] || []);
    if (!movesEqual(normalized, emerald)) overrides[speciesId] = normalized;
  }
  console.log(`${gameLabel}: ${Object.keys(overrides).length} overrides`);
  return overrides;
}

function formatMoves(moves) {
  return moves.map(([moveId, level]) => `[${moveId},${level}]`).join(',');
}

function writeOverrides(fileName, exports) {
  const lines = [
    '// Auto-generated by scripts/build-learnsets-frlg.js - DO NOT EDIT',
    '// Game-specific level-up overrides that differ from Emerald.',
    '// Pre-evolution moves are merged for move-selection legality.',
    '',
  ];
  for (const [exportName, overrides] of exports) {
    lines.push(`export const ${exportName} = {`);
    for (const speciesId of Object.keys(overrides).map(Number).sort((a, b) => a - b)) {
      lines.push(`  ${speciesId}: [${formatMoves(overrides[speciesId])}], // ${speciesById[speciesId] || '???'}`);
    }
    lines.push('};', '');
  }
  const outputPath = path.join(DATA, fileName);
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`Generated ${outputPath}`);
}

writeOverrides('learnsets.rs.js', [
  ['LEARNSETS_RS', getOverrides(rsLearnsets, 'Ruby/Sapphire')],
]);
writeOverrides('learnsets.frlg.js', [
  ['LEARNSETS_FIRE_RED', getOverrides(fireRedLearnsets, 'FireRed')],
  ['LEARNSETS_LEAF_GREEN', getOverrides(leafGreenLearnsets, 'LeafGreen')],
]);
