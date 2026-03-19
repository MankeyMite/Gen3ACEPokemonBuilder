// IV input selectors (used for visibility and clamping)
const ivIds = ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'];
import { NATURES, LANGUAGES } from './lib/gen3/constants.js';
import { SPECIES } from './data/species.gen3.js';
import { ITEMS } from './data/items.gen3.js';
import { MOVES } from './data/moves.gen3.js';
import { BALLS } from './data/balls.gen3.js';
import { LOCATIONS } from './data/locations.gen3.js';
import { PID_PRESETS } from './data/pid_presets.gen3.js';
import { STATIC_ENCOUNTERS, isLegendary, isBreedable, isGiftPokemon, STATIC_CATEGORIES, STATIC_ENCOUNTER_LIST, STATIC_SPECIES_SET, getEncountersByCategory, getSpeciesForCategory, getEncountersForSpeciesGame, getEncounterForSpecies } from './data/staticEncounters.gen3.js';
import { getLegendaryPreset, isColosseumXDLegendary } from './data/legendaryPresets.gen3.js';
import { buildPokemonBytes, toHexString, toFormattedHex, toBase64Emerald, coreSource, parsePokemonBytes, buildDecryptedPokemonFile } from './lib/gen3/builder.js';
import { GROUP, expForLevel, levelForExp } from './lib/exp.js';
import EXP_GROUPS from './data/expGroups.gen3.js';
import { ABILITIES, getAbilityName } from './data/abilities.gen3.js';
import { hasDualAbilities, getSpeciesAbilities } from './data/pokemonAbilities.gen3.js';
import { LEARNSETS } from './data/learnsets.gen3.js';
import { WILD_ENCOUNTERS } from './data/wildEncounters.gen3.js';
import { ENCOUNTER_SLOTS } from './data/encounterSlots.gen3.js';
import { buildWildWithEvolutions, getWildAncestor, PRE_EVOLUTIONS } from './data/evolutions.gen3.js';
import { PROFANITY_LIST } from './data/profanity.gen3.js';
import { createProfanityFilter } from './lib/profanityFilter.js';
import { CXD_SHADOW_ENCOUNTERS, CXD_SHADOW_SPECIES, getShadowEncountersForSpecies, isValidGCTidSid } from './data/shadowEncounters.gen3.js';
import { COLO_SHADOW_LOCKS, XD_SHADOW_LOCKS, COLO_NO_LOCK_SPECIES, XD_NO_LOCK_SPECIES } from './data/cxdLocks.gen3.js';
import { getSpritePath, getUnownFormIndex, getUnownFormChar, getUnownFormSuffix, getUnownSpritePath, getOnlineSpriteUrl, getOnlineUnownSpriteUrl, UNOWN_FORMS, TANOBY_FORMS_BY_LOCATION, getTanobyFormsForLocation, getTanobyLocationsForForm } from './data/nationalDex.gen3.js';

const $ = sel => document.querySelector(sel);

// Set of species IDs that can appear in wild mode (wild + their evolutions)
const wildPlusEvos = buildWildWithEvolutions(WILD_ENCOUNTERS);

// Global variables for encounter mode and species filtering
let speciesAutocomplete = null;
// Mystery gift containers (declared early so functions can reference them)
let MYSTERY_EVENTS = {};
let MYSTERY_GIFTS = {};
// Movesets loaded from external file, mapped by internal tag when possible
let MYSTERY_MOVESETS = {};

// Move autocomplete wrappers (set after init)
let moveAutocompletes = [null, null, null, null];

// Callback populated by boot() for applying imported data with access to boot()-scoped helpers
let _postImportUpdate = null;

// Ensure a safe no-op exists early so callers from earlier code don't throw
function updateMysterySpeciesOptions(/*tag*/) { return; }

    // Apply event-level defaults (TID/SID, OT name per language, shiny lock, origin, met location/level, ball, fateful flag, default PID)
    function applyEventDefaults(tag) {
      if (!tag) return;
      const evt = MYSTERY_EVENTS[tag];
      console.log('applyEventDefaults for', tag, evt);
      if (!evt) return;

        // If there is no event-level metadata but there are per-pokemon entries
        // for this tag, apply sensible defaults from the first entry so the
        // UI updates immediately. Also attempt to reload mystery data in the
        // background to populate `MYSTERY_EVENTS` for future selections.
        if (!evt && MYSTERY_GIFTS[tag] && MYSTERY_GIFTS[tag].length) {
          const first = MYSTERY_GIFTS[tag][0];
          if (first.fixedTID !== undefined) $('#tid').value = String(first.fixedTID);
          if (first.fixedSID !== undefined) $('#sid').value = String(first.fixedSID);
          if (first.ot_name) $('#otName').value = first.ot_name;
          if (first.ot_gender) $('#otGender').value = String(first.ot_gender).toLowerCase();
          if (first.pid) {
            const pidEl = $('#pid'); if (pidEl) pidEl.value = String(first.pid);
          }
          if (first.ivs && first.ivs.length >= 6) {
            $('#ivHp').value = String(first.ivs[0]||0);
            $('#ivAtk').value = String(first.ivs[1]||0);
            $('#ivDef').value = String(first.ivs[2]||0);
            $('#ivSpe').value = String(first.ivs[3]||0);
            $('#ivSpAtk').value = String(first.ivs[4]||0);
            $('#ivSpDef').value = String(first.ivs[5]||0);
          }
          // Try to refresh full events metadata in background
          try { loadMysteryGifts(); } catch (e) {}
          return;
        }

      // TID / SID
      if (evt.fixedTID !== undefined) $('#tid').value = String(evt.fixedTID);
      if (evt.fixedSID !== undefined) $('#sid').value = String(evt.fixedSID);

      // OT name: prefer English language mapping (id "2") if available,
      // set the UI language to English so the OT mapping behaves predictably.
      const preferredLangId = '2';
      try {
        const langEl = $('#language');
        if (langEl) {
          // Set language to English for event defaults (user can change it afterwards)
          langEl.value = preferredLangId;
          langEl.dispatchEvent(new Event('change'));
        }
      } catch (e) {}

      if (evt.ot_names && evt.ot_names[preferredLangId]) {
        $('#otName').value = evt.ot_names[preferredLangId];
      } else if (evt.ot_names && evt.ot_names[String($('#language')?.value || preferredLangId)]) {
        $('#otName').value = evt.ot_names[String($('#language')?.value || preferredLangId)];
      } else if (evt.ot_name) {
        $('#otName').value = evt.ot_name;
      }

      // OT gender if provided
      if (evt.ot_gender !== undefined) {
        const og = $('#otGender'); if (og) og.value = String(evt.ot_gender).toLowerCase();
      }

      // Disable Pokémon gender selection for mystery gifts to prevent
      // user changes (mystery events define fixed genders via presets).
      try {
        const genderEl = $('#gender');
        if (genderEl) {
          genderEl.disabled = (!manualOverrideActive && currentEncounterMode === 'mystery');
        }
      } catch (e) {}

      // Shiny lock
      const shinyCheckbox = $('#shiny');
      if (shinyCheckbox) {
        if (evt.shinyLocked) {
          shinyCheckbox.checked = false;
          shinyCheckbox.disabled = true;
        } else {
          shinyCheckbox.disabled = false;
        }
      }

      // Origin game
      if (evt.defaultOriginGame !== undefined) {
        const originGameSelect = $('#originGame');
        if (originGameSelect) {
          originGameSelect.value = String(evt.defaultOriginGame);
          // Update metLocation options for that game
          if (metLocationWrapper && metLocationWrapper.updateList) {
            try {
              metLocationWrapper.updateList(getLocationsForGame(evt.defaultOriginGame));
            } catch (e) {}
          }
        }
      }

      // Met location
      if (evt.defaultMetLocationId !== undefined) {
        const sel = $('#metLocation'); if (sel) sel.value = String(evt.defaultMetLocationId);
      } else if (evt.defaultMetLocation) {
        const sel = $('#metLocation');
        if (sel) {
          try {
            const candidates = getLocationsForGame(Number($('#originGame')?.value) || evt.defaultOriginGame || 2);
            const found = candidates.find(loc => loc[1] && loc[1].toLowerCase().includes(evt.defaultMetLocation.toLowerCase()));
            if (found) sel.value = String(found[0]);
            else {
              const allFound = LOCATIONS.find(loc => loc[1] && loc[1].toLowerCase().includes(evt.defaultMetLocation.toLowerCase()));
              if (allFound) sel.value = String(allFound[0]);
            }
          } catch (e) {}
        }
      }

      // Met level
      if (evt.defaultMetLevel !== undefined) {
        const ml = $('#metLevel'); if (ml) ml.value = String(evt.defaultMetLevel);
        const levelEl = $('#level'); if (levelEl) {
          let newLevel = (evt.current_level !== undefined) ? evt.current_level : evt.defaultMetLevel;
          try {
            const tU = String(tag).toUpperCase();
            if (tU === '10ANNI') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'AURA_MEW') {
              newLevel = Math.max(10, Number(newLevel));
            } else if (tU === 'BOX_EVENT') {
              newLevel = Math.max(5, Number(newLevel));
            } else if (tU === 'DOEL_DEOXYS') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'JOURNEY_ACROSS_AMERICA') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'PARTY_OF_THE_DECADE') {
              newLevel = Math.max(70, Number(newLevel));
            } else if (tU === 'POKEMON_ROCKS_METANG') {
              newLevel = Math.max(30, Number(newLevel));
            } else if (tU === 'WISHMKR_BEST' || tU === 'WISHMKR_SHINY') {
              newLevel = Math.max(5, Number(newLevel));
            } else if (tU === 'CHANNEL_JIRACHI') {
              newLevel = Math.max(5, Number(newLevel));
            }
          } catch (e) {}
          levelEl.value = String(newLevel);
        }
        // Compute total EXP for the set level (inline to avoid scope issues)
        try {
          const sid_local = Number($('#species')?.value || 0);
          const group_local = EXP_GROUPS[sid_local] ?? GROUP.MEDIUM_FAST;
          const lvl_local = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
          const exp_local = expForLevel(group_local, lvl_local);
          const expEl_local = document.querySelector('#expTotal');
          if (expEl_local) expEl_local.value = String(exp_local);
        } catch (e) {}
      }

      // Ball - try to match by option text
      if (evt.defaultBall) {
        const ballSel = $('#ball');
        if (ballSel) {
          const opts = ballSel.options && typeof ballSel.options[Symbol.iterator] === 'function' ? Array.from(ballSel.options) : Array.from(ballSel.querySelectorAll ? ballSel.querySelectorAll('option') : []);
          const opt = opts.find(o => (o.text || o.textContent || '').toLowerCase() === String(evt.defaultBall).toLowerCase());
          if (opt) ballSel.value = opt.value;
        }
      }

      // Fateful encounter flag
      if (evt.defaultFatefulEncounter !== undefined) {
        const f = $('#fatefulEncounter');
        if (f) {
          // Special-case: 10ANNI event should keep met location but NOT check the fateful box
          if (String(tag).toUpperCase() === '10ANNI') {
            f.checked = false;
          } else {
            f.checked = Boolean(evt.defaultFatefulEncounter);
          }
        }
      }

      // If event requires fateful encounter, ensure met location is set to a "Fateful" entry
      if (evt.defaultFatefulEncounter) {
        try {
          const sel = $('#metLocation');
          if (sel) {
            // Determine candidate locations for current origin game
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            // Look for any location whose name contains 'fateful' (case-insensitive)
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
        } catch (e) {}
      }

      // Special-case: JOURNEY_ACROSS_AMERICA should set metLocation to a
      // Fateful entry but NOT check the fatefulEncounter checkbox.
      try {
        if (String(tag).toUpperCase() === 'JOURNEY_ACROSS_AMERICA') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // PARTY_OF_THE_DECADE: set met location to a Fateful entry but do not
      // check the fatefulEncounter checkbox (event metadata requests Fateful
      // location but the encounter is not flagged fateful in UI).
      try {
        if (String(tag).toUpperCase() === 'PARTY_OF_THE_DECADE') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // PARTY_OF_THE_DECADE: restrict language selection to English only
      try {
        if (String(tag).toUpperCase() === 'PARTY_OF_THE_DECADE') {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}

      // Default PID
      if (evt.defaultPID) {
        const pidEl = $('#pid'); if (pidEl) pidEl.value = String(evt.defaultPID);
      }

      // WISHMKR_BEST: this version of the event does not allow shinies.
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_BEST') {
          const shinyCheckbox = $('#shiny');
          if (shinyCheckbox) {
            shinyCheckbox.checked = false;
            shinyCheckbox.disabled = true;
          }
        }
      } catch (e) {}

      // WISHMKR_BEST: set metLocation to a Fateful entry but do NOT check the fatefulEncounter box
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_BEST') {
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;
        }
      } catch (e) {}

      // Special-case language restrictions for certain events (e.g., 10ANNI disables Japanese)
      try {
        if (String(tag).toUpperCase() === '10ANNI') {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              if (String(o.value) === '1') o.disabled = true; // disable Japanese
            }
            if (String(langSel.value) === '1') {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // Aura Mew: force nickname to MEW, OT to 'Aura' for allowed languages,
      // and restrict selectable languages to EN/FR/IT/DE/ES.
      try {
        if (String(tag).toUpperCase() === 'AURA_MEW') {
          const nickEl = $('#nickname'); if (nickEl) nickEl.value = 'MEW';

          const allowed = new Set(['2','3','4','5','7']); // EN, FR, IT, DE, ES
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = !allowed.has(String(o.value));
            }
            if (!allowed.has(String(langSel.value))) {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            } else {
              // ensure OT name is explicitly set
              const ot = $('#otName'); if (ot) ot.value = 'Aura';
              try { updateLegalityStatus(); } catch (e) {}
            }
          }

          // Ensure TID is set for Aura Mew
          try { const tidEl = $('#tid'); if (tidEl) tidEl.value = '20078'; } catch (e) {}

          // Ensure event metadata lists Aura as the OT for allowed languages
          evt.ot_names = evt.ot_names || {};
          for (const v of Array.from(allowed)) evt.ot_names[String(v)] = 'Aura';
        }
      } catch (e) {}

          // JOURNEY_ACROSS_AMERICA: restrict language to English only
          try {
            if (String(tag).toUpperCase() === 'JOURNEY_ACROSS_AMERICA') {
              const langSel = $('#language');
              if (langSel && langSel.options) {
                for (const o of Array.from(langSel.options)) {
                  o.disabled = String(o.value) !== '2';
                }
                langSel.value = '2';
                try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
              }
            }
          } catch (e) {}

      // Populate mystery species options if event-level species list exists
      updateMysterySpeciesOptions(tag);

      // Trigger UI recalculations / derived updates
      try {
        updateGenderFromPID();
      } catch (e) {}

      // POKEMON_ROCKS_METANG: ensure National ribbon is checked
      try {
        if (String(tag).toUpperCase() === 'POKEMON_ROCKS_METANG') {
          const national = $('#ribbonNational');
          if (national) {
            national.checked = true;
          }
        }
      } catch (e) {}

      // Force English-only languages for specific events where only English
      // game versions are supported in this dataset.
      try {
        const englishOnly = ['POKEMON_ROCKS_METANG','WISHMKR_BEST','WISHMKR_SHINY','DOEL_DEOXYS','CHANNEL_JIRACHI'];
        if (englishOnly.includes(String(tag).toUpperCase())) {
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}

      // WISHMKR_SHINY: set metLocation to a Fateful entry (but do NOT check
      // the fatefulEncounter box) and restrict available natures to the
      // specific set provided in the JSON for this event so only those 9
      // preset PIDs are selectable.
      try {
        if (String(tag).toUpperCase() === 'WISHMKR_SHINY') {
          // set met location to a Fateful entry
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || evt.defaultOriginGame || 2;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;

          // Restrict nature choices to those present in the mystery JSON for this tag
          try {
            const allowed = new Set();
            const entries = MYSTERY_GIFTS[tag] || [];
            for (const e of entries) {
              if (!e) continue;
              const n = e.nature;
              if (n === undefined || n === null) continue;
              // numeric index
              if (!isNaN(Number(n))) {
                allowed.add(Number(n));
                continue;
              }
              // string name -> find index in NATURES (case-insensitive, canonical)
              const target = String(n).toLowerCase().replace(/[^a-z]/g,'');
              for (let i = 0; i < NATURES.length; i++) {
                const canon = String(NATURES[i] || '').toLowerCase().replace(/[^a-z]/g,'');
                if (canon && canon === target) { allowed.add(i); break; }
              }
            }
            const natSel = $('#nature');
            if (natSel && natSel.options) {
              // If no allowed natures found, leave options alone
              if (allowed.size) {
                for (const o of Array.from(natSel.options)) {
                  // option values are indices as strings
                  const val = Number(o.value);
                  // Keep placeholder (empty) enabled
                  if (o.value === '') { o.disabled = false; continue; }
                  o.disabled = !allowed.has(val);
                }
                // If current selection not allowed, pick first allowed
                const cur = Number(natSel.value || -1);
                if (!allowed.has(cur)) {
                  const first = Array.from(allowed)[0];
                  if (first !== undefined) {
                    natSel.value = String(first);
                    try { natSel.dispatchEvent(new Event('change')); } catch (e) {}
                  }
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
      // ── CHANNEL_JIRACHI special handling ──────────────────────────
      try {
        if (String(tag).toUpperCase() === 'CHANNEL_JIRACHI') {
          // Channel Jirachi uses XDRNG-based PID — not pre-computed.
          // Disable the simple shiny checkbox (shiny only via Find Legal PID).
          const shinyCheckbox = $('#shiny');
          if (shinyCheckbox) {
            shinyCheckbox.checked = false;
            shinyCheckbox.disabled = true;
          }

          // SID is determined by the Channel RNG — clear it for now.
          // The user will get it from Find Legal PID.
          const sidEl = $('#sid');
          if (sidEl) sidEl.value = '0';

          // Force language to English (Channel Jirachi is English-only)
          const langSel = $('#language');
          if (langSel && langSel.options) {
            for (const o of Array.from(langSel.options)) {
              o.disabled = String(o.value) !== '2';
            }
            langSel.value = '2';
            try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
          }

          // set met location to Fateful entry if present
          const sel = $('#metLocation');
          if (sel) {
            const originGameId = Number($('#originGame')?.value) || 1;
            const candidates = getLocationsForGame(originGameId);
            const found = candidates.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'))
                          || LOCATIONS.find(loc => String(loc[1] || '').toLowerCase().includes('fateful'));
            if (found) sel.value = String(found[0]);
          }
          const f = $('#fatefulEncounter'); if (f) f.checked = false;

          // Show PID Finder row and Make Shiny row for Channel Jirachi
          const pfRow = document.getElementById('pidFinderRow');
          if (pfRow) pfRow.style.display = 'flex';
          // Hide simple shiny row (replaced by Make Shiny btn)
          try {
            const shinyExtRows = document.querySelectorAll('.shiny-external');
            for (const r of shinyExtRows) r.style.display = 'none';
          } catch (e) {}

          // All natures should be available
          const natSel = $('#nature');
          if (natSel && natSel.options) {
            for (const o of Array.from(natSel.options)) o.disabled = false;
          }

          // Moves: Wish, Confusion, Rest
          try {
            const channelMoves = [273, 93, 156];
            for (let i = 0; i < 4; i++) {
              const el = $(`#move${i+1}`);
              if (!el) continue;
              el.value = i < channelMoves.length ? String(channelMoves[i]) : '';
              try { el.dispatchEvent(new Event('change')); } catch (e) {}
            }
          } catch (e) {}
        }
      } catch (e) {}
      try { checkShiny(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    }
let currentEncounterMode = 'hatched';
// When true, the PID Finder has set the met level and it should stay locked
let pidFinderLockedMetLevel = false;
// When true, a PID Finder result is applied — protects PID/IVs/nature from preset overwrites
let pidFinderResultActive = false;
// When true, the Manual Override checkbox is active — all field locks are bypassed
let manualOverrideActive = false;
// When true, skip applying simple-mode PID presets (used during imports)
let suppressPresetApply = false;
// When true, suppress marking user-change events while programmatically applying presets
let suppressUserChangeMark = false;
// Species ID for which a mystery preset was last applied (or 0/null when none)
let mysteryPresetAppliedFor = 0;
// Whether the user has modified fields (other than nickname) since the preset was applied
let mysteryUserModifiedSincePreset = false;

// ── Roamer encounter definitions ─────────────────────────────────
// Maps each roamer species to its allowed games, level, and whether IVs are truncated.
// Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen
const ROAMER_SPECIES = {
  408: { name: 'Latios',  games: [2, 3], level: 40 },       // Ruby, Emerald
  407: { name: 'Latias',  games: [1, 3], level: 40 },       // Sapphire, Emerald
  243: { name: 'Raikou',  games: [4, 5], level: 50 },       // FRLG
  244: { name: 'Entei',   games: [4, 5], level: 50 },       // FRLG
  245: { name: 'Suicune', games: [4, 5], level: 50 },       // FRLG
};
// Roamer species that have the IV truncation bug (non-Emerald)
// Emerald roamers do NOT truncate IVs.
function roamerHasTruncatedIVs(speciesId, gameId) {
  return !!(ROAMER_SPECIES[speciesId] && gameId !== 3);
}
// Maps game ID → which roamer species are available in that game
const ROAMER_SPECIES_BY_GAME = {
  1: [407],        // Sapphire: Latias
  2: [408],        // Ruby: Latios
  3: [407, 408],   // Emerald: Latias or Latios
  4: [243, 244, 245], // FireRed: beasts
  5: [243, 244, 245], // LeafGreen: beasts
};
// Maps species → which games allow that roamer
const ROAMER_GAMES_FOR_SPECIES = {};
for (const [sid, info] of Object.entries(ROAMER_SPECIES)) {
  ROAMER_GAMES_FOR_SPECIES[Number(sid)] = info.games;
}
const ROAMER_SPECIES_SET = new Set(Object.keys(ROAMER_SPECIES).map(Number));
// Roamer met location: 16 for RSE roamers, 101 for FRLG roamers
function getRoamerMetLocation(speciesId) {
  return [243, 244, 245].includes(speciesId) ? 101 : 16;
}

// Gender thresholds for different species (Gen 3)
// Map species ID to gender threshold (0-255)
// Female if (PID & 0xFF) < threshold, Male otherwise
// Genderless = -1, Always Female = 255, Always Male = 0
const GENDER_THRESHOLDS = {
  // Starters (87.5% male, threshold 31)
  1: 31, 2: 31, 3: 31,     // Bulbasaur line
  4: 31, 5: 31, 6: 31,     // Charmander line
  7: 31, 8: 31, 9: 31,     // Squirtle line
  152: 31, 153: 31, 154: 31, // Chikorita line
  155: 31, 156: 31, 157: 31, // Cyndaquil line
  158: 31, 159: 31, 160: 31, // Totodile line
  252: 31, 253: 31, 254: 31, // Treecko line
  255: 31, 256: 31, 257: 31, // Torchic line
  258: 31, 259: 31, 260: 31, // Mudkip line
  
  // Fossils (87.5% male, threshold 31)
  138: 31, 139: 31, // Omanyte line
  140: 31, 141: 31, // Kabuto line
  142: 31,          // Aerodactyl
  345: 31, 346: 31, // Lileep line
  347: 31, 348: 31, // Anorith line
  
  // Eevee line (87.5% male, threshold 31)
  133: 31, 134: 31, 135: 31, 136: 31, 196: 31, 197: 31,
  
  // 75% male species (threshold 63)
  66: 63, 67: 63, 68: 63,    // Machop line
  104: 63, 105: 63,          // Cubone line
  111: 63, 112: 63, 464: 63, // Rhyhorn line
  246: 63, 247: 63, 248: 63, // Larvitar line
  
  // 75% female species (threshold 191)
  35: 191, 36: 191, 173: 191, // Clefairy line
  39: 191, 40: 191, 174: 191, // Jigglypuff line
  183: 191, 184: 191,         // Marill line
  298: 191,                   // Azurill
  300: 191, 301: 191,         // Skitty line
  
  // Female-only species (threshold 255)
  29: 255, 30: 255, 31: 255,  // Nidoranâ™€ line
  113: 255, 242: 255, 440: 255, // Chansey line
  238: 255, 124: 255,          // Smoochum, Jynx
  387: 255,                    // Illumise
  
  // Male-only species (threshold 0)
  32: 0, 33: 0, 34: 0,    // Nidoranâ™‚ line
  106: 0, 107: 0, 236: 0, 237: 0, // Hitmons
  128: 0,                  // Tauros
  386: 0,                  // Volbeat
  
  // Genderless (threshold -1)
  81: -1, 82: -1, 462: -1,   // Magnemite line
  100: -1, 101: -1,          // Voltorb line
  120: -1, 121: -1,          // Staryu line
  132: -1,                   // Ditto
  137: -1, 233: -1, 474: -1, // Porygon line
  201: -1,                   // Unown
  144: -1, 145: -1, 146: -1, // Legendary birds
  150: -1, 151: -1,          // Mewtwo, Mew
  243: -1, 244: -1, 245: -1, // Legendary beasts
  249: -1, 250: -1,          // Lugia, Ho-Oh
  251: -1,                   // Celebi
  398: -1,                   // Beldum
  399: -1, 400: -1,          // Metang, Metagross
  401: -1, 402: -1, 403: -1, // Regis
  407: -1, 408: -1,          // Lati@s
  404: -1, 405: -1, 406: -1, // Weather trio
  409: -1, 410: -1,          // Jirachi, Deoxys
  
  // Most others default to 50/50 (threshold 127) if not specified
};

function getGenderThreshold(speciesId) {
  if (speciesId in GENDER_THRESHOLDS) {
    return GENDER_THRESHOLDS[speciesId];
  }
  return 127; // Default 50/50
}

// Calculate Hidden Power type and power from IVs
function calculateHiddenPower(ivs) {
  const types = [
    'Fighting', 'Flying', 'Poison', 'Ground', 
    'Rock', 'Bug', 'Ghost', 'Steel',
    'Fire', 'Water', 'Grass', 'Electric', 
    'Psychic', 'Ice', 'Dragon', 'Dark'
  ];
  
  // Type is determined by the lowest bit of each IV (odd=1, even=0)
  // Order: HP, ATK, DEF, SPE, SPA, SPD
  const a = ivs.hp & 1;
  const b = ivs.atk & 1;
  const c = ivs.def & 1;
  const d = ivs.spe & 1;
  const e = ivs.spa & 1;
  const f = ivs.spd & 1;
  
  const typeIndex = Math.floor(((a + 2*b + 4*c + 8*d + 16*e + 32*f) * 15) / 63);
  const type = types[typeIndex];
  
  // Power is determined by the second-lowest bit of each IV (bit 1)
  // Order: HP, ATK, DEF, SPE, SPA, SPD
  const u = (ivs.hp >> 1) & 1;
  const v = (ivs.atk >> 1) & 1;
  const w = (ivs.def >> 1) & 1;
  const x = (ivs.spe >> 1) & 1;
  const y = (ivs.spa >> 1) & 1;
  const z = (ivs.spd >> 1) & 1;
  
  const power = Math.floor(((u + 2*v + 4*w + 8*x + 16*y + 32*z) * 40) / 63) + 30;
  
  return { type, power };
}

// Parse PID input accepting hex (with or without 0x) or decimal. Returns unsigned 32-bit number.
function parsePidInput(s){
  if(s === null || s === undefined) return 0;
  const v = String(s).trim();
  if(v === '') return 0;
  // 0x... hex
  if(/^0x[0-9a-fA-F]+$/.test(v)) return parseInt(v.slice(2),16) >>> 0;
  // plain hex (no prefix)
  if(/^[0-9a-fA-F]{1,8}$/.test(v)) return parseInt(v,16) >>> 0;
  // decimal fallback
  const n = Number(v);
  if(!Number.isNaN(n)) return n >>> 0;
  return 0;
}

// Turn any entry into [name, id], supporting both [name,id] and [id,name]
function toNameId(entry) {
  if (!Array.isArray(entry) || entry.length < 2) return [String(entry), 0];
  const [a, b] = entry;

  const isNumeric = v =>
    typeof v === 'number' ||
    (typeof v === 'string' && /^[0-9]+$/.test(v));

  // If first looks numeric and second looks like a name => assume [id,name]
  if (isNumeric(a) && !isNumeric(b)) {
    return [String(b), Number(a)];
  }
  // Otherwise assume [name,id]
  return [String(a), Number(b)];
}

function fillSelect(el, list, opts = {}) {
  el.innerHTML = '';
  const placeholder = opts.placeholder ?? '— Select —';
  if (placeholder !== null) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    el.appendChild(opt);
  }
  for (const row of list) {
    const [name, id] = toNameId(row);
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = name;
    el.appendChild(opt);
  }
}

// Ensure Mew in Legendary mode is at least level 30. Called after species/mode changes.
function enforceMewLegendMinLevel() {
  try {
    if (currentEncounterMode !== 'static') return;
    const sp = Number($('#species')?.value || 0);
    if (sp !== 151) return;
    const levelEl = $('#level');
    if (!levelEl) return;
    let val = Number(levelEl.value) || 0;
    if (val < 30) {
      levelEl.value = '30';
      try { computeAndSetExpFromLevel(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    }
  } catch (e) {}
}

// Create autocomplete input that replaces a select element
function createAutocomplete(selectEl, list, opts = {}) {
  const placeholder = opts.placeholder ?? '— Select —';
  const allowEmpty = opts.placeholder !== null;
  const onSelect = opts.onSelect || null;
  // Optional full list used to resolve display names for values not in the
  // current filtered list (e.g. mystery-gift preset moves outside the learnset).
  const masterList = opts.masterList || null;
  
  // Store the data - make it mutable so we can update it
  let items = list.map(row => {
    const [name, id] = toNameId(row);
    return { name, id: String(id) };
  });
  let masterItems = masterList ? masterList.map(row => {
    const [name, id] = toNameId(row);
    return { name, id: String(id) };
  }) : null;
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  
  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'autocomplete-input';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  // Limit dropdown height to 5 items and make it scrollable
  dropdown.style.maxHeight = '160px'; // ~32px per item * 5
  dropdown.style.overflowY = 'auto';
  
  // Store current selection
  let selectedId = '';
  let selectedIndex = -1;
  
  // Expose value property on wrapper for compatibility
  Object.defineProperty(wrapper, 'value', {
    get() { return selectedId; },
    set(val) {
      selectedId = String(val);
      const item = items.find(i => i.id === selectedId);
      if (item) {
        input.value = item.name;
      } else if (masterItems) {
        // Fallback: resolve display name from the full master list
        // (e.g. mystery-gift moves not in the current learnset)
        const fallback = masterItems.find(i => i.id === selectedId);
        if (fallback) input.value = fallback.name;
      }
      if (!item && !masterItems?.find(i => i.id === selectedId)) {
        if (allowEmpty && val === '') {
          input.value = '';
          selectedId = '';
        }
      }
    },
    configurable: true
  });
  
  // Expose method to update the list
  // opts.preserveValue — keep current selection even if it's not in the new list
  wrapper.updateList = function(newList, opts = {}) {
    items = newList.map(row => {
      const [name, id] = toNameId(row);
      return { name, id: String(id) };
    });
    // Clear current selection if it's not in the new list
    // (unless preserveValue is set — keeps e.g. mystery-gift moves visible)
    if (!opts.preserveValue) {
      const stillExists = items.some(i => i.id === selectedId);
      if (!stillExists) {
        selectedId = '';
        input.value = '';
      }
    }
  };
  
  // Also expose addEventListener for compatibility
  wrapper.addEventListener = function(type, handler) {
    input.addEventListener(type, handler);
  };
  // Forward dispatchEvent to the internal input so callers that dispatch
  // events on the wrapper (compat shim) trigger the attached handlers.
  wrapper.dispatchEvent = function(evt) {
    try { return input.dispatchEvent(evt); } catch (e) { return false; }
  };
  
  function filterItems(query) {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => item.name.toLowerCase().includes(q));
  }
  
  function renderDropdown(filtered) {
    dropdown.innerHTML = '';
    selectedIndex = -1;
    
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'autocomplete-no-results';
      noResults.textContent = 'No matches found';
      dropdown.appendChild(noResults);
      return;
    }
    
    // Show all filtered items, but dropdown is scrollable and visually limited to 5
    filtered.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item.name;
      div.dataset.id = item.id;
      div.dataset.index = idx;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(item);
      });
      dropdown.appendChild(div);
    });
  }
  
  function selectItem(item) {
    selectedId = item.id;
    input.value = item.name;
    dropdown.classList.remove('show');
    
    // Trigger callback if provided
    if (onSelect) {
      onSelect(item);
    }
    
    // Trigger change event for compatibility
    const event = new Event('change', { bubbles: true });
    wrapper.dispatchEvent(event);
  }
  
  function showDropdown() {
    const filtered = filterItems(input.value);
    renderDropdown(filtered);
    dropdown.classList.add('show');
  }
  
  function hideDropdown() {
    dropdown.classList.remove('show');
  }
  
  // Event listeners
  input.addEventListener('input', (e) => {
    const query = e.target.value;
    const filtered = filterItems(query);
    renderDropdown(filtered);
    dropdown.classList.add('show');
    
    // Clear selected ID when typing (user is searching)
    selectedId = '';
  });
  
  input.addEventListener('focus', () => {
    // If a value is already selected, show ALL options so the user can
    // browse and pick a different one (instead of filtering by current text).
    if (selectedId) {
      renderDropdown(items);
      dropdown.classList.add('show');
      // Scroll the currently selected item into view
      const active = dropdown.querySelector(`.autocomplete-item[data-id="${selectedId}"]`);
      if (active) {
        active.classList.add('selected');
        active.scrollIntoView({ block: 'nearest' });
      }
    } else {
      showDropdown();
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      hideDropdown();
      
      // Auto-select if user typed an exact match
      if (input.value && !selectedId) {
        // Skip auto-resolve when Manual Override is active (import or PID
        // Finder result applied) to prevent any async preset application.
        if (suppressPresetApply) return;
        const exactMatch = items.find(item => 
          item.name.toLowerCase() === input.value.toLowerCase()
        );
        if (exactMatch) {
          selectItem(exactMatch);
        } else {
          // Clear invalid input
          input.value = '';
        }
      }
    }, 200);
  });
  
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelectedItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelectedItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        const id = items[selectedIndex].dataset.id;
        const filtered = filterItems(input.value);
        const item = filtered.find(i => i.id === id);
        if (item) selectItem(item);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });
  
  function updateSelectedItem(items) {
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIndex);
    });
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // Replace select with autocomplete
  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);
  selectEl.parentNode.replaceChild(wrapper, selectEl);
  
  // Copy ID to wrapper for querySelector compatibility
  wrapper.id = selectEl.id;
  wrapper.querySelector('input').id = selectEl.id + '-input';
  
  return wrapper;
}


