# Trainer-ID dice

The dice beside SID randomizes **both** TID and SID for the selected Origin
Game. It is hidden for Mystery Gifts, NPC trades, fixed trainer IDs and
GameCube starters (whose IDs must be generated together with their PID/IVs).
Manual Override does not enable the dice for these encounters. A roll clears
an active legal-encounter selection so its previous trainer-dependent result
cannot be reused silently. The normal trainer input handlers then refresh
shininess, legality, import edit tracking and stale generated output.

## RNG rules

- **Ruby/Sapphire:** start from a random 16-bit boot seed, advance through a
  modeled intro, then draw SID followed by TID from consecutive GBA LCRNG
  outputs. This also satisfies the builder's existing R/S pair validator.
- **Emerald:** the naming-screen timer becomes both TID and the new RNG seed.
  Advance that seed through a modeled remaining intro, then draw SID.
- **FireRed/LeafGreen:** the same timer-seeded TID/SID mechanism, with a longer
  remaining intro window to account for the rival-name portion.
- **Colosseum/XD:** construct a reachable name-screen end seed with four
  consecutive outputs above `0x1999`, advance 1,000 times, then draw TID and SID
  from consecutive XDRNG outputs. Generated pairs pass the existing full
  GameCube trainer-ID verifier, including name-screen reachability.

The GBA timing sampler uses the hardware refresh rate (approximately 59.7275
frames/second). Its truncated exponential distribution favors shorter times,
with a hard **1,000-second maximum** (16 minutes 40 seconds). Minimums and
exponential scales are respectively 60/60 seconds for R/S, 10/20 for Emerald,
and 30/40 for FRLG. Emerald's median is approximately 24 seconds.

These timing preferences are a **heuristic**, not measured player behavior or
an exact input replay. They model RNG advances at one call per VBlank; intro
animations, text speed, naming and other calls affect exact wall-clock timing.
They constrain new rolls only, without rejecting manually entered IDs that
could arise after longer waits. The GBA time model is not applied to GameCube.

## Primary references

- [R/S trainer-ID draws](https://github.com/pret/pokeruby/blob/master/src/new_game.c)
- [Emerald trainer-ID draw](https://github.com/pret/pokeemerald/blob/master/src/new_game.c),
  [timer seeding and VBlank advances](https://github.com/pret/pokeemerald/blob/master/src/main.c),
  [player naming-screen exit](https://github.com/pret/pokeemerald/blob/master/src/naming_screen.c)
- [FRLG trainer-ID draw](https://github.com/pret/pokefirered/blob/master/src/new_game.c),
  [timer seeding and VBlank advances](https://github.com/pret/pokefirered/blob/master/src/main.c),
  [player naming-screen exit](https://github.com/pret/pokefirered/blob/master/src/naming_screen.c)
- GameCube reachability: the existing `isValidGCTidSid` implementation in
  `src/data/shadowEncounters.gen3.js`, ported from PKHeX's `MethodCXD`.
