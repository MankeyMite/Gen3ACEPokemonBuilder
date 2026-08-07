import EXP_GROUPS from '../data/expGroups.gen3.js';
import { getSpeciesAbilities } from '../data/pokemonAbilities.gen3.js';
import { getAbilityName } from '../data/abilities.gen3.js';
import { GROUP, expForLevel, levelForExp } from '../lib/exp.js';

export function resolveImportedProgression({ speciesId, totalExp, level } = {}) {
  const group = EXP_GROUPS[Number(speciesId)] ?? GROUP.MEDIUM_FAST;
  const hasExactExp = totalExp !== null
    && totalExp !== undefined
    && String(totalExp).trim() !== ''
    && Number.isFinite(Number(totalExp));

  if (hasExactExp) {
    const exactExp = Math.max(0, Math.floor(Number(totalExp)));
    return {
      level: levelForExp(group, exactExp),
      totalExp: exactExp,
      group,
    };
  }

  // Showdown assumes level 100 when the Level line is omitted.
  const hasLevel = level !== null
    && level !== undefined
    && String(level).trim() !== ''
    && Number.isFinite(Number(level));
  const importedLevel = hasLevel
    ? Math.max(1, Math.min(100, Math.floor(Number(level))))
    : 100;
  return {
    level: importedLevel,
    totalExp: expForLevel(group, importedLevel),
    group,
  };
}

function normalizeAbilityName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveShowdownAbilitySlot(speciesId, abilityName) {
  const abilities = getSpeciesAbilities(Number(speciesId));
  if (!abilities) return 0;

  const [ability0Id, ability1Id] = abilities;
  const requested = normalizeAbilityName(abilityName);
  const ability0 = normalizeAbilityName(getAbilityName(ability0Id));
  const ability1 = normalizeAbilityName(getAbilityName(ability1Id));

  if (ability0Id !== ability1Id && requested && requested === ability1) return 1;
  if (!requested || requested === ability0 || requested === ability1) return 0;

  // A modern ability that does not exist for this species in Gen 3 cannot be
  // represented; retain the legal first Gen 3 ability slot.
  return 0;
}