// Filter locations based on origin game
function getLocationsForGame(originGame) {
  const gameId = Number(originGame);
  
  // Colosseum/XD (game ID 15) uses locations with format "###: Name / Name"
  if (gameId === 15) {
    return LOCATIONS.filter(([id, name]) => {
      // Check if name starts with "###:" pattern (Colosseum/XD format)
      return /^\d{3}:/.test(String(name));
    });
  }
  
  // RSE/FRLG (game IDs 1-5) use locations WITHOUT the "###:" prefix
  return LOCATIONS.filter(([id, name]) => {
    // Exclude Colosseum/XD formatted locations
    return !/^\d{3}:/.test(String(name));
  });
}

// Store reference to metLocation autocomplete wrapper for updating
let metLocationWrapper = null;

/**
 * Given an array of merged level ranges [[min,max], ...] and a target level,
 * return the closest valid level that falls inside one of the ranges.
 * If the value is between two disjoint ranges, snaps to the nearest boundary.
 */
function snapToValidLevel(ranges, target) {
  if (!ranges || !ranges.length) return target;
  // Flatten to absolute min/max first for quick bounds check
  const absMin = ranges[0][0];
  const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
  if (target <= absMin) return absMin;
  if (target >= absMax) return absMax;
  // Check if target falls inside any range
  for (const r of ranges) {
    const lo = r[0], hi = r.length > 1 ? r[1] : r[0];
    if (target >= lo && target <= hi) return target; // already valid
  }
  // Target is in a gap — find the closest boundary
  let best = absMin, bestDist = Math.abs(target - absMin);
  for (const r of ranges) {
    const lo = r[0], hi = r.length > 1 ? r[1] : r[0];
    for (const bound of [lo, hi]) {
      const d = Math.abs(target - bound);
      if (d < bestDist) { best = bound; bestDist = d; }
    }
  }
  return best;
}

/**
 * Build a human-readable label for a set of level ranges, e.g. "2–5, 8, 10–12".
 */
function rangesToLabel(ranges) {
  return ranges.map(r => r.length > 1 && r[0] !== r[1] ? `${r[0]}\u2013${r[1]}` : `${r[0]}`).join(', ');
}

/**
 * Update Origin Game, Met Location, and Met Level in wild mode based on
 * the selected species' wild encounter data.
 *
 * The encounter data uses merged level ranges:
 *   locationId â†’ [[min,max], ...]  (e.g. [[5,10],[20,30]])
 *
 * Flow:
 *   1. Disable Origin Game options where the species has no wild encounters.
 *   2. If the currently selected game has no encounters, auto-select the
 *      first available game.
 *   3. Filter Met Location to only the locations for this species + game.
 *   4. Snap Met Level to the closest valid level within the ranges.
 *
 * Called when: species changes, mode changes to wild, origin game changes,
 * or met location changes.
 */
function updateWildEncounterFilters(speciesId) {
  if (currentEncounterMode !== 'wild') return;

  // For evolved forms not directly in the wild, resolve to their wild ancestor
  const wildId = WILD_ENCOUNTERS[speciesId] ? speciesId : getWildAncestor(speciesId, WILD_ENCOUNTERS);
  const encounterData = wildId != null ? WILD_ENCOUNTERS[wildId] : null;
  const originGameSelect = $('#originGame');
  const metLevelInput =    $('#metLevel');
  if (!originGameSelect) return;

  // â”€â”€ 1. Filter Origin Game options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const availableGames = encounterData ? Object.keys(encounterData).map(Number) : [];
  const options = Array.from(originGameSelect.options);
  for (const opt of options) {
    const gId = Number(opt.value);
    // Colosseum/XD (15) — always disabled/greyed in wild mode (no data yet)
    if (gId === 15) { opt.disabled = true; continue; }
    opt.disabled = !availableGames.includes(gId);
    opt.hidden   = !availableGames.includes(gId);
  }

  // â”€â”€ 2. Auto-select first available game if current is disabled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let currentGame = Number(originGameSelect.value);
  if (!availableGames.includes(currentGame)) {
    if (availableGames.length) {
      originGameSelect.value = String(availableGames[0]);
      currentGame = availableGames[0];
    }
  }

  // â”€â”€ 3. Filter Met Location to valid locations for species + game â”€â”€â”€â”€â”€â”€â”€â”€
  if (encounterData && encounterData[currentGame]) {
    const gameLocs = encounterData[currentGame]; // { locId: [[min,max],...] }
    const locIds = Object.keys(gameLocs).map(Number);
    // Build the filtered location list from LOCATIONS
    const baseLocations = getLocationsForGame(currentGame);
    const filteredLocations = baseLocations.filter(([id]) => locIds.includes(id));
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(filteredLocations);
    }

    // If the current met location isn't in the filtered set, auto-pick the first
    const metLocVal = Number($('#metLocation').value);
    if (!locIds.includes(metLocVal) && filteredLocations.length) {
      $('#metLocation').value = String(filteredLocations[0][0]);
    }

    // â”€â”€ 4. Snap Met Level to the closest valid level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const chosenLoc = Number($('#metLocation').value);
    const ranges = gameLocs[chosenLoc];
    if (ranges && ranges.length && metLevelInput) {
      const absMin = ranges[0][0];
      const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
      const curLevel = Number(metLevelInput.value) || 0;
      metLevelInput.value = String(snapToValidLevel(ranges, curLevel));
      metLevelInput.min = String(absMin);
      metLevelInput.max = String(absMax);
      metLevelInput.title = `Valid levels: ${rangesToLabel(ranges)}`;

      // Also sync the main level so it's at least the met level
      const metLevel  = Number(metLevelInput.value);
      const mainLevel = Number($('#level').value) || 0;
      if (mainLevel < metLevel) {
        $('#level').value = String(metLevel);
        try { computeAndSetExpFromLevel(); } catch (e) {}
      }
      // Refresh move filtering with the updated level
      try { refreshMoveExclusions(); } catch (e) {}
    }
  } else {
    // No encounter data: show all locations for this game, reset level constraints
    const baseLocations = getLocationsForGame(currentGame);
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(baseLocations);
    }
    if (metLevelInput) {
      metLevelInput.min = '0';
      metLevelInput.max = '100';
      metLevelInput.title = '';
    }
  }

  // Unown: filter form dropdown to match the (now-updated) met location
  if (speciesId === 201) {
    filterUnownFormsByLocation();
  }
}

/**
 * Reset Origin Game dropdown to its normal state (all options enabled).
 * Called when switching away from wild mode.
 */
function resetOriginGameOptions() {
  const select = $('#originGame');
  if (!select) return;
  for (const opt of Array.from(select.options)) {
    opt.disabled = false;
    opt.hidden   = false;
  }
}

/**
 * Update the move dropdowns to only show moves the selected species can
 * legally learn, taking the current encounter mode and level into account.
 *
 * Mode rules:
 *   hatched     — all categories: level-up (any level) + egg + TM/HM + tutor
 *   wild /
 *   legendaries — level-up (≤ pokémon level) + TM/HM + tutor  (NO egg moves)
 *   mystery     — level-up (≤ pokémon level) + TM/HM + tutor  (NO egg moves)
 *
 * `preserveValue` keeps the current selection even when it is not in the
 * new filtered list (used for mystery-gift preset moves & imports).
 */
function updateMovesForSpecies(speciesId, { preserveValue = false } = {}) {
  const data = LEARNSETS[speciesId];
  let baseMoves;

  if (manualOverrideActive || currentEncounterMode === 'cxd_shadow') {
    // Manual override / CXD Shadow: show ALL Gen 3 moves regardless of species learnset
    // (shadow encounters can know moves outside the normal learnset)
    baseMoves = MOVES;
  } else if (data) {
    const mode = currentEncounterMode;
    const level = Number($('#level')?.value) || 100;

    // Collect move IDs that are legal for the current mode + level
    const idSet = new Set();

    // Level-up moves — in hatched mode allow all, otherwise cap by level
    if (data.l) {
      for (const [mid, learnLvl] of data.l) {
        if (mode === 'hatched' || learnLvl <= level) {
          idSet.add(mid);
        }
      }
    }
    // TM/HM & tutor moves — always allowed (no level restriction)
    if (data.t) for (const mid of data.t) idSet.add(mid);
    if (data.u) for (const mid of data.u) idSet.add(mid);
    // Egg moves — only in hatched mode
    // Include egg moves from this species and all pre-evolutions in the chain
    if (mode === 'hatched') {
      if (data.e) {
        for (const mid of data.e) idSet.add(mid);
      }
      let preId = PRE_EVOLUTIONS[speciesId];
      while (preId != null) {
        const preData = LEARNSETS[preId];
        if (preData?.e) {
          for (const mid of preData.e) idSet.add(mid);
        }
        preId = PRE_EVOLUTIONS[preId];
      }
    }

    // Keep the empty/0 entry ("— None —") plus all legal moves
    baseMoves = MOVES.filter(([id]) => id === 0 || idSet.has(id));
  } else {
    // No learnset data â†’ show everything
    baseMoves = MOVES;
  }

  // For each slot, exclude moves already chosen in other slots to
  // prevent the same move from being selected twice.
  const selected = moveAutocompletes.map(ac => ac ? ac.value : '');
  for (let i = 0; i < moveAutocompletes.length; i++) {
    const ac = moveAutocompletes[i];
    if (!ac || !ac.updateList) continue;
    const othersSelected = new Set(
      selected.filter((id, j) => j !== i && id && id !== '0' && id !== '')
    );
    const filtered = othersSelected.size > 0
      ? baseMoves.filter(([id]) => id === 0 || !othersSelected.has(String(id)))
      : baseMoves;
    ac.updateList(filtered, { preserveValue });
  }
}

/**
 * Re-apply move-slot exclusion / level filtering using the currently
 * selected species and level — call after any individual move selection
 * or level change so that duplicates and out-of-level moves are kept
 * out of the other slots' dropdowns.
 */
function refreshMoveExclusions() {
  const speciesId = Number($('#species')?.value || 0);
  updateMovesForSpecies(speciesId, { preserveValue: true });
}

// Update Hidden Power display based on current IV values
function updateHiddenPower() {
  const ivs = {
    hp: Number($('#ivHp')?.value || 0),
    atk: Number($('#ivAtk')?.value || 0),
    def: Number($('#ivDef')?.value || 0),
    spa: Number($('#ivSpAtk')?.value || 0),
    spd: Number($('#ivSpDef')?.value || 0),
    spe: Number($('#ivSpe')?.value || 0)
  };
  
  const hp = calculateHiddenPower(ivs);
  const typeEl = $('#hiddenPowerType');
  const powerEl = $('#hiddenPowerPower');
  
  if (typeEl) typeEl.textContent = hp.type;
  if (powerEl) powerEl.textContent = `Power: ${hp.power}`;
}

// Highlight missing required fields (global scope for access from onGenerate)
function highlightMissingFields() {
  const speciesValue = $('#species').value;
  const natureValue = $('#nature').value;
  const move1Value = $('#move1').value;
  const move2Value = $('#move2').value;
  const move3Value = $('#move3').value;
  const move4Value = $('#move4').value;
  const otNameValue = $('#otName').value;
  
  // Remove any existing error highlights
  $('#species').parentElement.classList.remove('field-error');
  $('#nature').classList.remove('field-error');
  $('#move1').parentElement.classList.remove('field-error');
  $('#move2').parentElement.classList.remove('field-error');
  $('#move3').parentElement.classList.remove('field-error');
  $('#move4').parentElement.classList.remove('field-error');
  $('#otName').classList.remove('field-error');
  
  let missingFields = [];
  
  // Check each required field
  if (!speciesValue || speciesValue.trim() === '') {
    $('#species').parentElement.classList.add('field-error');
    missingFields.push('Species');
  }
  
  if (!natureValue || natureValue.trim() === '') {
    $('#nature').classList.add('field-error');
    missingFields.push('Nature');
  }
  
  if (!otNameValue || otNameValue.trim() === '') {
    $('#otName').classList.add('field-error');
    missingFields.push('OT Name');
  }
  
  // Check if at least one move is selected
  const hasMove = (move1Value && move1Value !== '0') || 
                  (move2Value && move2Value !== '0') || 
                  (move3Value && move3Value !== '0') || 
                  (move4Value && move4Value !== '0');
  
  if (!hasMove) {
    $('#move1').parentElement.classList.add('field-error');
    missingFields.push('At least one Move');
  }
  
  return missingFields;
}

function updateSpeciesSprite(speciesId) {
  const img = $('#speciesSprite');
  if (!img) return;
  img.onerror = null;
  const isShiny = $('#shiny')?.checked || false;

  // Unown: use form-specific sprite
  if (speciesId === 201) {
    const pid = parsePidInput($('#pid')?.value || '0');
    const formIndex = getUnownFormIndex(pid);
    const localPath = getUnownSpritePath(formIndex);
    const onlinePath = getOnlineUnownSpriteUrl(isShiny);
    img.onerror = () => { img.onerror = null; img.src = localPath; };
    img.src = onlinePath || localPath;
    img.alt = `Unown ${UNOWN_FORMS[formIndex]}`;
    img.classList.add('visible');
    return;
  }

  const species = SPECIES.find(s => s[0] === speciesId);
  const localPath = species ? getSpritePath(species[1]) : null;

  if (species) {
    const onlinePath = getOnlineSpriteUrl(species[1], isShiny);
    if (onlinePath) {
      if (localPath) {
        img.onerror = () => { img.onerror = null; img.src = localPath; };
      }
      img.src = onlinePath;
      img.alt = species[1];
      img.classList.add('visible');
      return;
    }
  }

  if (localPath) {
    img.src = localPath;
    img.alt = species[1];
    img.classList.add('visible');
  } else {
    img.removeAttribute('src');
    img.alt = '';
    img.classList.remove('visible');
  }
}

// â”€â”€ Unown form helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/** Populate and show/hide the Unown form dropdown based on current species. */
function updateUnownFormVisibility(speciesId) {
  const row = document.getElementById('unownFormRow');
  if (!row) return;
  if (speciesId === 201) {
    // Populate dropdown with all 28 forms initially
    const sel = document.getElementById('unownForm');
    if (sel && sel.options.length === 0) {
      for (let i = 0; i < 28; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        const ch = UNOWN_FORMS[i];
        opt.textContent = ch === '!' ? '! (Exclamation)' : ch === '?' ? '? (Question)' : ch;
        sel.appendChild(opt);
      }
    }
    // Sync to current PID
    updateUnownFormFromPID();
    // In wild mode, restrict forms to those available in the current chamber
    if (currentEncounterMode === 'wild') {
      filterUnownFormsByLocation();
    }
    row.style.display = '';
  } else {
    row.style.display = 'none';
  }
}

/** Sync the Unown form dropdown + sprite to the current PID value. */
function updateUnownFormFromPID() {
  const speciesId = Number($('#species')?.value || 0);
  if (speciesId !== 201) return;
  const pid = parsePidInput($('#pid')?.value || '0');
  const formIndex = getUnownFormIndex(pid);
  const sel = document.getElementById('unownForm');
  if (sel) sel.value = String(formIndex);
  // Update sprite to matching form
  const img = $('#speciesSprite');
  if (img) {
    img.src = getUnownSpritePath(formIndex);
    img.alt = `Unown ${UNOWN_FORMS[formIndex]}`;
    img.classList.add('visible');
  }
}

/**
 * Ensure all 28 Unown forms are visible in the dropdown.
 * (Previously filtered by location; now all forms are always selectable
 * and picking a form snaps the location instead.)
 */
function filterUnownFormsByLocation() {
  const sel = document.getElementById('unownForm');
  if (!sel) return;
  for (const opt of Array.from(sel.options)) {
    opt.hidden = false;
    opt.disabled = false;
  }
}

/**
 * When the Unown form dropdown changes, snap the met location
 * to a valid Tanoby chamber for the chosen form (if the current
 * location cannot produce it).  The full location list is kept intact.
 */
function filterUnownLocationsByForm() {
  if (currentEncounterMode !== 'wild') return;
  const speciesId = Number($('#species')?.value || 0);
  if (speciesId !== 201) return;

  const formIndex = Number(document.getElementById('unownForm')?.value ?? 0);
  const validLocIds = getTanobyLocationsForForm(formIndex);

  // If current location cannot produce this form, snap to the first valid one
  const curLoc = Number($('#metLocation')?.value || 0);
  if (!validLocIds.includes(curLoc) && validLocIds.length) {
    $('#metLocation').value = String(validLocIds[0]);
    // Snap met level for the new location
    const gameId = Number($('#originGame')?.value || 0);
    const enc = WILD_ENCOUNTERS[speciesId];
    if (enc && enc[gameId] && enc[gameId][validLocIds[0]]) {
      const ranges = enc[gameId][validLocIds[0]];
      const ml = $('#metLevel');
      if (ml && ranges && ranges.length) {
        ml.value = String(snapToValidLevel(ranges, Number(ml.value) || 0));
        const absMin = ranges[0][0];
        const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
        ml.min = String(absMin);
        ml.max = String(absMax);
        ml.title = `Valid levels: ${rangesToLabel(ranges)}`;
      }
    }
    try { updateBallLocking(); } catch (e) {}
  }
}

/** Update sprite to match the currently selected Unown form. */
function updateUnownFormSprite() {
  const formIndex = Number(document.getElementById('unownForm')?.value ?? 0);
  const img = $('#speciesSprite');
  if (img) {
    img.src = getUnownSpritePath(formIndex);
    img.alt = `Unown ${UNOWN_FORMS[formIndex]}`;
    img.classList.add('visible');
  }
}

// When user manually picks a form, update sprite + filter locations
document.getElementById('unownForm')?.addEventListener('change', function () {
  updateUnownFormSprite();
  filterUnownLocationsByForm();
});

