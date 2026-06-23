import assert from 'node:assert/strict';
import { MOVES_MAP } from './moves.gen3.js';

const EXPECTED_GEN3_MOVES = {
  33: { Move: 'Tackle', Accuracy: '95%' },
  126: { Move: 'Fire Blast', Power: 120 },
  141: { Move: 'Leech Life', Power: 20 },
  186: { Move: 'Sweet Kiss', Type: 'Normal' },
  204: { Move: 'Charm', Type: 'Normal' },
  229: { Move: 'Rapid Spin', Power: 20 },
  236: { Move: 'Moonlight', Type: 'Normal' },
  282: { Move: 'Knock Off', Power: 20 },
  343: { Move: 'Covet', Power: 40 },
};

for (const [moveId, expectedFields] of Object.entries(EXPECTED_GEN3_MOVES)) {
  for (const [field, expectedValue] of Object.entries(expectedFields)) {
    assert.equal(
      MOVES_MAP[moveId][field],
      expectedValue,
      `move ${moveId} ${field} should use its Gen 3 value`
    );
  }
}

console.log('All Gen 3 move data tests passed.');
