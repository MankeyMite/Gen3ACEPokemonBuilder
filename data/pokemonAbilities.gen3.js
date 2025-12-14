/**
 * Pokémon abilities for Gen 3 (National Dex order)
 * Structure: [speciesId]: [ability0_id, ability1_id]
 * If both abilities are the same, the Pokémon only has one ability
 */

export const POKEMON_ABILITIES = {
  1: [65, 65],   // Bulbasaur - Overgrow
  2: [65, 65],   // Ivysaur - Overgrow
  3: [65, 65],   // Venusaur - Overgrow
  4: [66, 66],   // Charmander - Blaze
  5: [66, 66],   // Charmeleon - Blaze
  6: [66, 66],   // Charizard - Blaze
  7: [67, 67],   // Squirtle - Torrent
  8: [67, 67],   // Wartortle - Torrent
  9: [67, 67],   // Blastoise - Torrent
  10: [19, 19],  // Caterpie - Shield Dust
  11: [61, 61],  // Metapod - Shed Skin
  12: [14, 14],  // Butterfree - Compound Eyes
  13: [19, 19],  // Weedle - Shield Dust
  14: [61, 61],  // Kakuna - Shed Skin
  15: [68, 68],  // Beedrill - Swarm
  16: [51, 51],  // Pidgey - Keen Eye
  17: [51, 51],  // Pidgeotto - Keen Eye
  18: [51, 51],  // Pidgeot - Keen Eye
  19: [50, 62],  // Rattata - Run Away / Guts
  20: [50, 62],  // Raticate - Run Away / Guts
  21: [51, 51],  // Spearow - Keen Eye
  22: [51, 51],  // Fearow - Keen Eye
  23: [22, 61],  // Ekans - Intimidate / Shed Skin
  24: [22, 61],  // Arbok - Intimidate / Shed Skin
  25: [9, 9],    // Pikachu - Static
  26: [9, 9],    // Raichu - Static
  27: [8, 8],    // Sandshrew - Sand Veil
  28: [8, 8],    // Sandslash - Sand Veil
  29: [38, 38],  // Nidoran♀ - Poison Point
  30: [38, 38],  // Nidorina - Poison Point
  31: [38, 38],  // Nidoqueen - Poison Point
  32: [38, 38],  // Nidoran♂ - Poison Point
  33: [38, 38],  // Nidorino - Poison Point
  34: [38, 38],  // Nidoking - Poison Point
  35: [56, 56],  // Clefairy - Cute Charm
  36: [56, 56],  // Clefable - Cute Charm
  37: [18, 18],  // Vulpix - Flash Fire
  38: [18, 18],  // Ninetales - Flash Fire
  39: [56, 56],  // Jigglypuff - Cute Charm
  40: [56, 56],  // Wigglytuff - Cute Charm
  41: [39, 39],  // Zubat - Inner Focus
  42: [39, 39],  // Golbat - Inner Focus
  43: [34, 34],  // Oddish - Chlorophyll
  44: [34, 34],  // Gloom - Chlorophyll
  45: [34, 34],  // Vileplume - Chlorophyll
  46: [27, 27],  // Paras - Effect Spore
  47: [27, 27],  // Parasect - Effect Spore
  48: [14, 14],  // Venonat - Compound Eyes
  49: [19, 19],  // Venomoth - Shield Dust
  50: [8, 71],   // Diglett - Sand Veil / Arena Trap
  51: [8, 71],   // Dugtrio - Sand Veil / Arena Trap
  52: [53, 53],  // Meowth - Pickup
  53: [7, 7],    // Persian - Limber
  54: [6, 13],   // Psyduck - Damp / Cloud Nine
  55: [6, 13],   // Golduck - Damp / Cloud Nine
  56: [72, 72],  // Mankey - Vital Spirit
  57: [72, 72],  // Primeape - Vital Spirit
  58: [22, 18],  // Growlithe - Intimidate / Flash Fire
  59: [22, 18],  // Arcanine - Intimidate / Flash Fire
  60: [11, 6],   // Poliwag - Water Absorb / Damp
  61: [11, 6],   // Poliwhirl - Water Absorb / Damp
  62: [11, 6],   // Poliwrath - Water Absorb / Damp
  63: [28, 39],  // Abra - Synchronize / Inner Focus
  64: [28, 39],  // Kadabra - Synchronize / Inner Focus
  65: [28, 39],  // Alakazam - Synchronize / Inner Focus
  66: [62, 62],  // Machop - Guts
  67: [62, 62],  // Machoke - Guts
  68: [62, 62],  // Machamp - Guts
  69: [34, 34],  // Bellsprout - Chlorophyll
  70: [34, 34],  // Weepinbell - Chlorophyll
  71: [34, 34],  // Victreebel - Chlorophyll
  72: [29, 64],  // Tentacool - Clear Body / Liquid Ooze
  73: [29, 64],  // Tentacruel - Clear Body / Liquid Ooze
  74: [69, 5],   // Geodude - Rock Head / Sturdy
  75: [69, 5],   // Graveler - Rock Head / Sturdy
  76: [69, 5],   // Golem - Rock Head / Sturdy
  77: [50, 18],  // Ponyta - Run Away / Flash Fire
  78: [50, 18],  // Rapidash - Run Away / Flash Fire
  79: [12, 20],  // Slowpoke - Oblivious / Own Tempo
  80: [12, 20],  // Slowbro - Oblivious / Own Tempo
  81: [42, 5],   // Magnemite - Magnet Pull / Sturdy
  82: [42, 5],   // Magneton - Magnet Pull / Sturdy
  83: [51, 39],  // Farfetch'd - Keen Eye / Inner Focus
  84: [50, 48],  // Doduo - Run Away / Early Bird
  85: [50, 48],  // Dodrio - Run Away / Early Bird
  86: [47, 47],  // Seel - Thick Fat
  87: [47, 47],  // Dewgong - Thick Fat
  88: [1, 60],   // Grimer - Stench / Sticky Hold
  89: [1, 60],   // Muk - Stench / Sticky Hold
  90: [75, 75],  // Shellder - Shell Armor
  91: [75, 75],  // Cloyster - Shell Armor
  92: [26, 26],  // Gastly - Levitate
  93: [26, 26],  // Haunter - Levitate
  94: [26, 26],  // Gengar - Levitate
  95: [69, 5],   // Onix - Rock Head / Sturdy
  96: [15, 15],  // Drowzee - Insomnia
  97: [15, 15],  // Hypno - Insomnia
  98: [52, 75],  // Krabby - Hyper Cutter / Shell Armor
  99: [52, 75],  // Kingler - Hyper Cutter / Shell Armor
  100: [43, 9],  // Voltorb - Soundproof / Static
  101: [43, 9],  // Electrode - Soundproof / Static
  102: [34, 34], // Exeggcute - Chlorophyll
  103: [34, 34], // Exeggutor - Chlorophyll
  104: [69, 32], // Cubone - Rock Head / Lightning Rod
  105: [69, 32], // Marowak - Rock Head / Lightning Rod
  106: [7, 7],   // Hitmonlee - Limber
  107: [51, 51], // Hitmonchan - Keen Eye
  108: [20, 12], // Lickitung - Own Tempo / Oblivious
  109: [26, 26], // Koffing - Levitate
  110: [26, 26], // Weezing - Levitate
  111: [32, 69], // Rhyhorn - Lightning Rod / Rock Head
  112: [32, 69], // Rhydon - Lightning Rod / Rock Head
  113: [30, 32], // Chansey - Natural Cure / Serene Grace
  114: [34, 34], // Tangela - Chlorophyll
  115: [48, 48], // Kangaskhan - Early Bird
  116: [33, 33], // Horsea - Swift Swim
  117: [38, 38], // Seadra - Poison Point
  118: [33, 11], // Goldeen - Swift Swim / Water Veil
  119: [33, 11], // Seaking - Swift Swim / Water Veil
  120: [35, 30], // Staryu - Illuminate / Natural Cure
  121: [35, 30], // Starmie - Illuminate / Natural Cure
  122: [43, 43], // Mr. Mime - Soundproof
  123: [68, 68], // Scyther - Swarm
  124: [12, 12], // Jynx - Oblivious
  125: [9, 9],   // Electabuzz - Static
  126: [49, 49], // Magmar - Flame Body
  127: [52, 52], // Pinsir - Hyper Cutter
  128: [22, 22], // Tauros - Intimidate
  129: [33, 33], // Magikarp - Swift Swim
  130: [22, 22], // Gyarados - Intimidate
  131: [11, 75], // Lapras - Water Absorb / Shell Armor
  132: [7, 7],   // Ditto - Limber
  133: [50, 50], // Eevee - Run Away
  134: [11, 11], // Vaporeon - Water Absorb
  135: [10, 10], // Jolteon - Volt Absorb
  136: [18, 18], // Flareon - Flash Fire
  137: [36, 36], // Porygon - Trace
  138: [33, 75], // Omanyte - Swift Swim / Shell Armor
  139: [33, 75], // Omastar - Swift Swim / Shell Armor
  140: [33, 4],  // Kabuto - Swift Swim / Battle Armor
  141: [33, 4],  // Kabutops - Swift Swim / Battle Armor
  142: [69, 46], // Aerodactyl - Rock Head / Pressure
  143: [17, 47], // Snorlax - Immunity / Thick Fat
  144: [46, 46], // Articuno - Pressure
  145: [46, 46], // Zapdos - Pressure
  146: [46, 46], // Moltres - Pressure
  147: [61, 61], // Dratini - Shed Skin
  148: [61, 61], // Dragonair - Shed Skin
  149: [39, 39], // Dragonite - Inner Focus
  150: [46, 46], // Mewtwo - Pressure
  151: [28, 28], // Mew - Synchronize
  152: [65, 65], // Chikorita - Overgrow
  153: [65, 65], // Bayleef - Overgrow
  154: [65, 65], // Meganium - Overgrow
  155: [66, 66], // Cyndaquil - Blaze
  156: [66, 66], // Quilava - Blaze
  157: [66, 66], // Typhlosion - Blaze
  158: [67, 67], // Totodile - Torrent
  159: [67, 67], // Croconaw - Torrent
  160: [67, 67], // Feraligatr - Torrent
  161: [50, 51], // Sentret - Run Away / Keen Eye
  162: [50, 51], // Furret - Run Away / Keen Eye
  163: [15, 51], // Hoothoot - Insomnia / Keen Eye
  164: [15, 51], // Noctowl - Insomnia / Keen Eye
  165: [68, 48], // Ledyba - Swarm / Early Bird
  166: [68, 48], // Ledian - Swarm / Early Bird
  167: [68, 15], // Spinarak - Swarm / Insomnia
  168: [68, 15], // Ariados - Swarm / Insomnia
  169: [39, 39], // Crobat - Inner Focus
  170: [10, 35], // Chinchou - Volt Absorb / Illuminate
  171: [10, 35], // Lanturn - Volt Absorb / Illuminate
  172: [9, 9],   // Pichu - Static
  173: [56, 56], // Cleffa - Cute Charm
  174: [56, 56], // Igglybuff - Cute Charm
  175: [55, 32], // Togepi - Hustle / Serene Grace
  176: [55, 32], // Togetic - Hustle / Serene Grace
  177: [28, 48], // Natu - Synchronize / Early Bird
  178: [28, 48], // Xatu - Synchronize / Early Bird
  179: [9, 9],   // Mareep - Static
  180: [9, 9],   // Flaaffy - Static
  181: [9, 9],   // Ampharos - Static
  182: [34, 34], // Bellossom - Chlorophyll
  183: [47, 37], // Marill - Thick Fat / Huge Power
  184: [47, 37], // Azumarill - Thick Fat / Huge Power
  185: [5, 69],  // Sudowoodo - Sturdy / Rock Head
  186: [11, 6],  // Politoed - Water Absorb / Damp
  187: [34, 34], // Hoppip - Chlorophyll
  188: [34, 34], // Skiploom - Chlorophyll
  189: [34, 34], // Jumpluff - Chlorophyll
  190: [50, 53], // Aipom - Run Away / Pickup
  191: [34, 34], // Sunkern - Chlorophyll
  192: [34, 34], // Sunflora - Chlorophyll
  193: [3, 14],  // Yanma - Speed Boost / Compound Eyes
  194: [6, 11],  // Wooper - Damp / Water Absorb
  195: [6, 11],  // Quagsire - Damp / Water Absorb
  196: [28, 28], // Espeon - Synchronize
  197: [28, 28], // Umbreon - Synchronize
  198: [15, 15], // Murkrow - Insomnia
  199: [12, 20], // Slowking - Oblivious / Own Tempo
  200: [26, 26], // Misdreavus - Levitate
  201: [26, 26], // Unown - Levitate
  202: [23, 23], // Wobbuffet - Shadow Tag
  203: [48, 39], // Girafarig - Early Bird / Inner Focus
  204: [5, 5],   // Pineco - Sturdy
  205: [5, 5],   // Forretress - Sturdy
  206: [32, 50], // Dunsparce - Serene Grace / Run Away
  207: [52, 8],  // Gligar - Hyper Cutter / Sand Veil
  208: [69, 5],  // Steelix - Rock Head / Sturdy
  209: [22, 50], // Snubbull - Intimidate / Run Away
  210: [22, 22], // Granbull - Intimidate
  211: [38, 33], // Qwilfish - Poison Point / Swift Swim
  212: [68, 68], // Scizor - Swarm
  213: [5, 5],   // Shuckle - Sturdy
  214: [68, 62], // Heracross - Swarm / Guts
  215: [39, 51], // Sneasel - Inner Focus / Keen Eye
  216: [53, 53], // Teddiursa - Pickup
  217: [62, 62], // Ursaring - Guts
  218: [40, 49], // Slugma - Magma Armor / Flame Body
  219: [40, 49], // Magcargo - Magma Armor / Flame Body
  220: [12, 12], // Swinub - Oblivious
  221: [12, 12], // Piloswine - Oblivious
  222: [55, 30], // Corsola - Hustle / Natural Cure
  223: [55, 55], // Remoraid - Hustle
  224: [21, 21], // Octillery - Suction Cups
  225: [72, 55], // Delibird - Vital Spirit / Hustle
  226: [33, 11], // Mantine - Swift Swim / Water Absorb
  227: [51, 5],  // Skarmory - Keen Eye / Sturdy
  228: [48, 18], // Houndour - Early Bird / Flash Fire
  229: [48, 18], // Houndoom - Early Bird / Flash Fire
  230: [33, 33], // Kingdra - Swift Swim
  231: [53, 53], // Phanpy - Pickup
  232: [5, 5],   // Donphan - Sturdy
  233: [36, 36], // Porygon2 - Trace
  234: [22, 22], // Stantler - Intimidate
  235: [20, 20], // Smeargle - Own Tempo
  236: [62, 62], // Tyrogue - Guts
  237: [22, 22], // Hitmontop - Intimidate
  238: [12, 12], // Smoochum - Oblivious
  239: [9, 9],   // Elekid - Static
  240: [49, 49], // Magby - Flame Body
  241: [47, 47], // Miltank - Thick Fat
  242: [30, 32], // Blissey - Natural Cure / Serene Grace
  243: [46, 46], // Raikou - Pressure
  244: [46, 46], // Entei - Pressure
  245: [46, 46], // Suicune - Pressure
  246: [62, 62], // Larvitar - Guts
  247: [61, 61], // Pupitar - Shed Skin
  248: [45, 45], // Tyranitar - Sand Stream
  249: [46, 46], // Lugia - Pressure
  250: [46, 46], // Ho-Oh - Pressure
  251: [30, 30], // Celebi - Natural Cure
  277: [65, 65], // Treecko - Overgrow
  278: [65, 65], // Grovyle - Overgrow
  279: [65, 65], // Sceptile - Overgrow
  280: [66, 66], // Torchic - Blaze
  281: [66, 66], // Combusken - Blaze
  282: [66, 66], // Blaziken - Blaze
  283: [67, 67], // Mudkip - Torrent
  284: [67, 67], // Marshtomp - Torrent
  285: [67, 67], // Swampert - Torrent
  286: [50, 50], // Poochyena - Run Away
  287: [22, 22], // Mightyena - Intimidate
  288: [53, 53], // Zigzagoon - Pickup
  289: [53, 53], // Linoone - Pickup
  290: [19, 19], // Wurmple - Shield Dust
  291: [61, 61], // Silcoon - Shed Skin
  292: [68, 68], // Beautifly - Swarm
  293: [61, 61], // Cascoon - Shed Skin
  294: [19, 19], // Dustox - Shield Dust
  295: [33, 44], // Lotad - Swift Swim / Rain Dish
  296: [33, 44], // Lombre - Swift Swim / Rain Dish
  297: [33, 44], // Ludicolo - Swift Swim / Rain Dish
  298: [34, 48], // Seedot - Chlorophyll / Early Bird
  299: [34, 48], // Nuzleaf - Chlorophyll / Early Bird
  300: [34, 48], // Shiftry - Chlorophyll / Early Bird
  301: [14, 14], // Nincada - Compound Eyes
  302: [3, 3],   // Ninjask - Speed Boost
  303: [25, 25], // Shedinja - Wonder Guard
  304: [62, 62], // Taillow - Guts
  305: [62, 62], // Swellow - Guts
  306: [27, 27], // Shroomish - Effect Spore
  307: [27, 27], // Breloom - Effect Spore
  308: [20, 20], // Spinda - Own Tempo
  309: [51, 51], // Wingull - Keen Eye
  310: [51, 51], // Pelipper - Keen Eye
  311: [33, 33], // Surskit - Swift Swim
  312: [22, 22], // Masquerain - Intimidate
  313: [41, 12], // Wailmer - Water Veil / Oblivious
  314: [41, 12], // Wailord - Water Veil / Oblivious
  315: [56, 56], // Skitty - Cute Charm
  316: [56, 56], // Delcatty - Cute Charm
  317: [16, 16], // Kecleon - Color Change
  318: [26, 26], // Baltoy - Levitate
  319: [26, 26], // Claydol - Levitate
  320: [5, 42],  // Nosepass - Sturdy / Magnet Pull
  321: [73, 73], // Torkoal - White Smoke
  322: [51, 51], // Sableye - Keen Eye
  323: [12, 12], // Barboach - Oblivious
  324: [12, 12], // Whiscash - Oblivious
  325: [33, 33], // Luvdisc - Swift Swim
  326: [52, 75], // Corphish - Hyper Cutter / Shell Armor
  327: [52, 75], // Crawdaunt - Hyper Cutter / Shell Armor
  328: [33, 33], // Feebas - Swift Swim
  329: [63, 63], // Milotic - Marvel Scale
  330: [24, 24], // Carvanha - Rough Skin
  331: [24, 24], // Sharpedo - Rough Skin
  332: [52, 71], // Trapinch - Hyper Cutter / Arena Trap
  333: [26, 26], // Vibrava - Levitate
  334: [26, 26], // Flygon - Levitate
  335: [47, 62], // Makuhita - Thick Fat / Guts
  336: [47, 62], // Hariyama - Thick Fat / Guts
  337: [9, 32],  // Electrike - Static / Lightning Rod
  338: [9, 32],  // Manectric - Static / Lightning Rod
  339: [12, 12], // Numel - Oblivious
  340: [40, 40], // Camerupt - Magma Armor
  341: [47, 47], // Spheal - Thick Fat
  342: [47, 47], // Sealeo - Thick Fat
  343: [47, 47], // Walrein - Thick Fat
  344: [8, 8],   // Cacnea - Sand Veil
  345: [8, 8],   // Cacturne - Sand Veil
  346: [39, 39], // Snorunt - Inner Focus
  347: [39, 39], // Glalie - Inner Focus
  348: [26, 26], // Lunatone - Levitate
  349: [26, 26], // Solrock - Levitate
  350: [47, 37], // Azurill - Thick Fat / Huge Power
  351: [47, 20], // Spoink - Thick Fat / Own Tempo
  352: [47, 20], // Grumpig - Thick Fat / Own Tempo
  353: [57, 57], // Plusle - Plus
  354: [58, 58], // Minun - Minus
  355: [52, 22], // Mawile - Hyper Cutter / Intimidate
  356: [74, 74], // Meditite - Pure Power
  357: [74, 74], // Medicham - Pure Power
  358: [30, 30], // Swablu - Natural Cure
  359: [30, 30], // Altaria - Natural Cure
  360: [23, 23], // Wynaut - Shadow Tag
  361: [26, 26], // Duskull - Levitate
  362: [46, 46], // Dusclops - Pressure
  363: [30, 38], // Roselia - Natural Cure / Poison Point
  364: [54, 54], // Slakoth - Truant
  365: [72, 72], // Vigoroth - Vital Spirit
  366: [54, 54], // Slaking - Truant
  367: [64, 60], // Gulpin - Liquid Ooze / Sticky Hold
  368: [64, 60], // Swalot - Liquid Ooze / Sticky Hold
  369: [34, 34], // Tropius - Chlorophyll
  370: [43, 43], // Whismur - Soundproof
  371: [43, 43], // Loudred - Soundproof
  372: [43, 43], // Exploud - Soundproof
  373: [75, 75], // Clamperl - Shell Armor
  374: [33, 33], // Huntail - Swift Swim
  375: [33, 33], // Gorebyss - Swift Swim
  376: [46, 46], // Absol - Pressure
  377: [15, 15], // Shuppet - Insomnia
  378: [15, 15], // Banette - Insomnia
  379: [61, 61], // Seviper - Shed Skin
  380: [17, 17], // Zangoose - Immunity
  381: [69, 69], // Relicanth - Rock Head
  382: [5, 69],  // Aron - Sturdy / Rock Head
  383: [5, 69],  // Lairon - Sturdy / Rock Head
  384: [5, 69],  // Aggron - Sturdy / Rock Head
  385: [59, 59], // Castform - Forecast
  386: [35, 68], // Volbeat - Illuminate / Swarm
  387: [12, 12], // Illumise - Oblivious
  388: [21, 21], // Lileep - Suction Cups
  389: [21, 21], // Cradily - Suction Cups
  390: [4, 4],   // Anorith - Battle Armor
  391: [4, 4],   // Armaldo - Battle Armor
  392: [28, 36], // Ralts - Synchronize / Trace
  393: [28, 36], // Kirlia - Synchronize / Trace
  394: [28, 36], // Gardevoir - Synchronize / Trace
  395: [69, 69], // Bagon - Rock Head
  396: [69, 69], // Shelgon - Rock Head
  397: [22, 22], // Salamence - Intimidate
  398: [29, 29], // Beldum - Clear Body
  399: [29, 29], // Metang - Clear Body
  400: [29, 29], // Metagross - Clear Body
  401: [29, 29], // Regirock - Clear Body
  402: [29, 29], // Regice - Clear Body
  403: [29, 29], // Registeel - Clear Body
  404: [2, 2],   // Kyogre - Drizzle
  405: [70, 70], // Groudon - Drought
  406: [77, 77], // Rayquaza - Air Lock
  407: [26, 26], // Latias - Levitate
  408: [26, 26], // Latios - Levitate
  409: [32, 32], // Jirachi - Serene Grace
  410: [46, 46], // Deoxys - Pressure
  411: [26, 26]  // Chimecho - Levitate
};

/**
 * Check if a species has two different abilities
 * @param {number} speciesId 
 * @returns {boolean}
 */
export function hasDualAbilities(speciesId) {
  const abilities = POKEMON_ABILITIES[speciesId];
  if (!abilities) return false;
  return abilities[0] !== abilities[1];
}

/**
 * Get the ability IDs for a species
 * @param {number} speciesId 
 * @returns {[number, number] | null}
 */
export function getSpeciesAbilities(speciesId) {
  return POKEMON_ABILITIES[speciesId] || null;
}