function boot(){
  // Function to update ability select based on species
  function updateAbilitySelect(speciesId) {
    const abilitySelect = $('#ability');
    if (!abilitySelect) return;
    
    const abilities = getSpeciesAbilities(speciesId);
    if (!abilities) {
      // Default to generic 0/1 if no data
      abilitySelect.innerHTML = `
        <option value="0">0</option>
        <option value="1">1</option>
      `;
      return;
    }
    
    const [ability0Id, ability1Id] = abilities;
    const ability0Name = getAbilityName(ability0Id);
    const ability1Name = getAbilityName(ability1Id);
    
    // Store current value to preserve selection if possible
    const currentValue = abilitySelect.value;
    
    if (ability0Id === ability1Id) {
      // Single ability - only show one option
      abilitySelect.innerHTML = `<option value="0">${ability0Name}</option>`;
      abilitySelect.value = '0';
    } else {
      // Dual abilities - show both
      abilitySelect.innerHTML = `
        <option value="0">${ability0Name}</option>
        <option value="1">${ability1Name}</option>
      `;
      // Restore previous value if it's still valid
      if (currentValue === '0' || currentValue === '1') {
        abilitySelect.value = currentValue;
      } else {
        abilitySelect.value = '0';
      }
    }
  }

  // Form validation - check if generate button should be enabled
  function validateForm() {
    const speciesValue = $('#species').value;
    const natureValue = $('#nature').value;
    const move1Value = $('#move1').value;
    const move2Value = $('#move2').value;
    const move3Value = $('#move3').value;
    const move4Value = $('#move4').value;
    const otNameValue = $('#otName').value;
    
    // Check if species and nature are selected
    const hasSpecies = speciesValue && speciesValue.trim() !== '';
    const hasNature = natureValue && natureValue.trim() !== '';
    const hasOTName = otNameValue && otNameValue.trim() !== '';
    
    // Check if at least one move is selected
    const hasMove = (move1Value && move1Value !== '0') || 
                    (move2Value && move2Value !== '0') || 
                    (move3Value && move3Value !== '0') || 
                    (move4Value && move4Value !== '0');
    
    // Enable generate button only if all conditions are met
    const generateBtn = $('#generateBtn');
    if (hasSpecies && hasNature && hasMove && hasOTName) {
      generateBtn.setAttribute('data-disabled', 'false');
    } else {
      generateBtn.setAttribute('data-disabled', 'true');
    }
  }

  // Expose post-import update callback so module-level import functions
  // (onLoadFromHex, Smogon import) can access boot()-scoped helpers.
  _postImportUpdate = function(speciesId) {
    updateAbilitySelect(speciesId);
    updateSpeciesSprite(speciesId);
    updateUnownFormVisibility(speciesId);
    handleEncounterModeChange(speciesId);
    validateForm();
  };

  /**
   * Check legality of current Pokémon data
   * Returns { legal: boolean, errors: string[], unknown: boolean }
   */
  function checkLegality() {
    const errors = [];
    const speciesId = Number($('#species').value) || 0;
    const natureValue = $('#nature').value;
    const level = Number($('#level').value) || 1;
    const metLevel = Number($('#metLevel').value) || 0;
    const mode = currentEncounterMode;
    
    // Return unknown status if essential fields are not set
    if (!speciesId || natureValue === null || natureValue === undefined || natureValue === '') {
      return {
        legal: false,
        errors: ['Please select a Pokémon and Nature to check legality'],
        unknown: true
      };
    }
    
    // Universal rules
    if (level < 2 || level > 100) {
      errors.push('Level must be between 2 and 100');
    }
    
    // Level must be at or above met level (applies to all modes)
    if (level < metLevel) {
      errors.push('Current level cannot be lower than met level');
    }
    
    if (mode === 'hatched') {
      // Hatched mode rules
      if (level < 5) {
        errors.push('Hatched Pokémon must be at least level 5');
      }
      
      if (metLevel !== 0) {
        errors.push('Met level must be 0 for hatched Pokémon');
      }
      
      // Hatched Pokémon must be in a Poké Ball (ID 4)
      const ballId = Number($('#ball').value) || 0;
      if (ballId !== 4) {
        errors.push('Hatched Pokémon must be in a Poké Ball');
      }
      
      // Check EVs if level is exactly 5 with base EXP
      if (level === 5) {
        const expTotal = Number($('#expTotal').value) || 0;
        const species = SPECIES.find(s => s[0] === speciesId);
        if (species) {
          const group = EXP_GROUPS[speciesId] ?? GROUP.MEDIUM_FAST;
          const baseExpFor5 = expForLevel(group, 5);
          
          if (expTotal === baseExpFor5) {
            // Check if any individual EV exceeds 100
            const evs = [
              Number($('#evHp').value) || 0,
              Number($('#evAtk').value) || 0,
              Number($('#evDef').value) || 0,
              Number($('#evSpAtk').value) || 0,
              Number($('#evSpDef').value) || 0,
              Number($('#evSpe').value) || 0
            ];
            
            const maxEV = Math.max(...evs);
            if (maxEV > 100) {
              errors.push('No individual EV stat can exceed 100 for level 5 Pokémon with no additional EXP');
            }
          }
        }
      }
      
      // Check illegal ribbons for hatched mode
      const illegalHatchedRibbons = [
        { id: 'ribbonWorld', name: 'World' },
        { id: 'ribbonBattleChampion', name: 'Battle Champion' },
        { id: 'ribbonCountry', name: 'Country' },
        { id: 'ribbonNational', name: 'National' },
        { id: 'ribbonNationalChampion', name: 'National Champion' },
        { id: 'ribbonRegionalChampion', name: 'Regional Champion' }
      ];
      
      illegalHatchedRibbons.forEach(ribbon => {
        const ribbonEl = $(`#${ribbon.id}`);
        if (ribbonEl && ribbonEl.checked) {
          errors.push(`${ribbon.name} ribbon is illegal for hatched Pokémon`);
        }
      });
      
      // Hatched Pokémon must NOT have fateful encounter checked
      const fatefulCheckbox = $('#fatefulEncounter');
      if (fatefulCheckbox && fatefulCheckbox.checked) {
        errors.push('Fateful encounter cannot be checked for hatched Pokémon');
      }
    } else if (mode === 'static' && STATIC_ENCOUNTERS[speciesId]) {
      // Legendary mode rules
      const encounter = STATIC_ENCOUNTERS[speciesId];
      
      // Check if the PID matches a known preset
      const currentPID = parsePidInput($('#pid').value);
      let expectedPID = null;
      let isKnownPID = false;
      
      if (encounter.fixedEvent && encounter.fixedPID !== undefined) {
        // Fixed event Pokémon have predetermined PID
        expectedPID = encounter.fixedPID;
        isKnownPID = (currentPID === expectedPID);
      } else {
        // Non-fixed legendaries use preset PIDs based on nature
        const natureIndex = Number($('#nature').value || 0);
        const originGame = encounter.defaultOriginGame || 2;
        const preset = getLegendaryPreset(natureIndex, originGame);
        if (preset && preset.pid !== undefined) {
          expectedPID = preset.pid;
          isKnownPID = (currentPID === expectedPID);
        }
      }
      
      // If PID doesn't match any known preset, return unknown status
      if (!isKnownPID) {
        return {
          legal: false,
          errors: ['Legality check does not yet support custom PIDs for the legendary mode'],
          unknown: true
        };
      }
      
      // Check met level
      if (encounter.defaultMetLevel && metLevel !== encounter.defaultMetLevel) {
        errors.push(`Met level must be ${encounter.defaultMetLevel} for this legendary`);
      }
      
      // Check EVs if level equals met level with base EXP (same logic as hatched mode)
      if (level === metLevel && metLevel > 0) {
        const expTotal = Number($('#expTotal').value) || 0;
        const species = SPECIES.find(s => s[0] === speciesId);
        if (species) {
          const group = EXP_GROUPS[speciesId] ?? GROUP.MEDIUM_FAST;
          const baseExpForLevel = expForLevel(group, level);
          
          if (expTotal === baseExpForLevel) {
            // Check if any individual EV exceeds 100
            const evs = [
              Number($('#evHp').value) || 0,
              Number($('#evAtk').value) || 0,
              Number($('#evDef').value) || 0,
              Number($('#evSpAtk').value) || 0,
              Number($('#evSpDef').value) || 0,
              Number($('#evSpe').value) || 0
            ];
            
            const maxEV = Math.max(...evs);
            if (maxEV > 100) {
              errors.push(`No individual EV stat can exceed 100 for this Pokémon without increasing the EXP`);
            }
          }
        }
      }
      
      // Get expected IVs based on whether it's a fixed event or uses preset
      let expectedIVs = null;
      
      if (encounter.fixedEvent && encounter.fixedIVs) {
        // Fixed event Pokémon have predetermined IVs
        expectedIVs = encounter.fixedIVs;
      } else {
        // Non-fixed legendaries use preset IVs based on nature
        const natureIndex = Number($('#nature').value || 0);
        const originGame = encounter.defaultOriginGame || 2;
        const preset = getLegendaryPreset(natureIndex, originGame);
        if (preset && preset.ivs) {
          expectedIVs = preset.ivs;
        }
      }
      
      // Check if IVs match the expected values
      if (expectedIVs) {
        const currentIVs = {
          hp: Number($('#ivHp').value) || 0,
          atk: Number($('#ivAtk').value) || 0,
          def: Number($('#ivDef').value) || 0,
          spa: Number($('#ivSpAtk').value) || 0,
          spd: Number($('#ivSpDef').value) || 0,
          spe: Number($('#ivSpe').value) || 0
        };
        
        if (currentIVs.hp !== expectedIVs.hp ||
            currentIVs.atk !== expectedIVs.atk ||
            currentIVs.def !== expectedIVs.def ||
            currentIVs.spa !== expectedIVs.spa ||
            currentIVs.spd !== expectedIVs.spd ||
            currentIVs.spe !== expectedIVs.spe) {
          errors.push(`IVs must be ${expectedIVs.hp}/${expectedIVs.atk}/${expectedIVs.def}/${expectedIVs.spa}/${expectedIVs.spd}/${expectedIVs.spe} (HP/Atk/Def/SpA/SpD/Spe) for this PID`);
        }
      }
      
      // Check if met location was changed (if it has a default)
      if (encounter.defaultMetLocationId) {
        const currentMetLocation = Number($('#metLocation').value);
        if (currentMetLocation !== encounter.defaultMetLocationId) {
          errors.push('Met location cannot be changed for this legendary');
        }
      }
      
      // Check origin game legality (complex rules for different legendaries)
      const currentOriginGame = Number($('#originGame').value);
      const currentMetLocation = Number($('#metLocation').value);
      
      // Game IDs: 1=Sapphire, 2=Ruby, 3=Emerald, 4=FireRed, 5=LeafGreen, 15=Colosseum/XD
      
      // Mewtwo (150)
      if (speciesId === 150) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![4, 5].includes(currentOriginGame)) {
          errors.push('This legendary must have FireRed or LeafGreen as its origin game');
        }
      }
      // Legendary birds: Articuno (144), Zapdos (145), Moltres (146)
      else if ([144, 145, 146].includes(speciesId)) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![4, 5].includes(currentOriginGame)) {
          errors.push('This legendary must have FireRed, LeafGreen, or Colosseum/XD as its origin game');
        }
      }
      // Mew (151)
      else if (speciesId === 151) {
        if (currentOriginGame !== 3) {
          errors.push('Mew must have Emerald as origin game');
        }
      }
      // Jirachi (409) and Celebi (251)
      else if ([409, 251].includes(speciesId)) {
        if (![1, 2].includes(currentOriginGame)) {
          errors.push('Jirachi and Celebi must have Ruby or Sapphire as origin game');
        }
      }
      // Regis: Regirock (377), Regice (378), Registeel (379)
      else if ([377, 378, 379].includes(speciesId)) {
        if (![1, 2, 3].includes(currentOriginGame)) {
          errors.push('Regi legendaries must have Emerald, Ruby, or Sapphire as origin game');
        }
      }
      // Lugia (249) and Ho-Oh (250)
      else if ([249, 250].includes(speciesId)) {
        if (currentOriginGame === 15) {
          // XD/Colosseum not yet implemented
          return {
            legal: false,
            errors: ['XD/Colosseum legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (![3, 4, 5].includes(currentOriginGame)) {
          errors.push('Lugia and Ho-Oh must have Emerald, FireRed, or LeafGreen as origin game');
        }
      }
      // Latios (408) and Latias (407)
      else if ([407, 408].includes(speciesId)) {
        if (currentEncounterMode === 'roamer') {
          // Roamer mode: validate species↔game pairing
          const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
          if (!allowedGames.includes(currentOriginGame)) {
            const gameName = speciesId === 408 ? 'Ruby or Emerald' : 'Sapphire or Emerald';
            errors.push(`${speciesId === 408 ? 'Latios' : 'Latias'} roamer must have ${gameName} as origin game`);
          }
        } else {
          // Static/event mode: Southern Island encounters require RSE
          if (![1, 2, 3].includes(currentOriginGame)) {
            errors.push('Latios and Latias must have Ruby, Sapphire, or Emerald as origin game');
          }
        }
      }
      // Kyogre (404)
      else if (speciesId === 404) {
        if (![1, 3].includes(currentOriginGame)) {
          errors.push('Kyogre must have Emerald or Sapphire as origin game');
        } else if (currentOriginGame === 1) {
          // Sapphire specific rules
          if (currentMetLocation !== 72) {
            errors.push('Kyogre from Sapphire must be caught at Cave of Origin');
          }
          if (metLevel !== 45) {
            errors.push('Kyogre from Sapphire must have met level 45');
          }
        }
      }
      // Groudon (405)
      else if (speciesId === 405) {
        if (![2, 3].includes(currentOriginGame)) {
          errors.push('Groudon must have Emerald or Ruby as origin game');
        } else if (currentOriginGame === 2) {
          // Ruby specific rules
          if (currentMetLocation !== 72) {
            errors.push('Groudon from Ruby must be caught at Cave of Origin');
          }
          if (metLevel !== 45) {
            errors.push('Groudon from Ruby must have met level 45');
          }
        }
      }
      // For other legendaries, check against default origin game
      else if (encounter.defaultOriginGame !== undefined) {
        if (currentOriginGame !== encounter.defaultOriginGame) {
          errors.push('Origin game cannot be changed for this legendary Pokémon');
        }
      }
      
      // Check fateful encounter requirement for specific legendaries
      // Mew (151), Lugia (249), Ho-Oh (250), Deoxys (410), Latios (408), Latias (407)
      // Roamers do NOT have fateful encounter
      const fatefulEncounterRequired = [151, 249, 250, 410, 408, 407];
      const fatefulCheckbox = $('#fatefulEncounter');
      
      if (currentEncounterMode === 'roamer') {
        // Roamers must NOT have fateful encounter
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Roaming legendaries do not have the fateful encounter flag');
        }
      } else if (fatefulEncounterRequired.includes(speciesId)) {
        // These Pokémon MUST have fateful encounter checked
        if (fatefulCheckbox && !fatefulCheckbox.checked) {
          errors.push('Fateful encounter must be checked for this legendary Pokémon');
        }
      } else {
        // All other Pokémon must NOT have fateful encounter checked
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Fateful encounter cannot be checked for this Pokémon');
        }
      }
      
      // Check ball legality for legendary mode
      const ballId = Number($('#ball').value) || 0;
      const legendLocId = Number($('#metLocation')?.value) || 0;
      if (ballId === 5 && !SAFARI_ZONE_IDS.includes(legendLocId)) {
        errors.push('Legendary Pokémon cannot be caught in a Safari Ball');
      }
      
      // Check illegal ribbons for legendary mode
      // Define legendary categories
      const xdColosseumDogs = [243, 244, 245]; // Raikou, Entei, Suicune
      const battleFrontierAllowed = [407, 408, 144, 145, 146, 401, 402, 403]; // Latias, Latios, Articuno, Zapdos, Moltres, Regirock, Regice, Registeel
      const battleFrontierBanned = [251, 150, 151, 406, 404, 405, 409, 410]; // Celebi, Mewtwo, Mew, Rayquaza, Kyogre, Groudon, Jirachi, Deoxys
      
      let illegalLegendaryRibbons = [];
      
      if (xdColosseumDogs.includes(speciesId)) {
        // XD/Colosseum dogs cannot have these ribbons
        illegalLegendaryRibbons = [
          { id: 'ribbonWorld', name: 'World' },
          { id: 'ribbonBattleChampion', name: 'Battle Champion' },
          { id: 'ribbonCountry', name: 'Country' },
          { id: 'ribbonNationalChampion', name: 'National Champion' },
          { id: 'ribbonRegionalChampion', name: 'Regional Champion' }
        ];
      } else if (battleFrontierAllowed.includes(speciesId)) {
        // Battle Frontier allowed legendaries
        illegalLegendaryRibbons = [
          { id: 'ribbonWorld', name: 'World' },
          { id: 'ribbonBattleChampion', name: 'Battle Champion' },
          { id: 'ribbonCountry', name: 'Country' },
          { id: 'ribbonNational', name: 'National' },
          { id: 'ribbonNationalChampion', name: 'National Champion' },
          { id: 'ribbonRegionalChampion', name: 'Regional Champion' }
        ];
      } else if (battleFrontierBanned.includes(speciesId)) {
        // Battle Frontier banned legendaries (most restrictive)
        illegalLegendaryRibbons = [
          { id: 'ribbonWorld', name: 'World' },
          { id: 'ribbonBattleChampion', name: 'Battle Champion' },
          { id: 'ribbonCountry', name: 'Country' },
          { id: 'ribbonNational', name: 'National' },
          { id: 'ribbonNationalChampion', name: 'National Champion' },
          { id: 'ribbonRegionalChampion', name: 'Regional Champion' },
          { id: 'ribbonVictory', name: 'Victory' },
          { id: 'ribbonWinning', name: 'Winning' }
        ];
      }
      
      illegalLegendaryRibbons.forEach(ribbon => {
        const ribbonEl = $(`#${ribbon.id}`);
        if (ribbonEl && ribbonEl.checked) {
          errors.push(`${ribbon.name} ribbon is illegal for this legendary Pokémon`);
        }
      });
    } else if (mode === 'roamer') {
      // ── Roamer legality checks ─────────────────────────────────
      if (!ROAMER_SPECIES_SET.has(speciesId)) {
        errors.push('This species is not a roaming legendary');
      } else {
        const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
        const currentOriginGame = Number($('#originGame').value) || 0;
        if (!allowedGames.includes(currentOriginGame)) {
          errors.push('Selected origin game is not valid for this roaming species');
        }
        // Met level must match roamer's fixed level
        const roamerLevel = ROAMER_SPECIES[speciesId]?.level || 0;
        if (metLevel !== roamerLevel) {
          errors.push(`Roamer met level must be ${roamerLevel}`);
        }
        // Check met location
        const expectedLoc = getRoamerMetLocation(speciesId);
        const currentMetLocation = Number($('#metLocation').value) || 0;
        if (currentMetLocation !== expectedLoc) {
          errors.push('Met location does not match this roaming species');
        }
        // Fateful encounter must be off for roamers
        const fatefulCheckbox = $('#fatefulEncounter');
        if (fatefulCheckbox && fatefulCheckbox.checked) {
          errors.push('Roaming legendaries do not have the fateful encounter flag');
        }
        // IV truncation check: non-Emerald roamers must have truncated IVs
        if (roamerHasTruncatedIVs(speciesId, currentOriginGame)) {
          const atkIV = Number($('#ivAtk').value) || 0;
          const defIV = Number($('#ivDef').value) || 0;
          const speIV = Number($('#ivSpe').value) || 0;
          const spaIV = Number($('#ivSpAtk').value) || 0;
          const spdIV = Number($('#ivSpDef').value) || 0;
          if (atkIV > 7) errors.push('Non-Emerald roamer ATK IV cannot exceed 7');
          if (defIV !== 0) errors.push('Non-Emerald roamer DEF IV must be 0');
          if (speIV !== 0) errors.push('Non-Emerald roamer Speed IV must be 0');
          if (spaIV !== 0) errors.push('Non-Emerald roamer SpAtk IV must be 0');
          if (spdIV !== 0) errors.push('Non-Emerald roamer SpDef IV must be 0');
        }
      }
    }
    
    return {
      legal: errors.length === 0,
      errors: errors,
      unknown: false
    };
  }

  /**
   * Update legality status display
   */
  function updateLegalityStatus() {
    const result = checkLegality();
    // If a mystery preset is active and the user modified fields since the
    // preset was applied (except nickname), present 'unknown' (grey) status
    // to indicate the preset may no longer match exactly.
    try {
      if (currentEncounterMode === 'mystery' && mysteryPresetAppliedFor && mysteryUserModifiedSincePreset) {
        result.unknown = true;
        // Prefer an explanatory message if none present
        if (!result.errors || !result.errors.length) result.errors = ['User-modified since mystery preset'];
      }
    } catch (e) {}
    // Global explanatory message for unknown/grey legality state
    const unknownLegalityMessage = "Unable to check legality with the current changes. Please export the pokemon to a pk3 or ek3 file below and open it in PkHex to confirm legality.";
    const statusEl = $('#legalityStatus');
    const iconEl = $('#legalityIcon');
    const textEl = $('#legalityText');
    
    if (result.unknown) {
      // Unknown/unsupported - show grey and display global explanatory message
      statusEl.className = 'unknown';
      iconEl.textContent = '?';
      iconEl.style.color = '#9ca3af';
      textEl.textContent = 'Legal?';
      textEl.style.color = '#9ca3af';
      statusEl.title = unknownLegalityMessage;
    } else if (result.legal) {
      statusEl.className = 'legal';
      iconEl.textContent = 'âœ“';
      iconEl.style.color = '#22c55e';
      textEl.textContent = 'Legal';
      textEl.style.color = '#22c55e';
      statusEl.title = 'This Pokémon passes all legality checks';
    } else {
      statusEl.className = 'illegal';
      iconEl.textContent = 'âœ—';
      iconEl.style.color = '#ef4444';
      textEl.textContent = 'Illegal';
      textEl.style.color = '#ef4444';
      statusEl.title = result.errors.join('\n');
    }
  }

  // Click handler to show legality errors
  $('#legalityStatus').addEventListener('click', () => {
    const result = checkLegality();
    const statusEl = $('#legalityStatus');
    const unknownMsg = "Unable to check legality with the current changes. Please export the pokemon to a pk3 or ek3 file below and open it in PkHex to confirm legality.";
    // If the UI currently shows 'unknown' (grey), present the global explanatory message
    if (statusEl && statusEl.className === 'unknown') {
      alert('Legality Unknown:\n\n' + unknownMsg);
      return;
    }
    if (result.unknown) {
      alert('Legality Unknown:\n\n• ' + result.errors.join('\n• '));
    } else if (!result.legal) {
      alert('Legality Issues:\n\n• ' + result.errors.join('\n• '));
    } else {
      alert('This Pokémon should be legal and transferrable to Pokémon Home.\n\nTo make sure, export the .ek3 file and load it up in PKHeX for validation.');
    }
  });

  // Create autocomplete fields for searchable dropdowns
  speciesAutocomplete = createAutocomplete($('#species'), SPECIES, {
    onSelect: (item) => {
      const speciesId = Number(item.id);
      // Update nickname when species is selected
      const species = SPECIES.find(s => s[0] === speciesId);
      if (species) {
        // Special handling for Mew (species ID 151)
        if (speciesId === 151) {
          // If Aura Mew event is active in mystery mode, enforce Aura Mew rules
          const currentTag = document.getElementById('mysteryEvent')?.value || '';
          if (currentEncounterMode === 'mystery' && String(currentTag).toUpperCase() === 'AURA_MEW') {
            $('#nickname').value = 'MEW';
            $('#otName').value = 'Aura';
            // Ensure language is within allowed set (EN/FR/IT/DE/ES)
            const allowed = new Set(['2','3','4','5','7']);
            const langSel = $('#language');
            if (langSel && !allowed.has(String(langSel.value))) {
              langSel.value = '2';
              try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
            }
            const fatefulCheckbox = $('#fatefulEncounter');
            if (fatefulCheckbox) fatefulCheckbox.checked = true;
          } else {
            $('#nickname').value = 'ミュウ'; // Mew in Japanese
            $('#otName').value = 'ミュウ';   // OT also Mew in Japanese
            $('#language').value = '1';      // Japanese language
            const fatefulCheckbox = $('#fatefulEncounter');
            if (fatefulCheckbox) {
              fatefulCheckbox.checked = true; // Enable fateful encounter
            }
          }
        }
        // Special handling for Celebi (species ID 251)
        else if (speciesId === 251) {
          const currentTag = document.getElementById('mysteryEvent')?.value || '';
          if (currentEncounterMode === 'mystery' && String(currentTag).toUpperCase() === 'JOURNEY_ACROSS_AMERICA') {
            $('#nickname').value = 'CELEBI';
            $('#language').value = '2'; // English
          } else {
            $('#nickname').value = 'ã‚»ãƒ¬ãƒ“ã‚£'; // Celebi in Japanese
            $('#language').value = '1';        // Japanese language
          }
        }
        else {
          $('#nickname').value = species[1].toUpperCase();
        }
      }
      // Update ability select based on species
      updateAbilitySelect(speciesId);
      // Update species sprite
      updateSpeciesSprite(speciesId);
      // Show/hide Unown form dropdown
      updateUnownFormVisibility(speciesId);
      // Uncheck shiny since species changed (gender ratios may differ)
      const shinyCheckbox = document.querySelector('#shiny');
      if (shinyCheckbox && shinyCheckbox.checked) {
        shinyCheckbox.checked = false;
        checkShiny();
      }
      // Reset PID Finder locks when species changes (result is no longer valid)
      if (pidFinderResultActive) unlockPidFinderFields();
      // Always update gender dropdown for selected species
      handleEncounterModeChange(speciesId);

      // Update move dropdowns to only show moves this species can learn.
      // In mystery mode, preserve already-set moves (may be special event moves).
      updateMovesForSpecies(speciesId, {
        preserveValue: currentEncounterMode === 'mystery'
      });

      // If we're in Mystery Gifts mode and an event is selected, apply any
      // per-species mystery preset (TID/SID/OT/PID/IVs) so the basics/stats
      // reflect the event immediately and are not overridden by other logic.
      if (!pidFinderResultActive && currentEncounterMode === 'mystery') {
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag) applyMysteryPresetForSpecies(speciesId);
      }
      // Validate form
      validateForm();
    }
  });
  
  // Apply initial species filter for default mode (breedable)
  updateSpeciesListForMode();
  // Filter out items with IDs 259-288 and 339-376
  const filteredItems = ITEMS.filter(([id, name]) => {
    return !((id >= 259 && id <= 288) || (id >= 339 && id <= 376));
  });
  createAutocomplete($('#item'), filteredItems, { placeholder: '— None —' });
  moveAutocompletes[0] = createAutocomplete($('#move1'), MOVES, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[1] = createAutocomplete($('#move2'), MOVES, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[2] = createAutocomplete($('#move3'), MOVES, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  moveAutocompletes[3] = createAutocomplete($('#move4'), MOVES, { placeholder: '— Empty —', onSelect: validateForm, masterList: MOVES });
  createAutocomplete($('#ball'), BALLS);
  
  // Set default ball to Poké Ball (ID 4)
  $('#ball').value = '4';
  
  // Create metLocation autocomplete with initial filtered list
  const initialGame = $('#originGame').value || '3';
  metLocationWrapper = createAutocomplete($('#metLocation'), getLocationsForGame(initialGame));
  
  // Set default met location to Mauville City (ID 9)
  $('#metLocation').value = '9';
  
  // Keep these as regular selects (small lists)
  fillSelect($('#nature'), NATURES.map((n,i)=>[n, String(i)]), { placeholder: null });
  fillSelect($('#language'), LANGUAGES.map(([name,id])=>[name,String(id)]), { placeholder: null });
  
  // Set default language to English (ID 2)
  $('#language').value = '2';
  // Disable Japanese option by default (we don't support the character set yet).
  try {
    const langSelInit = $('#language');
    if (langSelInit && langSelInit.options) {
      for (const o of Array.from(langSelInit.options)) {
        if (String(o.value) === '1') o.disabled = true;
      }
    }
  } catch (e) {}
  try { enforceJapaneseOption(); } catch (e) {}
  try { lockLanguageForMewLegend(); } catch (e) {}
  
  // Adjust nickname/OT maxlength based on language selection
  $('#language').addEventListener('change', () => {
    const languageId = $('#language').value;
    const isJapanese = languageId === '1'; // Japanese language ID
    
    // Japanese games limit to 5 characters, other languages use full byte limits
    $('#nickname').maxLength = isJapanese ? 5 : 10;
    $('#otName').maxLength = isJapanese ? 5 : 7;
    
    // Truncate existing values if they exceed new limits
    if ($('#nickname').value.length > $('#nickname').maxLength) {
      $('#nickname').value = $('#nickname').value.slice(0, $('#nickname').maxLength);
    }
    if ($('#otName').value.length > $('#otName').maxLength) {
      $('#otName').value = $('#otName').value.slice(0, $('#otName').maxLength);
    }

    // If we're in mystery mode and an event is selected, attempt to apply
    // the event-provided OT name for the chosen language.
    try {
      if (currentEncounterMode === 'mystery') {
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag && MYSTERY_EVENTS && MYSTERY_EVENTS[tag]) {
          const evt = MYSTERY_EVENTS[tag];
          const langKey = String($('#language')?.value || '');
          if (evt.ot_names && evt.ot_names[langKey]) {
            $('#otName').value = evt.ot_names[langKey];
            // update legality/status if needed
            try { updateLegalityStatus(); } catch (e) {}
            return;
          }
          // Fallback to generic ot_name if provided
          if (evt.ot_name) {
            $('#otName').value = evt.ot_name;
            try { updateLegalityStatus(); } catch (e) {}
            return;
          }
        }
      }
    } catch (e) {}
  });
  
  // Attach validation to relevant fields
  $('#species').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    // Recompute total EXP when species changes (exp group may differ)
    try { computeAndSetExpFromLevel(); } catch (e) {}
    // Clear error highlighting immediately on interaction
    $('#species').parentElement.classList.remove('field-error');
    try { lockLanguageForMewLegend(); } catch (e) {}
    try { enforceMewLegendMinLevel(); } catch (e) {}
    // Update sprite (covers imports / preset changes)
    updateSpeciesSprite(Number($('#species').value) || 0);
    // Update Unown form visibility (covers imports / mode changes)
    updateUnownFormVisibility(Number($('#species').value) || 0);
  });
  $('#species').addEventListener('input', () => {
    validateForm();
    updateLegalityStatus();
    try { computeAndSetExpFromLevel(); } catch (e) {}
    $('#species').parentElement.classList.remove('field-error');
  });
  $('#species').addEventListener('focus', () => {
    $('#species').parentElement.classList.remove('field-error');
  });
  $('#nature').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    $('#nature').classList.remove('field-error');
    // If we're in mystery event mode, apply the per-event preset for the
    // currently selected species so PID/IV from the JSON are used instead
    // of the simple-mode/randomized presets.
    try {
      if (!suppressPresetApply && !pidFinderResultActive && currentEncounterMode === 'mystery') {
        const sp = Number($('#species').value) || 0;
        if (sp) applyMysteryPresetForSpecies(sp);
      }
    } catch (e) {}
    // Re-apply roamer preset when nature changes (PID depends on nature)
    try {
      if (!suppressPresetApply && !pidFinderResultActive && currentEncounterMode === 'roamer') {
        const sp = Number($('#species').value) || 0;
        if (sp) applyRoamerPreset(sp);
      }
    } catch (e) {}
  });
  $('#nature').addEventListener('focus', () => {
    $('#nature').classList.remove('field-error');
  });
  $('#move1').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    refreshMoveExclusions();
    // Clear all move errors immediately
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move1').addEventListener('focus', () => {
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move2').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    refreshMoveExclusions();
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move2').addEventListener('focus', () => {
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move3').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    refreshMoveExclusions();
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move3').addEventListener('focus', () => {
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move4').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    refreshMoveExclusions();
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#move4').addEventListener('focus', () => {
    $('#move1').parentElement.classList.remove('field-error');
    $('#move2').parentElement.classList.remove('field-error');
    $('#move3').parentElement.classList.remove('field-error');
    $('#move4').parentElement.classList.remove('field-error');
  });
  $('#otName').addEventListener('input', () => {
    validateForm();
    updateLegalityStatus();
    $('#otName').classList.remove('field-error');
  });
  $('#otName').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
    $('#otName').classList.remove('field-error');
  });
  $('#otName').addEventListener('focus', () => {
    $('#otName').classList.remove('field-error');
  });
  
  // PID changes should trigger legality check (for legendary mode)
  const pidField = $('#pid');
  if (pidField) {
    pidField.addEventListener('input', updateLegalityStatus);
    pidField.addEventListener('change', updateLegalityStatus);
  }
  
  // Ribbon changes should trigger legality check
  const ribbonIds = [
    'ribbonWorld', 'ribbonBattleChampion', 'ribbonCountry', 'ribbonNational',
    'ribbonNationalChampion', 'ribbonRegionalChampion', 'ribbonVictory', 'ribbonWinning'
  ];
  
  ribbonIds.forEach(ribbonId => {
    const ribbonEl = $(`#${ribbonId}`);
    if (ribbonEl) {
      ribbonEl.addEventListener('change', updateLegalityStatus);
    }
  });
  
  // Fateful encounter checkbox should trigger legality check
  const fatefulEncounterCheckbox = $('#fatefulEncounter');
  if (fatefulEncounterCheckbox) {
    fatefulEncounterCheckbox.addEventListener('change', updateLegalityStatus);
  }
  
  // Run initial validation
  validateForm();
  updateLegalityStatus();
  
  // Update locations when origin game changes
  $('#originGame').addEventListener('change', (e) => {
    const newGame = e.target.value;

    // In roamer mode, re-apply roamer preset for the new game
    if (currentEncounterMode === 'roamer') {
      const speciesId = Number($('#species').value) || 0;
      if (speciesId && ROAMER_SPECIES[speciesId]) {
        // Update location list for the new game
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(newGame));
        }
        if (!pidFinderResultActive) applyRoamerPreset(speciesId);
      }
      updateLegalityStatus();
      return;
    }

    // In wild mode, delegate to the encounter filter (handles locations + level)
    if (currentEncounterMode === 'wild') {
      const speciesId = Number($('#species').value) || 0;
      updateWildEncounterFilters(speciesId);
      try { updateBallLocking(); } catch (e) {}
      updateLegalityStatus();
      return;
    }

    // Default: show all locations for the selected game
    const filteredLocations = getLocationsForGame(newGame);
    
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(filteredLocations);
    }
    
    // Update legality status when origin game changes
    updateLegalityStatus();
  });

  // Global listener to mark user modifications after a mystery preset is applied.
  // Any user-driven `input` or `change` (except `#nickname`) will flip the
  // `mysteryUserModifiedSincePreset` flag so the legality UI shows 'Legal?'.
  document.addEventListener('input', (e) => {
    if (suppressUserChangeMark) return;
    if (currentEncounterMode !== 'mystery') return;
    if (!mysteryPresetAppliedFor) return;
    const tgt = e.target || {};
    const id = tgt.id || '';
    if (!id) return;
    if (id === 'nickname') return; // nickname changes are allowed
    // If selected species differs from the preset species, ignore
    const curSpecies = Number($('#species')?.value) || 0;
    if (curSpecies !== Number(mysteryPresetAppliedFor)) return;
    mysteryUserModifiedSincePreset = true;
    try { updateLegalityStatus(); } catch (e) {}
  }, true);

  document.addEventListener('change', (e) => {
    if (suppressUserChangeMark) return;
    if (currentEncounterMode !== 'mystery') return;
    if (!mysteryPresetAppliedFor) return;
    const tgt = e.target || {};
    const id = tgt.id || '';
    if (!id) return;
    if (id === 'nickname') return;
    const curSpecies = Number($('#species')?.value) || 0;
    if (curSpecies !== Number(mysteryPresetAppliedFor)) return;
    mysteryUserModifiedSincePreset = true;
    try { updateLegalityStatus(); } catch (e) {}
  }, true);

  // Add legality check listeners for fields that affect legality
  const levelInput = $('#level');
  if (levelInput) {
    levelInput.addEventListener('input', updateLegalityStatus);
    levelInput.addEventListener('change', updateLegalityStatus);
  }
  
  const metLevelInput = $('#metLevel');
  if (metLevelInput) {
    metLevelInput.addEventListener('input', updateLegalityStatus);
    metLevelInput.addEventListener('change', updateLegalityStatus);
    // In wild mode, snap met level to closest valid encounter level on blur
    metLevelInput.addEventListener('blur', () => {
      if (currentEncounterMode !== 'wild') return;
      const spId   = Number($('#species').value) || 0;
      const gameId = Number($('#originGame').value) || 0;
      const locId  = Number($('#metLocation').value) || 0;
      const wId = WILD_ENCOUNTERS[spId] ? spId : getWildAncestor(spId, WILD_ENCOUNTERS);
      const enc = wId != null ? WILD_ENCOUNTERS[wId] : null;
      if (enc && enc[gameId] && enc[gameId][locId]) {
        const ranges = enc[gameId][locId];
        let v = Number(metLevelInput.value) || 0;
        metLevelInput.value = String(snapToValidLevel(ranges, v));
      }
    });
  }
  
  const metLocationInput = $('#metLocation');
  if (metLocationInput) {
    metLocationInput.addEventListener('change', () => {
      updateLegalityStatus();
      // Update ball locking for Safari Zone logic
      try { updateBallLocking(); } catch (e) {}
      // In wild mode, snap met level for the newly chosen location
      if (currentEncounterMode === 'wild') {
        const spId = Number($('#species').value) || 0;
        const gameId = Number($('#originGame').value) || 0;
        const locId  = Number($('#metLocation').value) || 0;
        const wId = WILD_ENCOUNTERS[spId] ? spId : getWildAncestor(spId, WILD_ENCOUNTERS);
        const enc = wId != null ? WILD_ENCOUNTERS[wId] : null;
        if (enc && enc[gameId] && enc[gameId][locId]) {
          const ranges = enc[gameId][locId];
          const ml = $('#metLevel');
          if (ml && ranges && ranges.length) {
            const absMin = ranges[0][0];
            const absMax = ranges[ranges.length - 1].length > 1 ? ranges[ranges.length - 1][1] : ranges[ranges.length - 1][0];
            ml.min = String(absMin);
            ml.max = String(absMax);
            ml.title = `Valid levels: ${rangesToLabel(ranges)}`;
            const cur = Number(ml.value) || 0;
            ml.value = String(snapToValidLevel(ranges, cur));
          }
        }
        // Unown: filter form dropdown to forms available in this chamber
        if (spId === 201) {
          filterUnownFormsByLocation();
        }
      }
    });
    metLocationInput.addEventListener('input', updateLegalityStatus);
  }
  
  const ballInput = $('#ball');
  if (ballInput) {
    ballInput.addEventListener('change', updateLegalityStatus);
    ballInput.addEventListener('input', updateLegalityStatus);
  }
  
  // IVs
  ['#ivHp', '#ivAtk', '#ivDef', '#ivSpAtk', '#ivSpDef', '#ivSpe'].forEach(ivField => {
    const element = $(ivField);
    if (element) {
      element.addEventListener('input', updateLegalityStatus);
      element.addEventListener('change', updateLegalityStatus);
    }
  });
  
  // EVs
  ['#evHp', '#evAtk', '#evDef', '#evSpAtk', '#evSpDef', '#evSpe'].forEach(evField => {
    const element = $(evField);
    if (element) {
      element.addEventListener('input', updateLegalityStatus);
      element.addEventListener('change', updateLegalityStatus);
    }
  });
  
  // Experience field (affects legality for level 5 base EXP check)
  const experienceInput = $('#experience');
  if (experienceInput) {
    experienceInput.addEventListener('input', updateLegalityStatus);
    experienceInput.addEventListener('change', updateLegalityStatus);
  }
  
  // Setup marking symbols - make them clickable
  document.querySelectorAll('.marking-symbol').forEach(symbol => {
    symbol.addEventListener('click', () => {
      const checkboxId = symbol.getAttribute('data-marking');
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        symbol.classList.toggle('active', checkbox.checked);
      }
    });
  });

  // Setup mode toggle
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.body.classList.remove('mode-simple', 'mode-advanced');
      document.body.classList.add(`mode-${e.target.value}`);
      try { updatePidLocking(); } catch (e) {}
    });
  });
  
  // Set initial mode
  document.body.classList.add('mode-simple');
  try { updatePidLocking(); } catch (e) {}

  // Setup encounter mode dropdown (was radio buttons)
  const encounterModeSelect = document.querySelector('#encounterMode');
  if (encounterModeSelect) {
    encounterModeSelect.addEventListener('change', (e) => {
      // Reset mode-specific state to avoid carryover between modes
      try { resetAllModeState(); } catch (ee) {}
      // Restore Origin Game dropdown options when leaving wild mode
      try { resetOriginGameOptions(); } catch (ee) {}
      // Restore full location list for the current origin game
      try {
        const curGame = $('#originGame').value || '3';
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(curGame));
        }
      } catch (ee) {}
      // Reset met level constraints and PID Finder lock
      try {
        const ml = $('#metLevel');
        if (ml) { ml.min = '0'; ml.max = '100'; ml.title = ''; }
      } catch (ee) {}
      pidFinderLockedMetLevel = false;
      // Reset PID Finder field locks when encounter mode changes
      if (pidFinderResultActive) unlockPidFinderFields();
      // Unlock CXD-specific field locks (origin game, met location, met level)
      const unlockEl = (el) => { if (!el) return; el.disabled = false; el.style.pointerEvents = ''; el.style.opacity = ''; el.style.cursor = ''; };
      unlockEl($('#originGame'));
      unlockEl($('#metLocation'));
      unlockEl($('#metLevel'));
      // Unlock any greyed-out origin game options from roamer mode
      try { unlockAllOriginGameOptions(); } catch (e) {}
      // Reset Make Shiny row visibility (let CSS handle it for non-CXD modes)
      const makeShinyRowEl = document.getElementById('makeShinyRow');
      if (makeShinyRowEl) makeShinyRowEl.style.display = '';
      currentEncounterMode = e.target.value;
      // For CXD mode, hide Make Shiny by default (shown per-encounter if Colosseum)
      if (currentEncounterMode === 'cxd_shadow' && makeShinyRowEl) makeShinyRowEl.style.display = 'none';
      // Add body classes for special encounter modes so CSS/JS can adjust visibility
      document.body.classList.toggle('encounter-wild', currentEncounterMode === 'wild');
      document.body.classList.toggle('encounter-static', currentEncounterMode === 'static');
      document.body.classList.toggle('encounter-roamer', currentEncounterMode === 'roamer');
      document.body.classList.toggle('encounter-mystery', currentEncounterMode === 'mystery');
      document.body.classList.toggle('encounter-cxd_shadow', currentEncounterMode === 'cxd_shadow');
      document.body.classList.toggle('encounter-imported', currentEncounterMode === 'imported');
      
      // Filter species list based on encounter mode
      updateSpeciesListForMode();
      // Toggle availability of Pokémon gender control based on mode
      try {
        const genderEl = document.querySelector('#gender');
        if (genderEl && !manualOverrideActive) genderEl.disabled = (currentEncounterMode === 'mystery');
      } catch (e) {}
      
      // When changing encounter mode, update the Pokémon if needed
      const speciesId = Number($('#species').value) || 0;
      handleEncounterModeChange(speciesId);
      // Re-apply move filtering for the current species
      if (speciesId) {
        updateMovesForSpecies(speciesId, {
          preserveValue: currentEncounterMode === 'mystery'
        });
      }
      // Update human-readable description under the selector
      try { setEncounterModeDescription(currentEncounterMode); } catch (e) {}
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      try { updateLevelLocking(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { enforceMewLegendMinLevel(); } catch (e) {}
      try { updateFatefulLocking(); } catch (e) {}
      try { updateShinyCheckboxState(); } catch (e) {}
    });
  }

  // Setup Manual Override checkbox
  const overrideCheckbox = document.querySelector('#manualOverride');
  if (overrideCheckbox) {
    overrideCheckbox.addEventListener('change', (e) => {
      manualOverrideActive = e.target.checked;
      // Clear PID Finder locks when override is toggled
      if (pidFinderResultActive) unlockPidFinderFields();
      // Re-run all locking functions — they will skip locks when override is active
      try { updateMetLevelLocking(); } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      try { updateLevelLocking(); } catch (e) {}
      try { updatePidLocking(); } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { updateFatefulLocking(); } catch (e) {}
      // Refresh move dropdowns — override shows all Gen 3 moves, normal re-applies learnset
      try {
        const speciesId = Number($('#species').value) || 0;
        if (speciesId) updateMovesForSpecies(speciesId, { preserveValue: true });
      } catch (e) {}
      // Unlock gender control if override is on
      try {
        const genderEl = document.querySelector('#gender');
        if (genderEl) {
          if (manualOverrideActive) {
            genderEl.disabled = false;
            genderEl.style.pointerEvents = '';
            genderEl.style.opacity = '';
            genderEl.style.cursor = '';
          } else {
            // Re-apply mode-specific gender locking
            const speciesId = Number($('#species').value) || 0;
            handleEncounterModeChange(speciesId);
          }
        }
      } catch (e) {}
    });
  }

  // Set the encounter mode description element text
  function setEncounterModeDescription(mode) {
    const el = document.getElementById('encounterModeDescription');
    if (!el) return;
    const map = {
      hatched: {label: 'Hatched', color: '#10b981', text: 'Pokémon that came from eggs, and not met in the wild. This mode is recommended for any Pokemon that can be obtained through breeding, as it allows full customization for IVs, shinyness, TID and SID.'},
      static: {label: 'Static', color: '#f59e0b', text: 'All static encounters: starters, fossils, gifts, game corner, stationary, legends, and events. IVs are hand picked for best possible per nature for Method 1. Use the PID searcher for custom PID/shininess.'},
      roamer: {label: 'Roamer', color: '#e879f9', text: 'Roaming legendaries (Latios, Latias, Raikou, Entei, Suicune). Uses Method 1 PID generation. Non-Emerald roamers have the IV truncation bug (only HP and partial ATK IVs are kept; DEF/SPE/SPA/SPD are forced to 0).'},
      wild: {label: 'Wild', color: '#60a5fa', text: 'Wild encounters (in the overworld). Recommended only if you prefer it looking like it was RNG manipulated. Uses Method 1 encounter slots to aim for best IVs per nature for each species. Use the PID searcher for custom PID/shininess.'},
      mystery: {label: 'Mystery Gifts', color: '#ef476f', text: 'Mystery Gift events — Get Distribution Event Pokémon! These have strict rules, so you may only change a few fields. IVs are hand picked for the best possible for each nature.'},
      cxd_shadow: {label: 'XD / Colosseum', color: '#a78bfa', text: 'Shadow Pokémon from Pokémon XD: Gale of Darkness and Pokémon Colosseum. Choose a species and encounter location, then use the PID Finder with CXD method. TID and SID must be a valid GameCube RNG pair.'},
      imported: {label: 'Imported', color: '#94a3b8', text: 'Pokémon imported from external data. All fields are unlocked via Manual Override. You can freely edit any field and generate the Pokémon.'}
    };
    const m = map[mode] || {label: '', color: '#94a3b8', text: ''};
    // Render pill + text so the description is clearly associated with the selected mode
    el.innerHTML = '';
    const pill = document.createElement('span');
    pill.className = 'mode-pill';
    pill.style.background = m.color;
    pill.textContent = m.label;
    const txt = document.createElement('span');
    txt.className = 'mode-desc-text';
    txt.textContent = m.text;
    el.appendChild(pill);
    el.appendChild(txt);
  }

  // Initialize description for the default/current encounter mode
  try { setEncounterModeDescription(currentEncounterMode); } catch (e) {}
  try { updateMetLevelLocking(); } catch (e) {}
  try { updateBallLocking(); } catch (e) {}
  try { updateLevelLocking(); } catch (e) {}
  try { updateFatefulLocking(); } catch (e) {}

  // Lock or unlock TID/SID inputs depending on selected mystery event.
  // If in `mystery` mode and a non-BOX_EVENT tag is selected, these should
  // be locked so users cannot change event-provided TID/SID values.
  function updateTidSidLocking() {
    try {
      const tidEl = $('#tid');
      const sidEl = $('#sid');
      const otEl = $('#otName');
      const tag = String($('#mysteryEvent')?.value || '').toUpperCase();
      const shouldLock = !manualOverrideActive && (currentEncounterMode === 'mystery' && tag && tag !== 'BOX_EVENT');
      if (tidEl) {
        tidEl.disabled = Boolean(shouldLock);
        tidEl.style.pointerEvents = shouldLock ? 'none' : '';
        tidEl.style.opacity = shouldLock ? '0.6' : '';
        tidEl.style.cursor = shouldLock ? 'not-allowed' : '';
      }
      if (sidEl) {
        sidEl.disabled = Boolean(shouldLock);
        sidEl.style.pointerEvents = shouldLock ? 'none' : '';
        sidEl.style.opacity = shouldLock ? '0.6' : '';
        sidEl.style.cursor = shouldLock ? 'not-allowed' : '';
      }
      if (otEl) {
        otEl.disabled = Boolean(shouldLock);
        otEl.style.pointerEvents = shouldLock ? 'none' : '';
        otEl.style.opacity = shouldLock ? '0.6' : '';
        otEl.style.cursor = shouldLock ? 'not-allowed' : '';
      }
    } catch (e) {}
  }

  // Lock PID input in advanced mode to prevent manual edits; it will still
  // be updated programmatically based on nature/gender/ability.
  function updatePidLocking() {
    try {
      const pidEl = $('#pid');
      if (!pidEl) return;
      const shouldLock = !manualOverrideActive && document.body.classList.contains('mode-advanced');
      pidEl.disabled = Boolean(shouldLock);
      pidEl.style.pointerEvents = shouldLock ? 'none' : '';
      pidEl.style.opacity = shouldLock ? '0.6' : '';
      pidEl.style.cursor = shouldLock ? 'not-allowed' : '';
    } catch (e) {}
  }

  /**
   * Unlock all fields that were locked by the PID Finder result.
   * Called when species or encounter mode changes, invalidating the previous result.
   */
  function unlockPidFinderFields() {
    pidFinderResultActive = false;
    pidFinderLockedMetLevel = false;
    const unlock = (el) => {
      if (!el) return;
      el.disabled = false;
      el.style.pointerEvents = '';
      el.style.opacity = '';
      el.style.cursor = '';
    };
    unlock($('#nature'));
    unlock($('#gender'));
    unlock($('#ability'));
    for (const id of ['ivHp','ivAtk','ivDef','ivSpAtk','ivSpDef','ivSpe']) {
      unlock($('#' + id));
    }
    // Also unlock Channel-specific fields if they were locked
    unlock($('#item'));
    unlock($('#otGender'));
    unlock($('#originGame'));
    try { updateTidSidLocking(); } catch (e) {}
    try { updateMetLevelLocking(); } catch (e) {}
  }

  // By default, Japanese (language id '1') is not selectable in the UI because
  // we don't support the required character set yet. Events that explicitly
  // require Japanese (provide a Japanese OT name or default language) may
  // programmatically set the language to Japanese — disabling the option only
  // prevents manual user selection.
  function enforceJapaneseOption(tag) {
    try {
      const langSel = $('#language');
      if (!langSel || !langSel.options) return;
      let allowJapanese = manualOverrideActive; // override unlocks all languages
      if (!allowJapanese) {
        const t = String(tag || '').toUpperCase();
        if (t && MYSTERY_EVENTS && MYSTERY_EVENTS[t]) {
          const evt = MYSTERY_EVENTS[t] || {};
          if (evt.defaultLanguage === 1) allowJapanese = true;
          if (evt.ot_names && evt.ot_names['1']) allowJapanese = true;
        }
      }
      for (const o of Array.from(langSel.options)) {
        if (String(o.value) === '1') {
          o.disabled = !allowJapanese;
        }
      }
    } catch (e) {}
  }

  // Show or hide the "Is Egg" row depending on current encounter mode.
  function updateIsEggVisibility() {
    try {
      const isEggInput = $('#isEgg');
      if (!isEggInput) return;
      const row = isEggInput.parentElement;
      if (!row) return;
      if (currentEncounterMode === 'hatched') {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    } catch (e) {}
  }

  // Lock/unlock the Fateful Encounter checkbox.
  // Disabled by default in all modes; only Manual Override unlocks it.
  function updateFatefulLocking() {
    const el = $('#fatefulEncounter');
    if (!el) return;
    if (manualOverrideActive) {
      el.disabled = false;
    } else {
      el.disabled = true;
    }
  }

  // Lock met level to 0 for hatched encounter mode, or keep it locked
  // if the PID Finder has set a specific level.
  function updateMetLevelLocking() {
    try {
      const metEl = $('#metLevel');
      if (!metEl) return;
      if (manualOverrideActive) {
        // Override: unlock met level for manual editing
        metEl.disabled = false;
        metEl.style.pointerEvents = '';
        metEl.style.opacity = '';
        metEl.style.cursor = '';
        return;
      }
      if (currentEncounterMode === 'hatched') {
        metEl.value = '0';
        metEl.disabled = true;
        metEl.style.pointerEvents = 'none';
        metEl.style.opacity = '0.6';
        metEl.style.cursor = 'not-allowed';
      } else if (pidFinderLockedMetLevel) {
        // PID Finder set a specific met level — keep it locked
        metEl.disabled = true;
        metEl.style.pointerEvents = 'none';
        metEl.style.opacity = '0.6';
        metEl.style.cursor = 'not-allowed';
      } else {
        metEl.disabled = false;
        metEl.style.pointerEvents = '';
        metEl.style.opacity = '';
        metEl.style.cursor = '';
      }
    } catch (e) {}
  }
      // Lock ball selection based on encounter mode and location.
      // Safari Zone locations (Hoenn 57, Kanto 136) require Safari Ball;
      // other wild/legendary locations cannot use Safari Ball.
      const SAFARI_ZONE_IDS = [57, 136];
      function updateBallLocking() {
        try {
          const ballEl = $('#ball');
          if (!ballEl) return;

          if (manualOverrideActive) {
            // Override: full ball list, unlocked
            if (ballEl.updateList) ballEl.updateList(BALLS);
            ballEl.disabled = false;
            ballEl.style.pointerEvents = '';
            ballEl.style.opacity = '';
            ballEl.style.cursor = '';
            return;
          }

          const locId = Number($('#metLocation')?.value) || 0;
          const isSafariZone = SAFARI_ZONE_IDS.includes(locId);

          if (isSafariZone) {
            // Safari Zone: force Safari Ball and lock, regardless of encounter mode
            if (ballEl.updateList) ballEl.updateList(BALLS);
            try { ballEl.value = '5'; } catch (e) {}
            ballEl.disabled = true;
            ballEl.style.pointerEvents = 'none';
            ballEl.style.opacity = '0.6';
            ballEl.style.cursor = 'not-allowed';
          } else if (currentEncounterMode === 'hatched') {
            // Hatched: force Poké Ball and lock
            if (ballEl.updateList) ballEl.updateList(BALLS);
            try { ballEl.value = '4'; } catch (e) {}
            ballEl.disabled = true;
            ballEl.style.pointerEvents = 'none';
            ballEl.style.opacity = '0.6';
            ballEl.style.cursor = 'not-allowed';
          } else if (currentEncounterMode === 'wild' || currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
            // Check if this static encounter has a fixed ball (starters, gifts, fossils, game corner)
            const speciesId = Number($('#species')?.value || 0);
            const currentGame = Number($('#originGame')?.value || 0);
            const detEnc = currentEncounterMode === 'static' ? getEncounterForSpecies(speciesId, currentGame) : null;
            if (detEnc && detEnc.fixedBall) {
              // Fixed ball: force it and lock
              if (ballEl.updateList) ballEl.updateList(BALLS);
              try { ballEl.value = String(detEnc.fixedBall); } catch (e) {}
              ballEl.disabled = true;
              ballEl.style.pointerEvents = 'none';
              ballEl.style.opacity = '0.6';
              ballEl.style.cursor = 'not-allowed';
            } else {
              // Wild/Static NOT at Safari Zone, no fixed ball: remove Safari Ball from options
              const filteredBalls = BALLS.filter(b => b[0] !== 5);
              if (ballEl.updateList) ballEl.updateList(filteredBalls);
              if (Number(ballEl.value) === 5) {
                try { ballEl.value = '4'; } catch (e) {}
              }
              ballEl.disabled = false;
              ballEl.style.pointerEvents = '';
              ballEl.style.opacity = '';
              ballEl.style.cursor = '';
            }
          } else {
            // Other modes: full ball list, unlocked
            if (ballEl.updateList) ballEl.updateList(BALLS);
            ballEl.disabled = false;
            ballEl.style.pointerEvents = '';
            ballEl.style.opacity = '';
            ballEl.style.cursor = '';
          }
        } catch (e) {}
      }

      // Lock language to Japanese for Mew when in Legendary encounter mode.
  function lockLanguageForMewLegend() {
    try {
      const langSel = $('#language');
      if (!langSel || !langSel.options) return;
      const speciesId = Number($('#species')?.value || 0);
      const isMew = speciesId === 151;
      if (!manualOverrideActive && currentEncounterMode === 'static' && isMew) {
        // Ensure Japanese option is enabled and select it, then disable the control
        for (const o of Array.from(langSel.options)) {
          if (String(o.value) === '1') o.disabled = false;
        }
        langSel.value = '1';
        langSel.disabled = true;
        langSel.style.pointerEvents = 'none';
        langSel.style.opacity = '0.6';
        langSel.style.cursor = 'not-allowed';
        // Lock OT name to the Japanese Mew name
        try {
          const otEl = $('#otName');
          if (otEl) {
            otEl.value = 'ミュウ';
            otEl.disabled = true;
            otEl.style.pointerEvents = 'none';
            otEl.style.opacity = '0.6';
            otEl.style.cursor = 'not-allowed';
          }
        } catch (e) {}
        // Lock nickname as well for legendary Mew
        try {
          const nickEl = $('#nickname');
          if (nickEl) {
            nickEl.value = 'ミュウ';
            nickEl.disabled = true;
            nickEl.style.pointerEvents = 'none';
            nickEl.style.opacity = '0.6';
            nickEl.style.cursor = 'not-allowed';
          }
        } catch (e) {}
      } else {
        // Restore language control to normal and re-apply Japanese availability rules
        langSel.disabled = false;
        langSel.style.pointerEvents = '';
        langSel.style.opacity = '';
        langSel.style.cursor = '';
        try { enforceJapaneseOption(); } catch (e) {}
        // Restore OT name control
        try {
          const otEl = $('#otName');
          if (otEl) {
            otEl.disabled = false;
            otEl.style.pointerEvents = '';
            otEl.style.opacity = '';
            otEl.style.cursor = '';
          }
        } catch (e) {}
        // Restore nickname control
        try {
          const nickEl = $('#nickname');
          if (nickEl) {
            nickEl.disabled = false;
            nickEl.style.pointerEvents = '';
            nickEl.style.opacity = '';
            nickEl.style.cursor = '';
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // Enforce minimum level and UI constraints for hatched mode.
  function updateLevelLocking() {
    try {
      const levelEl = $('#level');
      if (!levelEl) return;
      if (manualOverrideActive) {
        // Override: remove min constraints
        try { levelEl.min = '1'; } catch (e) {}
        return;
      }
      if (currentEncounterMode === 'hatched') {
        // set min attribute for better UX
        try { levelEl.min = '5'; } catch (e) {}
        // if current value is below 5, snap it up
        const cur = Number(levelEl.value) || 0;
        if (cur < 5) {
          levelEl.value = '5';
          try { computeAndSetExpFromLevel(); } catch (e) {}
          try { updateLegalityStatus(); } catch (e) {}
        }
      } else {
        try { levelEl.min = '1'; } catch (e) {}
      }
    } catch (e) {}
  }

    // Load mystery gift data (JSON) to populate event list
    async function loadMysteryGifts() {
      try {
        // Try fetching the JSON; try both encoded and plain filename variants
        let data = null;
        const pathsToTry = [
          'src/data/' + encodeURIComponent('Mystery gift pokemon gen 3.json'),
          'src/data/Mystery gift pokemon gen 3.json'
        ];
        for (const p of pathsToTry) {
          try {
            const res = await fetch(p);
            if (!res || !res.ok) continue;
            data = await res.json();
            break;
          } catch (e) {
            // try next
          }
        }
        if (!data) throw new Error('Failed to fetch mystery gifts JSON');

        // group individual pokemon entries by tag
        MYSTERY_GIFTS = {};
        for (const entry of data.pokemon || []) {
          const tag = entry.tag || 'UNKNOWN';
          if (!MYSTERY_GIFTS[tag]) MYSTERY_GIFTS[tag] = [];
          MYSTERY_GIFTS[tag].push(entry);
        }

        // load event-level metadata if present
        MYSTERY_EVENTS = data.events || {};

        // Try loading external moveset file to supply per-event moves
        try {
          const msRes = await fetch('src/data/gen3_event_movesets.json');
          if (msRes && msRes.ok) {
            const movesData = await msRes.json();
            const internalKeys = Object.keys(MYSTERY_EVENTS).length ? Object.keys(MYSTERY_EVENTS) : Object.keys(MYSTERY_GIFTS);
            const normalize = s => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
            // Explicit aliases checked FIRST so curated mappings always win
            // over heuristic species/name matching (critical when multiple
            // events share the same single species, e.g. Jirachi).
            const aliasMap = {
              'doeldeoxys': 'DOEL_DEOXYS',
              'pokemonrocksamerica2005': 'POKEMON_ROCKS_METANG',
              'partyofthedecade': 'PARTY_OF_THE_DECADE',
              'clubnintendojirachigiveaway': 'WISHMKR_BEST',
              'wishmkrjirachibestivs': 'WISHMKR_BEST',
              'wishmkrjirachiallshinypids': 'WISHMKR_SHINY'
            };
            for (const displayName of Object.keys(movesData || {})) {
              const movesForEvent = movesData[displayName];
              let found = null;

              // 1. Check explicit alias map first (highest priority)
              const nd = normalize(displayName);
              const rawLower = String(displayName || '').toLowerCase();
              const compact = rawLower.replace(/[^a-z0-9]/g,'');
              if (aliasMap[nd]) found = aliasMap[nd];
              else if (aliasMap[rawLower]) found = aliasMap[rawLower];
              else if (aliasMap[compact]) found = aliasMap[compact];

              // 2. Species-based matching
              if (!found) {
                const speciesNames = Object.keys(movesForEvent || {});
                const ids = new Set();
                for (const nm of speciesNames) {
                  const sp = SPECIES.find(s => String(s[1]).toLowerCase() === String(nm).toLowerCase());
                  if (sp) ids.add(Number(sp[0]));
                }
                if (ids.size) {
                  let bestSize = Infinity;
                  for (const k of internalKeys) {
                    const evt = MYSTERY_EVENTS[k];
                    let allowed = new Set();
                    if (evt && Array.isArray(evt.species)) {
                      for (const s of evt.species) allowed.add(Number(s));
                    } else if (MYSTERY_GIFTS[k]) {
                      for (const e of MYSTERY_GIFTS[k]) if (e.species) allowed.add(Number(e.species));
                    }
                    if (!allowed.size) continue;
                    let all = true;
                    for (const id of ids) if (!allowed.has(id)) { all = false; break; }
                    if (all && allowed.size < bestSize) { found = k; bestSize = allowed.size; }
                  }
                }
              }

              // 3. Fallback to name-based matching
              if (!found) {
                found = internalKeys.find(k => normalize(k) === nd || normalize(k).includes(nd) || nd.includes(normalize(k)));
                if (!found) {
                  const toks = String(displayName).split(/[_\- ]+/).filter(Boolean).reverse().join('');
                  found = internalKeys.find(k => normalize(k) === toks || normalize(k).includes(toks));
                }
              }
              if (found) {
                if (!MYSTERY_MOVESETS[found]) {
                  MYSTERY_MOVESETS[found] = { displayName, moves: {} };
                }
                // Merge moves from this file entry into any existing moves for
                // the resolved internal event key. This avoids later entries
                // overwriting earlier ones when multiple display names map to
                // the same internal event (and preserves all species moves).
                MYSTERY_MOVESETS[found].moves = Object.assign({}, MYSTERY_MOVESETS[found].moves || {}, movesForEvent || {});
                // Track alternate display names for diagnostics
                if (MYSTERY_MOVESETS[found].displayName !== displayName) {
                  if (!MYSTERY_MOVESETS[found].aliases) MYSTERY_MOVESETS[found].aliases = [MYSTERY_MOVESETS[found].displayName];
                  if (!MYSTERY_MOVESETS[found].aliases.includes(displayName)) MYSTERY_MOVESETS[found].aliases.push(displayName);
                }
              }
            }
          }
        } catch (e) {
          // non-fatal
        }

        // If any events include an event-level exp group, don't apply it globally.
        // Prefer explicit per-pokemon `expGroup` fields so each species keeps its own group.
        try {
          for (const [tag, evt] of Object.entries(MYSTERY_EVENTS || {})) {
            if (evt && (evt.defaultExpGroup || evt.default_exp_group)) {
              console.warn('Ignoring event-level defaultExpGroup for mystery event', tag);
            }
          }
        } catch (e) {}

        // Apply per-pokemon exp group mappings if present in the JSON entries.
        // JSON entries may provide `expGroup` (string like "MEDIUM_SLOW") or `exp_group`.
        try {
          for (const entry of data.pokemon || []) {
            if (!entry) continue;
            const sid = entry.species !== undefined ? Number(entry.species) : NaN;
            const eg = entry.expGroup ?? entry.exp_group ?? null;
            if (!Number.isFinite(sid) || !eg) continue;
            let groupVal = null;
            if (typeof eg === 'string') {
              const key = String(eg).toUpperCase();
              if (typeof GROUP !== 'undefined' && GROUP[key] !== undefined) groupVal = GROUP[key];
            } else if (typeof eg === 'number') {
              groupVal = Number(eg);
            }
            if (groupVal !== null) {
              EXP_GROUPS[sid] = groupVal;
              console.log('Mapped exp group for species', sid, '->', groupVal);
            }
          }
        } catch (e) {}

        // Populate event select from events object keys (fallback to tags found in pokemon)
        const eventSel = document.getElementById('mysteryEvent');
        if (eventSel) {
          eventSel.innerHTML = '';
          const placeholderOpt = document.createElement('option');
          placeholderOpt.value = '';
          placeholderOpt.textContent = '— Select event —';
          eventSel.appendChild(placeholderOpt);

          const keys = Object.keys(MYSTERY_EVENTS).length ? Object.keys(MYSTERY_EVENTS) : Object.keys(MYSTERY_GIFTS);
          const tags = keys.sort();
          for (const t of tags) {
            const o = document.createElement('option');
            o.value = t;
            // Friendly display: replace underscores with spaces, with special-case
            // rename for legacy 10ANNI tag.
            if (String(t).toUpperCase() === '10ANNI') {
              o.textContent = 'TOP 10 DISTRIBUTION POKÉMON';
            } else if (String(t).toUpperCase() === 'WISHMKR_BEST') {
              o.textContent = "WISHMKR JIRACHI - BEST IV'S";
            } else if (String(t).toUpperCase() === 'WISHMKR_SHINY') {
              o.textContent = "WISHMKR JIRACHI - ALL SHINY PID'S";
            } else if (String(t).toUpperCase() === 'CHANNEL_JIRACHI') {
              o.textContent = "CHANNEL JIRACHI";
            } else {
              o.textContent = t.replace(/_/g,' ');
            }
            eventSel.appendChild(o);
          }

          eventSel.addEventListener('change', () => {
            const tag = eventSel.value;
            console.log('Mystery event selected:', tag);
            // Unlock any PID Finder result from the previous event
            if (pidFinderResultActive) try { unlockPidFinderFields(); } catch (e) {}
            // Clear any previous event-specific UI state (ribbons, language disables)
            try { clearMysteryEventState(); } catch (e) {}
            // Apply event-level defaults
            applyEventDefaults(tag);
            try { updateMetLevelLocking(); } catch (e) {}

            // Update available species/options for this event
            updateSpeciesListForMode();
            // Also try to apply preset for selected species
            const sp = Number($('#species').value) || 0;
            if (sp) {
              // Update move dropdowns for the species learnset (preserve preset moves)
              updateMovesForSpecies(sp, { preserveValue: true });
              applyMysteryPresetForSpecies(sp);
            }
            // Update mystery species options (noop if selector removed)
            updateMysterySpeciesOptions(tag);
            try { updateTidSidLocking(); } catch (e) {}
              try { enforceJapaneseOption(tag); } catch (e) {}
              try { lockLanguageForMewLegend(); } catch (e) {}
            try { lockLanguageForMewLegend(); } catch (e) {}
          });
        }
      } catch (e) {
        console.warn('Failed to load mystery gifts JSON', e);
      }
    }
    loadMysteryGifts();

    // ── Static encounter category dropdown ──────────────────────────
    {
      const catSel = document.getElementById('staticCategory');
      if (catSel) {
        catSel.innerHTML = '';
        for (const cat of STATIC_CATEGORIES) {
          const o = document.createElement('option');
          o.value = cat.id;
          o.textContent = cat.label;
          catSel.appendChild(o);
        }
        catSel.addEventListener('change', () => {
          updateSpeciesListForMode();
          const sp = Number($('#species').value) || 0;
          if (sp) {
            handleEncounterModeChange(sp);
            updateMovesForSpecies(sp, { preserveValue: false });
          }
        });
      }
    }

    // Clear UI state that may have been set by a previously-selected mystery event
    function clearMysteryEventState() {
      try {
        // Re-enable all language options
        const langSel = $('#language');
        if (langSel && langSel.options) {
          for (const o of Array.from(langSel.options)) o.disabled = false;
        }

        // Uncheck event-specific ribbons that events might set
        const ribbonIds = ['ribbonWorld','ribbonBattleChampion','ribbonCountry','ribbonNational','ribbonNationalChampion','ribbonRegionalChampion','ribbonVictory','ribbonWinning'];
        for (const id of ribbonIds) {
          const el = $(`#${id}`);
          if (el) el.checked = false;
        }

        // Clear fateful flag (new event will set if needed)
        const f = $('#fatefulEncounter'); if (f) f.checked = false;
        // Re-enable all nature options (undo any event-specific restrictions)
        const natSel = $('#nature');
        if (natSel && natSel.options) {
          for (const o of Array.from(natSel.options)) {
            o.disabled = false;
          }
        }

        // Re-enable shiny checkbox (Channel Jirachi disables it)
        const shinyEl = $('#shiny');
        if (shinyEl) shinyEl.disabled = false;

        // Remove Channel-specific inline display overrides
        const pfRow = document.getElementById('pidFinderRow');
        if (pfRow) pfRow.style.removeProperty('display');
        try {
          const shinyExtRows = document.querySelectorAll('.shiny-external');
          for (const r of shinyExtRows) r.style.removeProperty('display');
        } catch (_) {}

        // Clear any mystery-preset tracking
        mysteryPresetAppliedFor = 0;
        mysteryUserModifiedSincePreset = false;
      } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}

    }

    // Apply a mystery event preset for a species (if entries exist for selected event)
    function applyMysteryPresetForSpecies(speciesId) {
      // Prevent our own programmatic changes from being treated as user edits
      suppressUserChangeMark = true;
      const rawTag = document.getElementById('mysteryEvent')?.value || '';
      if (!rawTag) { suppressUserChangeMark = false; return; }

      // Resolve common mismatches between event keys and per-pokemon tags.
      let tag = rawTag;
      if (!MYSTERY_GIFTS[tag]) {
        try {
          // Try reversed token order: DOEL_DEOXYS <-> DEOXYS_DOEL
          const toks = String(rawTag).split(/[_\- ]+/).filter(Boolean);
          if (toks.length > 1) {
            const rev = toks.slice().reverse().join('_');
            if (MYSTERY_GIFTS[rev]) tag = rev;
          }
        } catch (e) {}
      }
      // Fallback: case-insensitive contains/substring match
      if (!MYSTERY_GIFTS[tag]) {
        const low = String(rawTag).toLowerCase();
        const foundKey = Object.keys(MYSTERY_GIFTS).find(k => {
          const kl = String(k).toLowerCase();
          return kl === low || kl === low.replace(/[_\- ]+/g,'_') || kl.includes(low) || low.includes(kl);
        });
        if (foundKey) tag = foundKey;
      }
      if (!tag || !MYSTERY_GIFTS[tag]) { suppressUserChangeMark = false; return; }
      const natureIndex = Number($('#nature').value || 0);
      const natureName = NATURES[natureIndex] || '';

      // Diagnostics: log available entries and currently selected nature
      try {
        const candidateNatures = (MYSTERY_GIFTS[tag] || []).map(e => String(e.nature || ''));
        console.log('applyMysteryPresetForSpecies', { tag, speciesId, natureIndex, natureName, candidateNatures });
      } catch (e) {}

      // Build candidate list. Prefer exact-per-tag list, but if missing,
      // scan all per-pokemon entries for matching entry.tag values (handles
      // mismatches like DEOXYS_DOEL vs DOEL_DEOXYS).
      let candidates = [];
      if (MYSTERY_GIFTS[tag] && MYSTERY_GIFTS[tag].length) {
        candidates = MYSTERY_GIFTS[tag];
      } else {
        try {
          const rawLower = String(rawTag).toLowerCase();
          const rev = String(rawTag).split(/[_\- ]+/).filter(Boolean).reverse().join('_').toLowerCase();
          for (const k of Object.keys(MYSTERY_GIFTS)) {
            for (const e of (MYSTERY_GIFTS[k] || [])) {
              const etag = String(e.tag || '').toLowerCase();
              if (!etag) continue;
              if (etag === rawLower || etag === rev || etag.includes(rawLower) || rawLower.includes(etag)) {
                candidates.push(e);
              }
            }
          }
        } catch (e) {}
      }
      console.log('Mystery preset candidates count for', rawTag, candidates.length);
      const targetCanon = String(natureName || '').toLowerCase().replace(/[^a-z]/g, '');
      const entry = candidates.find(e => {
        const en = String(e.nature || '').toLowerCase().trim();
        if (!en) return false;
        if (en === String(natureName || '').toLowerCase()) return true;
        // If JSON used a numeric nature index
        if (!isNaN(Number(en)) && Number(en) === natureIndex) return true;
        // Canonical compare (ignore non-letters)
        const ec = en.replace(/[^a-z]/g, '');
        if (ec && ec === targetCanon) return true;
        return false;
      }) || candidates[0];
      if (!entry) { suppressUserChangeMark = false; return; }
      // Reset user-modified flag when applying preset
      mysteryUserModifiedSincePreset = false;
      // If entry contains pid/ivs, apply them
      const pidInput = $('#pid');
      if (pidInput && entry.pid) pidInput.value = String(entry.pid);
      if (entry.ivs && entry.ivs.length >= 6) {
        // JSON ivs order: [hp, atk, def, speed, sp.atk, sp.def] per notes
        $('#ivHp').value = String(entry.ivs[0]);
        $('#ivAtk').value = String(entry.ivs[1]);
        $('#ivDef').value = String(entry.ivs[2]);
        $('#ivSpe').value = String(entry.ivs[3]);
        $('#ivSpAtk').value = String(entry.ivs[4]);
        $('#ivSpDef').value = String(entry.ivs[5]);
      }
      if (entry.fixedTID !== undefined) $('#tid').value = String(entry.fixedTID);
      if (entry.fixedSID !== undefined) $('#sid').value = String(entry.fixedSID);
      if (entry.ot_name) $('#otName').value = entry.ot_name;
      if (entry.ot_gender) $('#otGender').value = entry.ot_gender.toLowerCase();
      // Apply moveset from external moveset mapping if available.
      // Use a resilient lookup: try the resolved tag, the raw selected tag,
      // the reversed-token variant, and normalized matching against keys.
      try {
        const normalizeKey = k => String(k||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        const raw = String(rawTag || '');
        const revRaw = String(rawTag).split(/[_\- ]+/).filter(Boolean).reverse().join('_');
        let ms = null;
        // Direct lookups
        if (tag && MYSTERY_MOVESETS[tag]) ms = MYSTERY_MOVESETS[tag];
        if (!ms && raw && MYSTERY_MOVESETS[raw]) ms = MYSTERY_MOVESETS[raw];
        if (!ms && revRaw && MYSTERY_MOVESETS[revRaw]) ms = MYSTERY_MOVESETS[revRaw];
        // Fallback: normalized name matching against available moveset keys
        if (!ms) {
          const nd = normalizeKey(raw);
          for (const k of Object.keys(MYSTERY_MOVESETS)) {
            const nk = normalizeKey(k);
            if (!nk) continue;
            if (nk === nd || nk.includes(nd) || nd.includes(nk)) { ms = MYSTERY_MOVESETS[k]; break; }
          }
        }
        // Final fallback: compare the moveset's displayName to the raw tag/display name
        if (!ms) {
          const rawNorm = normalizeKey(raw);
          for (const [k, v] of Object.entries(MYSTERY_MOVESETS)) {
            const disp = normalizeKey(v.displayName || '');
            if (!disp) continue;
            if (disp === rawNorm || disp.includes(rawNorm) || rawNorm.includes(disp)) { ms = v; break; }
          }
        }
        if (ms && ms.moves) {
          const speciesObj = SPECIES.find(s => Number(s[0]) === Number(speciesId));
          const speciesName = speciesObj ? String(speciesObj[1]) : null;
          // Try direct lookup by species name, then fallback to normalized name matching
          const normalizeName = s => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
          let moves = [];
          if (speciesName && ms.moves[speciesName]) {
            moves = ms.moves[speciesName] || [];
          } else if (speciesName) {
            const target = normalizeName(speciesName);
            const candidateKey = Object.keys(ms.moves || {}).find(k => {
              const nk = normalizeName(k);
              return nk === target || nk.includes(target) || target.includes(nk);
            });
            if (candidateKey) moves = ms.moves[candidateKey] || [];
          }
          for (let i = 0; i < 4; i++) {
            const el = $(`#move${i+1}`);
            if (!el) continue;
            const mv = moves[i];
            if (!mv) {
              el.value = '';
            } else if (mv.index !== undefined) {
              el.value = String(mv.index);
            } else if (typeof mv === 'number') {
              el.value = String(mv);
            } else {
              el.value = '';
            }
            try { el.dispatchEvent(new Event('change')); } catch (e) {}
          }
        }
      } catch (e) {}
      updateGenderFromPID();
      checkShiny();
      // Ensure gender is locked for mystery presets so it cannot be changed
      try {
        const g = $('#gender');
        if (currentEncounterMode === 'mystery' && g) {
          // If preset provided a gender explicitly in the entry, prefer it
          if (entry.gender) {
            g.value = String(entry.gender).toLowerCase();
          }
          g.style.pointerEvents = 'none';
          g.style.opacity = '0.6';
          g.style.cursor = 'not-allowed';
          g.disabled = true;
        }
      } catch (e) {}
          try { updateTidSidLocking(); } catch (e) {}
      // Mark which species the preset was applied for and update legality
      mysteryPresetAppliedFor = Number(speciesId) || 0;
      try { updateLegalityStatus(); } catch (e) {}
      // Re-enable marking of user changes after programmatic updates
      suppressUserChangeMark = false;
    }

    // The dedicated mystery-species select element was removed from the UI.
    // Keep a minimal no-op function so existing callers are safe and the
    // top-level `#mysteryEvent` dropdown continues to work without errors.
    function updateMysterySpeciesOptions(/*tag*/) {
      return; // noop — species selector was removed from the page
    }
  
  /**
   * Filter species list based on current encounter mode
   */
  function updateSpeciesListForMode() {
    if (!speciesAutocomplete) return;
    
    let filteredSpecies;
    switch(currentEncounterMode) {
      case 'hatched':
        // Exclude legendaries (only breedable pokemon), Ditto, and Unown (cannot be bred)
        // Also exclude placeholder/unknown species entries (names with '?')
        filteredSpecies = SPECIES.filter(s => !isLegendary(s[0]) && s[0] !== 132 && s[0] !== 201 && !String(s[1]||'').includes('?'));
        break;
      case 'static': {
        // Filter species by selected category
        const catVal = document.getElementById('staticCategory')?.value || '';
        if (catVal) {
          const catSpecies = new Set(getSpeciesForCategory(catVal));
          filteredSpecies = SPECIES.filter(s => catSpecies.has(s[0]));
        } else {
          // No category selected — show all static encounter species
          filteredSpecies = SPECIES.filter(s => STATIC_SPECIES_SET.has(s[0]));
        }
        break;
      }
      case 'wild':
        // Species with wild encounter data OR evolutions of wild species,
        // excluding placeholder/unknown species entries (names with '?')
        filteredSpecies = SPECIES.filter(s => wildPlusEvos.has(s[0]) && !String(s[1]||'').includes('?'));
        break;
      case 'mystery':
        // Only show species available in the selected mystery event (if specified)
        const selectedTag = document.getElementById('mysteryEvent')?.value || '';
        if (selectedTag && MYSTERY_EVENTS[selectedTag] && Array.isArray(MYSTERY_EVENTS[selectedTag].species)) {
          const allowed = new Set(MYSTERY_EVENTS[selectedTag].species.map(n => Number(n)));
          filteredSpecies = SPECIES.filter(s => allowed.has(s[0]));
        } else if (selectedTag && MYSTERY_GIFTS[selectedTag]) {
          const allowed = new Set();
          for (const e of MYSTERY_GIFTS[selectedTag]) if (e.species) allowed.add(Number(e.species));
          if (allowed.size) filteredSpecies = SPECIES.filter(s => allowed.has(s[0]));
          else filteredSpecies = SPECIES.filter(s => isGiftPokemon(s[0]));
        } else {
          // Fallback: show all gift event species
          filteredSpecies = SPECIES.filter(s => isGiftPokemon(s[0]));
        }
        break;
      case 'cxd_shadow':
        // Only show species with CXD shadow encounter data
        filteredSpecies = SPECIES.filter(s => CXD_SHADOW_SPECIES.has(s[0]));
        break;
      case 'roamer':
        // Only roamer species (Latios, Latias, Raikou, Entei, Suicune)
        filteredSpecies = SPECIES.filter(s => ROAMER_SPECIES_SET.has(s[0]));
        break;
      case 'imported':
        // All valid species
        filteredSpecies = SPECIES.filter(s => s[0] > 0 && !String(s[1]||'').includes('?'));
        break;
      default:
        filteredSpecies = SPECIES;
    }
    
    speciesAutocomplete.updateList(filteredSpecies);
  }

  /**
   * Handle encounter mode changes and apply appropriate PID/IV logic
   */
  function handleEncounterModeChange(speciesId) {
    const mode = currentEncounterMode;
    if (mode !== 'mystery') {
      mysteryPresetAppliedFor = 0;
      mysteryUserModifiedSincePreset = false;
    }
    const genderSelect = $('#gender');
    // Set gender options based on species gender threshold
    if (genderSelect) {
      const threshold = getGenderThreshold(speciesId);
      genderSelect.innerHTML = '';
      if (threshold === 255) {
        // Female only
        const opt = document.createElement('option');
        opt.value = 'female';
        opt.textContent = 'Female';
        genderSelect.appendChild(opt);
        genderSelect.value = 'female';
        genderSelect.disabled = true;
      } else if (threshold === 0) {
        // Male only
        const opt = document.createElement('option');
        opt.value = 'male';
        opt.textContent = 'Male';
        genderSelect.appendChild(opt);
        genderSelect.value = 'male';
        genderSelect.disabled = true;
      } else if (threshold === -1) {
        // Genderless
        const opt = document.createElement('option');
        opt.value = 'genderless';
        opt.textContent = 'Genderless';
        genderSelect.appendChild(opt);
        genderSelect.value = 'genderless';
        genderSelect.disabled = true;
      } else {
        // Both male and female
        const optM = document.createElement('option');
        optM.value = 'male';
        optM.textContent = 'Male';
        genderSelect.appendChild(optM);
        const optF = document.createElement('option');
        optF.value = 'female';
        optF.textContent = 'Female';
        genderSelect.appendChild(optF);
        genderSelect.disabled = false;
      }
      // If we're in mystery mode, lock the gender control so users cannot change it
      if (!manualOverrideActive && currentEncounterMode === 'mystery' && genderSelect) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
        genderSelect.disabled = true;
      }
    try { updateTidSidLocking(); } catch (e) {}
    }
    if (mode === 'static' && STATIC_ENCOUNTERS[speciesId]) {
      // For legendary encounters, apply preset data (skip when PID Finder is active)
      if (!pidFinderResultActive) applyStaticEncounterPreset(speciesId);
      // Make gender read-only for legendaries (can still update from PID, but user can't manually change)
      if (genderSelect && !pidFinderResultActive) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
      }
    } else if (mode === 'roamer') {
      // ── Roamer encounter mode ────────────────────────────────────
      // Lock gender (roamers are all genderless)
      if (genderSelect) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
      }
      // Apply roamer-specific defaults
      if (!pidFinderResultActive) applyRoamerPreset(speciesId);
    } else if (mode === 'hatched') {
      // Reset to hatched defaults when switching from legendaries
      const metLocationSelect = $('#metLocation');
      const metLevelInput = $('#metLevel');
      const levelInput = $('#level');
      const fatefulCheckbox = $('#fatefulEncounter');
      const originGameSelect = $('#originGame');
      // Re-enable gender selection
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      // Reset met location to Mauville City (location ID 9)
      if (metLocationSelect) {
        metLocationSelect.value = '9';
      }
      // Reset met level to 0 (hatched)
      if (metLevelInput) {
        metLevelInput.value = '0';
      }
      
      // Reset current level to 100
      if (levelInput) {
        levelInput.value = '100';
      }
      
      // Reset fateful encounter flag
      if (fatefulCheckbox) {
        fatefulCheckbox.checked = false;
      }
      
      // Reset origin game to Emerald (game ID 3)
      if (originGameSelect) {
        originGameSelect.value = '3';
      }

      // Restore full location list for Emerald
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame('3'));
      }
      // Re-set met location after the list is restored
      if (metLocationSelect) {
        metLocationSelect.value = '9';
      }
      
      // Reset IVs to 31
      $('#ivHp').value = '31';
      $('#ivAtk').value = '31';
      $('#ivDef').value = '31';
      $('#ivSpAtk').value = '31';
      $('#ivSpDef').value = '31';
      $('#ivSpe').value = '31';
      
      // Reset EVs to 0
      $('#evHp').value = '0';
      $('#evAtk').value = '0';
      $('#evDef').value = '0';
      $('#evSpAtk').value = '0';
      $('#evSpDef').value = '0';
      $('#evSpe').value = '0';
      
      // Update experience to match level 100
      computeAndSetExpFromLevel();
    } else if (mode === 'wild') {
      // For wild mode, re-enable gender selection and apply encounter filters
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }

      // Apply wild encounter filtering for origin game, met location, met level
      updateWildEncounterFilters(speciesId);

      // Re-check ball locking after location was set (may now be Safari Zone)
      try { updateBallLocking(); } catch (e) {}

      // Auto-select ability slot 0 for wild encounters
      const abilitySelect = $('#ability');
      if (abilitySelect) abilitySelect.value = '0';

        // Re-apply nature preset so PID/IV reflect the selected nature for wild mode
        // Skip during imports (suppressPresetApply) and when
        // PID Finder result is active to preserve their PID/IVs.
        if (!suppressPresetApply && !pidFinderResultActive) {
          const natureElLocal = document.querySelector('#nature');
          if (natureElLocal) {
            natureElLocal.dispatchEvent(new Event('change'));
          }
        }

      // Ensure ability is visibly selected after all preset logic
      if (abilitySelect && !abilitySelect.value) abilitySelect.value = '0';
    } else if (mode === 'cxd_shadow') {
      // CXD Shadow mode: populate shadow encounter sub-selector and auto-apply
      // Gender is NOT locked — user can choose gender freely
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
      // Lock origin game (always game ID 15 for CXD)
      const originGameEl = $('#originGame');
      if (originGameEl) {
        originGameEl.disabled = true;
        originGameEl.style.pointerEvents = 'none';
        originGameEl.style.opacity = '0.6';
        originGameEl.style.cursor = 'not-allowed';
      }
      // Lock met location (set by the shadow encounter preset)
      const metLocEl = $('#metLocation');
      if (metLocEl) {
        metLocEl.disabled = true;
        metLocEl.style.pointerEvents = 'none';
        metLocEl.style.opacity = '0.6';
        metLocEl.style.cursor = 'not-allowed';
      }
      // Lock met level (set by the shadow encounter preset)
      const metLvlEl = $('#metLevel');
      if (metLvlEl) {
        metLvlEl.disabled = true;
        metLvlEl.style.pointerEvents = 'none';
        metLvlEl.style.opacity = '0.6';
        metLvlEl.style.cursor = 'not-allowed';
      }
      // Update shiny checkbox state (CXD tooltip)
      try { updateShinyCheckboxState(); } catch (e) {}
      // Always populate the shadow encounter dropdown and auto-apply the preset.
      // Only skip auto-apply when PID Finder result is active.
      applyCXDShadowEncounterForSpecies(speciesId, !pidFinderResultActive);
    } else {
      // Fallback: re-enable gender selection
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }
    }
    // For 'wild' mode, use normal PID generation (already working)
    
    // Update legality status after mode change
    updateLegalityStatus();
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   *  CXD Shadow Encounter helpers
   * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  /**
   * Populate the #shadowEncounter dropdown with all encounters for the given
   * species, and auto-apply the first one.
   */
  function applyCXDShadowEncounterForSpecies(speciesId, applyPreset = true) {
    const encounters = getShadowEncountersForSpecies(speciesId);
    const sel = document.getElementById('shadowEncounter');
    if (!sel) return;
    sel.innerHTML = '';

    if (!encounters.length) {
      sel.innerHTML = '<option value="">— No encounters —</option>';
      try { updateMakeShinyVisibility(null); } catch (e) {}
      return;
    }

    // Build dropdown options:  "Trainer @ Location [###] (Game, Lv##)"
    for (let i = 0; i < encounters.length; i++) {
      const enc = encounters[i];
      const locPad = String(enc.location).padStart(3, '0');
      const gameLabel = enc.game === 'colo' ? 'Colo' : 'XD';
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${enc.trainer} @ ${enc.locationName} [${locPad}] (${gameLabel}, Lv${enc.level})`;
      sel.appendChild(opt);
    }
    sel.value = '0';
    // Apply the first encounter (or just update visibility when override is active)
    if (applyPreset) {
      applyCXDShadowPreset(encounters[0]);
    } else {
      // Still update Make Shiny button visibility based on selected encounter
      try { updateMakeShinyVisibility(encounters[0]); } catch (e) {}
    }
  }

  /**
   * Apply a single CXD shadow encounter preset to the form.
   * Sets origin game, met location, met level, level, moves, and fateful encounter.
   */
  function applyCXDShadowPreset(enc) {
    if (!enc) return;

    // Origin game: Colosseum/XD = game ID 15
    const originGameSelect = $('#originGame');
    if (originGameSelect) {
      originGameSelect.value = '15';
      // Refresh location list for Colosseum/XD
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(15));
      }
    }

    // Met location
    const metLocationSelect = $('#metLocation');
    if (metLocationSelect) {
      metLocationSelect.value = String(enc.location);
    }

    // Met level and level
    const metLevelInput = $('#metLevel');
    const levelInput = $('#level');
    if (metLevelInput) metLevelInput.value = String(enc.level);
    if (levelInput) levelInput.value = String(enc.level);
    computeAndSetExpFromLevel();

    // Moves
    const moveIds = enc.moves || [];
    for (let i = 0; i < 4; i++) {
      const moveEl = $(`#move${i + 1}`);
      if (moveEl) moveEl.value = String(moveIds[i] || 0);
    }
    // Show all moves in dropdown for this species so shadow moves are available
    updateMovesForSpecies(enc.species, { preserveValue: true });

    // Fateful encounter — all shadow Pokémon from Colosseum/XD are fateful
    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) fatefulCheckbox.checked = true;

    // National Ribbon — required for Colosseum/XD Pokémon to pass legality
    const nationalRibbonCb = $('#ribbonNational');
    if (nationalRibbonCb) nationalRibbonCb.checked = true;

    // IVs: reset to 31 (user can pick via PID Finder)
    $('#ivHp').value = '31';
    $('#ivAtk').value = '31';
    $('#ivDef').value = '31';
    $('#ivSpAtk').value = '31';
    $('#ivSpDef').value = '31';
    $('#ivSpe').value = '31';

    updateHiddenPower();
    try { validateForm(); } catch (e) {}
    try { updateGCTidSidWarning(); } catch (e) {}
    try { updateMakeShinyVisibility(enc); } catch (e) {}
  }

  /**
   * Show or hide the Make Shiny button for CXD shadow mode.
   * XD shadows are shiny-locked — hide the button.
   * Colosseum shadows are NOT shiny-locked — show the button.
   * For non-CXD modes, visibility is handled by the CSS `wild-or-legend` class.
   */
  function updateMakeShinyVisibility(enc) {
    const row = document.getElementById('makeShinyRow');
    if (!row) return;
    if (currentEncounterMode !== 'cxd_shadow') {
      // Non-CXD modes: let CSS handle visibility (wild-or-legend class)
      row.style.display = '';
      return;
    }
    // CXD mode: show only for Colosseum encounters
    if (enc && enc.game === 'colo') {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }

  // Wire up the shadow encounter dropdown change handler
  const shadowEncounterSel = document.getElementById('shadowEncounter');
  if (shadowEncounterSel) {
    shadowEncounterSel.addEventListener('change', () => {
      if (currentEncounterMode !== 'cxd_shadow') return;
      const speciesId = Number($('#species').value) || 0;
      const encounters = getShadowEncountersForSpecies(speciesId);
      const idx = Number(shadowEncounterSel.value) || 0;
      if (encounters[idx]) {
        applyCXDShadowPreset(encounters[idx]);
        updateMakeShinyVisibility(encounters[idx]);
      }
    });
  }

  /**
   * Check and display warning if TID/SID pair is invalid for GC RNG.
   * Only shown when in cxd_shadow mode.
   */
  function updateGCTidSidWarning() {
    const warningEl = document.getElementById('gcTidSidWarning');
    if (!warningEl) return;
    if (currentEncounterMode !== 'cxd_shadow') {
      warningEl.style.display = 'none';
      return;
    }
    const tid = Number($('#tid').value) & 0xFFFF;
    const sid = Number($('#sid').value) & 0xFFFF;
    const valid = isValidGCTidSid(tid, sid);
    warningEl.style.display = valid ? 'none' : '';
  }

  /**
   * Apply static encounter preset for a species.
   * Uses both the legacy STATIC_ENCOUNTERS keyed object (for fixed events)
   * and the new STATIC_ENCOUNTER_LIST (for per-game/category aware defaults).
   */
  function applyStaticEncounterPreset(speciesId) {
    const encounter = STATIC_ENCOUNTERS[speciesId];
    if (!encounter) return;

    // Do not apply static encounter presets while Mystery Gifts mode is active;
    // event defaults should take precedence for mystery events.
    if (currentEncounterMode === 'mystery') return;

    // Skip preset application during imports so imported PID/IVs are preserved,
    // and also when PID Finder result is active.
    if (suppressPresetApply || pidFinderResultActive) return;

    // Look up the detailed encounter entry from the new list.
    // Prefer matching by current origin game so that level/location are correct.
    const currentGame = Number($('#originGame')?.value || 0);
    const detailedEnc = getEncounterForSpecies(speciesId, currentGame);

    // Check if this is a fixed event (like WISHMKR Jirachi)
    if (encounter.fixedEvent) {
      // Set fixed TID/SID
      if (encounter.fixedTID !== undefined) {
        $('#tid').value = String(encounter.fixedTID);
      }
      if (encounter.fixedSID !== undefined) {
        $('#sid').value = String(encounter.fixedSID);
      }
      
      // Set fixed OT Name
      if (encounter.fixedOTName) {
        $('#otName').value = encounter.fixedOTName;
      }
      
      // Set fixed PID
      if (encounter.fixedPID !== undefined) {
        $('#pid').value = '0x' + encounter.fixedPID.toString(16).toUpperCase().padStart(8, '0');
        
        // Update nature from fixed PID
        const natureIndex = encounter.fixedPID % 25;
        $('#nature').value = String(natureIndex);
      }
      
      // Set fixed IVs
      if (encounter.fixedIVs) {
        $('#ivHp').value = encounter.fixedIVs.hp;
        $('#ivAtk').value = encounter.fixedIVs.atk;
        $('#ivDef').value = encounter.fixedIVs.def;
        $('#ivSpAtk').value = encounter.fixedIVs.spa;
        $('#ivSpDef').value = encounter.fixedIVs.spd;
        $('#ivSpe').value = encounter.fixedIVs.spe;
      }
      
      // Set fixed moves
      if (encounter.fixedMoves) {
        encounter.fixedMoves.forEach((move, index) => {
          const moveSlot = index + 1;
          const moveInput = $(`#move${moveSlot}`);
          if (moveInput && move.id) {
            moveInput.value = String(move.id);
          }
        });
        refreshMoveExclusions();
      }
    }

    // Use detailed encounter for origin game / location / level if available
    const gameId = detailedEnc ? detailedEnc.games[0] : encounter.defaultOriginGame;

    // Set origin game (do this BEFORE met location so the
    // location list contains the correct entries for this game)
    if (gameId !== undefined) {
      const originGameSelect = $('#originGame');
      if (originGameSelect) {
        originGameSelect.value = String(gameId);
        // Refresh location list for the new game
        if (metLocationWrapper && metLocationWrapper.updateList) {
          metLocationWrapper.updateList(getLocationsForGame(gameId));
        }
      }
    }

    // Set met location (prefer detailed encounter's location ID)
    const locationId = detailedEnc ? detailedEnc.location : encounter.defaultMetLocationId;
    if (locationId !== undefined) {
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        locationSelect.value = String(locationId);
      }
    } else if (encounter.defaultMetLocation) {
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        const location = LOCATIONS.find(loc => 
          loc[1] && loc[1].toLowerCase().includes(encounter.defaultMetLocation.toLowerCase())
        );
        if (location) {
          locationSelect.value = String(location[0]);
        }
      }
    }

    // Set met level and current level
    const metLevel = detailedEnc ? detailedEnc.level : encounter.defaultMetLevel;
    if (metLevel) {
      const metLevelInput = $('#metLevel');
      const levelInput = $('#level');
      if (metLevelInput) {
        metLevelInput.value = metLevel;
      }
      if (levelInput) {
        levelInput.value = metLevel;
      }
      computeAndSetExpFromLevel();
    }

    // Set fateful encounter flag from detailed encounter or legacy data
    const isFateful = detailedEnc ? !!detailedEnc.fateful : !!encounter.defaultFatefulEncounter;
    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) {
      fatefulCheckbox.checked = isFateful;
    }

    // Set default ribbons if specified
    if (encounter.defaultRibbons) {
      if (encounter.defaultRibbons.national !== undefined) {
        const nationalRibbon = $('#ribbonNational');
        if (nationalRibbon) {
          nationalRibbon.checked = encounter.defaultRibbons.national;
        }
      }
    }

    // Handle fixed ball from detailed encounter
    if (detailedEnc && detailedEnc.fixedBall) {
      try {
        const ballEl = $('#ball');
        if (ballEl) {
          ballEl.value = String(detailedEnc.fixedBall);
        }
      } catch (e) {}
    }

    // For non-fixed events, apply legendary PID and IV preset based on selected nature
    if (!encounter.fixedEvent) {
      const natureIndex = Number($('#nature').value || 0);
      const originGame = gameId || 2;
      const preset = getLegendaryPreset(natureIndex, originGame);
      
      if (preset) {
        // Set PID
        const pidInput = $('#pid');
        if (pidInput) {
          pidInput.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
        }

        // Set IVs
        if (preset.ivs) {
          $('#ivHp').value = preset.ivs.hp;
          $('#ivAtk').value = preset.ivs.atk;
          $('#ivDef').value = preset.ivs.def;
          $('#ivSpAtk').value = preset.ivs.spa;
          $('#ivSpDef').value = preset.ivs.spd;
          $('#ivSpe').value = preset.ivs.spe;
        }
      }
    }

    // Update gender and ability
    updateGenderFromPID();
    $('#ability').value = '0';

    // Check if shiny
    checkShiny();
    
    // Update legality status after applying preset
    updateLegalityStatus();

    console.log(`Applied legendary preset for species ${speciesId}`);
  }

  /**
   * Apply roamer encounter preset: sets origin game, met location, met level,
   * IVs (truncated for non-Emerald), and PID using Method 1.
   */
  function applyRoamerPreset(speciesId) {
    if (!ROAMER_SPECIES[speciesId]) return;
    if (suppressPresetApply || pidFinderResultActive) return;

    const info = ROAMER_SPECIES[speciesId];
    const originGameSelect = $('#originGame');
    const currentGame = Number(originGameSelect?.value || 0);

    // If current game is not valid for this roamer, auto-select the first allowed game
    let gameId = info.games.includes(currentGame) ? currentGame : info.games[0];

    // Set origin game
    if (originGameSelect) {
      originGameSelect.value = String(gameId);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(gameId));
      }
    }

    // Set met location (Roaming uses Route 101 for FRLG beasts, Route 101 for RSE Lati@s)
    const locId = getRoamerMetLocation(speciesId);
    const locationSelect = $('#metLocation');
    if (locationSelect) locationSelect.value = String(locId);

    // Set met level and current level
    const metLevelInput = $('#metLevel');
    const levelInput = $('#level');
    if (metLevelInput) metLevelInput.value = String(info.level);
    if (levelInput) levelInput.value = String(info.level);
    computeAndSetExpFromLevel();

    // Lock origin game, met location, met level (like CXD mode)
    if (!manualOverrideActive) {
      const lockEl = (el) => { if (!el) return; el.disabled = true; el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; el.style.cursor = 'not-allowed'; };
      lockEl($('#metLocation'));
      lockEl($('#metLevel'));
    }

    // Lock/grey games that are not allowed for this roamer species
    updateRoamerGameLocking(speciesId);

    // Set fateful encounter (roamers do NOT have fateful encounter)
    const fatefulCheckbox = $('#fatefulEncounter');
    if (fatefulCheckbox) {
      fatefulCheckbox.checked = false;
    }

    // Set IVs based on whether this roamer has the truncation bug
    const truncated = roamerHasTruncatedIVs(speciesId, gameId);
    const natureIndex = Number($('#nature').value || 0);
    const preset = getLegendaryPreset(natureIndex, gameId);
    if (preset && preset.ivs) {
      $('#ivHp').value = preset.ivs.hp;
      $('#ivAtk').value = truncated ? (preset.ivs.atk & 7) : preset.ivs.atk;
      $('#ivDef').value = truncated ? '0' : preset.ivs.def;
      $('#ivSpAtk').value = truncated ? '0' : preset.ivs.spa;
      $('#ivSpDef').value = truncated ? '0' : preset.ivs.spd;
      $('#ivSpe').value = truncated ? '0' : preset.ivs.spe;
    }

    // Apply PID from legendary preset (Method 1)
    if (preset) {
      const pidInput = $('#pid');
      if (pidInput) {
        pidInput.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
      }
    }

    updateGenderFromPID();
    $('#ability').value = '0';
    checkShiny();
    updateLegalityStatus();
  }

  /**
   * Lock/grey-out origin game options that are not allowed for the selected roamer species.
   * Called whenever the roamer species changes.
   */
  function updateRoamerGameLocking(speciesId) {
    const originGameSelect = $('#originGame');
    if (!originGameSelect) return;
    const allowedGames = ROAMER_GAMES_FOR_SPECIES[speciesId] || [];
    for (const opt of Array.from(originGameSelect.options)) {
      const gid = Number(opt.value);
      if (allowedGames.includes(gid)) {
        opt.disabled = false;
        opt.style.color = '';
      } else {
        opt.disabled = true;
        opt.style.color = '#666';
      }
    }
    // If current selection is not allowed, switch to first allowed
    const curGame = Number(originGameSelect.value);
    if (!allowedGames.includes(curGame) && allowedGames.length > 0) {
      originGameSelect.value = String(allowedGames[0]);
      // Re-apply preset with the corrected game
      if (!pidFinderResultActive && !suppressPresetApply) applyRoamerPreset(speciesId);
    }
  }

  /**
   * Unlock all origin game options (called when leaving roamer mode).
   */
  function unlockAllOriginGameOptions() {
    const originGameSelect = $('#originGame');
    if (!originGameSelect) return;
    for (const opt of Array.from(originGameSelect.options)) {
      opt.disabled = false;
      opt.style.color = '';
    }
  }

  /**
   * Get current encounter mode
   */
  function getEncounterMode() {
    return currentEncounterMode;
  }

  // Level input validation
  $('#level').addEventListener('input', (e) => {
    // Allow typing freely (don't enforce minimums while user types).
    try {
      const valRaw = e.target.value;
      if (valRaw === '') return; // allow empty while typing
      const val = Number(valRaw) || 0;
      if (val > 100) e.target.value = '100';
      // Do not force values <1 here to avoid snapping while typing (e.g., typing 74)
    } catch (e) {}
  });

  // Enforce bounds and event-specific minimums when the user leaves the field
  $('#level').addEventListener('blur', (e) => {
    try {
      let val = Number(e.target.value) || 0;
      if (val < 1) val = 1;
      // Enforce hatched minimum: snap up to 5 if in hatched mode
      try {
        if (currentEncounterMode === 'hatched' && val < 5) {
          val = 5;
        }
      } catch (eee) {}
      if (val > 100) val = 100;
        try {
        if (currentEncounterMode === 'mystery') {
          const tag = String(document.getElementById('mysteryEvent')?.value || '').toUpperCase();
          if (tag === '10ANNI' && val < 70) val = 70;
          else if (tag === 'AURA_MEW' && val < 10) val = 10;
          else if (tag === 'BOX_EVENT' && val < 5) val = 5;
          else if (tag === 'DOEL_DEOXYS' && val < 70) val = 70;
          else if (tag === 'JOURNEY_ACROSS_AMERICA' && val < 70) val = 70;
          else if (tag === 'PARTY_OF_THE_DECADE' && val < 70) val = 70;
          else if (tag === 'POKEMON_ROCKS_METANG' && val < 30) val = 30;
          else if ((tag === 'WISHMKR_BEST' || tag === 'WISHMKR_SHINY') && val < 5) val = 5;
          }
          // Legendary Mew: if in legendaries mode and species is Mew (151), enforce min level 30
          else if (currentEncounterMode === 'static') {
            try {
              const sp = Number($('#species')?.value || 0);
              if (sp === 151 && val < 30) val = 30;
            } catch (eee) {}
          }
          // CXD Shadow: current level must be >= met level
          if (currentEncounterMode === 'cxd_shadow') {
            try {
              const metLvl = Number($('#metLevel')?.value || 1);
              if (val < metLvl) val = metLvl;
            } catch (eee) {}
          }
      } catch (ee) {}
      if (String(e.target.value) !== String(val)) {
        e.target.value = String(val);
      }
      try { computeAndSetExpFromLevel(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
      // Re-filter moves: in non-hatched modes the available level-up moves
      // depend on the Pokémon's level, so update the dropdowns.
      try { refreshMoveExclusions(); } catch (e) {}
    } catch (e) {}
  });

  // EXP sync: when species or level changes, compute total EXP; when EXP edited (advanced), adjust level
  function computeAndSetExpFromLevel() {
    const sid = Number($('#species')?.value || 0);
    const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
    const lvl = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
    const exp = expForLevel(group, lvl);
    const expEl = document.querySelector('#expTotal');
    if (expEl) expEl.value = String(exp);
  }

  // Reset all mode-specific state to defaults to avoid carryover between modes
  function resetAllModeState() {
    try {
      const me = document.getElementById('mysteryEvent');
      if (me) {
        me.value = '';
        try { me.dispatchEvent(new Event('change')); } catch (e) {}
      }

      // Re-enable all language options and reset to English
      const langSel = $('#language');
      if (langSel && langSel.options) {
        for (const o of Array.from(langSel.options)) o.disabled = false;
        langSel.value = '2';
        try { langSel.dispatchEvent(new Event('change')); } catch (e) {}
      }

      // Reset origin/met/fateful/level/exp to sensible defaults
      const originGameSelect = $('#originGame'); if (originGameSelect) originGameSelect.value = '3';
      const metLocationSelect = $('#metLocation'); if (metLocationSelect) metLocationSelect.value = '9';
      const metLevelInput = $('#metLevel'); if (metLevelInput) metLevelInput.value = '0';
      const levelInput = $('#level'); if (levelInput) levelInput.value = '100';
      const expEl = $('#expTotal'); if (expEl) expEl.value = String(expForLevel(GROUP.MEDIUM_FAST, 100));
      const fateful = $('#fatefulEncounter'); if (fateful) fateful.checked = false;

      // Clear GC TID/SID warning and shadow encounter dropdown
      const gcWarn = document.getElementById('gcTidSidWarning');
      if (gcWarn) gcWarn.style.display = 'none';
      const shadowEnc = document.getElementById('shadowEncounter');
      if (shadowEnc) { shadowEnc.innerHTML = ''; }

      // Reset basic trainer info and PID/IVs to neutral values
      const tid = $('#tid'); if (tid) tid.value = '';
      const sid = $('#sid'); if (sid) sid.value = '';
      const otName = $('#otName'); if (otName) otName.value = '';
      const otGender = $('#otGender'); if (otGender) otGender.value = 'male';
      const pid = $('#pid'); if (pid) pid.value = '';
      ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'].forEach(id => { const el = $(id); if (el) el.value = '31'; });
    } catch (e) {}
  }

  // PID preset helpers: when in simple mode, select PID based on nature+gender.
  function getSelectedPreset(){
    const natureIndex = Number($('#nature').value || 0);
    const natureName = NATURES[natureIndex] || null;
    const gender = ($('#gender').value || 'male');
    if(!natureName) return null;
    const entry = PID_PRESETS[natureName];
    if(!entry) return null;
    // prefer explicit gender match, fallback to male, then female, then genderless
    return entry[gender] || entry.male || entry.female || entry.genderless || null;
  }

  function findPresetByPid(pid){
    const pidNum = parsePidInput(pid);
    for(const natureName of Object.keys(PID_PRESETS)){
      const entry = PID_PRESETS[natureName];
      for(const g of ['male','female','genderless']){
        if(entry && entry[g] && parsePidInput(entry[g].pid) === pidNum){
          return { nature: natureName, gender: g, preset: entry[g] };
        }
      }
    }
    return null;
  }

  function applyPresetIfSimple(){
    if (suppressPresetApply || pidFinderResultActive) return; 
    if (currentEncounterMode === 'mystery') return; // mystery uses its own presets
    if(document.body.classList.contains('mode-simple')){
      const preset = getSelectedPreset();
      if(preset){
        const pidEl = document.querySelector('#pid');
        if(pidEl) pidEl.value = '0x' + ((preset.pid >>> 0).toString(16).toUpperCase()).padStart(8,'0');
      }
    }
  }

  // When the PID input is changed (advanced mode or programmatic), if it matches a preset
  // update the IV inputs to reflect the preset IVs so advanced users see the correct IVs.
  // Also update the nature to match PID % 25 and check if shiny
  const pidEl = document.querySelector('#pid');
  if(pidEl){
    pidEl.addEventListener('input', (e) => {
      const val = parsePidInput(e.target.value);
      
      // Update nature to match PID
      const natureIndex = val % 25;
      const natureEl = document.querySelector('#nature');
      if(natureEl && natureEl.value !== String(natureIndex)){
        natureEl.value = String(natureIndex);
      }
      
      // Check if shiny
      checkShiny();
      
      // Update Unown form from PID
      updateUnownFormFromPID();
      // If Unown in wild mode, update met location to match new form
      if (Number($('#species')?.value || 0) === 201 && currentEncounterMode === 'wild') {
        filterUnownLocationsByForm();
      }
      
      // Check if PID matches a preset and update IVs
      // Skip when pidFinderResultActive so PID Finder results aren't overwritten
      if (!pidFinderResultActive) {
        const found = findPresetByPid(val);
        if(found && found.preset && found.preset.ivs){
          // populate IV inputs
          const ivs = found.preset.ivs;
          if(document.querySelector('#ivHp')) document.querySelector('#ivHp').value = String(ivs.hp);
          if(document.querySelector('#ivAtk')) document.querySelector('#ivAtk').value = String(ivs.atk);
          if(document.querySelector('#ivDef')) document.querySelector('#ivDef').value = String(ivs.def);
          if(document.querySelector('#ivSpAtk')) document.querySelector('#ivSpAtk').value = String(ivs.spa || ivs.spa === 0 ? ivs.spa : ivs.spa);
          if(document.querySelector('#ivSpDef')) document.querySelector('#ivSpDef').value = String(ivs.spd);
          if(document.querySelector('#ivSpe')) document.querySelector('#ivSpe').value = String(ivs.spe);
        }
      }
    });
  }

  // Check shiny status and update indicator
  checkShiny();

  // Also check shiny when TID or SID changes
  $('#tid').addEventListener('input', checkShiny);
  $('#sid').addEventListener('input', checkShiny);
  
  // Handle shiny checkbox
  const shinyCheckbox = $('#shiny');
  if (shinyCheckbox) {
    // Update checkbox disabled state when conditions change.
    // Do NOT disable while the user is typing a partial TID/SID; only
    // disable for mystery events that explicitly lock shininess.
    function updateShinyCheckboxState() {
      try {
        const shinyCheckboxLocal = $('#shiny');
        if (!shinyCheckboxLocal) return;
        // If we're in mystery mode and the selected event requests a shiny lock,
        // enforce it here. Otherwise keep the control enabled so the user can
        // toggle shiny while entering TID/SID.
        if (currentEncounterMode === 'mystery') {
          const tag = ($('#mysteryEvent') && $('#mysteryEvent').value) ? String($('#mysteryEvent').value).toUpperCase() : '';
          const evt = MYSTERY_EVENTS[tag];
          if (evt && evt.shinyLocked) {
            shinyCheckboxLocal.checked = false;
            shinyCheckboxLocal.disabled = true;
            shinyCheckboxLocal.title = 'This Pokémon is shiny locked!';
            return;
          }
        }
        // CXD shadow mode: shiny locked in-game, but user can still force-shiny by SID
        if (currentEncounterMode === 'cxd_shadow') {
          shinyCheckboxLocal.disabled = false;
          shinyCheckboxLocal.title = 'Shiny locked in-game — checking this adjusts your SID';
          return;
        }
        // Default: ensure enabled, clear tooltip
        shinyCheckboxLocal.disabled = false;
        shinyCheckboxLocal.title = '';
      } catch (e) {}
    }
    
    $('#tid').addEventListener('input', updateShinyCheckboxState);
    $('#sid').addEventListener('input', updateShinyCheckboxState);
    updateShinyCheckboxState(); // Initial check
    
    // When shiny checkbox is clicked
    shinyCheckbox.addEventListener('change', (e) => {
      const tid = Number($('#tid').value) & 0xFFFF;
      const natureIndex = Number($('#nature').value);
      const gender = $('#gender').value;
      const speciesId = Number($('#species').value) || 0;
      const ability = Number($('#ability').value);
      
      // For legendaries, wild, CXD shadow, and Box Event mystery gifts, adjust SID instead of PID
      const isBoxEvent = currentEncounterMode === 'mystery' && 
        String($('#mysteryEvent')?.value || '').toUpperCase() === 'BOX_EVENT';
      if (currentEncounterMode === 'static' || currentEncounterMode === 'wild' || currentEncounterMode === 'roamer' || currentEncounterMode === 'cxd_shadow' || isBoxEvent) {
        const pid = parsePidInput($('#pid').value);
        
        if (e.target.checked) {
          // Calculate SID to make this PID shiny
          // For shiny: (pidHigh ^ pidLow ^ tid ^ sid) < 8
          // We want xor = 0 for most reliable shiny (square shiny in later gens)
          const pidHigh = (pid >>> 16) & 0xFFFF;
          const pidLow = pid & 0xFFFF;
          const newSid = (pidHigh ^ pidLow ^ tid) & 0xFFFF;
          $('#sid').value = String(newSid);
        } else {
          // Calculate SID to make this PID non-shiny
          // For non-shiny: (pidHigh ^ pidLow ^ tid ^ sid) >= 8
          const pidHigh = (pid >>> 16) & 0xFFFF;
          const pidLow = pid & 0xFFFF;
          const xorBase = pidHigh ^ pidLow ^ tid;
          // Add a value >= 8 to ensure non-shiny
          const newSid = (xorBase ^ 8) & 0xFFFF;
          $('#sid').value = String(newSid);
        }
      } else {
        // For hatched mode, change PID as before
        const sid = Number($('#sid').value) & 0xFFFF;
        
        if (e.target.checked) {
          // Calculate a shiny PID with the correct gender and ability
          const shinyPID = calculateShinyPID(tid, sid, natureIndex, gender, speciesId, ability);
          $('#pid').value = '0x' + shinyPID.toString(16).toUpperCase().padStart(8, '0');
        } else {
          // Calculate a non-shiny PID with the correct gender and ability
          const nonShinyPID = calculateNonShinyPID(tid, sid, natureIndex, gender, speciesId, ability);
          $('#pid').value = '0x' + nonShinyPID.toString(16).toUpperCase().padStart(8, '0');
        }
        
        // Update gender based on new PID (should match what we requested)
        updateGenderFromPID();
        
        // Update ability based on new PID
        const abilityFromPID = ($('#pid').value ? parsePidInput($('#pid').value) & 1 : 0);
        const specId = Number($('#species').value) || 0;
        const specAbs = getSpeciesAbilities(specId);
        if (abilityFromPID === 1 && specAbs && specAbs[0] === specAbs[1]) {
          $('#ability').value = '0';
        } else {
          $('#ability').value = String(abilityFromPID);
        }
      }
      
      // Update shiny indicator
      checkShiny();
      
      // Update previous values so changes are detected
      if (typeof previousNature !== 'undefined') previousNature = String(natureIndex);
      if (typeof previousGender !== 'undefined') previousGender = gender;
      if (typeof previousAbility !== 'undefined') previousAbility = String(ability);
    });
  }
  
  // Update gender when PID changes
  const pidInput = $('#pid');
  if (pidInput) {
    pidInput.addEventListener('input', () => {
      updateGenderFromPID();
      checkShiny();
      updateMakeShinyButton();
    });
  }

  /* â”€â”€ Make Shiny button (adjusts SID to match current PID) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const makeShinyBtn = document.getElementById('makeShinyBtn');
  const makeShinyStatus = document.getElementById('makeShinyStatus');
  const shinyIndicatorBtn = document.getElementById('shinyIndicatorBtn');

  function updateMakeShinyButton() {
    if (!makeShinyBtn) return;
    const pid = parsePidInput($('#pid').value);
    const tid = Number($('#tid').value) & 0xFFFF;
    const sid = Number($('#sid').value) & 0xFFFF;
    const pidHigh = (pid >>> 16) & 0xFFFF;
    const pidLow = pid & 0xFFFF;
    const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
    const isShiny = xor < 8;

    if (isShiny) {
      makeShinyBtn.textContent = '\u2728 Undo Shiny';
      makeShinyBtn.classList.add('is-shiny');
    } else {
      makeShinyBtn.textContent = '\u2728 Make Shiny';
      makeShinyBtn.classList.remove('is-shiny');
    }
    if (shinyIndicatorBtn) {
      shinyIndicatorBtn.classList.toggle('active', isShiny);
    }
  }

  if (makeShinyBtn) {
    makeShinyBtn.addEventListener('click', () => {
      const pid = parsePidInput($('#pid').value);
      const tid = Number($('#tid').value) & 0xFFFF;
      const sid = Number($('#sid').value) & 0xFFFF;
      const pidHigh = (pid >>> 16) & 0xFFFF;
      const pidLow = pid & 0xFFFF;
      const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
      const isShiny = xor < 8;

      if (!isShiny) {
        // Make shiny: set SID so xor = 0 (pidHigh ^ pidLow ^ tid ^ newSid) = 0
        const newSid = (pidHigh ^ pidLow ^ tid) & 0xFFFF;
        $('#sid').value = String(newSid);
        if (makeShinyStatus) {
          makeShinyStatus.textContent = `SID set to ${newSid}`;
          makeShinyStatus.style.color = 'var(--emerald, #10b981)';
        }
      } else {
        // Undo shiny: set SID so xor >= 8
        const xorBase = pidHigh ^ pidLow ^ tid;
        const newSid = (xorBase ^ 8) & 0xFFFF;
        $('#sid').value = String(newSid);
        if (makeShinyStatus) {
          makeShinyStatus.textContent = `SID set to ${newSid}`;
          makeShinyStatus.style.color = 'var(--text-muted, #94a3b8)';
        }
      }

      checkShiny();
      updateMakeShinyButton();
      try { updateGCTidSidWarning(); } catch (e) {}
    });

    // Keep button state in sync when TID/SID change
    $('#tid').addEventListener('input', updateMakeShinyButton);
    $('#sid').addEventListener('input', updateMakeShinyButton);
    updateMakeShinyButton(); // Initial state
  }

  // Wire nature/gender changes to apply preset PID when in simple mode
  const natureEl = document.querySelector('#nature');
  const genderEl = document.querySelector('#gender');
  
  // Track previous values to detect actual changes
  let previousGender = genderEl ? genderEl.value : null;
  
  const abilityEl = document.querySelector('#ability');
  let previousAbility = abilityEl ? abilityEl.value : null;
  
  if(natureEl) {
    natureEl.addEventListener('change', () => {
      applyPresetIfSimple();
      
      // Always uncheck shiny when nature changes
      const shinyCheckbox = document.querySelector('#shiny');
      if (shinyCheckbox && shinyCheckbox.checked) {
        shinyCheckbox.checked = false;
      }
      
      // If we're in mystery mode, apply per-event presets first
      if (!suppressPresetApply && currentEncounterMode === 'mystery') {
        const speciesId = Number($('#species').value) || 0;
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag && MYSTERY_GIFTS[tag]) {
          applyMysteryPresetForSpecies(speciesId);
          return; // do not fall-through to other preset logic
        }
      }

      // If we're in legendaries, wild, or roamer mode, apply the per-nature legendary preset
      // Also skip when pidFinderResultActive (PID Finder selected a result)
      if (!suppressPresetApply && !pidFinderResultActive && (currentEncounterMode === 'static' || currentEncounterMode === 'wild' || currentEncounterMode === 'roamer')) {
        const speciesId = Number($('#species').value) || 0;
        const targetNature = Number(natureEl.value || 0);

        // Determine originGame: legendaries use the static encounter's defaultOriginGame,
        // wild/roamer uses the user's selected originGame (or default 2)
        let originGame = 2;
        if (currentEncounterMode === 'static') {
          const encounter = STATIC_ENCOUNTERS[speciesId];
          originGame = encounter?.defaultOriginGame || 2;
          // Only apply for actual legendary species in legendaries mode
          if (!isLegendary(speciesId)) {
            // skip applying preset
            originGame = null;
          }
        } else {
          // Wild/roamer mode: use the selected origin game if present
          const og = Number($('#originGame')?.value);
          originGame = Number.isFinite(og) && og > 0 ? og : 2;
        }

        if (originGame !== null) {
          const preset = getLegendaryPreset(targetNature, originGame);
          if (preset) {
            const pidEl = document.querySelector('#pid');
            if (pidEl) {
              pidEl.value = '0x' + preset.pid.toString(16).toUpperCase().padStart(8, '0');
            }

            if (preset.ivs) {
              // For truncated roamers, override IVs with truncated values
              if (currentEncounterMode === 'roamer' && roamerHasTruncatedIVs(speciesId, originGame)) {
                $('#ivHp').value = preset.ivs.hp;
                $('#ivAtk').value = preset.ivs.atk & 7;
                $('#ivDef').value = '0';
                $('#ivSpAtk').value = '0';
                $('#ivSpDef').value = '0';
                $('#ivSpe').value = '0';
              } else {
                $('#ivHp').value = preset.ivs.hp;
                $('#ivAtk').value = preset.ivs.atk;
                $('#ivDef').value = preset.ivs.def;
                $('#ivSpAtk').value = preset.ivs.spa;
                $('#ivSpDef').value = preset.ivs.spd;
                $('#ivSpe').value = preset.ivs.spe;
              }
            }

            // Update gender from PID
            updateGenderFromPID();

            // For legendaries/roamers, force ability to 0; for wild, derive ability bit from PID
            if (currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
              $('#ability').value = '0';
            } else {
              // Only set ability to 1 if the species actually has two different abilities
              const abilityBit = preset.pid & 1;
              const specAbilities = getSpeciesAbilities(speciesId);
              if (abilityBit === 1 && specAbilities && specAbilities[0] === specAbilities[1]) {
                $('#ability').value = '0'; // single-ability species, slot 1 doesn't exist in dropdown
              } else {
                $('#ability').value = String(abilityBit);
              }
            }

            updateLegalityStatus();
          }
        }
      } else if (!suppressPresetApply && !pidFinderResultActive) {
        // Normal mode: calculate PID to match the selected nature
        const pidEl = document.querySelector('#pid');
        if(pidEl){
          const currentPid = parsePidInput(pidEl.value);
          const targetNature = Number(natureEl.value || 0);
          const currentNature = currentPid % 25;
          
          // If PID is 0 or nature doesn't match, generate a new PID
          if(currentPid === 0 || currentNature !== targetNature){
            // Generate a new non-shiny PID with correct nature, gender, and ability
            const tid = Number($('#tid').value) & 0xFFFF;
            const sid = Number($('#sid').value) & 0xFFFF;
            const gender = $('#gender').value;
            const speciesId = Number($('#species').value) || 0;
            const ability = Number($('#ability').value);
            const newPid = calculateNonShinyPID(tid, sid, targetNature, gender, speciesId, ability);
            pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          }
        }
      }
      
      // Update shiny indicator after PID change
      checkShiny();
    });
  }
  if(genderEl) {
    genderEl.addEventListener('change', () => {
      const currentGender = genderEl.value;
      const actuallyChanged = currentGender !== previousGender;
      
      applyPresetIfSimple();
      
      // Only uncheck shiny if gender actually changed
      if (actuallyChanged) {
        const shinyCheckbox = document.querySelector('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          shinyCheckbox.checked = false;
          checkShiny();
        }
      }
      
      // Update previous value AFTER checking
      previousGender = currentGender;
      
      // Adjust PID to match the selected gender (works in both simple and advanced modes)
      const pidEl = document.querySelector('#pid');
      if(pidEl){
        const currentPid = parsePidInput(pidEl.value);
        const speciesId = Number($('#species').value) || 0;
        const genderThreshold = getGenderThreshold(speciesId);
        const currentGenderByte = currentPid & 0xFF;
        
        // Check if current PID matches selected gender
        let needsChange = false;
        if (currentGender === 'female' && currentGenderByte >= genderThreshold) {
          needsChange = true;
        } else if (currentGender === 'male' && currentGenderByte < genderThreshold) {
          needsChange = true;
        }
        
        if (needsChange) {
          // Generate a new non-shiny PID with correct nature, gender, and ability
          const tid = Number($('#tid').value) & 0xFFFF;
          const sid = Number($('#sid').value) & 0xFFFF;
          const natureIndex = Number($('#nature').value);
          const ability = Number($('#ability').value);
          const newPid = calculateNonShinyPID(tid, sid, natureIndex, currentGender, speciesId, ability);
          pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          checkShiny();
        }
      }
    });
  }
  
  if(abilityEl) {
    abilityEl.addEventListener('change', () => {
      const currentAbility = abilityEl.value;
      const actuallyChanged = currentAbility !== previousAbility;
      
      // Only uncheck shiny if ability actually changed
      if (actuallyChanged) {
        const shinyCheckbox = document.querySelector('#shiny');
        if (shinyCheckbox && shinyCheckbox.checked) {
          shinyCheckbox.checked = false;
          checkShiny();
        }
      }
      
      // Update previous value AFTER checking
      previousAbility = currentAbility;
      
      // Adjust PID to match the selected ability (works in both simple and advanced modes)
      const pidEl = document.querySelector('#pid');
      if(pidEl){
        const currentPid = parsePidInput(pidEl.value);
        const currentAbilityBit = currentPid & 1;
        const targetAbility = Number(currentAbility);
        
        if (currentAbilityBit !== targetAbility) {
          // Generate a new non-shiny PID with correct nature, gender, and ability
          const tid = Number($('#tid').value) & 0xFFFF;
          const sid = Number($('#sid').value) & 0xFFFF;
          const natureIndex = Number($('#nature').value);
          const gender = $('#gender').value;
          const speciesId = Number($('#species').value) || 0;
          const newPid = calculateNonShinyPID(tid, sid, natureIndex, gender, speciesId, targetAbility);
          pidEl.value = '0x' + newPid.toString(16).toUpperCase().padStart(8,'0');
          checkShiny();
        }
      }
    });
  }

  // When EXP is typed (advanced mode) update level to match
  const expEl = document.querySelector('#expTotal');
  if (expEl) {
    expEl.addEventListener('input', (e) => {
      const sid = Number($('#species')?.value || 0);
      const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
      // Cap at max EXP for level 100
      const maxExp = expForLevel(group, 100);
      const val = Math.max(0, Math.min(maxExp, Math.floor(Number(e.target.value) || 0)));
      e.target.value = String(val);
      const lvl = levelForExp(group, val);
      $('#level').value = String(lvl);
      try { refreshMoveExclusions(); } catch (ex) {}
    });
  }

  // Recompute when species or level changes
  speciesAutocomplete.addEventListener('change', computeAndSetExpFromLevel);
  $('#level').addEventListener('change', () => {
    computeAndSetExpFromLevel();
    refreshMoveExclusions();
  });
  // initialize
  computeAndSetExpFromLevel();

  // Move selection is handled by updateMovesForSpecies / refreshMoveExclusions
  // which filter by species learnset, encounter mode, level, and cross-slot dupes.

  // PP selects exist as dropdowns (0-3) so no typing clamp needed; keep them defaulted

  // IV and EV input handling: clamp values and enforce EV total
  const ivIds = ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'];
  const evIds = ['#evHp','#evAtk','#evDef','#evSpAtk','#evSpDef','#evSpe'];

  const clampInt = (v, min, max) => {
    if (v === '' || v === null) return '';
    const n = Number(v) || 0;
    if (n > max) return String(max);
    if (n < min) return String(min);
    return String(Math.floor(n));
  };

  // IVs: cap each at 31 and update Hidden Power
  ivIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 31);
      updateHiddenPower();
    });
  });
  
  // Initialize Hidden Power display
  updateHiddenPower();

  // Contest stats: cap each at 255
  const contestIds = ['#contestCool', '#contestBeauty', '#contestCute', '#contestSmart', '#contestTough', '#contestSheen'];
  contestIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 255);
    });
  });

  // EVs: cap each at 252 and ensure total <= 510 by reducing the changed field
  evIds.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('input', (e) => {
      // First cap the individual value to 252
      e.target.value = clampInt(e.target.value, 0, 252);

      // Then enforce total <= 510 by reducing this field if necessary
      const values = evIds.map(id => Number((document.querySelector(id)?.value) || 0));
      const sum = values.reduce((a,b)=>a+b,0);
      if (sum > 510) {
        const over = sum - 510;
        const cur = Number(e.target.value) || 0;
        const newVal = Math.max(0, cur - over);
        e.target.value = String(newVal);
      }
    });
  });

  // TID and SID: cap at 65535, and check GC RNG validity when in CXD shadow mode
  $('#tid').addEventListener('input', (e) => {
    e.target.value = clampInt(e.target.value, 0, 65535);
    try { updateGCTidSidWarning(); } catch (ex) {}
  });

  $('#sid').addEventListener('input', (e) => {
    e.target.value = clampInt(e.target.value, 0, 65535);
    try { updateGCTidSidWarning(); } catch (ex) {}
  });

  // Friendship: cap at 0-255
  const friendshipEl = document.querySelector('#friendship');
  if (friendshipEl) {
    friendshipEl.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 255);
    });
  }

  // Met Level: cap at 0-100
  const metLevelEl = document.querySelector('#metLevel');
  if (metLevelEl) {
    metLevelEl.addEventListener('input', (e) => {
      e.target.value = clampInt(e.target.value, 0, 100);
    });
  }


  // Output tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      // Update active tab content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector(`[data-tab-content="${tab}"]`)?.classList.add('active');
    });
  });

  $('#generateBtn').addEventListener('click', onGenerate);
  $('#copyHexBtn').addEventListener('click', ()=> {
    copy($('#hexOutput').value);
    showCopyConfirmation('copyHexCheck');
  });
  $('#copyBase64Btn').addEventListener('click', ()=> {
    copy($('#base64Output').value);
    showCopyConfirmation('copyBase64Check');
  });
  $('#loadFromHexBtn')?.addEventListener('click', onLoadFromHex);
  // Wire export/import buttons: keep .ek3 export, add .pk3 (decrypted) export,
  // and a unified Import Pokémon button that accepts .ek3 or .pk3 files.
  $('#exportEk3Btn')?.addEventListener('click', onExportPk3);
  $('#exportPk3Btn')?.addEventListener('click', () => {
    try {
      const cfg = collect();
      const bytes = buildDecryptedPokemonFile(cfg);
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const speciesEntry = SPECIES.find(s => s[0] === cfg.speciesId);
      const speciesName = speciesEntry ? String(speciesEntry[1]) : 'Pokemon';
      // Prefer species name for filenames; sanitize and collapse underscores
      const rawName = speciesName || 'Pokemon';
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Pokemon';
      a.download = `${safeName}.pk3`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('Error exporting .pk3 file: ' + err.message);
    }
  });
  $('#importPokemonBtn')?.addEventListener('click', ()=> { $('#pk3FileInput').click(); });
  $('#pk3FileInput').addEventListener('change', onImportPk3);

  // Import Modal wiring
  $('#openImportBtn')?.addEventListener('click', openImportModal);
  $('#importModalClose')?.addEventListener('click', closeImportModal);
  document.getElementById('importOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeImportModal();
  });
  document.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.import-tab-content').forEach(c => c.classList.remove('active'));
      const target = document.querySelector(`[data-import-tab-content="${btn.dataset.importTab}"]`);
      if (target) target.classList.add('active');
      const errEl = document.getElementById('importError');
      if (errEl) errEl.style.display = 'none';
    });
  });
  $('#importSmogonBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('importError');
    const input = document.getElementById('importSmogonInput')?.value || '';
    if (!input.trim()) {
      if (errEl) { errEl.textContent = 'Please paste a Smogon/Showdown set first.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      const parsed = parseSmogonSet(input);
      if (!parsed) {
        if (errEl) { errEl.textContent = 'Could not parse the set. Make sure the species name matches a Gen 3 Pokémon.'; errEl.style.display = 'block'; }
        return;
      }
      applySmogonImport(parsed);
      closeImportModal();
    } catch (e) {
      if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    }
  });
  $('#importHexBtn')?.addEventListener('click', () => {
    const errEl = document.getElementById('importError');
    const input = document.getElementById('importHexInput')?.value || '';
    if (!input.trim()) {
      if (errEl) { errEl.textContent = 'Please paste hex data first.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      onLoadFromHex(input);
      closeImportModal();
    } catch (e) {
      if (errEl) { errEl.textContent = 'Error: ' + e.message; errEl.style.display = 'block'; }
    }
  });
  $('#importFileBtn')?.addEventListener('click', () => {
    $('#pk3FileInput').click();
    const fileInput = document.getElementById('pk3FileInput');
    const closeOnce = () => {
      closeImportModal();
      fileInput.removeEventListener('change', closeOnce);
    };
    fileInput.addEventListener('change', closeOnce);
  });

  initPidFinder();
}

function copy(text){
  if(!text) return;
  navigator.clipboard.writeText(text).catch(()=>{});
}

function showCopyConfirmation(elementId){
  const el = $('#' + elementId);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
  }, 1500);
}

// Check shiny status and update indicator
function checkShiny() {
  const pid = parsePidInput($('#pid').value);
  const tid = Number($('#tid').value) & 0xFFFF;
  const sid = Number($('#sid').value) & 0xFFFF;
  
  const pidHigh = (pid >>> 16) & 0xFFFF;
  const pidLow = pid & 0xFFFF;
  const xor = (pidHigh ^ pidLow) ^ (tid ^ sid);
  const isShiny = xor < 8;
  
  // Update all shiny indicators (advanced mode, simple mode, and make-shiny button)
  const indicators = [document.querySelector('#shinyIndicator'), document.querySelector('#shinyIndicatorSimple'), document.querySelector('#shinyIndicatorBtn')];
  indicators.forEach(indicator => {
    if (indicator) {
      if (isShiny) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    }
  });
  
  // Update shiny checkbox to reflect current state
  const shinyCheckbox = $('#shiny');
  if (shinyCheckbox) {
    shinyCheckbox.checked = isShiny;
  }

  // Refresh sprite to show shiny/normal version
  updateSpeciesSprite(Number($('#species').value) || 0);
}

// Calculate a shiny PID for given TID/SID, nature, and gender
function calculateShinyPID(tid, sid, nature, targetGender, speciesId, ability) {
  // For a Pokémon to be shiny in Gen 3:
  // (pidHigh ^ pidLow ^ tid ^ sid) < 8
  // Nature = PID % 25
  // Gender is determined by lowest byte compared to species gender threshold
  // Ability = PID & 1 (0 or 1)
  
  const genderThreshold = getGenderThreshold(speciesId);
  
  // Handle genderless species
  if (genderThreshold === -1) {
    // Just generate any shiny PID with correct nature
    targetGender = 'genderless';
  }
  
  // Strategy: Build pidLow with gender, calculate pidHigh for shiny, then verify nature and ability
  let attempts = 0;
  const maxAttempts = 10000;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Determine gender byte (lowest byte of PID)
    let genderByte;
    if (targetGender === 'female') {
      // Female: genderByte must be < threshold
      if (genderThreshold > 0) {
        genderByte = Math.floor(Math.random() * genderThreshold);
      } else {
        continue; // Can't be female (male-only species)
      }
    } else if (targetGender === 'male') {
      // Male: genderByte must be >= threshold
      if (genderThreshold < 255) {
        genderByte = genderThreshold + Math.floor(Math.random() * (256 - genderThreshold));
      } else {
        continue; // Can't be male (female-only species)
      }
    } else {
      // Genderless - any byte
      genderByte = Math.floor(Math.random() * 256);
    }
    
    // Ensure genderByte matches ability (PID & 1 = ability)
    if ((genderByte & 1) !== ability) {
      // Flip the lowest bit to match ability
      genderByte ^= 1;
      // Check if this still satisfies gender constraints
      if (targetGender === 'female' && genderByte >= genderThreshold) continue;
      if (targetGender === 'male' && genderByte < genderThreshold) continue;
    }
    
    // Generate random second byte for lower 16 bits
    const byte1 = Math.floor(Math.random() * 256);
    
    // Construct pidLow (lower 16 bits)
    const pidLow = genderByte | (byte1 << 8);
    
    // Pick a random shiny XOR value (0-7)
    const shinyXor = Math.floor(Math.random() * 8);
    
    // Calculate pidHigh to make it shiny
    // shinyXor = pidHigh ^ pidLow ^ tid ^ sid
    // Therefore: pidHigh = shinyXor ^ pidLow ^ tid ^ sid
    const pidHigh = (shinyXor ^ pidLow ^ tid ^ sid) & 0xFFFF;
    
    // Construct full 32-bit PID
    const pid = ((pidHigh << 16) | pidLow) >>> 0;
    
    // Verify all constraints are met
    if ((pid & 0xFF) !== genderByte) continue;
    if (pid % 25 !== nature) continue;
    
    const verifyXor = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (tid ^ sid);
    if (verifyXor >= 8) continue;
    
    return pid;
  }
  
  // Fallback: return a non-shiny PID with correct nature and gender
  console.warn('Could not generate shiny PID after', maxAttempts, 'attempts');
  
  let genderByte;
  if (targetGender === 'female') {
    genderByte = Math.floor(Math.random() * 127);
  } else {
    genderByte = 127 + Math.floor(Math.random() * 129);
  }
  
  // Find byte1 for correct nature
  let byte1 = 0;
  for (let i = 0; i < 256; i++) {
    const pidLow = genderByte | (i << 8);
    if (pidLow % 25 === nature) {
      byte1 = i;
      break;
    }
  }
  
  const pidLow = genderByte | (byte1 << 8);
  const pidHigh = Math.floor(Math.random() * 0x10000);
  
  return ((pidHigh << 16) | pidLow) >>> 0;
}

function calculateNonShinyPID(tid, sid, nature, targetGender, speciesId, ability) {
  // Generate a PID with correct nature/gender/ability that is guaranteed NOT shiny
  const genderThreshold = getGenderThreshold(speciesId);
  
  if (genderThreshold === -1) {
    targetGender = 'genderless';
  }
  
  let attempts = 0;
  const maxAttempts = 10000;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Determine gender byte
    let genderByte;
    if (targetGender === 'female') {
      if (genderThreshold > 0) {
        genderByte = Math.floor(Math.random() * genderThreshold);
      } else {
        continue;
      }
    } else if (targetGender === 'male') {
      if (genderThreshold < 255) {
        genderByte = genderThreshold + Math.floor(Math.random() * (256 - genderThreshold));
      } else {
        continue;
      }
    } else {
      genderByte = Math.floor(Math.random() * 256);
    }
    
    // Ensure genderByte matches ability (PID & 1 = ability)
    if ((genderByte & 1) !== ability) {
      genderByte ^= 1;
      if (targetGender === 'female' && genderByte >= genderThreshold) continue;
      if (targetGender === 'male' && genderByte < genderThreshold) continue;
    }
    
    // Generate random second byte
    const byte1 = Math.floor(Math.random() * 256);
    const pidLow = genderByte | (byte1 << 8);
    
    // Generate random pidHigh
    const pidHigh = Math.floor(Math.random() * 0x10000);
    
    // Construct PID
    const pid = ((pidHigh << 16) | pidLow) >>> 0;
    
    // Verify it's the correct nature
    if (pid % 25 !== nature) continue;
    
    // Verify it's NOT shiny
    const xor = ((pid >>> 16) ^ (pid & 0xFFFF)) ^ (tid ^ sid);
    if (xor >= 8) {
      // Not shiny and correct nature/gender - perfect!
      return pid;
    }
  }
  
  // Fallback: just return any non-shiny PID with correct nature/gender
  let genderByte;
  if (targetGender === 'female') {
    genderByte = genderThreshold > 0 ? Math.floor(Math.random() * genderThreshold) : 0;
  } else if (targetGender === 'male') {
    genderByte = genderThreshold < 255 ? genderThreshold + Math.floor(Math.random() * (256 - genderThreshold)) : 255;
  } else {
    genderByte = Math.floor(Math.random() * 256);
  }
  
  let byte1 = 0;
  for (let i = 0; i < 256; i++) {
    const pidLow = genderByte | (i << 8);
    if (pidLow % 25 === nature) {
      byte1 = i;
      break;
    }
  }
  
  const pidLow = genderByte | (byte1 << 8);
  // Generate pidHigh that ensures non-shiny (XOR >= 8)
  const pidHigh = ((tid ^ sid ^ pidLow) + 8) & 0xFFFF;
  
  return ((pidHigh << 16) | pidLow) >>> 0;
}

// Update gender display based on PID
// In Gen 3, gender is determined by the lowest byte of PID vs species gender ratio
// For now, we'll just display the gender based on PID's lowest byte
// 0-126 = female for 50/50 species, 127-255 = male
function updateGenderFromPID() {
  const pidInput = $('#pid').value;
  if (!pidInput) return;
  
  const pid = parsePidInput(pidInput);
  const genderByte = pid & 0xFF;
  const speciesId = Number($('#species').value) || 0;
  const threshold = getGenderThreshold(speciesId);
  
  const genderSelect = $('#gender');
  if (genderSelect) {
    if (threshold === -1) {
      // Genderless - keep current selection or default to male
      return;
    } else if (threshold === 0) {
      genderSelect.value = 'male'; // Always male
    } else if (threshold === 255) {
      genderSelect.value = 'female'; // Always female
    } else {
      genderSelect.value = genderByte < threshold ? 'female' : 'male';
    }
  }
}

/* â”€â”€ PID Finder (RNG-legal PID search via Web Workers) â”€ */

let pfWorkers = [];
let pfWorkerSnapshots = [];
let pfAllResults = [];
let pfIsRoamerTruncated = false;

function initPidFinder() {
  const overlay  = document.getElementById('pidFinderOverlay');
  const btn      = document.getElementById('pidFinderBtn');
  const closeBtn = document.getElementById('pidFinderClose');
  const searchBtn   = document.getElementById('pfSearch');
  const stopBtn     = document.getElementById('pfStop');
  const progressFill = document.getElementById('pfProgressFill');
  const progressText = document.getElementById('pfProgressText');
  const resultsBody  = document.getElementById('pfResults');
  const resultCount  = document.getElementById('pfResultCount');
  const summaryEl    = document.getElementById('pidFinderSummary');
  const statusSpan   = document.getElementById('pidFinderStatus');

  if (!btn || !overlay) return;

  /* â”€â”€ Open / Close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function openModal() {
    // Populate summary from current form values
    const speciesId   = Number($('#species').value) || 0;
    const speciesEntry = SPECIES.find(s => s[0] === speciesId);
    const speciesName  = speciesEntry ? speciesEntry[1] : '\u2014';
    const natureIndex  = Number($('#nature').value || 0);
    const natureName   = NATURES[natureIndex] || '\u2014';
    const ability      = Number($('#ability').value);

    const originGameText = $('#originGame')?.selectedOptions?.[0]?.text || '\u2014';

    summaryEl.innerHTML = [
      `<span class="pf-tag">Species: <b>${speciesName}</b></span>`,
      `<span class="pf-tag">Nature: <b>${natureName}</b></span>`,
      `<span class="pf-tag">Game: <b>${originGameText}</b></span>`
    ].filter(Boolean).join('');

    /* â”€â”€ Populate PID Finder Gender selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const pfGenderSel     = document.getElementById('pfGender');
    const gender          = $('#gender').value || 'male';
    const genderThreshold = getGenderThreshold(speciesId);

    if (genderThreshold === -1) {
      // Genderless species – lock to Genderless
      pfGenderSel.innerHTML = '<option value="genderless">Genderless</option>';
      pfGenderSel.disabled = true;
    } else if (genderThreshold === 0) {
      // Always male
      pfGenderSel.innerHTML = '<option value="male">Male (fixed)</option>';
      pfGenderSel.disabled = true;
    } else if (genderThreshold >= 254) {
      // Always female
      pfGenderSel.innerHTML = '<option value="female">Female (fixed)</option>';
      pfGenderSel.disabled = true;
    } else {
      // Variable gender – offer choices with "Any" option
      pfGenderSel.innerHTML =
        '<option value="male">Male</option>' +
        '<option value="female">Female</option>' +
        '<option value="any">Any</option>';
      pfGenderSel.disabled = false;
      pfGenderSel.value = gender;  // pre-select from main form
    }

    /* â”€â”€ Populate PID Finder Ability selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const pfAbilitySel = document.getElementById('pfAbility');
    try {
      const abilities = getSpeciesAbilities(speciesId);
      if (abilities) {
        const [a0Id, a1Id] = abilities;
        const a0Name = getAbilityName(a0Id) || 'Slot 0';
        const a1Name = getAbilityName(a1Id) || 'Slot 1';
        if (a0Id === a1Id) {
          // Single ability – lock to slot 0 but show "Any" since both slots are same
          pfAbilitySel.innerHTML = `<option value="-1">${a0Name} (Any)</option>`;
          pfAbilitySel.disabled = true;
        } else {
          pfAbilitySel.innerHTML =
            `<option value="0">${a0Name} (Slot 0)</option>` +
            `<option value="1">${a1Name} (Slot 1)</option>` +
            '<option value="-1">Any</option>';
          pfAbilitySel.disabled = false;
          pfAbilitySel.value = String(ability);
        }
      } else {
        pfAbilitySel.innerHTML =
          '<option value="0">Slot 0</option>' +
          '<option value="1">Slot 1</option>' +
          '<option value="-1">Any</option>';
        pfAbilitySel.disabled = false;
        pfAbilitySel.value = String(ability);
      }
    } catch (_) {
      pfAbilitySel.innerHTML =
        '<option value="0">Slot 0</option><option value="1">Slot 1</option><option value="-1">Any</option>';
      pfAbilitySel.disabled = false;
    }

    /* â”€â”€ Populate TID / SID / Shiny from main form â”€â”€â”€â”€ */
    const pfTidEl   = document.getElementById('pfTid');
    const pfSidEl   = document.getElementById('pfSid');
    const pfShinyEl = document.getElementById('pfShiny');
    if (pfTidEl) { pfTidEl.value = String(Number($('#tid').value) || 0); pfTidEl.disabled = false; }
    if (pfSidEl) { pfSidEl.value = String(Number($('#sid').value) || 0); pfSidEl.disabled = false; }
    if (pfShinyEl) pfShinyEl.checked = !!$('#shiny')?.checked;

    /* â”€â”€ Adjust method checkboxes based on encounter mode â”€â”€ */
    const pfM1  = document.getElementById('pfMethod1');
    const pfM2  = document.getElementById('pfMethod2');
    const pfM4  = document.getElementById('pfMethod4');

    // Helper: relabel a checkbox's parent <label> without detaching the checkbox
    function relabelCheckbox(cb, text) {
      const lbl = cb.parentElement;
      if (!lbl) return;
      // Remove all text nodes, keep the checkbox
      Array.from(lbl.childNodes).forEach(n => { if (n.nodeType === 3) lbl.removeChild(n); });
      lbl.appendChild(document.createTextNode(' ' + text));
    }

    const currentGameId = Number($('#originGame').value) || 3;
    const isChannelPF = currentEncounterMode === 'mystery' &&
      String($('#mysteryEvent')?.value || '').toUpperCase() === 'CHANNEL_JIRACHI';

    if (isChannelPF) {
      // Channel Jirachi uses XDRNG Channel method only
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, 'Channel'); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
      // Lock TID to 40122, SID to 0 (SID comes from result)
      if (pfTidEl) { pfTidEl.value = '40122'; pfTidEl.disabled = true; }
      if (pfSidEl) { pfSidEl.value = '0'; pfSidEl.disabled = true; }
      // Gender: genderless (already handled above by threshold=-1)
      // Ability: lock (single ability Serene Grace)
    } else if (currentEncounterMode === 'cxd_shadow' || (currentEncounterMode === 'static' && currentGameId === 15)) {
      // CXD shadow encounters use CXD PRNG only
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, 'CXD'); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
    } else if (currentEncounterMode === 'static' || currentEncounterMode === 'roamer') {
      // Static and roamer encounters use Method 1 only
      const label = currentEncounterMode === 'roamer' ? 'Method H-1-Roaming' : 'Method 1';
      if (pfM1) { pfM1.checked = true;  pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, label); }
      if (pfM2) { pfM2.checked = false; pfM2.parentElement.style.display = 'none'; }
      if (pfM4) { pfM4.checked = false; pfM4.parentElement.style.display = 'none'; }
    } else {
      // Wild encounters use all three methods
      if (pfM1) { pfM1.checked = true; pfM1.parentElement.style.display = ''; relabelCheckbox(pfM1, 'Method H-1'); }
      if (pfM2) { pfM2.checked = true; pfM2.parentElement.style.display = ''; relabelCheckbox(pfM2, 'Method H-2'); }
      if (pfM4) { pfM4.checked = true; pfM4.parentElement.style.display = ''; relabelCheckbox(pfM4, 'Method H-4'); }
    }

    // Reset state
    resultsBody.innerHTML = '';
    resultCount.textContent = '';
    progressFill.style.width = '0%';
    progressText.textContent = 'Ready';
    searchBtn.disabled = false;
    stopBtn.disabled   = true;
    pfAllResults = [];

    overlay.classList.add('open');
  }

  function closeModal() {
    overlay.classList.remove('open');
    stopSearch();
  }

  btn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  /* â”€â”€ Stop running workers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function stopSearch() {
    pfWorkers.forEach(w => { try { w.postMessage({ stop: true }); } catch (_) {} });
    pfWorkers.forEach(w => { try { w.terminate(); } catch (_) {} });
    pfWorkers = [];
    // Merge whatever snapshots we have from the workers so far
    pfAllResults = [];
    for (const snap of pfWorkerSnapshots) {
      if (snap) pfAllResults.push(...snap);
    }
    displayResults();
    searchBtn.disabled = false;
    stopBtn.disabled   = true;
    progressText.textContent = pfAllResults.length ? 'Stopped (partial)' : 'Stopped';
  }
  stopBtn.addEventListener('click', stopSearch);

  /* â”€â”€ Start search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  searchBtn.addEventListener('click', () => {
    const speciesId      = Number($('#species').value) || 0;
    const nature         = Number($('#nature').value || 0);
    let   ability        = Number(document.getElementById('pfAbility').value);
    const pfGenderVal    = document.getElementById('pfGender').value;
    const genderThreshold = getGenderThreshold(speciesId);
    const tid = Number(document.getElementById('pfTid').value) & 0xFFFF;
    const sid = Number(document.getElementById('pfSid').value) & 0xFFFF;
    const wantShiny = !!document.getElementById('pfShiny')?.checked;

    // Map gender to numeric code for worker: 0=female 1=male 2=genderless 3=any
    let targetGender;
    if (genderThreshold === -1)        targetGender = 2;       // genderless
    else if (genderThreshold === 0)    targetGender = 1;       // always male
    else if (genderThreshold >= 254)   targetGender = 0;       // always female
    else if (pfGenderVal === 'any')    targetGender = 3;       // any (skip filter)
    else                               targetGender = (pfGenderVal === 'female') ? 0 : 1;

    const clamp = (id) => Math.max(0, Math.min(31, Number(document.getElementById(id).value) || 0));
    const minIVs = [clamp('pfMinHp'), clamp('pfMinAtk'), clamp('pfMinDef'),
                    clamp('pfMinSpA'), clamp('pfMinSpD'), clamp('pfMinSpe')];
    const clampMax = (id) => { const v = Number(document.getElementById(id).value); return Number.isFinite(v) ? Math.max(0, Math.min(31, v)) : 31; };
    const maxIVs = [clampMax('pfMaxHp'), clampMax('pfMaxAtk'), clampMax('pfMaxDef'),
                    clampMax('pfMaxSpA'), clampMax('pfMaxSpD'), clampMax('pfMaxSpe')];

    // For roamer mode with IV truncation bug, the RNG still generates normal
    // Method 1 IVs; the game then truncates the IV data in memory.
    // We search with unconstrained IVs and post-process results below.
    pfIsRoamerTruncated = currentEncounterMode === 'roamer' &&
      roamerHasTruncatedIVs(speciesId, Number($('#originGame').value) || 3);

    const methods = [
      document.getElementById('pfMethod1').checked,
      document.getElementById('pfMethod2').checked,
      document.getElementById('pfMethod4').checked
    ];
    if (!methods[0] && !methods[1] && !methods[2]) { alert('Select at least one method.'); return; }

    // Reset UI
    resultsBody.innerHTML = '';
    resultCount.textContent = '';
    pfAllResults = [];
    progressFill.style.width = '0%';
    progressText.textContent = 'Searching\u2026';
    searchBtn.disabled = true;
    stopBtn.disabled   = false;

    // Determine which worker to use
    const gameId     = Number($('#originGame').value) || 3;
    const isChannelSearch = currentEncounterMode === 'mystery' &&
      String($('#mysteryEvent')?.value || '').toUpperCase() === 'CHANNEL_JIRACHI';
    const isCXD      = !isChannelSearch && (currentEncounterMode === 'cxd_shadow' || (currentEncounterMode === 'static' && gameId === 15));
    const workerPath = isChannelSearch
      ? './src/lib/gen3/channel-worker.js'
      : isCXD ? './src/lib/gen3/cxd-worker.js' : './src/lib/gen3/rng-worker.js';

    // Decide fast-path (IV recovery) vs brute-force (full seed scan).
    // IV recovery enumerates HP/ATK/DEF combos × 131 k inner checks instead
    // of scanning all 2³² seeds, so one worker finishes almost instantly
    // when the user asks for high minimum IVs.
    const iv1Count = (maxIVs[0] - minIVs[0] + 1) *
                     (maxIVs[1] - minIVs[1] + 1) *
                     (maxIVs[2] - minIVs[2] + 1);
    const useFastPath = !isChannelSearch && iv1Count <= 4096;

    const cores = navigator.hardwareConcurrency || 4;
    const workerCount = useFastPath
      ? 1
      : Math.max(1, Math.min(Math.floor(cores / 2), 4));
    const totalSeeds  = 0x100000000; // 2^32
    const chunkSize   = Math.ceil(totalSeeds / workerCount);
    let finishedWorkers = 0;
    const progressArr   = new Array(workerCount).fill(0);
    // Per-worker snapshot: each worker sends its current best results
    // periodically.  We replace (not append) on each snapshot so partial
    // results are always available if the user clicks Stop.
    pfWorkerSnapshots = new Array(workerCount).fill(null);
    pfWorkers = [];

    /** Merge all per-worker snapshots into pfAllResults for display. */
    function mergeSnapshots() {
      pfAllResults = [];
      for (const snap of pfWorkerSnapshots) {
        if (snap) pfAllResults.push(...snap);
      }
    }

    for (let i = 0; i < workerCount; i++) {
      const start = i * chunkSize;
      const end   = Math.min(start + chunkSize, totalSeeds);
      const worker = new Worker(workerPath);
      pfWorkers.push(worker);

      worker.onmessage = function (msg) {
        const d = msg.data;
        if (d.type === 'progress') {
          progressArr[i] = d.done / d.total;
          const pct = (progressArr.reduce((a, b) => a + b, 0) / workerCount * 100);
          progressFill.style.width = pct.toFixed(1) + '%';
          progressText.textContent = pct.toFixed(0) + '%';
        } else if (d.type === 'snapshot') {
          // Workers periodically send their current priority buffer
          pfWorkerSnapshots[i] = d.results;
        } else if (d.type === 'done') {
          pfWorkerSnapshots[i] = d.results;
          finishedWorkers++;
          progressArr[i] = 1;
          const pct = (progressArr.reduce((a, b) => a + b, 0) / workerCount * 100);
          progressFill.style.width = pct.toFixed(1) + '%';
          progressText.textContent = pct.toFixed(0) + '%';

          if (finishedWorkers === workerCount) {
            mergeSnapshots();
            displayResults();
            searchBtn.disabled = false;
            stopBtn.disabled   = true;
            progressText.textContent = 'Done';
            pfWorkers = [];
          }
        }
      };

      worker.onerror = function (err) {
        console.error('PID finder worker error:', err);
        finishedWorkers++;
        if (finishedWorkers === workerCount) {
          displayResults();
          searchBtn.disabled = false;
          stopBtn.disabled   = true;
          progressText.textContent = 'Done (with errors)';
          pfWorkers = [];
        }
      };

      // Look up encounter slot tables for this game + location.
      // Static/roamer encounters do NOT use wild encounter slots,
      // so pass null to skip encounter-chain validation.
      const locationId = Number($('#metLocation').value) || 0;
      const slotTables = (currentEncounterMode === 'static' || currentEncounterMode === 'roamer')
        ? null
        : (ENCOUNTER_SLOTS[gameId] && ENCOUNTER_SLOTS[gameId][locationId]) || null;

      if (isChannelSearch) {
        // Channel Jirachi worker: nature + shiny + IV filters, seed validation
        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, wantShiny,
          tid: 40122,
          minIVs, maxIVs,
          maxResults: Math.ceil(250 / workerCount)
        });
      } else if (isCXD) {
        // CXD worker: core filters + anti-shiny rerolling + team-lock data.
        // Determine if the encounter is XD (for shiny value and lock lookup).
        const cxdEncounters = getShadowEncountersForSpecies(speciesId);
        const hasXD   = cxdEncounters.some(e => e.game === 'xd');
        const hasColo = cxdEncounters.some(e => e.game === 'colo');

        // Gather lock patterns for this species.
        // If ANY encounter variant for this species has no locks, skip
        // lock validation entirely (the lock-free encounter is always valid).
        let teamLocks = null;
        const xdNoLock   = XD_NO_LOCK_SPECIES.has(speciesId);
        const coloNoLock = COLO_NO_LOCK_SPECIES.has(speciesId);
        if (!(hasXD && xdNoLock) && !(hasColo && coloNoLock)) {
          // Combine all lock patterns from both games
          const patterns = [];
          if (hasXD && XD_SHADOW_LOCKS[speciesId])
            patterns.push(...XD_SHADOW_LOCKS[speciesId]);
          if (hasColo && COLO_SHADOW_LOCKS[speciesId])
            patterns.push(...COLO_SHADOW_LOCKS[speciesId]);
          if (patterns.length > 0) teamLocks = patterns;
        }

        // TSV: for XD shadows, use (TID^SID)>>3.
        // For Colo-only species, use 0xFFFFFFFF (no XD shiny rejection).
        const isTSVNeeded = hasXD;
        const tsvVal = isTSVNeeded ? ((tid ^ sid) >>> 3) : 0xFFFFFFFF;

        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, ability,
          genderThreshold: genderThreshold === -1 ? -1 : genderThreshold,
          targetGender, tid, sid, wantShiny,
          minIVs, maxIVs,
          maxResults: Math.ceil(250 / workerCount),
          noShiny: true,   // CXD shadows always anti-shiny
          teamLocks,
          tsv: tsvVal,
          unownForm: speciesId === 201 ? Number($('#unownForm')?.value ?? -1) : -1
        });
      } else {
        // For evolved wild species, use the wild ancestor for encounter-slot validation
        const slotSpecies = (currentEncounterMode === 'wild' && !WILD_ENCOUNTERS[speciesId])
          ? (getWildAncestor(speciesId, WILD_ENCOUNTERS) ?? speciesId)
          : speciesId;
        worker.postMessage({
          startSeed: start, endSeed: end,
          nature, ability,
          genderThreshold: genderThreshold === -1 ? -1 : genderThreshold,
          targetGender, tid, sid, wantShiny,
          minIVs, maxIVs, methods,
          maxResults: Math.ceil(250 / workerCount),
          targetSpecies: slotSpecies,
          slotTables,
          gameId,
          unownForm: speciesId === 201 ? Number($('#unownForm')?.value ?? -1) : -1
        });
      }
    }
  });

  /* â”€â”€ Display results table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function displayResults() {
    // For truncated roamers, post-process IVs: apply the roaming IV bug
    // The RNG generates normal Method 1 IVs, but only HP (0-31) and ATK (0-7) survive
    if (pfIsRoamerTruncated) {
      for (const r of pfAllResults) {
        r.ivs.atk = r.ivs.atk & 7;
        r.ivs.def = 0;
        r.ivs.spe = 0;
        r.ivs.spa = 0;
        r.ivs.spd = 0;
      }
      // De-duplicate: multiple RNG seeds can produce the same PID after truncation
      const seen = new Set();
      pfAllResults = pfAllResults.filter(r => {
        const key = `${r.pid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    pfAllResults.sort((a, b) => {
      const tA = a.ivs.hp + a.ivs.atk + a.ivs.def + a.ivs.spa + a.ivs.spd + a.ivs.spe;
      const tB = b.ivs.hp + b.ivs.atk + b.ivs.def + b.ivs.spa + b.ivs.spd + b.ivs.spe;
      if (tB !== tA) return tB - tA;
      return (a.method < b.method) ? -1 : (a.method > b.method) ? 1 : 0;
    });

    // Determine if encounter-chain validation was active
    const gameId     = Number($('#originGame').value) || 3;
    const locationId = Number($('#metLocation').value) || 0;
    const hadValidation = !!(ENCOUNTER_SLOTS[gameId] && ENCOUNTER_SLOTS[gameId][locationId]);

    const capped = pfAllResults.slice(0, 25);

    resultCount.textContent = pfAllResults.length === 0
      ? 'No results found. Try lowering minimum IVs.' + (hadValidation ? ' (encounter-chain validated)' : '')
      : `${pfAllResults.length} result${pfAllResults.length !== 1 ? 's' : ''} found`
        + (hadValidation ? ' \u2714 encounter-valid' : '')
        + (pfAllResults.length > 25 ? ' (showing top 25 by IV total)' : '');

    resultsBody.innerHTML = '';
    const speciesId = Number($('#species').value) || 0;
    const rGenderThreshold = getGenderThreshold(speciesId);
    let rAbility0Name = 'Slot 0', rAbility1Name = 'Slot 1';
    try {
      const ab = getSpeciesAbilities(speciesId);
      if (ab) {
        rAbility0Name = getAbilityName(ab[0]) || 'Slot 0';
        rAbility1Name = getAbilityName(ab[1]) || 'Slot 1';
      }
    } catch (_) {}

    // Detect Channel results to adjust table columns
    const isChannelResults = capped.length > 0 && capped[0].method === 'Channel';

    // Update table header for Channel vs normal
    try {
      const thead = resultsBody.closest('table')?.querySelector('thead tr');
      if (thead) {
        const ths = thead.querySelectorAll('th');
        // Columns: PID(0) HP(1) Atk(2) Def(3) SpA(4) SpD(5) Spe(6) Total(7) HPType(8) Mth(9) Lv(10) Gender(11) Ability(12) btn(13)
        if (ths.length >= 13) {
          ths[10].textContent = isChannelResults ? 'SID' : 'Lv';
          ths[11].textContent = isChannelResults ? 'Game' : 'Gender';
          ths[12].textContent = isChannelResults ? 'Item' : 'Ability';
        }
      }
    } catch (_) {}

    for (const r of capped) {
      const total = r.ivs.hp + r.ivs.atk + r.ivs.def + r.ivs.spa + r.ivs.spd + r.ivs.spe;

      // Derive gender from PID
      let genderStr;
      if (rGenderThreshold === -1)          genderStr = '\u2014';
      else if (rGenderThreshold === 0)      genderStr = '\u2642';
      else if (rGenderThreshold >= 254)     genderStr = '\u2640';
      else                                  genderStr = (r.pid & 0xFF) < rGenderThreshold ? '\u2640' : '\u2642';

      // Derive ability slot from PID
      const abilitySlot = r.pid & 1;
      const abilityName = abilitySlot === 0 ? rAbility0Name : rAbility1Name;

      // For static encounters, show method without 'H' prefix; for roamer, show 'H-1-Roaming'
      // CXD results already have method='CXD' so no replacement needed
      const methodLabel = r.method === 'CXD'
        ? 'CXD'
        : currentEncounterMode === 'roamer'
          ? r.method.replace(/^H-?(\d)/, 'H-$1-Roaming')
          : currentEncounterMode === 'static'
            ? r.method.replace('H', '')
            : r.method;

      const tr = document.createElement('tr');
      if (r.method === 'Channel') {
        // Channel-specific columns: SID, Game version, Held item
        const gameName = r.versionGameId === 1 ? 'Sapphire' : 'Ruby';
        const itemName = r.heldItemId === 169 ? 'Ganlon Berry' : 'Salac Berry';
        tr.innerHTML =
          `<td class="pid-cell">0x${(r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0')}</td>` +
          ivTd(r.ivs.hp) + ivTd(r.ivs.atk) + ivTd(r.ivs.def) +
          ivTd(r.ivs.spa) + ivTd(r.ivs.spd) + ivTd(r.ivs.spe) +
          `<td>${total}</td>` +
          `<td>${r.hpt}</td>` +
          `<td>${methodLabel}</td>` +
          `<td>${r.sid}</td>` +
          `<td>${gameName}</td>` +
          `<td>${itemName}</td>` +
          `<td><button type="button" class="select-btn">Select</button></td>`;
      } else {
      tr.innerHTML =
        `<td class="pid-cell">0x${(r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0')}</td>` +
        ivTd(r.ivs.hp) + ivTd(r.ivs.atk) + ivTd(r.ivs.def) +
        ivTd(r.ivs.spa) + ivTd(r.ivs.spd) + ivTd(r.ivs.spe) +
        `<td>${total}</td>` +
        `<td>${r.hpt}</td>` +
        `<td>${methodLabel}</td>` +
        `<td>${r.metLevels ? r.metLevels.join('/') : '\u2014'}</td>` +
        `<td>${genderStr}</td>` +
        `<td>${abilityName}</td>` +
        `<td><button type="button" class="select-btn">Select</button></td>`;
      }
      tr.querySelector('.select-btn').addEventListener('click', () => selectResult(r));
      resultsBody.appendChild(tr);
    }
  }

  function ivTd(v) {
    const cls = v === 31 ? ' class="iv-perfect"' : v === 0 ? ' class="iv-zero"' : '';
    return `<td${cls}>${v}</td>`;
  }

  /* â”€â”€ Apply selected result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  function selectResult(r) {
    // Mark PID Finder result as active — this guards preset-application paths
    // from overwriting the selected PID/IVs without enabling full Manual Override.
    pidFinderResultActive = true;

    // Sync TID/SID from PID Finder modal back to main form
    const pfTid = Number(document.getElementById('pfTid').value) & 0xFFFF;
    const pfSid = Number(document.getElementById('pfSid').value) & 0xFFFF;
    $('#tid').value = String(pfTid);
    $('#sid').value = String(pfSid);

    // Channel Jirachi: apply seed-derived fields (SID, held item, origin game, OT gender)
    if (r.method === 'Channel') {
      $('#sid').value = String(r.sid);
      const itemEl = $('#item');
      if (itemEl) { itemEl.value = String(r.heldItemId); try { itemEl.dispatchEvent(new Event('change')); } catch (_) {} }
      const gameEl = $('#originGame');
      if (gameEl) { gameEl.value = String(r.versionGameId); try { gameEl.dispatchEvent(new Event('change')); } catch (_) {} }
      const otGenderEl = $('#otGender');
      if (otGenderEl) { otGenderEl.value = r.otGender === 1 ? 'female' : 'male'; }
    }

    // Sync shiny checkbox from PID Finder modal to main form
    const pfShinyChecked = !!document.getElementById('pfShiny')?.checked;
    const mainShiny = $('#shiny');
    if (mainShiny) mainShiny.checked = pfShinyChecked;

    const pidHex = '0x' + (r.pid >>> 0).toString(16).toUpperCase().padStart(8, '0');
    const pidEl  = $('#pid');
    if (pidEl) {
      pidEl.value = pidHex;
      pidEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Set IVs (after PID event so we overwrite any stale preset lookup)
    $('#ivHp').value    = r.ivs.hp;
    $('#ivAtk').value   = r.ivs.atk;
    $('#ivDef').value   = r.ivs.def;
    $('#ivSpAtk').value = r.ivs.spa;
    $('#ivSpDef').value = r.ivs.spd;
    $('#ivSpe').value   = r.ivs.spe;

    // Set met level from encounter chain (use first valid level) and lock it
    if (r.metLevels && r.metLevels.length > 0) {
      const metLvEl = $('#metLevel');
      if (metLvEl) {
        metLvEl.value = r.metLevels[0];
        metLvEl.dispatchEvent(new Event('input', { bubbles: true }));
        // Lock the met level so the user cannot change it (PID-bound)
        pidFinderLockedMetLevel = true;
        metLvEl.disabled = true;
        metLvEl.style.pointerEvents = 'none';
        metLvEl.style.opacity = '0.6';
        metLvEl.style.cursor = 'not-allowed';
      }
    }

    updateHiddenPower();
    updateGenderFromPID();

    // Set ability based on PID low bit; fall back to 0 for single-ability species
    const abilityBit = r.pid & 1;
    const abilitySel = $('#ability');
    if (abilitySel) {
      abilitySel.value = String(abilityBit);
      // If the species only has one ability, option '1' doesn't exist — fall back
      if (abilitySel.value !== String(abilityBit)) abilitySel.value = '0';
    }

    // Lock nature, gender, ability, and IVs so casual changes don't invalidate
    // the PID Finder result.  Manual Override can still unlock everything.
    const lockStyle = (el) => {
      if (!el) return;
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.6';
      el.style.cursor = 'not-allowed';
    };
    lockStyle($('#nature'));
    lockStyle($('#gender'));
    lockStyle(abilitySel);
    for (const id of ['ivHp','ivAtk','ivDef','ivSpAtk','ivSpDef','ivSpe']) {
      lockStyle($('#' + id));
    }

    // Channel Jirachi: also lock seed-derived fields
    if (r.method === 'Channel') {
      lockStyle($('#sid'));
      lockStyle($('#item'));
      lockStyle($('#originGame'));
      lockStyle($('#otGender'));
    }

    checkShiny();

    const statusMethod = r.method === 'Channel'
      ? 'Channel'
      : r.method === 'CXD'
      ? 'CXD'
      : currentEncounterMode === 'roamer'
        ? r.method.replace(/^H-?(\d)/, 'H-$1-Roaming')
        : currentEncounterMode === 'static'
          ? r.method.replace('H', '')
          : r.method;
    if (statusSpan) statusSpan.textContent = r.method === 'Channel'
      ? `PID set (Channel, SID ${r.sid})`
      : `PID set (${statusMethod === 'CXD' ? 'CXD' : 'Method ' + statusMethod}, Lv ${r.metLevels ? r.metLevels[0] : '?'})`;
    closeModal();
  }
}

function collect(){
  const ivClamp = s => Math.max(0, Math.min(31, Number(s)));
  const evClamp = s => Math.max(0, Math.min(252, Number(s)));
  const level = s => Math.max(1, Math.min(100, Number(s)));
  const moves = [$('#move1').value, $('#move2').value, $('#move3').value, $('#move4').value].filter(x=>x!=='');

  let ivs = {
    hp: ivClamp($('#ivHp').value),
    atk: ivClamp($('#ivAtk').value),
    def: ivClamp($('#ivDef').value),
    spa: ivClamp($('#ivSpAtk').value),
    spd: ivClamp($('#ivSpDef').value),
    spe: ivClamp($('#ivSpe').value)
  };

  let evs = {
    hp: evClamp($('#evHp').value),
    atk: evClamp($('#evAtk').value),
    def: evClamp($('#evDef').value),
    spa: evClamp($('#evSpAtk').value),
    spd: evClamp($('#evSpDef').value),
    spe: evClamp($('#evSpe').value)
  };

  // Normalize EVs so total <= 510 (reduce in order: spe, spd, spa, def, atk, hp)
  const total = Object.values(evs).reduce((a,b)=>a+b,0);
  if (total > 510) {
    let over = total - 510;
    const order = ['spe','spd','spa','def','atk','hp'];
    for (const k of order) {
      const take = Math.min(evs[k], over);
      evs[k] -= take;
      over -= take;
      if (over === 0) break;
    }
  }

  const out = {
    speciesId: Number($('#species').value || 0),
    itemId: Number($('#item').value || 0),
    level: level($('#level').value || 50),
    natureIndex: Number($('#nature').value),
    abilityBit: Number($('#ability').value) & 1,
    genderPref: $('#gender').value, // 'any' | 'male' | 'female'
    tid: Number($('#tid').value) & 0xFFFF,
    sid: Number($('#sid').value) & 0xFFFF,
    pid: parsePidInput($('#pid').value) & 0xFFFFFFFF,
    ballId: Number($('#ball').value || 0),
    metLocationId: Number($('#metLocation').value || 0),
    metLevel: Math.max(0, Math.min(100, Number($('#metLevel').value || 0))),
    originGame: Number($('#originGame').value || 3),
    otGender: $('#otGender').value === 'female' ? 1 : 0,
    otName: $('#otName').value || 'BRENDAN',
    nickname: $('#nickname').value || '',
    languageId: Number($('#language').value),
    isEgg: $('#isEgg')?.checked || false,
    markings: {
      circle: $('#markCircle')?.checked || false,
      triangle: $('#markTriangle')?.checked || false,
      square: $('#markSquare')?.checked || false,
      heart: $('#markHeart')?.checked || false
    },
    // If we're in simple mode, prefer the preset's IVs (and PID) to avoid mismatches.
    // BUT skip this when a PID Finder result is active — the finder already set the
    // correct correlated IVs in the DOM fields.
    ivs: (function(){
      try{
        if(document.body.classList.contains('mode-simple') && !pidFinderResultActive
           && currentEncounterMode !== 'roamer' && currentEncounterMode !== 'static' && currentEncounterMode !== 'cxd_shadow'){
          const natureIndex = Number($('#nature').value || 0);
          const natureName = NATURES[natureIndex] || null;
          const gender = ($('#gender').value || 'male');
          const entry = PID_PRESETS[natureName];
          const preset = entry ? (entry[gender] || entry.male || entry.female || entry.genderless) : null;
          if(preset && preset.ivs){
            // also ensure the PID field is set to the preset PID if empty
            const pidEl = document.querySelector('#pid');
            if(pidEl && (!pidEl.value || Number(pidEl.value) === 0)) pidEl.value = String(preset.pid >>> 0);
            return {
              hp: Number(preset.ivs.hp) || 0,
              atk: Number(preset.ivs.atk) || 0,
              def: Number(preset.ivs.def) || 0,
              spa: Number(preset.ivs.spa) || 0,
              spd: Number(preset.ivs.spd) || 0,
              spe: Number(preset.ivs.spe) || 0
            };
          }
        }
      }catch(e){ }
      return ivs;
    })(),
    evs,
    contest: {
      cool: Math.max(0, Math.min(255, Number($('#contestCool')?.value || 0))),
      beauty: Math.max(0, Math.min(255, Number($('#contestBeauty')?.value || 0))),
      cute: Math.max(0, Math.min(255, Number($('#contestCute')?.value || 0))),
      smart: Math.max(0, Math.min(255, Number($('#contestSmart')?.value || 0))),
      tough: Math.max(0, Math.min(255, Number($('#contestTough')?.value || 0))),
      sheen: Math.max(0, Math.min(255, Number($('#contestSheen')?.value || 0)))
    },
    friendship: Number($('#friendship').value) & 0xFF,
    moves: moves.map(x=>Number(x)),
    forceShiny: $('#shiny').checked,
    // totalExp: either the advanced input or computed from species+level
    totalExp: (function(){
      const sid = Number($('#species').value || 0);
      const group = EXP_GROUPS[sid] ?? GROUP.MEDIUM_FAST;
      const inputExp = Number($('#expTotal')?.value);
      if (!Number.isNaN(inputExp) && String($('#expTotal')?.value).trim() !== '') return Math.max(0, Math.floor(inputExp));
      return expForLevel(group, level($('#level').value || 1));
    })(),
    pps: [
      Math.max(0, Math.min(3, Number($('#pp1')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp2')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp3')?.value || 0))),
      Math.max(0, Math.min(3, Number($('#pp4')?.value || 0)))
    ],
    // â”€â”€ EV > 100 legality fix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // If any single stat has EVs > 100 and the Pokémon's level equals its
    // met level (i.e. never battled), add 1 EXP to avoid a legality flag.
    // A freshly-caught mon can't have >100 EVs in a stat without gaining
    // at least some experience.
    evLegalityBump: (function() {
      const lv  = Math.max(1, Math.min(100, Number($('#level')?.value || 1)));
      const met = Math.max(0, Math.min(100, Number($('#metLevel')?.value || 0)));
      if (lv === met) {
        const evVals = ['#evHp','#evAtk','#evDef','#evSpAtk','#evSpDef','#evSpe']
          .map(id => Math.max(0, Math.min(252, Number($(id)?.value || 0))));
        if (evVals.some(v => v > 100)) return true;
      }
      return false;
    })(),
    ribbons: {
      cool: Number($('#ribbonCool')?.value || 0),
      beauty: Number($('#ribbonBeauty')?.value || 0),
      cute: Number($('#ribbonCute')?.value || 0),
      smart: Number($('#ribbonSmart')?.value || 0),
      tough: Number($('#ribbonTough')?.value || 0),
      champion: $('#ribbonChampion')?.checked || false,
      winning: $('#ribbonWinning')?.checked || false,
      victory: $('#ribbonVictory')?.checked || false,
      artist: $('#ribbonArtist')?.checked || false,
      effort: $('#ribbonEffort')?.checked || false,
      battleChampion: $('#ribbonBattleChampion')?.checked || false,
      regionalChampion: $('#ribbonRegionalChampion')?.checked || false,
      nationalChampion: $('#ribbonNationalChampion')?.checked || false,
      country: $('#ribbonCountry')?.checked || false,
      national: $('#ribbonNational')?.checked || false,
      earth: $('#ribbonEarth')?.checked || false,
      world: $('#ribbonWorld')?.checked || false,
      fatefulEncounter: $('#fatefulEncounter')?.checked || false
    }
  };

  // â”€â”€ EV > 100 legality fix: bump EXP by 1 when at met level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (out.evLegalityBump) {
    out.totalExp += 1;
  }
  delete out.evLegalityBump;

  return out;
}

// â”€â”€ Profanity check for Base64 box names â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Hybrid filter: boundary-only terms (short/ambiguous words only banned at word
// boundaries) + strong substring terms (slurs banned even inside larger words).
// See src/lib/profanityFilter.js for rule class documentation.
const _profanityFilter = createProfanityFilter(PROFANITY_LIST);

/**
 * Scan the Base64 box-name output for profanity.
 * Returns an array of { box, word } objects for every match found.
 */
