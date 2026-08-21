import assert from 'node:assert/strict';
import {
  SHINY_CONTROL_KIND,
  SHINY_SID_MODE,
  getDefaultShinySidMode,
  getShinyButtonPresentation,
  getShinyControlPolicy,
} from './shinyControl.js';

assert.equal(getDefaultShinySidMode('hatched'), SHINY_SID_MODE.KEEP);
assert.equal(getDefaultShinySidMode('HATCHED'), SHINY_SID_MODE.KEEP);
assert.equal(getDefaultShinySidMode('wild'), SHINY_SID_MODE.AUTO);
assert.equal(getDefaultShinySidMode('static'), SHINY_SID_MODE.AUTO);
assert.equal(getDefaultShinySidMode('mystery'), SHINY_SID_MODE.AUTO);

assert.equal(getShinyControlPolicy({ encounterMode: 'hatched' }).kind, SHINY_CONTROL_KIND.DIRECT);

assert.equal(getShinyControlPolicy({
  encounterMode: 'mystery',
  eventTag: 'BOX_EVENT',
  event: { shinyLocked: false },
  pidMethod: 'BACD_U',
}).kind, SHINY_CONTROL_KIND.DIRECT, 'Box bonus eggs use the hatcher trainer IDs');

assert.equal(getShinyControlPolicy({
  encounterMode: 'mystery',
  eventTag: 'PCNY_WISH_EGGS',
  event: { usesHatcherTrainerData: true },
  pidMethod: 'METHOD_2',
}).kind, SHINY_CONTROL_KIND.DIRECT, 'hatcher-owned event eggs may adjust SID');

assert.equal(getShinyControlPolicy({
  encounterMode: 'mystery',
  eventTag: 'CHANNEL_JIRACHI',
  event: { shinyLocked: false },
  pidMethod: 'CHANNEL',
}).kind, SHINY_CONTROL_KIND.FINDER, 'fixed-trainer correlated events must use the finder');

assert.deepEqual(getShinyControlPolicy({
  encounterMode: 'mystery',
  event: { shinyLocked: true },
}), {
  kind: SHINY_CONTROL_KIND.LOCKED,
  message: '🔒 This Pokémon cannot be shiny.',
});

assert.equal(getShinyControlPolicy({
  encounterMode: 'mystery',
  event: { shinyLocked: true },
  pidMethod: 'BACD_R_A',
  unlockShinyLock: true,
}).kind, SHINY_CONTROL_KIND.FINDER, 'manual Celebi unlock still requires a legal RNG result');

assert.equal(getShinyControlPolicy({
  encounterMode: 'mystery',
  event: { alwaysShiny: true },
}).kind, SHINY_CONTROL_KIND.ALWAYS);

assert.deepEqual(getShinyButtonPresentation({ isShiny: true }), {
  label: '✨ Already Shiny',
  disabled: true,
  active: true,
});
assert.equal(getShinyButtonPresentation({ isShiny: true, undoActive: true }).label, '✨ Undo Shiny');
assert.equal(getShinyButtonPresentation({ policyKind: SHINY_CONTROL_KIND.FINDER }).label, '✨ Find Shiny');
assert.equal(getShinyButtonPresentation({ policyKind: SHINY_CONTROL_KIND.ALWAYS }).disabled, true);

console.log('shinyControl tests passed');
