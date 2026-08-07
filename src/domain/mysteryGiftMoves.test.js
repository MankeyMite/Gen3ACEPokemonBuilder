import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  getCuratedMysteryMovesForSpecies,
  resolveMysteryMoveIds,
} from './mysteryGiftMoves.js';

const eventMovesets = JSON.parse(await readFile(
  new URL('../data/gen3_event_movesets.json', import.meta.url),
  'utf8',
));

const boxMoveset = { moves: eventMovesets['Box Event'] };
const zigzagoonMoves = getCuratedMysteryMovesForSpecies(boxMoveset, 'Zigzagoon');

assert.deepEqual(
  resolveMysteryMoveIds({
    curatedMoves: zigzagoonMoves,
    levelUpMoves: [[33, 1], [45, 1], [39, 5]],
    encounterLevel: 5,
  }),
  [33, 45, 39, 245],
  'Box Event Zigzagoon should keep Extreme Speed as its fourth curated move',
);

assert.deepEqual(
  resolveMysteryMoveIds({
    entryMoves: [1, 2],
    eventMoves: [3, 4],
    curatedMoves: zigzagoonMoves,
    levelUpMoves: [[33, 1]],
    encounterLevel: 5,
  }),
  [1, 2],
  'per-entry moves should remain more specific than event and curated moves',
);

assert.deepEqual(
  resolveMysteryMoveIds({
    levelUpMoves: [[33, 1], [45, 1], [39, 5], [28, 13]],
    encounterLevel: 5,
  }),
  [33, 45, 39],
  'level-up moves should remain the fallback when no event moves are defined',
);

console.log('mystery gift move tests passed');