function checkBase64Profanity(b64Text) {
  const hits = [];
  // Parse individual box names from the formatted output
  const lines = b64Text.split('\n');
  for (const line of lines) {
    const m = line.match(/Box\s+(\d+):\s+\(([^)]*)\)/);
    if (!m) continue;
    const boxNum = Number(m[1]);
    const boxName = m[2];
    // Test the box name against the hybrid profanity filter
    const result = _profanityFilter.checkDetailed(boxName);
    if (result.blocked) {
      for (const word of result.matches) hits.push({ box: boxNum, word });
    }
  }
  return hits;
}

/** Show or hide the profanity warning banner above the Base64 output. */
function updateProfanityWarning(b64Text) {
  const banner = document.getElementById('profanityWarning');
  if (!banner) return;
  const hits = checkBase64Profanity(b64Text);
  if (hits.length === 0) {
    banner.style.display = 'none';
    banner.textContent = '';
    return;
  }
  // Build a human-readable message
  const details = hits.map(h => `Box ${h.box}: "${h.word}"`).join(', ');
  banner.textContent = `�� ️ This code may be censored on the Nintendo Switch — detected: ${details}`;
  banner.style.display = 'block';
}

function onGenerate(){
  // Check if button is disabled and show validation errors
  if ($('#generateBtn').getAttribute('data-disabled') === 'true') {
    highlightMissingFields();
    return;
  }
  
  const cfg = collect();
  const result = buildPokemonBytes(cfg);
  const hex = toFormattedHex(result.bytes);
  const b64 = toBase64Emerald(result.bytes);
  $('#hexOutput').value = hex;
  $('#base64Output').value = b64;

  // Check for profanity in the generated box names
  updateProfanityWarning(b64);
}

