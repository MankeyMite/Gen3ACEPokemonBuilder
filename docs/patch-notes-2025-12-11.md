Patch Notes — 2025-12-11 (V.0.1.7)

Summary
- Small UI and parser fixes applied across the tool to improve import/export reliability and UX.

Changes
- Items dropdown: filtered out hidden/unused item ID ranges (IDs 259–288 and 339–376) so they no longer appear in the item selector.
- Items autocomplete: limited visible dropdown height to ~5 items and made it scrollable to avoid overlaying other UI sections.
- Gender selector: species-based enforcement so species with single-sex or genderless classifications no longer show invalid gender options.
- Import parsing (.ek3/.pk3): improved detection for encrypted vs decrypted Gen3 PC data by validating substructure checksum; prevents double-decryption of already-decrypted `.pk3` files.
- Export formats: added `.pk3` (decrypted PKHeX-style) export in addition to `.ek3`. Export flow unified via an Export modal allowing format and filename selection.
- Export filename: defaults to species name (sanitized) when exporting; fixed Blob creation to ensure correct binary downloads.
- Legality UI: after an import, legality is set to "unknown" (grey question mark) with updated tooltip indicating external verification with PKHeX is recommended.
- Legendary IDs (Gen3): corrected Gen3 species indices used in legality rules (e.g., Kyogre/Groudon/Rayquaza/Latias/Latios/Jirachi/Deoxys) to match `src/data/species.gen3.js` (404–410 where applicable). This prevents incorrect fateful-encounter checks.
- Import Hex button: moved the explanatory text into a hover tooltip next to the `Import Hex Code` button to match existing legality tooltip styling.
- UI: bumped displayed version to `v0.1.7` and adjusted site title prominence.


