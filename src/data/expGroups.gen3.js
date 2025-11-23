import { GROUP } from '../lib/exp.js';

// Gen 3 Pokémon grouped by experience type (using Gen III ROM index numbers)
// Each array contains the species IDs for that experience group
// Note: Index numbers differ from National Dex due to gap between Celebi (251) and Treecko (277)
// Group indices: 0=MEDIUM_FAST, 1=ERRATIC, 2=FLUCTUATING, 3=MEDIUM_SLOW, 4=FAST, 5=SLOW

export const MEDIUM_FAST = [
  10, 11, 12, // Caterpie, Metapod, Butterfree
  13, 14, 15, // Weedle, Kakuna, Beedrill
  19, 20, // Rattata, Raticate
  21, 22, // Spearow, Fearow
  23, 24, // Ekans, Arbok
  25, 26, // Pikachu, Raichu
  27, 28, // Sandshrew, Sandslash
  37, 38, // Vulpix, Ninetales
  41, 42, // Zubat, Golbat
  46, 47, // Paras, Parasect
  48, 49, // Venonat, Venomoth
  50, 51, // Diglett, Dugtrio
  52, 53, // Meowth, Persian
  54, 55, // Psyduck, Golduck
  56, 57, // Mankey, Primeape
  77, 78, // Ponyta, Rapidash
  79, 80, // Slowpoke, Slowbro
  81, 82, // Magnemite, Magneton
  83, // Farfetch'd
  84, 85, // Doduo, Dodrio
  86, 87, // Seel, Dewgong
  88, 89, // Grimer, Muk
  95, // Onix
  96, 97, // Drowzee, Hypno
  98, 99, // Krabby, Kingler
  100, 101, // Voltorb, Electrode
  104, 105, // Cubone, Marowak
  106, 107, // Hitmonlee, Hitmonchan
  108, // Lickitung
  109, 110, // Koffing, Weezing
  114, // Tangela
  115, // Kangaskhan
  116, 117, // Horsea, Seadra
  118, 119, // Goldeen, Seaking
  122, // Mr. Mime
  123, // Scyther
  124, // Jynx
  125, // Electabuzz
  126, // Magmar
  132, // Ditto
  133, 134, 135, 136, // Eevee, Vaporeon, Jolteon, Flareon
  137, // Porygon
  138, 139, // Omanyte, Omastar
  140, 141, // Kabuto, Kabutops
  161, 162, // Sentret, Furret
  163, 164, // Hoothoot, Noctowl
  169, // Crobat
  172, // Pichu
  177, 178, // Natu, Xatu
  185, // Sudowoodo
  193, // Yanma
  194, 195, // Wooper, Quagsire
  196, 197, // Espeon, Umbreon
  199, // Slowking
  201, // Unown
  202, // Wobbuffet
  203, // Girafarig
  204, 205, // Pineco, Forretress
  206, // Dunsparce
  208, // Steelix
  211, // Qwilfish
  212, // Scizor
  216, 217, // Teddiursa, Ursaring
  218, 219, // Slugma, Magcargo
  223, 224, // Remoraid, Octillery
  230, // Kingdra
  231, 232, // Phanpy, Donphan
  233, // Porygon2
  236, 237, // Tyrogue, Hitmontop
  238, 239, 240, // Smoochum, Elekid, Magby
  286, 287, // Poochyena, Mightyena
  288, 289, // Zigzagoon, Linoone
  290, 291, 292, 293, 294, // Wurmple, Silcoon, Beautifly, Cascoon, Dustox
  295, 296, 297, // Lotad, Lombre, Ludicolo
  298, 299, 300, // Seedot, Nuzleaf, Shiftry
  304, 305, // Taillow, Swellow
  308, // Spinda
  309, 310, // Wingull, Pelipper
  311, 312, // Surskit, Masquerain
  315, 316, // Skitty, Delcatty
  317, // Kecleon
  318, 319, // Baltoy, Claydol
  320, // Nosepass
  321, // Torkoal
  322, // Sableye
  323, 324, // Barboach, Whiscash
  325, // Luvdisc
  326, 327, // Corphish, Crawdaunt
  330, 331, // Carvanha, Sharpedo
  332, 333, 334, // Trapinch, Vibrava, Flygon
  337, 338, // Electrike, Manectric
  339, 340, // Numel, Camerupt
  341, 342, 343, // Spheal, Sealeo, Walrein
  344, 345, // Cacnea, Cacturne
  346, 347, // Snorunt, Glalie
  348, 349, // Lunatone, Solrock
  350, // Azurill
  351, 352, // Spoink, Grumpig
  353, 354, // Plusle, Minun
  355, // Mawile
  358, // Swablu
  361, 362, // Duskull, Dusclops
  363, 367, 368, // Roselia, Gulpin, Swalot, 
  370, 371, 372, // Whismur, Loudred, Exploud
  385, // Castform
];

export const ERRATIC = [
  301, 302, 303, // Nincada, Ninjask, Shedinja
  313, // Wailmer
  328, 329, // Feebas, Milotic
  359, 360, 380, // Altaria, Wynaut, Zangoose
  375, 376, 377, // Clamperl, Huntail, Gorebyss
  380, // Zangoose
  386, // Volbeat
  388, 389, 390, 391 // Lileep, Cradily, Anorith, Armaldo
];

