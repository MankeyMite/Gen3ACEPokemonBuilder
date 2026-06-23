import assert from 'node:assert/strict';
import { BASE_STATS } from './baseStats.gen3.js';

const EXPECTED_GEN3_FIELDS = {
  24: { atk: 85 }, // Arbok
  51: { atk: 80 }, // Dugtrio
  83: { atk: 65 }, // Farfetch'd
  85: { spe: 100 }, // Dodrio
  101: { spe: 140 }, // Electrode
  103: { spd: 65 }, // Exeggutor
  164: { spa: 76 }, // Noctowl
  168: { spd: 60 }, // Ariados
  211: { def: 75 }, // Qwilfish
  219: { hp: 50, spa: 80 }, // Magcargo
  222: { hp: 55, def: 85, spd: 85 }, // Corsola
  226: { hp: 65 }, // Mantine
  305: { spa: 50 }, // Swellow
  310: { spa: 85 }, // Pelipper
  312: { spa: 80, spe: 60 }, // Masquerain
  316: { spe: 70 }, // Delcatty
  348: { hp: 70 }, // Lunatone
  349: { hp: 70 }, // Solrock
  386: { def: 55, spd: 75 }, // Volbeat
  387: { def: 55, spd: 75 }, // Illumise
  411: { hp: 65, def: 70, spd: 80 }, // Chimecho
};

for (const [speciesId, expectedFields] of Object.entries(EXPECTED_GEN3_FIELDS)) {
  for (const [stat, expectedValue] of Object.entries(expectedFields)) {
    assert.equal(
      BASE_STATS[speciesId][stat],
      expectedValue,
      `species ${speciesId} ${stat} should use its Gen 3 value`
    );
  }
}

console.log('All Gen 3 base stat tests passed.');