/**
 * Switch the encounter mode dropdown to "imported" and apply its settings.
 * This gives the user a clear "imported" label while behaving like hatched
 * mode (all moves, all species visible, manual override enabled).
 */
function switchToImportedMode() {
  const select = document.querySelector('#encounterMode');
  if (!select) return;
  // Add the imported option if it doesn't exist yet
  if (!select.querySelector('option[value="imported"]')) {
    const opt = document.createElement('option');
    opt.value = 'imported';
    opt.textContent = 'Imported';
    select.appendChild(opt);
  }
  select.value = 'imported';
  currentEncounterMode = 'imported';
  // Apply body class
  document.body.classList.remove('encounter-wild','encounter-static','encounter-roamer','encounter-mystery','encounter-cxd_shadow');
  document.body.classList.add('encounter-imported');
  // Show all species in the autocomplete (imported could be anything)
  if (speciesAutocomplete) {
    speciesAutocomplete.updateList(SPECIES.filter(s => s[0] > 0 && !String(s[1]||'').includes('?')));
  }
  // Update mode description
  try {
    const el = document.getElementById('encounterModeDescription');
    if (el) {
      el.innerHTML = '';
      const pill = document.createElement('span');
      pill.className = 'mode-pill';
      pill.style.background = '#94a3b8';
      pill.textContent = 'Imported';
      const txt = document.createElement('span');
      txt.className = 'mode-desc-text';
      txt.textContent = 'Pokémon imported from external data. All fields are unlocked via Manual Override. You can freely edit any field and generate the Pokémon.';
      el.appendChild(pill);
      el.appendChild(txt);
    }
  } catch (e) {}
}