export const FLUCTUATING = [
  306, 307, // Shroomish, Breloom
  314, // Wailord
  335, 336, // Makuhita, Hariyama
  379, // Seviper
  387, // Illumise
];

export const MEDIUM_SLOW = [
  1, 2, 3, // Bulbasaur, Ivysaur, Venusaur
  4, 5, 6, // Charmander, Charmeleon, Charizard
  7, 8, 9, // Squirtle, Wartortle, Blastoise
  16, 17, 18, // Pidgey, Pidgeotto, Pidgeot
  29, 30, 31, // Nidoran♀, Nidorina, Nidoqueen
  32, 33, 34, // Nidoran♂, Nidorino, Nidoking
  43, 44, 45, // Oddish, Gloom, Vileplume
  60, 61, 62, // Poliwag, Poliwhirl, Poliwrath
  63, 64, 65, // Abra, Kadabra, Alakazam
  66, 67, 68, // Machop, Machoke, Machamp
  69, 70, 71, // Bellsprout, Weepinbell, Victreebel
  74, 75, 76, // Geodude, Graveler, Golem
  92, 93, 94, // Gastly, Haunter, Gengar
  151, // Mew
  152, 153, 154, // Chikorita, Bayleef, Meganium
  155, 156, 157, // Cyndaquil, Quilava, Typhlosion
  158, 159, 160, // Totodile, Croconaw, Feraligatr
  179, 180, 181, // Mareep, Flaaffy, Ampharos
  182, // Bellossom
  186, // Politoed
  187, 188, 189, // Hoppip, Skiploom, Jumpluff
  191, 192, // Sunkern, Sunflora
  198, // Murkrow
  207, // Gligar
  213, // Shuckle
  215, // Sneasel
  251, // Celebi
  277, 278, 279, // Treecko, Grovyle, Sceptile
  280, 281, 282, // Torchic, Combusken, Blaziken
  283, 284, 285, // Mudkip, Marshtomp, Swampert
  376, // Absol
];

export const FAST = [
  35, 36, // Clefairy, Clefable
  39, 40, // Jigglypuff, Wigglytuff
  113, // Chansey
  165, 166, // Ledyba, Ledian
  167, 168, // Spinarak, Ariados
  173, 174, 175, 176, // Pichu, Cleffa, Igglybuff, Togepi
  183, 184, // Marill, Azumarill
  190, // Aipom
  200, // Misdreavus
  209, 210, // Snubbull, Granbull
  222, // Corsola
  225, // Delibird
  235, // Smeargle
  242, // Blissey
  353, 354, // Plusle, Minun
  355, 356, // Mawile, Meditite
  377, 378, // Shuppet, Banette
  411, // Chimecho
];

export const SLOW = [
  58, 59, // Growlithe, Arcanine
  72, 73, // Tentacool, Tentacruel
  90, 91, // Shellder, Cloyster
  102, 103, // Exeggcute, Exeggutor
  111, 112, // Rhyhorn, Rhydon
  120, 121, // Staryu, Starmie
  127, // Pinsir
  128, // Tauros
  129, 130, // Magikarp, Gyarados
  131, // Lapras
  142, // Aerodactyl
  143, // Snorlax
  144, 145, 146, // Articuno, Zapdos, Moltres
  147, 148, 149, // Dratini, Dragonair, Dragonite
  150, // Mewtwo
  170, 171, // Chinchou, Lanturn
  214, // Heracross
  220, 221, // Swinub, Piloswine
  226, // Mantine
  227, // Skarmory
  228, 229, // Houndour, Houndoom
  234, // Stantler
  241, // Miltank
  243, 244, 245, // Raikou, Entei, Suicune
  246, 247, 248, // Larvitar, Pupitar, Tyranitar
  249, 250, // Lugia, Ho-Oh
  364, 365, 366, // Slakoth, Vigoroth, Slaking
  381, // Relicanth
  382, 383, 384, // Aron, Lairon, Aggron
  392, 393, 394, // Ralts, Kirlia, Gardevoir
  395, 396, 397, // Bagon, Shelgon, Salamence
  398, 399, 400, // Beldum, Metang, Metagross
  401, 402, 403, // Regirock, Regice, Registeel
  404, 405, 406, // Kyogre, Groudon, Rayquaza
  407, 408, 409, // Latias, Latios, Jirachi
  410, // Deoxys
];

// Build an array indexed by species ID for fast lookup
// EXP_GROUPS_MAP[speciesId] = GROUP.<type>
export const EXP_GROUPS_MAP = [];

MEDIUM_FAST.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.MEDIUM_FAST));
ERRATIC.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.ERRATIC));
FLUCTUATING.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.FLUCTUATING));
MEDIUM_SLOW.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.MEDIUM_SLOW));
FAST.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.FAST));
SLOW.forEach(id => (EXP_GROUPS_MAP[id] = GROUP.SLOW));

// For convenience: default to MEDIUM_FAST if species not found
export function getExpGroup(speciesId) {
  return EXP_GROUPS_MAP[speciesId] ?? GROUP.MEDIUM_FAST;
}

export default EXP_GROUPS_MAP;