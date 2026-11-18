// Stored numeric limits, rather than legality limits, apply to raw imports.
export const IMPORTED_POKEMON_FIELDS = [
  ['species', 'speciesId', 65535], ['item', 'itemId', 65535],
  ['expTotal', 'totalExp', 0xFFFFFFFF], ['tid', 'tid', 65535], ['sid', 'sid', 65535],
  ['language', 'languageId', 255], ['ability', 'abilityBit', 1],
  ['metLocation', 'metLocationId', 255], ['metLevel', 'metLevel', 127],
  ['originGame', 'originGame', 15], ['ball', 'ballId', 15],
  ['friendship', 'friendship', 255],
  ['nickname', 'nickname', 'text'], ['otName', 'otName', 'text'],
  ['isEgg', 'isEgg', 'boolean'],
  ...['Hp', 'Atk', 'Def', 'Spe', 'SpAtk', 'SpDef'].flatMap((suffix, index) => {
    const key = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'][index];
    return [[`iv${suffix}`, `ivs.${key}`, 31], [`ev${suffix}`, `evs.${key}`, 255]];
  }),
  ...['Cool', 'Beauty', 'Cute', 'Smart', 'Tough', 'Sheen'].map(suffix =>
    [`contest${suffix}`, `contest.${suffix.toLowerCase()}`, 255]),
  ...[1, 2, 3, 4].flatMap((slot, index) => [
    [`move${slot}`, `moves.${index}`, 65535], [`pp${slot}`, `pps.${index}`, 3],
  ]),
  ...['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'].map(suffix =>
    [`ribbon${suffix}`, `ribbons.${suffix.toLowerCase()}`, 7]),
  ...['Champion', 'Winning', 'Victory', 'Artist', 'Effort', 'BattleChampion',
    'RegionalChampion', 'NationalChampion', 'Country', 'National', 'Earth', 'World'].map(suffix =>
    [`ribbon${suffix}`, `ribbons.${suffix[0].toLowerCase()}${suffix.slice(1)}`, 'boolean']),
  ['fatefulEncounter', 'ribbons.fatefulEncounter', 'boolean'],
  ...['Circle', 'Triangle', 'Square', 'Heart'].map(suffix =>
    [`mark${suffix}`, `markings.${suffix.toLowerCase()}`, 'boolean']),
];

export function readImportedPokemonFields(getControl) {
  const result = { ivs: {}, evs: {}, contest: {}, moves: [], pps: [], ribbons: {}, markings: {} };
  for (const [id, path, type] of IMPORTED_POKEMON_FIELDS) {
    const control = getControl(id);
    const parts = path.split('.');
    const target = parts.length === 1 ? result : result[parts[0]];
    target[parts.at(-1)] = type === 'boolean' ? Boolean(control?.checked)
      : type === 'text' ? String(control?.value ?? '') : Number(control?.value ?? 0);
  }
  return result;
}

const originalNumberLimits = new WeakMap();

export function resetImportedControl(control) {
  if (!control) return;
  const limits = originalNumberLimits.get(control);
  if (limits) {
    control.min = limits.min;
    control.max = limits.max;
    originalNumberLimits.delete(control);
  }
  for (const option of Array.from(control.options || [])) {
    if (option.dataset.importedValue) option.remove();
  }
  control.clearImportedValues?.();
}

export function setImportedControlValue(control, value, type) {
  if (!control) return;
  if (type === 'boolean') { control.checked = Boolean(value); return; }
  if (control.setImportedValue) {
    control.setImportedValue(value);
  } else {
    if (control.tagName === 'SELECT' && !Array.from(control.options).some(option => option.value === String(value))) {
      const option = control.ownerDocument.createElement('option');
      option.value = String(value);
      option.textContent = `Imported value (${value})`;
      option.dataset.importedValue = 'true';
      control.appendChild(option);
    }
    if (control.type === 'number' && typeof type === 'number') {
      if (!originalNumberLimits.has(control)) originalNumberLimits.set(control, { min: control.min, max: control.max });
      control.min = '0';
      control.max = String(type);
    }
    control.value = String(value);
  }
}
