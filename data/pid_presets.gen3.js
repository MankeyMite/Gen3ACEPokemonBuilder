// PID presets for Gen III simple mode
// For each nature, provide a male and female preset PID and IVs (all 31s recommended)
// You can add 'genderless' if needed for genderless Pokémon

export const PID_PRESETS = {
  Adamant: {
    male:   { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } },
    female: { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } },
    genderless: { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } }
  },
  Bashful: {
    male:   { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } },
    female: { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } },
    genderless: { pid: 0x00000000, ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } }
  },
  // ...add all other natures here
};

// Example usage:
// PID_PRESETS[nature][gender].pid
// PID_PRESETS[nature][gender].ivs
