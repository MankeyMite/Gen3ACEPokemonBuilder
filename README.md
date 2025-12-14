# Gen 3 ACE Pokémon Builder

> A browser-based tool for creating Gen III Pokémon using the Arbitrary Code Execution (ACE) glitch
> Link: https://mankeymite.github.io/Gen3ACEPokemonBuilder/

[![Version](https://img.shields.io/badge/version-0.1.8--alpha-blue.svg)](https://github.com/yourusername/pkmn-ace-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎮 Features

- **Three Encounter Modes**: Hatched, Legendaries, and Wild (coming soon)
- **Comprehensive Pokémon Customization**:
  - All 386 Gen III species
  - Full IV/EV control
  - Nature selection with stat modifications
  - Ability selection (including Hoenn dex ability mapping)
  - Move selection with all Gen III moves
  - Ribbons, contest stats, and markings
  - Create as Egg
- **Special Event Pokémon**: Pre-configured presets for event Pokémon (Mew, Celebi, WISHMKR Jirachi, etc.)
- **Legality Checker**: Real-time validation to help ensure transferability to Pokémon Home
- **Multiple Export Formats**:
  - Base64 box name codes for ACE injection
  - Raw hex data
  - .pk3 and .ek3 file export/import (compatible with PKHeX and Pokeglitzer)
- **Retro Gen 3 Themed UI**: Interface inspired by Ruby, Sapphire, and Emerald

## 🚀 Quick Start

1. **Select an encounter mode**: Choose between Hatched or Legendaries
2. **Build your Pokémon**: Select species, nature, moves, stats, etc.
3. **Check legality**: The tool will indicate if your Pokémon should be legal, although it's recommended to export the pokemon to PkHex to confirm.
4. **Generate codes**: Click the Generate button to create ACE codes.
5. **Export**: Copy the Base64/Hex codes or export as a .pk3 or .ek3 file.

No installation, no build process, no dependencies required!

## 📖 Usage Guide

### Encounter Modes

- **Hatched**: Create Pokémon as if they hatched from eggs
  - Must be level 5+, met at level 0
  - Must be in a Poké Ball
  - EV restrictions apply at base level

- **Legendaries**: Create legendary Pokémon with proper event data
  - Automatic PID/IV generation based on nature and origin game
  - Pre-configured met locations and levels
  - Automatic fateful encounter flags where required
  - Origin game validation (Ruby, Sapphire, Emerald, FireRed, LeafGreen)

### Legality Checker

The built-in legality checker validates:
- ✅ Ball compatibility
- ✅ EV limits based on level and experience
- ✅ Ribbon legality per Pokémon type
- ✅ Origin game restrictions
- ✅ Fateful encounter requirements
- ✅ Met location and level validation
- ✅ PID/IV correlation

**Note**: This is a simplified checker. Always validate with PKHeX before transferring to ensure full legality.

### Simple vs Advanced Mode

- **Simple Mode**: Only shows essential fields (species, nature, level, moves, IVs, EVs)
- **Advanced Mode**: Shows all fields including PID, encryption constant, ribbons, contest stats, etc.

Toggle between modes using the button at the top of the page.

## 🔧 Technical Details

### Export Formats

#### Base64 Box Names
The primary export format for ACE injection. Box names are encoded using a custom Gen III character set and can be entered directly into Pokémon Emerald using the ACE glitch.

#### Hex Data
Raw hexadecimal representation of the Pokémon data structure (80 bytes). Useful for debugging or custom ACE implementations.

#### .pk3 and .ek3 Files
Decrypted and Encrypted Pokémon files compatible with PKHeX and Pokeglitzer. Use this format to:
- Validate legality in PKHeX
- Import into save files
- Share Pokémon with others

### Data Structure

The tool generates proper Gen III Pokémon data structures:
- Personality Value (PID) with nature/gender/shiny calculation
- Individual Values (IVs) for all 6 stats
- Effort Values (EVs) for all 6 stats
- 4 moves with PP
- Held item
- Ribbons and markings
- Contest stats
- Proper encryption using XOR with PID and OT ID

## ⚠️ Important Notes

### Alpha Release Limitations

This is an **alpha release**. Known limitations:
- Wild encounter mode is not yet implemented
- Colosseum/XD origin game support is incomplete
- Custom PID validation returns "unknown" status

### Legality Disclaimer

While the legality checker helps create valid Pokémon, it may not catch all issues. **Always verify with PKHeX** before attempting to transfer to Pokémon Home or other games.

This tool is designed for educational purposes and use with legally obtained games.

### Development Note

This tool was created primarily using GitHub Copilot in Visual Studio Code. While extensive testing has been done, there may be undiscovered bugs or edge cases. Please report any issues you encounter!
This tool was created primarily using GitHub Copilot in Visual Studio Code v1.106.2. While extensive testing has been done, there may be undiscovered bugs or edge cases. Please report any issues you encounter!

## 🗂️ Project Structure

```
pkmn-ace-tool/
├── index.html              # Main application file
├── src/
│   ├── main.js            # Application logic and UI handling
│   ├── styles.css         # Gen 3 themed styling
│   ├── lib/
│   │   ├── exp.js         # Experience calculation
│   │   └── gen3/
│   │       ├── builder.js      # Pokémon data structure builder
│   │       ├── constants.js    # Game constants
│   │       ├── encoding.js     # Character encoding
│   │       ├── packers.js      # Data packing utilities
│   │       └── permutations.js # GAEM encryption
│   └── data/
│       ├── abilities.gen3.js        # Ability database
│       ├── balls.gen3.js            # Poké Ball types
│       ├── expGroups.gen3.js        # Experience groups
│       ├── items.gen3.js            # Item database
│       ├── legendaryPresets.gen3.js # Legendary PID/IV presets
│       ├── locations.gen3.js        # Met locations
│       ├── moves.gen3.js            # Move database
│       ├── pokemonAbilities.gen3.js # Species ability mapping
│       ├── species.gen3.js          # Species database
│       └── staticEncounters.gen3.js # Legendary encounter data
└── docs/
    └── Pokemon data structure (Generation III).txt
```

## 🤝 Contributing

Contributions are welcome! This is an alpha release and there's plenty of room for improvement.

### Areas for Contribution
- Wild encounter PID generation
- Additional event Pokémon presets
- Colosseum/XD support
- UI/UX improvements
- Bug fixes and legality checker enhancements
- Documentation improvements

Please open an issue before starting work on major features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bulbapedia for Gen III data structure documentation
- PKHeX for legality checking insights
- The Gen III ACE community for reverse engineering work
- pokesprite for Pokémon sprite assets

## 📧 Contact

For bug reports and feature requests, please use the [GitHub Issues](https://github.com/yourusername/pkmn-ace-tool/issues) page.

---

**Disclaimer**: This tool is for educational purposes. Use only with legally obtained games and save files. The authors are not responsible for any damage to save files or game cartridges.
