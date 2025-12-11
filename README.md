# Gen3 ACE Pokémon Builder (Scaffold)

This is a minimal, modular scaffold for a client-side tool that builds legal Gen3 Pokémon bytes and exports them as hex/Base64 for ACE injection in Pokémon Emerald.

## Structure
- `index.html` — UI
- `src/styles.css` — styles
- `src/main.js` — wiring UI to the builder
- `src/lib/gen3/*` — core logic (constants, permutations, encoding, packers, builder)
- `src/data/*` — separate data lists (species, moves, items, balls, locations)

## Next steps (fill these to go from scaffold → full tool)
- Fill the **24 GAEM permutations** with the exact canonical table.
- Implement the **real header layout** (nickname/OT encoding, language, flags) and the **exact word layout** inside G/A/E/M per Gen3 docs.
- Replace placeholder **experience**, **PP/PP Ups**, **met location/origin/ball** packing with authoritative mappings.
- Implement a **PID bank** and/or search that satisfies nature/gender/shiny (the current version includes naive stubs).
- Provide full **data tables** for species, moves, items, locations, ball IDs, language IDs, gender thresholds, ability mapping, etc.
- Swap `toBase64Emerald` for your custom alphabet if your ACE pipeline uses a non-standard Base64 mapping.

Open `index.html` locally in a modern browser to test.
