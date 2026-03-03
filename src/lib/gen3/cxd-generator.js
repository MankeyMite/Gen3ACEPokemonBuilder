/**
 * CXD (Colosseum / XD: Gale of Darkness) PRNG and shadow-encounter generator.
 *
 * PRNG: seed = (seed * 0x343FD + 0x269EC3) >>> 0   (MSVC LCG, same in both games)
 *
 * Standard CXD Pokémon generation pipeline (from the frame seed):
 *   call 1 → IV1  (r15 → hp[4:0], atk[9:5], def[14:10])
 *   call 2 → IV2  (r15 → spe[4:0], spa[9:5], spd[14:10])
 *   call 3 → Ability (r15 & 1)
 *   call 4 → PID high (u16)
 *   call 5 → PID low  (u16)
 *   — if anti-shiny: reroll PID when (tidXsid ^ pidHi ^ pidLo) < 8
 *
 * Shadow encounters in Colosseum additionally have "lock" sequences that
 * consume RNG calls BEFORE the shadow Pokémon's own frame seed.  Each lock
 * represents a non-shadow party member generated ahead of the shadow.
 *
 * Lock Pokémon pipeline (each):
 *   call 1 → IV1  (consumed, not stored)
 *   call 2 → IV2  (consumed, not stored)
 *   call 3 → Ability (consumed)
 *   call 4 → PID high
 *   call 5 → PID low
 *   — must satisfy gender AND nature constraints; if not, loop calls 4+5 again
 *
 * For single-lock encounters (like Raikou #34) the lock has no constraints
 * (any gender / any nature), so the very first PID always passes → 0 extra
 * rejections for the lock, 5 calls consumed.
 */

/* ══════════════════════════════════════════════════════════
 *  CXD PRNG
 * ══════════════════════════════════════════════════════════ */

const CXD_MULT = 0x343FD;
const CXD_ADD  = 0x269EC3;

/** Advance the CXD PRNG by one step. */
export function cxdNext(seed) {
  return (Math.imul(seed, CXD_MULT) + CXD_ADD) >>> 0;
}

/** Reverse the CXD PRNG by one step. */
export function cxdPrev(seed) {
  // Modular inverse of 0x343FD mod 2^32 is 0xB9B33155
  // Reverse add = (-0x269EC3 * 0xB9B33155) & 0xFFFFFFFF = 0xA170F641
  return (Math.imul(seed, 0xB9B33155) + 0xA170F641) >>> 0;
}

/** Get upper 16 bits. */
function u16(seed) { return seed >>> 16; }

/** Get upper 15 bits (& 0x7FFF). */
function r15(seed) { return (seed >>> 16) & 0x7FFF; }

/* ══════════════════════════════════════════════════════════
 *  Single CXD Pokémon generation (from its frame seed)
 * ══════════════════════════════════════════════════════════ */

/**
 * Generate one CXD Pokémon from `seed` (the frame seed for that Pokémon).
 *
 * @param {number}  seed        – RNG state at the start of this Pokémon's frame
 * @param {boolean} antiShiny   – if true, reroll PID when shiny for given TID/SID
 * @param {number}  tid         – Trainer ID   (only needed when antiShiny = true)
 * @param {number}  sid         – Secret ID    (only needed when antiShiny = true)
 * @returns {{ pid:number, ivs:{hp,atk,def,spa,spd,spe}, ability:number, seedEnd:number }}
 */
export function generateCXDPokemon(seed, antiShiny = false, tid = 0, sid = 0) {
  // IV1
  seed = cxdNext(seed);
  const iv1 = r15(seed);
  const hp  = iv1 & 0x1F;
  const atk = (iv1 >> 5) & 0x1F;
  const def = (iv1 >> 10) & 0x1F;

  // IV2
  seed = cxdNext(seed);
  const iv2 = r15(seed);
  const spe = iv2 & 0x1F;
  const spa = (iv2 >> 5) & 0x1F;
  const spd = (iv2 >> 10) & 0x1F;

  // Ability
  seed = cxdNext(seed);
  const ability = r15(seed) & 1;

  // PID (high then low)
  let pidHi, pidLo, pid;
  const trainerXor = (tid ^ sid) >>> 0;

  do {
    seed = cxdNext(seed);
    pidHi = u16(seed);
    seed = cxdNext(seed);
    pidLo = u16(seed);
    pid = ((pidHi << 16) | pidLo) >>> 0;
  } while (antiShiny && ((pidHi ^ pidLo ^ trainerXor) >>> 0) < 8);

  return {
    pid,
    ivs: { hp, atk, def, spa, spd, spe },
    ability,
    seedEnd: seed
  };
}

/* ══════════════════════════════════════════════════════════
 *  Lock Pokémon generation (non-shadow party member)
 * ══════════════════════════════════════════════════════════ */

/**
 * Generate a lock Pokémon, consuming RNG calls until PID satisfies the lock constraints.
 *
 * @param {number} seed
 * @param {object} lock  – { nature: number|null, gender: number|null, genderRatio: number }
 *                          nature = 0-24 or null (any),
 *                          gender = 0 (female), 1 (male), 2 (genderless), null (any)
 *                          genderRatio = 0 (male-only), 254 (female-only), 255 (genderless),
 *                                        or threshold (e.g. 127 = 50/50)
 * @returns {{ seed: number, pid: number }}
 */
