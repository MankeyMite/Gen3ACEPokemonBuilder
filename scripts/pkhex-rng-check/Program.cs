using System.Reflection;
using System.Text.Json;
using PKHeX.Core;

// Use the same pinned Core as the browser validator. Reflection accesses its
// internal encounter database; the RNG checks themselves use public APIs.
var assembly = typeof(PK3).Assembly;
var flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static;
string[] names = ["SlotsS", "SlotsR", "SlotsE", "SlotsFR", "SlotsLG"];
var areas = names.Select((name, index) => (EncounterArea3[])assembly
    .GetType(index < 3 ? "PKHeX.Core.Encounters3RSE" : "PKHeX.Core.Encounters3FRLG")!
    .GetField(name, flags)!.GetValue(null)!).ToArray();

// Confirm the user's original shiny Adamant male Sturdy example is rejected
// for both Graveler and its traded evolution Golem in FireRed and LeafGreen.
var reported = new PK3
{
    Species = 75, PID = 0x50C8FEF9, TID16 = 16669, SID16 = 61226,
    IV_HP = 29, IV_ATK = 30, IV_DEF = 18, IV_SPA = 22, IV_SPD = 31, IV_SPE = 27,
};
var reportedSeed = MethodFinder.Analyze(reported).OriginSeed;
foreach (var game in new[] { 4, 5 })
{
    foreach (var species in new ushort[] { 75, 76 })
    {
        var evo = new EvoCriteria { Species = species, LevelMin = 39, LevelMax = 39 };
        var slots = areas[game - 1].SelectMany(area => area.Slots)
            .Where(slot => slot.Species == 75 && slot.Location == 138);
        if (slots.Any(slot => MethodH.GetSeed(slot, reportedSeed, false, reported.Gender, evo).IsValid))
            throw new InvalidOperationException("The impossible Rock Tunnel regression unexpectedly passed PKHeX.");
    }
}

using var document = JsonDocument.Parse(File.ReadAllText(args[0]));
var count = 0;
foreach (var fixture in document.RootElement.EnumerateArray())
{
    var game = fixture.GetProperty("gameId").GetInt32();
    var species = SpeciesConverter.GetNational3(fixture.GetProperty("species").GetUInt16());
    var location = fixture.GetProperty("location").GetInt32();
    var pid = fixture.GetProperty("pid").GetUInt32();
    var iv = fixture.GetProperty("ivs");
    var pk = new PK3
    {
        Species = species, PID = pid, Version = (GameVersion)game,
        IV_HP = iv.GetProperty("hp").GetInt32(), IV_ATK = iv.GetProperty("atk").GetInt32(),
        IV_DEF = iv.GetProperty("def").GetInt32(), IV_SPA = iv.GetProperty("spa").GetInt32(),
        IV_SPD = iv.GetProperty("spd").GetInt32(), IV_SPE = iv.GetProperty("spe").GetInt32(),
    };
    // Recover from the result's actual PID/IVs, as the legality checker does,
    // instead of trusting the seed claimed by the JavaScript worker.
    var correlation = MethodFinder.Analyze(pk);
    if (correlation.Type is not (PIDType.Method_1 or PIDType.Method_2 or PIDType.Method_4))
        throw new InvalidOperationException($"Unexpected PID/IV correlation for {pid:X8}: {correlation.Type}");
    foreach (var levelValue in fixture.GetProperty("metLevels").EnumerateArray())
    {
        var level = levelValue.GetByte();
        var evo = new EvoCriteria { Species = species, LevelMin = level, LevelMax = level };
        var slots = areas[game - 1].SelectMany(area => area.Slots)
            .Where(slot => slot.Species == species && slot.Location == location &&
                slot.LevelMin <= level && slot.LevelMax >= level);
        if (!slots.Any(slot => MethodH.GetSeed(slot, correlation.OriginSeed, game == 3, pk.Gender, evo).IsValid))
            throw new InvalidOperationException($"Impossible RNG: game {game}, species {species}, location {location}, level {level}, PID {pid:X8}, {fixture.GetProperty("method")}");
    }
    count++;
}
Console.WriteLine($"PKHeX.Core 26.8.26: {count} PID/IV and exact-level encounter correlations passed across FR/LG and RSE.");