/**
 * Parse a Smogon/Showdown-format set into an object with the fields it defines.
 * Returns null if the text doesn't look like a valid set.
 */
function parseSmogonSet(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  const result = {
    species: null,
    speciesId: null,
    item: null,
    itemId: null,
    ability: null,
    nature: null,
    natureIndex: null,
    level: null,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    moveIds: [],
    gender: null,
    shiny: false,
    happiness: null,
  };

  // Stat name mapping (case-insensitive)
  const statMap = { hp: 'hp', atk: 'atk', attack: 'atk', def: 'def', defense: 'def',
    spa: 'spa', spatk: 'spa', 'sp. atk': 'spa', 'sp.atk': 'spa', spd: 'spd',
    spdef: 'spd', 'sp. def': 'spd', 'sp.def': 'spd', spe: 'spe', speed: 'spe' };

  function parseStat(key) {
    return statMap[key.toLowerCase().trim()] || null;
  }

  // Line 1: "Species @ Item" or "Species (M) @ Item" or just "Species"
  const firstLine = lines[0];
  let speciesStr, itemStr = null;
  if (firstLine.includes('@')) {
    const parts = firstLine.split('@');
    speciesStr = parts[0].trim();
    itemStr = parts.slice(1).join('@').trim();
  } else {
    speciesStr = firstLine.trim();
  }
  // Strip gender indicator from species: "Gardevoir (F)" → "Gardevoir"
  const genderMatch = speciesStr.match(/^(.+?)\s*\(([MF])\)\s*$/);
  if (genderMatch) {
    speciesStr = genderMatch[1].trim();
    result.gender = genderMatch[2].toLowerCase() === 'm' ? 'male' : 'female';
  }
  // Strip nickname: "Nickname (Species)" → "Species"
  const nicknameMatch = speciesStr.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (nicknameMatch) {
    speciesStr = nicknameMatch[2].trim();
  }

  // Resolve species
  result.species = speciesStr;
  const specLower = speciesStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  const specEntry = SPECIES.find(s => {
    const sName = String(s[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return sName === specLower;
  });
  if (specEntry) result.speciesId = specEntry[0];

  // Resolve item
  if (itemStr) {
    result.item = itemStr;
    const itemLower = itemStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    const itemEntry = ITEMS.find(i => {
      const iName = String(i[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return iName === itemLower;
    });
    if (itemEntry) result.itemId = itemEntry[0];
  }

  // Remaining lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Moves: lines starting with "- "
    if (line.startsWith('-')) {
      let moveName = line.replace(/^-\s*/, '').trim();
      // Handle "Hidden Power [Type]" → "Hidden Power"
      // In Gen 3, Hidden Power is move ID 237
      if (/^hidden\s*power/i.test(moveName)) {
        moveName = 'Hidden Power';
      }
      result.moves.push(moveName);
      const moveLower = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const moveEntry = MOVES.find(m => {
        const mName = String(m[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return mName === moveLower;
      });
      result.moveIds.push(moveEntry ? moveEntry[0] : null);
      continue;
    }

    // Ability
    if (/^ability\s*:/i.test(line)) {
      result.ability = line.replace(/^ability\s*:\s*/i, '').trim();
      continue;
    }

    // Level
    if (/^level\s*:/i.test(line)) {
      result.level = parseInt(line.replace(/^level\s*:\s*/i, ''), 10) || null;
      continue;
    }

    // Shiny
    if (/^shiny\s*:\s*yes/i.test(line)) {
      result.shiny = true;
      continue;
    }

    // Happiness
    if (/^happiness\s*:/i.test(line)) {
      result.happiness = parseInt(line.replace(/^happiness\s*:\s*/i, ''), 10);
      if (isNaN(result.happiness)) result.happiness = null;
      continue;
    }

    // Nature: "Modest Nature"
    if (/nature$/i.test(line)) {
      const natureName = line.replace(/\s*nature\s*$/i, '').trim();
      const natureIdx = NATURES.findIndex(n => n.toLowerCase() === natureName.toLowerCase());
      if (natureIdx >= 0) {
        result.nature = natureName;
        result.natureIndex = natureIdx;
      }
      continue;
    }

    // EVs: "EVs: 252 HP / 252 SpA / 4 Spe"
    if (/^evs\s*:/i.test(line)) {
      const evStr = line.replace(/^evs\s*:\s*/i, '');
      const parts = evStr.split('/');
      for (const part of parts) {
        const m = part.trim().match(/^(\d+)\s+(.+)$/);
        if (m) {
          const stat = parseStat(m[2]);
          if (stat) result.evs[stat] = Math.min(255, parseInt(m[1], 10) || 0);
        }
      }
      continue;
    }

    // IVs: "IVs: 0 Atk / 30 SpA"
    if (/^ivs\s*:/i.test(line)) {
      const ivStr = line.replace(/^ivs\s*:\s*/i, '');
      const parts = ivStr.split('/');
      for (const part of parts) {
        const m = part.trim().match(/^(\d+)\s+(.+)$/);
        if (m) {
          const stat = parseStat(m[2]);
          if (stat) result.ivs[stat] = Math.min(31, parseInt(m[1], 10) || 0);
        }
      }
      continue;
    }
  }

  // Must have at least a species to be valid
  if (!result.speciesId) return null;
  return result;
}

/**
 * Apply a parsed Smogon set to the form fields.
 * Only sets fields that the Smogon format provides; leaves others at defaults.
 */
function applySmogonImport(parsed) {
  // Enable manual override
  manualOverrideActive = true;
  suppressPresetApply = true;
  const overrideCb = document.querySelector('#manualOverride');
  if (overrideCb) overrideCb.checked = true;

  // Unlock fields
  const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
  fieldsToUnlock.forEach(sel => {
    const el = $(sel);
    if (el) { el.disabled = false; el.style.pointerEvents = ''; el.style.opacity = ''; el.style.cursor = ''; }
  });

  // Switch to imported mode FIRST so the species list includes all species
  switchToImportedMode();

  // Species
  $('#species').value = String(parsed.speciesId);
  const specEntry = SPECIES.find(s => s[0] === parsed.speciesId);
  if (specEntry) {
    $('#nickname').value = specEntry[1].toUpperCase();
  }

  // Item
  if (parsed.itemId != null) {
    $('#item').value = String(parsed.itemId);
  }

  // Nature
  if (parsed.natureIndex != null) {
    $('#nature').value = String(parsed.natureIndex);
  }

  // Level
  if (parsed.level != null) {
    $('#level').value = String(parsed.level);
    // Trigger exp update
    try {
      const expGroup = EXP_GROUPS[parsed.speciesId] ?? GROUP.MEDIUM_FAST;
      $('#expTotal').value = String(expForLevel(expGroup, parsed.level));
    } catch (e) {}
  }

  // Ability
  if (parsed.ability) {
    const abilityLower = parsed.ability.toLowerCase().replace(/[^a-z0-9]/g, '');
    const abilities = getSpeciesAbilities(parsed.speciesId);
    if (abilities) {
      const [a0, a1] = abilities;
      const a0Name = getAbilityName(a0).toLowerCase().replace(/[^a-z0-9]/g, '');
      const a1Name = getAbilityName(a1).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (abilityLower === a1Name && a0 !== a1) {
        $('#ability').value = '1';
      } else {
        $('#ability').value = '0';
      }
    }
  }

  // EVs
  $('#evHp').value = String(parsed.evs.hp);
  $('#evAtk').value = String(parsed.evs.atk);
  $('#evDef').value = String(parsed.evs.def);
  $('#evSpAtk').value = String(parsed.evs.spa);
  $('#evSpDef').value = String(parsed.evs.spd);
  $('#evSpe').value = String(parsed.evs.spe);

  // IVs
  $('#ivHp').value = String(parsed.ivs.hp);
  $('#ivAtk').value = String(parsed.ivs.atk);
  $('#ivDef').value = String(parsed.ivs.def);
  $('#ivSpAtk').value = String(parsed.ivs.spa);
  $('#ivSpDef').value = String(parsed.ivs.spd);
  $('#ivSpe').value = String(parsed.ivs.spe);

  // Moves — update learnset filter first, then set move values
  updateMovesForSpecies(parsed.speciesId, { preserveValue: true });
  for (let i = 0; i < 4; i++) {
    const moveId = parsed.moveIds[i] ?? 0;
    $(`#move${i+1}`).value = String(moveId);
  }
  refreshMoveExclusions();

  // Gender
  if (parsed.gender) {
    $('#gender').value = parsed.gender;
  }

  // Happiness
  if (parsed.happiness != null) {
    $('#friendship').value = String(parsed.happiness);
  }

  // Update Hidden Power
  try { updateHiddenPower(); } catch (e) {}

  // Update species-specific UI
  if (_postImportUpdate) _postImportUpdate(parsed.speciesId);

  suppressPresetApply = false;
}

/**
 * Open the import modal
 */
function openImportModal() {
  const overlay = document.getElementById('importOverlay');
  if (overlay) overlay.classList.add('open');
}

/**
 * Close the import modal
 */
function closeImportModal() {
  const overlay = document.getElementById('importOverlay');
  if (overlay) overlay.classList.remove('open');
}

function onLoadFromHex(hexString){
  try {
    const hexInput = hexString || $('#hexOutput').value;
    const data = parsePokemonBytes(hexInput);
    
    // Debug: log species ID and exp group
    const expGroup = EXP_GROUPS[data.speciesId] ?? GROUP.MEDIUM_FAST;
    console.log(`Species ID: ${data.speciesId}, Exp Group: ${expGroup}, Total Exp: ${data.totalExp}`);
    
    // Enable manual override so imported values aren't overwritten by mode locks
    manualOverrideActive = true;
    suppressPresetApply = true;
    const overrideCb = document.querySelector('#manualOverride');
    if (overrideCb) overrideCb.checked = true;

    // Switch to imported mode FIRST so the species list includes all species
    // (otherwise legendaries or other filtered-out species won't display properly)
    switchToImportedMode();

    // Temporarily unlock all disabled fields so .value assignments take effect
    const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
    fieldsToUnlock.forEach(sel => {
      const el = $(sel);
      if (el) {
        el.disabled = false;
        el.style.pointerEvents = '';
        el.style.opacity = '';
        el.style.cursor = '';
      }
    });
    
    // Populate all fields
    $('#species').value = String(data.speciesId);
    $('#item').value = String(data.itemId);
    $('#level').value = String(levelForExp(expGroup, data.totalExp));
    $('#expTotal').value = String(data.totalExp);
    $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
    $('#nature').value = String(data.natureIndex);
    $('#ability').value = String(data.abilityBit);
    $('#tid').value = String(data.tid);
    $('#sid').value = String(data.sid);
    $('#ball').value = String(data.ballId);
    // Set origin game BEFORE met location so the location list is correct
    $('#originGame').value = String(data.originGame);
    if (metLocationWrapper && metLocationWrapper.updateList) {
      metLocationWrapper.updateList(getLocationsForGame(data.originGame));
    }
    $('#metLocation').value = String(data.metLocationId);
    $('#metLevel').value = String(data.metLevel);
    $('#otGender').value = data.otGender === 1 ? 'female' : 'male';
    $('#otName').value = data.otName;
    $('#nickname').value = data.nickname;
    $('#language').value = String(data.languageId);
    // Egg flag (misc header bit 2 -> 0x04). parsePokemonBytes now returns `isEgg`.
    if (typeof data.isEgg !== 'undefined') $('#isEgg').checked = Boolean(data.isEgg);
    
    // Extra bytes removed from UI/controls
    
    // Markings
    if (data.markings) {
      $('#markCircle').checked = data.markings.circle;
      $('#markTriangle').checked = data.markings.triangle;
      $('#markSquare').checked = data.markings.square;
      $('#markHeart').checked = data.markings.heart;
      
      // Update visual state of marking symbols
      document.querySelector('[data-marking="markCircle"]')?.classList.toggle('active', data.markings.circle);
      document.querySelector('[data-marking="markTriangle"]')?.classList.toggle('active', data.markings.triangle);
      document.querySelector('[data-marking="markSquare"]')?.classList.toggle('active', data.markings.square);
      document.querySelector('[data-marking="markHeart"]')?.classList.toggle('active', data.markings.heart);
    }
    
    // IVs
    $('#ivHp').value = String(data.ivs.hp);
    $('#ivAtk').value = String(data.ivs.atk);
    $('#ivDef').value = String(data.ivs.def);
    $('#ivSpAtk').value = String(data.ivs.spa);
    $('#ivSpDef').value = String(data.ivs.spd);
    $('#ivSpe').value = String(data.ivs.spe);
    
    // EVs
    $('#evHp').value = String(data.evs.hp);
    $('#evAtk').value = String(data.evs.atk);
    $('#evDef').value = String(data.evs.def);
    $('#evSpAtk').value = String(data.evs.spa);
    $('#evSpDef').value = String(data.evs.spd);
    $('#evSpe').value = String(data.evs.spe);
    
    // Contest stats
    if (data.contest) {
      $('#contestCool').value = String(data.contest.cool);
      $('#contestBeauty').value = String(data.contest.beauty);
      $('#contestCute').value = String(data.contest.cute);
      $('#contestSmart').value = String(data.contest.smart);
      $('#contestTough').value = String(data.contest.tough);
      $('#contestSheen').value = String(data.contest.sheen);
    }
    
    // Moves and PP Ups
    // Update learnset filter for the imported species (preserve imported moves)
    updateMovesForSpecies(Number(data.speciesId) || 0, { preserveValue: true });
    $('#move1').value = String(data.moves[0]);
    $('#move2').value = String(data.moves[1]);
    $('#move3').value = String(data.moves[2]);
    $('#move4').value = String(data.moves[3]);
    refreshMoveExclusions();
    $('#pp1').value = String(data.pps[0]);
    $('#pp2').value = String(data.pps[1]);
    $('#pp3').value = String(data.pps[2]);
    $('#pp4').value = String(data.pps[3]);
    
    $('#friendship').value = String(data.friendship);
    
    // Ribbons
    if (data.ribbons) {
      $('#ribbonCool').value = String(data.ribbons.cool);
      $('#ribbonBeauty').value = String(data.ribbons.beauty);
      $('#ribbonCute').value = String(data.ribbons.cute);
      $('#ribbonSmart').value = String(data.ribbons.smart);
      $('#ribbonTough').value = String(data.ribbons.tough);
      $('#ribbonChampion').checked = data.ribbons.champion;
      $('#ribbonWinning').checked = data.ribbons.winning;
      $('#ribbonVictory').checked = data.ribbons.victory;
      $('#ribbonArtist').checked = data.ribbons.artist;
      $('#ribbonEffort').checked = data.ribbons.effort;
      $('#ribbonBattleChampion').checked = data.ribbons.battleChampion;
      $('#ribbonRegionalChampion').checked = data.ribbons.regionalChampion;
      $('#ribbonNationalChampion').checked = data.ribbons.nationalChampion;
      $('#ribbonCountry').checked = data.ribbons.country;
      $('#ribbonNational').checked = data.ribbons.national;
      $('#ribbonEarth').checked = data.ribbons.earth;
      $('#ribbonWorld').checked = data.ribbons.world;
      $('#fatefulEncounter').checked = data.ribbons.fatefulEncounter;
    }
    
    // Check shiny status
    checkShiny();
    
    // Update Hidden Power display based on loaded IVs
    updateHiddenPower();
    
    // Re-apply all locking functions (they'll see override is active and unlock)
    try { updateMetLevelLocking(); } catch (e) {}
    try { updateBallLocking(); } catch (e) {}
    try { updateLevelLocking(); } catch (e) {}
    try { updatePidLocking(); } catch (e) {}
    try { updateTidSidLocking(); } catch (e) {}
    try { lockLanguageForMewLegend(); } catch (e) {}
    try { updateFatefulLocking(); } catch (e) {}

    // Final safety net: ensure the imported PID and IVs are exactly what was
    // in the hex data, regardless of any handler that may have overwritten them.
    $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
    $('#ivHp').value   = String(data.ivs.hp);
    $('#ivAtk').value  = String(data.ivs.atk);
    $('#ivDef').value  = String(data.ivs.def);
    $('#ivSpAtk').value = String(data.ivs.spa);
    $('#ivSpDef').value = String(data.ivs.spd);
    $('#ivSpe').value  = String(data.ivs.spe);
    try { updateGenderFromPID(); } catch(e) {}
    try { checkShiny(); } catch(e) {}

    // Update species-specific UI (abilities, sprite, gender, form visibility)
    const speciesId = Number(data.speciesId) || 0;
    if (_postImportUpdate) _postImportUpdate(speciesId);

    // Re-enable preset application AFTER the final safety net so no listener
    // can overwrite imported IVs while suppressPresetApply is still false.
    suppressPresetApply = false;
    
    if (!hexString) {
      alert('Pokémon data loaded successfully! Manual Override has been enabled so you can edit all fields freely.');
    }
  } catch (e) {
    if (hexString) throw e; // Re-throw when called from modal so it can show its own error
    alert('Error loading hex data: ' + e.message);
  }
}

// Export Pokémon data as .ek3 file (encrypted PKHeX format)
function onExportPk3() {
  try {
    const cfg = collect();
    const result = buildPokemonBytes(cfg);
    
    // .ek3 files are 80 bytes (encrypted PC data structure)
    const bytes = result.bytes;
    
    // Ensure we have exactly 80 bytes
    if (bytes.length !== 80) {
      alert(`Error: Generated ${bytes.length} bytes instead of 80`);
      return;
    }
    
    // Create a fresh Uint8Array to ensure clean copy without any offset issues
    const cleanBytes = new Uint8Array(80);
    for (let i = 0; i < 80; i++) {
      cleanBytes[i] = bytes[i];
    }
    
    // Create blob from the clean buffer
    const blob = new Blob([cleanBytes], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    
    // Generate filename based on species name (prefer English species name)
    const speciesId = cfg.speciesId;
    const speciesEntry = SPECIES.find(s => s[0] === speciesId);
    const speciesName = speciesEntry ? String(speciesEntry[1]) : 'Pokemon';
    const rawName = speciesName || 'Pokemon';
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Pokemon';
    a.download = `${safeName}.ek3`;
    
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert('Error exporting .ek3 file: ' + e.message);
  }
}

// Import Pokémon data from .ek3 file
function onImportPk3(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Reset the file input so the same file can be imported again
  event.target.value = '';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const arrayBuffer = e.target.result;
      let bytes = new Uint8Array(arrayBuffer);
      
      // Handle both encrypted (80 bytes) and decrypted (100 bytes) formats
      if (bytes.length === 100) {
        // PKHeX decrypted format: first 80 bytes are what we need
        bytes = bytes.slice(0, 80);
      } else if (bytes.length === 80) {
        // Standard encrypted format
        // bytes is already correct
      } else {
        alert(`Invalid .ek3 file size: ${bytes.length} bytes (expected 80 or 100 bytes)`);
        return;
      }
      
      // Parse the bytes and load into form fields (without updating outputs yet)
      const data = parsePokemonBytes(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
      // Diagnostic: log whether XOR-decryption was used and PID read from header
      console.log('Imported .pk3/.ek3 — PID:', data.pid, 'usedXor:', data.usedXor);
      
      // Debug: log species ID and exp group
      const expGroup = EXP_GROUPS[data.speciesId] ?? GROUP.MEDIUM_FAST;
      console.log(`Species ID: ${data.speciesId}, Exp Group: ${expGroup}, Total Exp: ${data.totalExp}`);
      
      // Enable manual override so imported values aren't overwritten by mode locks.
      // Also suppress preset application so PID/IVs come from the imported file.
      manualOverrideActive = true;
      suppressPresetApply = true;
      const overrideCb = document.querySelector('#manualOverride');
      if (overrideCb) overrideCb.checked = true;

      // Temporarily unlock all disabled fields so .value assignments take effect
      const fieldsToUnlock = ['#pid','#metLevel','#ball','#tid','#sid','#otName','#language','#nickname','#gender'];
      fieldsToUnlock.forEach(sel => {
        const el = $(sel);
        if (el) {
          el.disabled = false;
          el.style.pointerEvents = '';
          el.style.opacity = '';
          el.style.cursor = '';
        }
      });
      
      // Switch to imported mode FIRST so the species list includes all species
      switchToImportedMode();

      // Populate all fields (same as onLoadFromHex)
      $('#species').value = String(data.speciesId);
      // Update ability select options based on species (do this here because
      // the updateAbilitySelect function is defined inside boot() and not
      // directly callable from this scope)
      (function setAbilityOptionsForSpecies(speciesId, abilityBit){
        const abilitySelect = document.querySelector('#ability');
        if (!abilitySelect) return;
        const abilities = getSpeciesAbilities(Number(speciesId));
        if (!abilities) {
          abilitySelect.innerHTML = `\n        <option value="0">0</option>\n        <option value="1">1</option>\n      `;
          abilitySelect.value = String(abilityBit ?? '0');
          return;
        }
        const [ability0Id, ability1Id] = abilities;
        const ability0Name = getAbilityName(ability0Id);
        const ability1Name = getAbilityName(ability1Id);
        if (ability0Id === ability1Id) {
          abilitySelect.innerHTML = `<option value="0">${ability0Name}</option>`;
          abilitySelect.value = '0';
        } else {
          abilitySelect.innerHTML = `\n        <option value="0">${ability0Name}</option>\n        <option value="1">${ability1Name}</option>\n      `;
          // set ability to imported bit if valid, otherwise default to 0
          if (abilityBit === 0 || abilityBit === 1 || String(abilityBit) === '0' || String(abilityBit) === '1') {
            abilitySelect.value = String(abilityBit);
          } else {
            abilitySelect.value = '0';
          }
        }
      })(data.speciesId, data.abilityBit);
      $('#item').value = String(data.itemId);
      $('#level').value = String(levelForExp(expGroup, data.totalExp));
      $('#expTotal').value = String(data.totalExp);
      $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
      $('#nature').value = String(data.natureIndex);
      $('#tid').value = String(data.tid);
      $('#sid').value = String(data.sid);
      $('#ball').value = String(data.ballId);
      // Set origin game BEFORE met location so the location list is correct
      $('#originGame').value = String(data.originGame);
      if (metLocationWrapper && metLocationWrapper.updateList) {
        metLocationWrapper.updateList(getLocationsForGame(data.originGame));
      }
      $('#metLocation').value = String(data.metLocationId);
      $('#metLevel').value = String(data.metLevel);
      $('#otGender').value = data.otGender === 1 ? 'female' : 'male';
      $('#otName').value = data.otName;
      $('#nickname').value = data.nickname;
      $('#language').value = String(data.languageId);
      if (typeof data.isEgg !== 'undefined') $('#isEgg').checked = Boolean(data.isEgg);
      
      // Extra bytes removed from UI/controls
      
      // Markings
      if (data.markings) {
        $('#markCircle').checked = data.markings.circle;
        $('#markTriangle').checked = data.markings.triangle;
        $('#markSquare').checked = data.markings.square;
        $('#markHeart').checked = data.markings.heart;
        
        // Update visual state of marking symbols
        document.querySelector('[data-marking="markCircle"]')?.classList.toggle('active', data.markings.circle);
        document.querySelector('[data-marking="markTriangle"]')?.classList.toggle('active', data.markings.triangle);
        document.querySelector('[data-marking="markSquare"]')?.classList.toggle('active', data.markings.square);
        document.querySelector('[data-marking="markHeart"]')?.classList.toggle('active', data.markings.heart);
      }
      
      // IVs
      $('#ivHp').value = String(data.ivs.hp);
      $('#ivAtk').value = String(data.ivs.atk);
      $('#ivDef').value = String(data.ivs.def);
      $('#ivSpAtk').value = String(data.ivs.spa);
      $('#ivSpDef').value = String(data.ivs.spd);
      $('#ivSpe').value = String(data.ivs.spe);
      
      // EVs
      $('#evHp').value = String(data.evs.hp);
      $('#evAtk').value = String(data.evs.atk);
      $('#evDef').value = String(data.evs.def);
      $('#evSpAtk').value = String(data.evs.spa);
      $('#evSpDef').value = String(data.evs.spd);
      $('#evSpe').value = String(data.evs.spe);
      
      // Contest stats
      if (data.contest) {
        $('#contestCool').value = String(data.contest.cool);
        $('#contestBeauty').value = String(data.contest.beauty);
        $('#contestCute').value = String(data.contest.cute);
        $('#contestSmart').value = String(data.contest.smart);
        $('#contestTough').value = String(data.contest.tough);
        $('#contestSheen').value = String(data.contest.sheen);
      }
      
      // Moves and PP Ups
      // Update learnset filter for the imported species (preserve imported moves)
      updateMovesForSpecies(Number(data.speciesId) || 0, { preserveValue: true });
      $('#move1').value = String(data.moves[0]);
      $('#move2').value = String(data.moves[1]);
      $('#move3').value = String(data.moves[2]);
      $('#move4').value = String(data.moves[3]);
      refreshMoveExclusions();
      $('#pp1').value = String(data.pps[0]);
      $('#pp2').value = String(data.pps[1]);
      $('#pp3').value = String(data.pps[2]);
      $('#pp4').value = String(data.pps[3]);
      
      $('#friendship').value = String(data.friendship);
      
      // Ribbons
      if (data.ribbons) {
        $('#ribbonCool').value = String(data.ribbons.cool);
        $('#ribbonBeauty').value = String(data.ribbons.beauty);
        $('#ribbonCute').value = String(data.ribbons.cute);
        $('#ribbonSmart').value = String(data.ribbons.smart);
        $('#ribbonTough').value = String(data.ribbons.tough);
        $('#ribbonChampion').checked = data.ribbons.champion;
        $('#ribbonWinning').checked = data.ribbons.winning;
        $('#ribbonVictory').checked = data.ribbons.victory;
        $('#ribbonArtist').checked = data.ribbons.artist;
        $('#ribbonEffort').checked = data.ribbons.effort;
        $('#ribbonBattleChampion').checked = data.ribbons.battleChampion;
        $('#ribbonRegionalChampion').checked = data.ribbons.regionalChampion;
        $('#ribbonNationalChampion').checked = data.ribbons.nationalChampion;
        $('#ribbonCountry').checked = data.ribbons.country;
        $('#ribbonNational').checked = data.ribbons.national;
        $('#ribbonEarth').checked = data.ribbons.earth;
        $('#ribbonWorld').checked = data.ribbons.world;
        $('#fatefulEncounter').checked = data.ribbons.fatefulEncounter;
      }
      
      // Check shiny status
      checkShiny();

      // Update Hidden Power display based on loaded IVs
      updateHiddenPower();

      // Ensure species-specific UI updates (abilities, gender options)
      const speciesId = Number(data.speciesId) || 0;
      try {
        updateAbilitySelect(speciesId);
      } catch (e) {
        // ignore if function not available
      }
      try {
        handleEncounterModeChange(speciesId);
      } catch (e) {}

      // Safety net: re-apply imported PID and IVs in case any handler above
      // (e.g. applyStaticEncounterPreset, applyPresetIfSimple) overwrote them.
      $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
      $('#ivHp').value = String(data.ivs.hp);
      $('#ivAtk').value = String(data.ivs.atk);
      $('#ivDef').value = String(data.ivs.def);
      $('#ivSpAtk').value = String(data.ivs.spa);
      $('#ivSpDef').value = String(data.ivs.spd);
      $('#ivSpe').value = String(data.ivs.spe);

      // Dispatch change/input events for key fields so listeners run
      // While programmatically updating fields during import we must
      // avoid triggering simple-mode preset application which would
      // overwrite the imported PID. Set suppression flag here.
      suppressPresetApply = true;

      const dispatchIfPresent = (sel, type='change') => {
        const el = document.querySelector(sel);
        if (!el) return;
        try {
          el.dispatchEvent(new Event(type, { bubbles: true }));
        } catch (e) {}
      };

      // Fields that affect validation: species, nature, moves, otName
      dispatchIfPresent('#species');
      dispatchIfPresent('#nature');
      dispatchIfPresent('#move1');
      dispatchIfPresent('#move2');
      dispatchIfPresent('#move3');
      dispatchIfPresent('#move4');
      dispatchIfPresent('#otName', 'input');

      // Re-run form validation so Generate button state updates
      try { validateForm(); } catch (e) {}

      // Imported Pokémon may be event/custom or otherwise unverifiable.
      // Force the legality checker into 'unknown' (grey question-mark) mode
      // to indicate the result should be verified in PKHeX.
      try {
        const statusEl = $('#legalityStatus');
        const iconEl = $('#legalityIcon');
        const textEl = $('#legalityText');
        if (statusEl && iconEl && textEl) {
          statusEl.className = 'unknown';
          iconEl.textContent = '?';
          iconEl.style.color = '#9ca3af';
          textEl.textContent = 'Legal?';
          textEl.style.color = '#9ca3af';
          statusEl.title = 'Imported Pokémon — legality unknown; please verify in PKHeX.';
        }
      } catch (e) {}

      // Also run the general updater so any other UI reacts to the import
      try { updateLegalityStatus(); } catch (e) {}

      // Re-apply all locking functions (they'll see override is active and unlock)
      try { updateMetLevelLocking(); } catch (e) {}
      try { updateBallLocking(); } catch (e) {}
      try { updateLevelLocking(); } catch (e) {}
      try { updatePidLocking(); } catch (e) {}
      try { updateTidSidLocking(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { updateFatefulLocking(); } catch (e) {}

      // Final safety net: ensure the imported PID and IVs are exactly what was
      // in the file, regardless of any handler/event-listener that may have
      // overwritten them during the import pipeline.
      $('#pid').value = '0x' + data.pid.toString(16).toUpperCase().padStart(8, '0');
      $('#ivHp').value   = String(data.ivs.hp);
      $('#ivAtk').value  = String(data.ivs.atk);
      $('#ivDef').value  = String(data.ivs.def);
      $('#ivSpAtk').value = String(data.ivs.spa);
      $('#ivSpDef').value = String(data.ivs.spd);
      $('#ivSpe').value  = String(data.ivs.spe);
      try { updateGenderFromPID(); } catch(e) {}
      try { checkShiny(); } catch(e) {}

      // Finished programmatic updates; re-enable preset application.
      // Keep manualOverrideActive = true so user can freely edit imported values.
      // Placed AFTER the final safety net so no listener can sneak in and
      // overwrite the imported IVs while suppressPresetApply is still false.
      suppressPresetApply = false;

      alert('Pokémon imported successfully! Manual Override has been enabled so you can edit all fields freely.');
    } catch (err) {
      alert('Error importing .ek3 file: ' + err.message);
    }
  };
  
  reader.onerror = function() {
    alert('Failed to read .ek3 file');
  };
  
  reader.readAsArrayBuffer(file);
}

function onDownload(){
  const cfg = collect();
  const result = buildPokemonBytes(cfg);
  const payload = {
    input: cfg,
    meta: result.meta,
    hex: toHexString(result.bytes),
    base64: toBase64Emerald(result.bytes)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pkmn_${Date.now()}.json`;
  a.click();
}

boot();
