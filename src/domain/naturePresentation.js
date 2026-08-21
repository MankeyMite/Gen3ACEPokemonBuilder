const NATURE_STAT_EFFECTS = Object.freeze([
  {}, { up: 'atk', down: 'def' }, { up: 'atk', down: 'spe' }, { up: 'atk', down: 'spa' }, { up: 'atk', down: 'spd' },
  { up: 'def', down: 'atk' }, {}, { up: 'def', down: 'spe' }, { up: 'def', down: 'spa' }, { up: 'def', down: 'spd' },
  { up: 'spe', down: 'atk' }, { up: 'spe', down: 'def' }, {}, { up: 'spe', down: 'spa' }, { up: 'spe', down: 'spd' },
  { up: 'spa', down: 'atk' }, { up: 'spa', down: 'def' }, { up: 'spa', down: 'spe' }, {}, { up: 'spa', down: 'spd' },
  { up: 'spd', down: 'atk' }, { up: 'spd', down: 'def' }, { up: 'spd', down: 'spe' }, { up: 'spd', down: 'spa' }, {},
].map(effect => Object.freeze(effect)));

const NATURE_STAT_LABELS = Object.freeze({
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
});

export function getNatureEffect(natureIndex) {
  const index = Number(natureIndex);
  return NATURE_STAT_EFFECTS[Number.isInteger(index) && index >= 0 && index < 25 ? index : 0];
}

export function formatNatureOption(natureName, natureIndex) {
  const effect = getNatureEffect(natureIndex);
  if (!effect.up || !effect.down) return String(natureName || '');
  return `${natureName} (+${NATURE_STAT_LABELS[effect.up]}, -${NATURE_STAT_LABELS[effect.down]})`;
}

export function getNatureMultiplier(natureIndex, statKey) {
  if (statKey === 'hp') return 1;
  const effect = getNatureEffect(natureIndex);
  if (effect.up === statKey && effect.down !== statKey) return 1.1;
  if (effect.down === statKey && effect.up !== statKey) return 0.9;
  return 1;
}

// At level 100, every 8 EVs are equivalent to one point of base stat in the
// Gen III formula. This keeps the visualization on the same scale as the
// original base-stat bar while making EV and nature effects easy to compare.
export function getAdjustedStatBarValue({ base, ev, natureIndex, statKey }) {
  const safeBase = Math.max(0, Number(base) || 0);
  const safeEv = Math.max(0, Math.min(252, Math.floor(Number(ev) || 0)));
  const evBaseEquivalent = Math.floor(safeEv / 4) / 2;
  return (safeBase + evBaseEquivalent) * getNatureMultiplier(natureIndex, statKey);
}

