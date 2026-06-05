Patch Notes - (V.0.3.7)

- Added a visual graph for the base stats of the selected Pokémon.
- Added max-width: 640px mobile overrides to prevent horizontal overflow on mobile.
- Made sure "is egg" is only availbale to base forms, Marill and Wobbuffet in the Hatched encounter type.
- Added and adjusted multiple tooltips to the website for extra clarity.
- Fixed Mitsurin Celebi having the wrong PID type and OT name.
- Made the Metang code troubleshooting link visible before generating a code.


Patch Notes - (V.0.3.6)
- Added Pokérus option. You may choose between no pokérus, has pokérus and cured for all encounter types.
- Added buttons to choose between Console/Emulator code and Nintendo Switch code.
- Added and adjusted some tooltips and structure of the site for more clarity.
- Fixed the PID type generation for Ruby&Sapphire Box distribution for the BACD_U PID type. It was giving limited and incorrect results.

Patch Notes - (V.0.3.5)
- Added a troubleshooting guide for Base64 codes, and added a clickable Metang sprite in the code section.
- Locked CXD generations to Male OT, as there is no female protaganist in Colosseum or XD
- Added tooltip for EVs
- Added "Find legal encounter" button to Ruby&Sapphire Box distribution pokemon.
- locked the Origin Game to Ruby for WISHMKR Jirachi Event, and updated the wording on the extra pkmn next to WELDR to avoid confusion about spaces.
- Locked some fields for the Channel Jirachi event
- Locked multiple fields in mystery gift encounter type
- improved profanity filter, making it no longer treat numbers as invisible, helping to catch more bad words
- fixed some bugs in the mystery gifts events, and added find legal encounter for pokemon Box ruby & sapphire
- changed .ek3 file import to allow 100 bytes, ignoring the last 20 bytes.

Patch Notes - (V.0.3.4)
- Added "Find legal encounter" to Mystery Gifts encounter type
- Improved the profanity filter
- Added Space Center Deoxys mystery gift
- Added "Berry Program Update Zigzagoon" event to Mystery Gifts
- Added "PCNY WISH EGGS" event
- Added MYSTRY Mew event to Mystery Gifts
- Set the global minimum IVs to 20 in the Find Legal Encounter function, to allow for more results on event Pokemon with limited pool.


Patch Notes - (V.0.3.3)
- Removed simple and advanced mode to simplify the page. They are now instead merged together with an improved flow.
- Added Mitsurin Celebi to Mystery Gifts
- Added a strict rule for import, where unedited imports = byte-preserved output. Edited import = rebuild from UI fields
- Fixed a bug where pk3 files were not converted correctly to raw encrypted data, causing the tool to rebuild the Pokemon, giving slightly different code.

Patch Notes - (V.0.3.2)
- Added Base64 as an import function.
- Made hidden power type editable in hatched mode, changed "manual override" to "Unlock all fields for editing", and added an explanation.
- Reworked encounter-mode change flow: save current mode state, load saved state when returning to a mode.
- Improved profanity filter workaround for the switch, ignoring numbers and symbols to catch bad words more easily.
- Added the patch notes log to the site.
- Fixed the import hex data function so that illegally imported data would still result in a 1:1 conversion when generating the code, as long as the fields remain unedited.
- Fixed a bug where the xd/colosseum shiny lock warning would remain after switching to another encounter type.

Patch Notes - (V.0.3.1)
- Added Hidden Power filter to the "find legal PID" button and changed the name to "find legal encounter"
- Locked IV fields from non-hatched modes for a lower risk of creating illegal Pokemon.
- Fixed the Hatched mode generating the wrong gender because of old system using NatDex numbers instead of Index numbers when determining species.
- Fixed a browser auto-restore bug on the base64 guide.
- Fixed Colosseum Pokemon having the "fateful encounter" checked, added warning for changing TID/SID after PID selection.
- fixed a bug where non-legendaries in static mode did not update nature PID.

Patch Notes - (V.0.3.0)
- Added new Base64 guide for all gen 3 games, including Ruby/Sapphire.
- Added a profanity filter workaround, where the code generator scans for bad words, then splits them in two and shifts the code string forward.
- Additional profanity filter workaround added that kicks in if the first workaround fails: swaps certian letters for symbols. 
- Added tutor moves for FR/LG, and added special moves Blast Burn, Hydro Cannon and Frenzy Plant for Charizard, Blastoise and Venusaur. 
- Allows typing 0 in front of TID and SID to avoid confusion. (0 at the front is just a filler, but shows in-game).
- Small fixes to ability id's.

Patch Notes - (V.0.2.9)
- Repositioned the Import button to the top of the page.
- Added smogon/showdown format as an import option.
- Added .ek3/.pk3 file import option in the same import window.
- Fixed a bug where the "generate" button would not be clickable after import.
- Fixed missing egg moves from evolutions.


Patch Notes - (V.0.2.8)
- Added Static mode for all static encounters in RSEFRLG.
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

