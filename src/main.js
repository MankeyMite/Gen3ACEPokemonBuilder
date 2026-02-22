// IV input selectors (used for visibility and clamping)
const ivIds = ['#ivHp','#ivAtk','#ivDef','#ivSpAtk','#ivSpDef','#ivSpe'];
import { NATURES, LANGUAGES } from './lib/gen3/constants.js';
import { SPECIES } from './data/species.gen3.js';
import { ITEMS } from './data/items.gen3.js';
import { MOVES } from './data/moves.gen3.js';
import { BALLS } from './data/balls.gen3.js';
import { LOCATIONS } from './data/locations.gen3.js';
import { PID_PRESETS } from './data/pid_presets.gen3.js';
import { STATIC_ENCOUNTERS, isLegendary, isBreedable, isGiftPokemon } from './data/staticEncounters.gen3.js';
import { getLegendaryPreset, isColosseumXDLegendary } from './data/legendaryPresets.gen3.js';
import { buildPokemonBytes, toHexString, toFormattedHex, toBase64Emerald, coreSource, parsePokemonBytes, buildDecryptedPokemonFile } from './lib/gen3/builder.js';
import { GROUP, expForLevel, levelForExp } from './lib/exp.js';
import EXP_GROUPS from './data/expGroups.gen3.js';
import { ABILITIES, getAbilityName } from './data/abilities.gen3.js';
import { hasDualAbilities, getSpeciesAbilities } from './data/pokemonAbilities.gen3.js';

const $ = sel => document.querySelector(sel);

