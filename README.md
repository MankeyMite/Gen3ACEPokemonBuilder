# Gen 3 ACE Pokémon Builder

> A browser-based tool for creating Gen III Pokémon using the Arbitrary Code Execution (ACE) glitch
> Link: https://mankeymite.github.io/Gen3ACEPokemonBuilder/

### Export Formats

#### Base64 Box Names
The primary export format for ACE injection. Box names are encoded using a custom Gen III character set and can be entered directly into gen 3 games like Pokémon Emerald, or FireRed and LeafGreen on Nintendo Switch using the ACE glitch.

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

### Development Note

This tool was created primarily using agentic coding inside Visual Studio Code. While extensive testing has been done, there may be undiscovered bugs or edge cases. Please report any issues you encounter!


## 🙏 Acknowledgments

- Bulbapedia, Pokeemerald, Pokefirered and similar projects for Gen III data documentation.
- PKHeX for legality checking insights.
- Mettrich, Adrichu00 and other commmunity profiles for helping with useful information.

## 📧 Contact

For bug reports and feature requests, please contact me on Discord: MankeyMite#9981

**Disclaimer**: This tool is for educational purposes. Use only with legally obtained games and save files. The author is not responsible for any damage to save files, game cartridges or the risk of a ban from Pokémon Home if an illegal Pokémon was created and transferred.
