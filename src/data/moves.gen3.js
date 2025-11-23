/*
	This module adapts the full JSON `moves.gen3.json` into two exports:
	- `MOVES`: preserves the original array-of-[id,name] shape for backward compatibility
	- `MOVES_MAP`: a lookup object keyed by move id containing the full move fields
*/

// Import moves data. Prefer the JS fallback to avoid JSON import/assert issues in some servers/browsers.
import MOVES_JSON from './moves.gen3.data.js';

// MOVES_JSON is an array where the move id is in the empty-string key `""` (exported CSV header)
const normalizeId = (m) => {
	if (m === null || m === undefined) return m;
	if (typeof m === 'number') return m;
	if (m[''] !== undefined && m[''] !== null && m[''] !== '') return Number(m['']);
	if (m.id !== undefined) return Number(m.id);
	return undefined;
};

export const MOVES = MOVES_JSON.map((m) => [normalizeId(m), m.Move]);

export const MOVES_MAP = MOVES_JSON.reduce((acc, m) => {
	const id = normalizeId(m);
	if (id == null) return acc;
	acc[id] = Object.assign({}, m, { basePP: m.PP });
	return acc;
}, {});

export default { MOVES, MOVES_MAP };