// Global variables for encounter mode and species filtering
let speciesAutocomplete = null;
// Mystery gift containers (declared early so functions can reference them)
let MYSTERY_EVENTS = {};
let MYSTERY_GIFTS = {};
// Movesets loaded from external file, mapped by internal tag when possible
let MYSTERY_MOVESETS = {};

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
          genderEl.disabled = (currentEncounterMode === 'mystery');
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
        const englishOnly = ['POKEMON_ROCKS_METANG','WISHMKR_BEST','WISHMKR_SHINY','DOEL_DEOXYS'];
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
      try { checkShiny(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
    }
let currentEncounterMode = 'hatched';
// When true, skip applying simple-mode PID presets (used during imports)
let suppressPresetApply = false;
// When true, suppress marking user-change events while programmatically applying presets
let suppressUserChangeMark = false;
// Species ID for which a mystery preset was last applied (or 0/null when none)
let mysteryPresetAppliedFor = 0;
// Whether the user has modified fields (other than nickname) since the preset was applied
let mysteryUserModifiedSincePreset = false;

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
  29: 255, 30: 255, 31: 255,  // Nidoran♀ line
  113: 255, 242: 255, 440: 255, // Chansey line
  238: 255, 124: 255,          // Smoochum, Jynx
  387: 255,                    // Illumise
  
  // Male-only species (threshold 0)
  32: 0, 33: 0, 34: 0,    // Nidoran♂ line
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
    if (currentEncounterMode !== 'legendaries') return;
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
  
  // Store the data - make it mutable so we can update it
  let items = list.map(row => {
    const [name, id] = toNameId(row);
    return { name, id: String(id) };
  });
  
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
      } else if (allowEmpty && val === '') {
        input.value = '';
        selectedId = '';
      }
    },
    configurable: true
  });
  
  // Expose method to update the list
  wrapper.updateList = function(newList) {
    items = newList.map(row => {
      const [name, id] = toNameId(row);
      return { name, id: String(id) };
    });
    // Clear current selection if it's not in the new list
    const stillExists = items.some(i => i.id === selectedId);
    if (!stillExists) {
      selectedId = '';
      input.value = '';
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
    showDropdown();
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      hideDropdown();
      
      // Auto-select if user typed an exact match
      if (input.value && !selectedId) {
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
    } else if (mode === 'legendaries' && STATIC_ENCOUNTERS[speciesId]) {
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
        if ([1, 2].includes(currentOriginGame)) {
          // Ruby/Sapphire not yet implemented
          return {
            legal: false,
            errors: ['Ruby or Sapphire legality not yet implemented for this legendary'],
            unknown: true
          };
        } else if (currentOriginGame !== 3) {
          errors.push('Latios and Latias must have Emerald as origin game');
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
      const fatefulEncounterRequired = [151, 249, 250, 410, 408, 407];
      const fatefulCheckbox = $('#fatefulEncounter');
      
      if (fatefulEncounterRequired.includes(speciesId)) {
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
      if (ballId === 5) {
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
      iconEl.textContent = '✓';
      iconEl.style.color = '#22c55e';
      textEl.textContent = 'Legal';
      textEl.style.color = '#22c55e';
      statusEl.title = 'This Pokémon passes all legality checks';
    } else {
      statusEl.className = 'illegal';
      iconEl.textContent = '✗';
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
            $('#nickname').value = 'セレビィ'; // Celebi in Japanese
            $('#language').value = '1';        // Japanese language
          }
        }
        else {
          $('#nickname').value = species[1].toUpperCase();
        }
      }
      // Update ability select based on species
      updateAbilitySelect(speciesId);
      // Uncheck shiny since species changed (gender ratios may differ)
      const shinyCheckbox = document.querySelector('#shiny');
      if (shinyCheckbox && shinyCheckbox.checked) {
        shinyCheckbox.checked = false;
        checkShiny();
      }
      // Always update gender dropdown for selected species
      handleEncounterModeChange(speciesId);

      // If we're in Mystery Gifts mode and an event is selected, apply any
      // per-species mystery preset (TID/SID/OT/PID/IVs) so the basics/stats
      // reflect the event immediately and are not overridden by other logic.
      if (currentEncounterMode === 'mystery') {
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
  createAutocomplete($('#move1'), MOVES, { placeholder: '— Empty —', onSelect: validateForm });
  createAutocomplete($('#move2'), MOVES, { placeholder: '— Empty —', onSelect: validateForm });
  createAutocomplete($('#move3'), MOVES, { placeholder: '— Empty —', onSelect: validateForm });
  createAutocomplete($('#move4'), MOVES, { placeholder: '— Empty —', onSelect: validateForm });
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
      if (currentEncounterMode === 'mystery') {
        const sp = Number($('#species').value) || 0;
        if (sp) applyMysteryPresetForSpecies(sp);
      }
    } catch (e) {}
  });
  $('#nature').addEventListener('focus', () => {
    $('#nature').classList.remove('field-error');
  });
  $('#move1').addEventListener('change', () => {
    validateForm();
    updateLegalityStatus();
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
  }
  
  const metLocationInput = $('#metLocation');
  if (metLocationInput) {
    metLocationInput.addEventListener('change', updateLegalityStatus);
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

  // Setup encounter mode toggle
  document.querySelectorAll('input[name="encounterMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Reset mode-specific state to avoid carryover between modes
      try { resetAllModeState(); } catch (ee) {}
      currentEncounterMode = e.target.value;
      // Add body classes for special encounter modes so CSS/JS can adjust visibility
      document.body.classList.toggle('encounter-wild', currentEncounterMode === 'wild');
      document.body.classList.toggle('encounter-mystery', currentEncounterMode === 'mystery');
      
      // Filter species list based on encounter mode
      updateSpeciesListForMode();
      // Toggle availability of Pokémon gender control based on mode
      try {
        const genderEl = document.querySelector('#gender');
        if (genderEl) genderEl.disabled = (currentEncounterMode === 'mystery');
      } catch (e) {}
      
      // When changing encounter mode, update the Pokémon if needed
      const speciesId = Number($('#species').value) || 0;
      handleEncounterModeChange(speciesId);
      // Update human-readable description under the selector
      try { setEncounterModeDescription(currentEncounterMode); } catch (e) {}
      try { updateIsEggVisibility(); } catch (e) {}
      try { updateMetLevelLocking(); } catch (e) {}
      try { enforceJapaneseOption(); } catch (e) {}
      try { lockLanguageForMewLegend(); } catch (e) {}
      try { enforceMewLegendMinLevel(); } catch (e) {}
    });
  });

  // Set the encounter mode description element text
  function setEncounterModeDescription(mode) {
    const el = document.getElementById('encounterModeDescription');
    if (!el) return;
    const map = {
      hatched: {label: 'Hatched', color: '#10b981', text: 'Pokémon hatched from eggs. This mode is recommended for any Pokemon that can be obtained through breeding, as it allows full customization for IVs, shinyness, TID and SID.'},
      legendaries: {label: 'Legendaries', color: '#f59e0b', text: 'All legendary Pokémon with in-game encounters. IVs are hand picked for best possible per nature for Method 1. You may therefore not choose the SID if you want it shiny.'},
      wild: {label: 'Wild', color: '#60a5fa', text: 'Wild encounters (in the overworld). Recommended only if you prefer it looking like it was RNG manipulated. Uses Method 1 encounter slots to aim for best IVs per nature for each species, and you may therefore not choose the SID if you want it shiny.'},
      mystery: {label: 'Mystery Gifts', color: '#ef476f', text: 'Mystery Gift events — Get Distribution Event Pokémon! These have strict rules, so you may only change a few fields. IVs are hand picked for the best possible for each nature.'}
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

  // Lock or unlock TID/SID inputs depending on selected mystery event.
  // If in `mystery` mode and a non-BOX_EVENT tag is selected, these should
  // be locked so users cannot change event-provided TID/SID values.
  function updateTidSidLocking() {
    try {
      const tidEl = $('#tid');
      const sidEl = $('#sid');
      const otEl = $('#otName');
      const tag = String($('#mysteryEvent')?.value || '').toUpperCase();
      const shouldLock = (currentEncounterMode === 'mystery' && tag && tag !== 'BOX_EVENT');
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
      const shouldLock = document.body.classList.contains('mode-advanced');
      pidEl.disabled = Boolean(shouldLock);
      pidEl.style.pointerEvents = shouldLock ? 'none' : '';
      pidEl.style.opacity = shouldLock ? '0.6' : '';
      pidEl.style.cursor = shouldLock ? 'not-allowed' : '';
    } catch (e) {}
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
      let allowJapanese = false;
      const t = String(tag || '').toUpperCase();
      if (t && MYSTERY_EVENTS && MYSTERY_EVENTS[t]) {
        const evt = MYSTERY_EVENTS[t] || {};
        if (evt.defaultLanguage === 1) allowJapanese = true;
        if (evt.ot_names && evt.ot_names['1']) allowJapanese = true;
      }
      for (const o of Array.from(langSel.options)) {
        if (String(o.value) === '1') {
          o.disabled = !allowJapanese; // user can't pick if not allowed
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

  // Lock met level to 0 for hatched encounter mode and disable edits.
  function updateMetLevelLocking() {
    try {
      const metEl = $('#metLevel');
      if (!metEl) return;
      if (currentEncounterMode === 'hatched') {
        metEl.value = '0';
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

  // Lock language to Japanese for Mew when in Legendary encounter mode.
  function lockLanguageForMewLegend() {
    try {
      const langSel = $('#language');
      if (!langSel || !langSel.options) return;
      const speciesId = Number($('#species')?.value || 0);
      const isMew = speciesId === 151;
      if (currentEncounterMode === 'legendaries' && isMew) {
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
            } else {
              o.textContent = t.replace(/_/g,' ');
            }
            eventSel.appendChild(o);
          }

          eventSel.addEventListener('change', () => {
            const tag = eventSel.value;
            console.log('Mystery event selected:', tag);
            // Clear any previous event-specific UI state (ribbons, language disables)
            try { clearMysteryEventState(); } catch (e) {}
            // Apply event-level defaults
            applyEventDefaults(tag);
            try { updateMetLevelLocking(); } catch (e) {}

            // Update available species/options for this event
            updateSpeciesListForMode();
            // Also try to apply preset for selected species
            const sp = Number($('#species').value) || 0;
            if (sp) applyMysteryPresetForSpecies(sp);
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
        // Exclude legendaries (only breedable pokemon) and Ditto (cannot be bred)
        // Also exclude placeholder/unknown species entries (names with '?')
        filteredSpecies = SPECIES.filter(s => !isLegendary(s[0]) && s[0] !== 132 && !String(s[1]||'').includes('?'));
        break;
      case 'legendaries':
        // Only legendaries
        filteredSpecies = SPECIES.filter(s => isLegendary(s[0]));
        break;
      case 'wild':
        // All non-legendary pokemon (include starters/gift species),
        // but exclude placeholder/unknown species entries (names with '?')
        filteredSpecies = SPECIES.filter(s => !isLegendary(s[0]) && !String(s[1]||'').includes('?'));
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
      if (currentEncounterMode === 'mystery' && genderSelect) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
        genderSelect.disabled = true;
      }
    try { updateTidSidLocking(); } catch (e) {}
    }
    if (mode === 'legendaries' && STATIC_ENCOUNTERS[speciesId]) {
      // For legendary encounters, apply preset data
      applyStaticEncounterPreset(speciesId);
      // Make gender read-only for legendaries (can still update from PID, but user can't manually change)
      if (genderSelect) {
        genderSelect.style.pointerEvents = 'none';
        genderSelect.style.opacity = '0.6';
        genderSelect.style.cursor = 'not-allowed';
      }
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
      // For wild mode, re-enable gender selection and clear origin/met presets
      if (genderSelect) {
        genderSelect.style.pointerEvents = '';
        genderSelect.style.opacity = '';
        genderSelect.style.cursor = '';
      }

      // Clear origin game, met location and met level so user can fill them
      const originGameSelect = $('#originGame');
      const metLocationSelect = $('#metLocation');
      const metLevelInput = $('#metLevel');
      if (originGameSelect) originGameSelect.value = '';
      if (metLocationSelect) metLocationSelect.value = '';
      if (metLevelInput) metLevelInput.value = '';

        // Re-apply nature preset so PID/IV reflect the selected nature for wild mode
        const natureElLocal = document.querySelector('#nature');
        if (natureElLocal) {
          natureElLocal.dispatchEvent(new Event('change'));
        }
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

  /**
   * Apply static encounter preset for a species
   */
  function applyStaticEncounterPreset(speciesId) {
    const encounter = STATIC_ENCOUNTERS[speciesId];
    if (!encounter) return;

    // Do not apply static encounter presets while Mystery Gifts mode is active;
    // event defaults should take precedence for mystery events.
    if (currentEncounterMode === 'mystery') return;

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
      }
    }

    // Set met location and level if available
    if (encounter.defaultMetLocationId) {
      // Use direct location ID (preferred)
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        locationSelect.value = String(encounter.defaultMetLocationId);
      }
    } else if (encounter.defaultMetLocation) {
      // Fallback: search by location name
      const locationSelect = $('#metLocation');
      if (locationSelect) {
        // Find the location ID by searching LOCATIONS array
        const location = LOCATIONS.find(loc => 
          loc[1] && loc[1].toLowerCase().includes(encounter.defaultMetLocation.toLowerCase())
        );
        if (location) {
          locationSelect.value = String(location[0]);
        }
      }
    }

    if (encounter.defaultMetLevel) {
      const metLevelInput = $('#metLevel');
      const levelInput = $('#level');
      if (metLevelInput) {
        metLevelInput.value = encounter.defaultMetLevel;
      }
      // Also set the main level to match
      if (levelInput) {
        levelInput.value = encounter.defaultMetLevel;
      }
      // Update experience to match the new level
      computeAndSetExpFromLevel();
    }

    // Set fateful encounter flag
    if (encounter.defaultFatefulEncounter !== undefined) {
      const fatefulCheckbox = $('#fatefulEncounter');
      if (fatefulCheckbox) {
        fatefulCheckbox.checked = encounter.defaultFatefulEncounter;
      }
    }
    
    // Auto-check fateful encounter for specific legendaries
    // Mew (151), Lugia (249), Ho-Oh (250), Deoxys (410), Latios (408), Latias (407)
    const fatefulEncounterRequired = [151, 249, 250, 410, 408, 407];
    if (fatefulEncounterRequired.includes(speciesId)) {
      const fatefulCheckbox = $('#fatefulEncounter');
      if (fatefulCheckbox) {
        fatefulCheckbox.checked = true;
      }
    }

    // Set origin game if specified
    if (encounter.defaultOriginGame !== undefined) {
      const originGameSelect = $('#originGame');
      if (originGameSelect) {
        originGameSelect.value = String(encounter.defaultOriginGame);
      }
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

    // For non-fixed events, apply legendary PID and IV preset based on selected nature
    if (!encounter.fixedEvent) {
      const natureIndex = Number($('#nature').value || 0);
      const originGame = encounter.defaultOriginGame || 2;
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

    // Update gender and ability - always set ability to 0 for legendaries
    updateGenderFromPID();
    $('#ability').value = '0';

    // Check if shiny
    checkShiny();
    
    // Update legality status after applying preset
    updateLegalityStatus();

    console.log(`Applied legendary preset for species ${speciesId}`);
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
          else if (currentEncounterMode === 'legendaries') {
            try {
              const sp = Number($('#species')?.value || 0);
              if (sp === 151 && val < 30) val = 30;
            } catch (eee) {}
          }
      } catch (ee) {}
      if (String(e.target.value) !== String(val)) {
        e.target.value = String(val);
      }
      try { computeAndSetExpFromLevel(); } catch (e) {}
      try { updateLegalityStatus(); } catch (e) {}
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
    if (suppressPresetApply) return; 
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
      
      // Check if PID matches a preset and update IVs
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
            return;
          }
        }
        // Default: ensure enabled
        shinyCheckboxLocal.disabled = false;
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
      
      // For legendaries, wild encounters, and Box Event mystery gifts, adjust SID instead of PID
      const isBoxEvent = currentEncounterMode === 'mystery' && 
        String($('#mysteryEvent')?.value || '').toUpperCase() === 'BOX_EVENT';
      if (currentEncounterMode === 'legendaries' || currentEncounterMode === 'wild' || isBoxEvent) {
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
        $('#ability').value = String(abilityFromPID);
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
    });
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
      if (currentEncounterMode === 'mystery') {
        const speciesId = Number($('#species').value) || 0;
        const tag = document.getElementById('mysteryEvent')?.value || '';
        if (tag && MYSTERY_GIFTS[tag]) {
          applyMysteryPresetForSpecies(speciesId);
          return; // do not fall-through to other preset logic
        }
      }

      // If we're in legendaries or wild mode, apply the per-nature legendary preset
      if (currentEncounterMode === 'legendaries' || currentEncounterMode === 'wild') {
        const speciesId = Number($('#species').value) || 0;
        const targetNature = Number(natureEl.value || 0);

        // Determine originGame: legendaries use the static encounter's defaultOriginGame,
        // wild uses the user's selected originGame (or default 2)
        let originGame = 2;
        if (currentEncounterMode === 'legendaries') {
          const encounter = STATIC_ENCOUNTERS[speciesId];
          originGame = encounter?.defaultOriginGame || 2;
          // Only apply for actual legendary species in legendaries mode
          if (!isLegendary(speciesId)) {
            // skip applying preset
            originGame = null;
          }
        } else {
          // Wild mode: use the selected origin game if present
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
              $('#ivHp').value = preset.ivs.hp;
              $('#ivAtk').value = preset.ivs.atk;
              $('#ivDef').value = preset.ivs.def;
              $('#ivSpAtk').value = preset.ivs.spa;
              $('#ivSpDef').value = preset.ivs.spd;
              $('#ivSpe').value = preset.ivs.spe;
            }

            // Update gender from PID
            updateGenderFromPID();

            // For legendaries, force ability to 0; for wild, derive ability bit from PID
            if (currentEncounterMode === 'legendaries') {
              $('#ability').value = '0';
            } else {
              $('#ability').value = String(preset.pid & 1);
            }

            updateLegalityStatus();
          }
        }
      } else {
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
    });
  }

  // Recompute when species or level changes
  speciesAutocomplete.addEventListener('change', computeAndSetExpFromLevel);
  $('#level').addEventListener('change', computeAndSetExpFromLevel);
  // initialize
  computeAndSetExpFromLevel();

  // Move selection - autocomplete doesn't support disabling options like select does
  // Users can select duplicate moves if needed (not a critical validation)

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

  // TID and SID: cap at 65535
  $('#tid').addEventListener('input', (e) => {
    e.target.value = clampInt(e.target.value, 0, 65535);
  });

  $('#sid').addEventListener('input', (e) => {
    e.target.value = clampInt(e.target.value, 0, 65535);
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
  $('#loadFromHexBtn').addEventListener('click', onLoadFromHex);
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
  
  // Update both shiny indicators (advanced mode and simple mode)
  const indicators = [document.querySelector('#shinyIndicator'), document.querySelector('#shinyIndicatorSimple')];
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

  return {
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
    ivs: (function(){
      try{
        if(document.body.classList.contains('mode-simple')){
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
}

function onLoadFromHex(){
  try {
    const hexInput = $('#hexOutput').value;
    const data = parsePokemonBytes(hexInput);
    
    // Debug: log species ID and exp group
    const expGroup = EXP_GROUPS[data.speciesId] ?? GROUP.MEDIUM_FAST;
    console.log(`Species ID: ${data.speciesId}, Exp Group: ${expGroup}, Total Exp: ${data.totalExp}`);
    
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
    $('#metLocation').value = String(data.metLocationId);
    $('#metLevel').value = String(data.metLevel);
    $('#originGame').value = String(data.originGame);
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
    $('#move1').value = String(data.moves[0]);
    $('#move2').value = String(data.moves[1]);
    $('#move3').value = String(data.moves[2]);
    $('#move4').value = String(data.moves[3]);
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
    
    alert('Pokémon data loaded successfully!');
  } catch (e) {
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
      $('#metLocation').value = String(data.metLocationId);
      $('#metLevel').value = String(data.metLevel);
      $('#originGame').value = String(data.originGame);
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
      $('#move1').value = String(data.moves[0]);
      $('#move2').value = String(data.moves[1]);
      $('#move3').value = String(data.moves[2]);
      $('#move4').value = String(data.moves[3]);
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

      // Finished programmatic updates; re-enable preset application
      suppressPresetApply = false;

      alert('Pokémon imported from .ek3 file successfully! The form has been re-validated.');
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
