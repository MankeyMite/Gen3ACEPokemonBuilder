import { getSpeciesLineage } from './encounterAvailability.js';
import { WILD_ENCOUNTERS } from '../data/wildEncounters.gen3.js';

const mergedEncounters = new Map();

/** Put the selected species' locations first, followed by its nearest ancestors. */
export function sortWildOriginLocations(speciesId, gameId, locations) {
  const sources = getWildOriginSpeciesIds(speciesId, gameId);
  const rank = locationId => {
    const index = sources.findIndex(id => WILD_ENCOUNTERS[id][gameId]?.[locationId]);
    return index < 0 ? Infinity : index;
  };
  return [...locations].sort((a, b) => rank(a[0]) - rank(b[0]));
}

/** Wild species in the selected Pokemon's lineage, optionally at a given origin. */
export function getWildOriginSpeciesIds(speciesId, gameId, locationId, metLevel) {
  return getSpeciesLineage(speciesId).filter(id => {
    const games = WILD_ENCOUNTERS[id];
    if (!games) return false;
    if (gameId == null) return true;
    const locations = games[gameId];
    if (!locations) return false;
    if (locationId == null) return true;
    const ranges = locations[locationId];
    if (!ranges) return false;
    return metLevel == null || ranges.some(([lo, hi = lo]) => metLevel >= lo && metLevel <= hi);
  });
}

/** Union of games, locations and capture-level ranges across the entire lineage. */
export function getWildOriginEncounters(speciesId) {
  const id = Number(speciesId);
  if (mergedEncounters.has(id)) return mergedEncounters.get(id);
  const merged = {};
  for (const sourceId of getWildOriginSpeciesIds(id)) {
    for (const [gameId, locations] of Object.entries(WILD_ENCOUNTERS[sourceId])) {
      const game = merged[gameId] ||= {};
      for (const [locationId, ranges] of Object.entries(locations)) {
        (game[locationId] ||= []).push(...ranges.map(([lo, hi = lo]) => [lo, hi]));
      }
    }
  }
  for (const locations of Object.values(merged)) {
    for (const [locationId, ranges] of Object.entries(locations)) {
      const union = [];
      for (const [lo, hi] of ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
        const previous = union.at(-1);
        if (previous && lo <= previous[1] + 1) previous[1] = Math.max(previous[1], hi);
        else union.push([lo, hi]);
      }
      locations[locationId] = union;
    }
  }
  mergedEncounters.set(id, merged);
  return merged;
}
