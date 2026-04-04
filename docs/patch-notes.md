Patch Notes - (V.0.3.0)
- Added new Base64 guide for all gen 3 games, including Ruby/Sapphire.
- Added a profanity filter workaround, where the code generator scans for bad words, then splits them in two and shifts the code string forward.
- Additional profanity filter workaround added that kicks in if the first workaround fails: swaps certian letters for symbols. 
- Added tutor moves for FR/LG, and added special moves Blast Burn, Hydro Cannon and Frenzy Plant for Charizard, Blastoise and Venusaur. 
- allows typing 0 in front of TID and SID to avoid confusion. (0 at the front is just a filler, but shows in-game).
- Small fixes to ability id's.

Patch Notes - (V.0.2.9)
- Repositioned the Import button to the top of the page
- added smogon/showdown format as an import option
- added .ek3/.pk3 file import option in the same import window.
- fixed a bug where the "generate" button would not be clickable after import.
- Fixed missing egg moves from evolutions.


Patch Notes - (V.0.2.8)
- Added Static mode for all static encounters in RSEFRLG
- Removed the Legal/Illegal checker, to prevent users from generating illegal pokemon that was states as legal by the website. Will reimplement this later.


Patch Notes - (V.0.2.7)
- Added sprites for each Pokémon
- Fixed Safari encounters for all games
- Added RNG for Unown encounters
- Added reworked shiny funciton
- New UI for better readability

Patch Notes - (V.0.2.6)
- Added proper PID search algorithm (it's much faster)
- Added correct CXD PID type generation for Colosseum/XD mode.
- Added profanity filter for the BASE64 codes, because of Nintendo's strict filters on the Switch. 
- Changed to GPL-3.0 License because of parsed PkHex files. 
- Fixed illegal generations happening when EVs were above 100 and met level was same as current level. 


Patch Notes - (V.0.2.5)

- Added PID Search function to Wild and Legendary mode. This allows users to find and use their own PIDs. 
- Moved the Shiny tickbox into the PID search function for Wild and Legendary mode. 
- Added Manual Override mode, to customize freely.
- Fixed some bugs.


Patch Notes — (V.0.2.4)

Summary

- Only legal moves may now be selected for each species: Implemented levelup moves, egg moves, tutor moves, pre-evolution moves and evolution lines for correct handling of legal moves at specific levels.

Huge "Wild" mode updates:

- You may now only select legal Origin data, met locations and met levels for each species. Implemented the encounter tables for Emerald, Ruby/Sapphire and Fire Red and Leaf Green. Pokemon Collosseum/XD may has been deselected as correct encounter tables are missing. 

Other:
- Background changes for a better "Pokémon feel" to the website.



Patch Notes — (V.0.2.3)

Summary
-UI changes to improve understanding of how the tool works.
-Added event min levels: POKEMON_ROCKS_METANG ≥30; WISHMKR_BEST/WISHMKR_SHINY (Jirachi) ≥5.
-Enforced those mins in applyEventDefaults() and #level blur in main.js.
-Locked/greyed #tid, #sid, and #otName for mystery events (except BOX_EVENT).
-Added and wired updateTidSidLocking() into event selection/clear/preset/encounter flows.
-Hid the #isEgg row except when mode = hatched via updateIsEggVisibility().
-Updated the todo list to reflect these changes.

Patch Notes — (V.0.2.1)

Summary
- Reworked instruction page for BASE64 setup

Patch Notes — (V.0.2.0)

Summary
- Added "Wild" option to the tool.
- Added "Mystery Gifts" option to the tool.
    - includes the most common distribution english and european events for gen 3. More to come in a later patch.
    - includes a database of PIDs with highest average IVs for each nature. Thanks to Adrichu00 for providing a list for each nature for these events.
    - Event Pokemon come with pre-filled movesets. No customization needed once a Pokemon from an event is selected and a nature has been chosen. Export ready!


Patch Notes — (V.0.1.9)

Summary
- Fixed some Pokemon with two abilities having the wrong second ability
- Added a written tutorial for the BASE64 writer 3.0 

Patch Notes — (V.0.1.8)

Summary
- Added the option to spawn your pokemon as an egg.
- Fixed some pokemon being in the wrong growth rate group
- Fixed PID not changing when switching gender
- Fixed .pk3 file import and export to recieve and export correct data.

Patch Notes — (V.0.1.7)

Summary
- Small changes to the UI
- Fixed some species from showing genders they cannot have
- removed HMs and Key items from the list of held items.
- Added .pk3 support. You may now export and import .pk3 files. This should also open correctly in PkHex and Pokeglitzer.