export function generateLockPokemon(seed, lock) {
  // IV1 (consumed)
  seed = cxdNext(seed);
  // IV2 (consumed)
  seed = cxdNext(seed);
  // Ability (consumed)
  seed = cxdNext(seed);

  // PID loop: generate PID high/low, reroll if constraints fail
  let pidHi, pidLo, pid;
  for (let attempts = 0; attempts < 10000; attempts++) {
    seed = cxdNext(seed);
    pidHi = u16(seed);
    seed = cxdNext(seed);
    pidLo = u16(seed);
    pid = ((pidHi << 16) | pidLo) >>> 0;

    // Check nature
    if (lock.nature !== null && lock.nature !== undefined) {
      if (pid % 25 !== lock.nature) continue;
    }

    // Check gender
    if (lock.gender !== null && lock.gender !== undefined && lock.gender < 2) {
      const gByte = pid & 0xFF;
      if (lock.genderRatio === 0 || lock.genderRatio >= 254 || lock.genderRatio === 255) {
        // Fixed gender — no constraint possible, accept
      } else {
        const isFemale = gByte < lock.genderRatio;
        if (lock.gender === 0 && !isFemale) continue;  // wanted female
        if (lock.gender === 1 &&  isFemale) continue;  // wanted male
      }
    }

    // Passed all constraints
    return { seed, pid };
  }

  // Should never reach here for valid encounter data
  return { seed, pid: 0 };
}

/* ══════════════════════════════════════════════════════════
 *  Shadow encounter definitions (Colosseum)
 *
 *  Each encounter has:
 *    species, level, locks[] (applied in order before shadow frame)
 *
 *  Lock constraints:
 *    nature: index 0-24 or null (any)
 *    gender: 0=female, 1=male, 2=genderless, null=any
 *    genderRatio: species gender threshold (127 = 50/50, etc.)
 * ══════════════════════════════════════════════════════════ */

/**
 * Colosseum shadow encounter table.
 * Encounter IDs match PokeFinder / PKHeX numbering.
 * For brevity, only the most commonly used encounters are listed;
 * add more as needed.
 *
 * The `locks` array is processed in order: each lock generates one
 * non-shadow party member from the RNG stream before the shadow itself.
 */
export const COLO_SHADOW_ENCOUNTERS = {
  // ── Ein's Raikou, Shadow encounter 34 ──────────────
  // Ein has 3 other Pokémon before Raikou, but in PokeFinder's model
  // only locks that precede the shadow Pokémon right before its frame
  // are listed.  For Raikou, PokeFinder's encounter data has NO locks
  // (the 3 preceding party members are generated in a separate frame
  // chain that doesn't constrain the shadow's origin seed).
  34: {
    species: 243,  // Raikou
    level: 40,
    locks: []      // no lock constraints for the shadow Pokémon itself
  },

  // ── Entei, Shadow encounter 33 ─────────────────────
  33: {
    species: 244,  // Entei
    level: 40,
    locks: []
  },

  // ── Suicune, Shadow encounter 32 ───────────────────
  32: {
    species: 245,  // Suicune
    level: 40,
    locks: []
  }
};

/* ══════════════════════════════════════════════════════════
 *  Shadow encounter generator
 * ══════════════════════════════════════════════════════════ */

/**
 * Generate a shadow CXD Pokémon for a given origin seed.
 *
 * @param {number} seed0         – Origin seed (start of the encounter's RNG chain)
 * @param {number} encounterId   – Encounter ID (key in COLO_SHADOW_ENCOUNTERS)
 * @param {object} [trainerInfo] – { tid, sid } for anti-shiny logic (Colosseum shadows
 *                                  are NOT anti-shiny locked, so this is optional)
 * @returns {{ pid, ivs, ability, seedEnd, advancesUsed }}
 */
export function generateShadowCXD(seed0, encounterId, trainerInfo = {}) {
  const encounter = COLO_SHADOW_ENCOUNTERS[encounterId];
  if (!encounter) throw new Error(`Unknown CXD shadow encounter: ${encounterId}`);

  let seed = seed0 >>> 0;
  let advances = 0;

  // Process lock sequence (non-shadow party members)
  for (const lock of encounter.locks) {
    const before = seed;
    const result = generateLockPokemon(seed, lock);
    seed = result.seed;

    // Count advances consumed by this lock
    let tmp = before;
    let cnt = 0;
    while ((tmp >>> 0) !== (seed >>> 0)) { tmp = cxdNext(tmp); cnt++; }
    advances += cnt;
  }

  // Generate the shadow Pokémon itself
  const pokemon = generateCXDPokemon(seed, false);  // Colosseum shadows are NOT anti-shiny
  let tmp = seed;
  let cnt = 0;
  while ((tmp >>> 0) !== (pokemon.seedEnd >>> 0)) { tmp = cxdNext(tmp); cnt++; }
  advances += cnt;

  return {
    pid: pokemon.pid,
    ivs: pokemon.ivs,
    ability: pokemon.ability,
    seedEnd: pokemon.seedEnd,
    advancesUsed: advances
  };
}

/* ══════════════════════════════════════════════════════════
 *  Utility: check if a species is a CXD shadow legendary
 * ══════════════════════════════════════════════════════════ */

/** Map species → encounter ID for quick lookup */
export const CXD_SPECIES_ENCOUNTER = {};
for (const [id, enc] of Object.entries(COLO_SHADOW_ENCOUNTERS)) {
  CXD_SPECIES_ENCOUNTER[enc.species] = Number(id);
}

/**
 * Get the CXD encounter ID for a species, or null if not a CXD shadow.
 */
export function getCXDEncounterId(speciesId) {
  return CXD_SPECIES_ENCOUNTER[speciesId] ?? null;
}
