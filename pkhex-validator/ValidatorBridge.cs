using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using System.Text.Json;
using System.Text.Json.Serialization;
using PKHeX.Core;

namespace PkhexValidator;

[SupportedOSPlatform("browser")]
public static partial class ValidatorBridge
{
    private const int Gen3StoredSize = 80;
    public const string PinnedPkhexVersion = "26.8.26";
    public const string CartridgeEnvironment = "gba-cartridge";
    public const string SwitchEnvironment = "switch-frlg";

    private static readonly object Gate = new();
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    /// <summary>
    /// Validates an exact copied 80-byte encrypted Gen III stored Pokemon.
    /// Base64 is transport encoding only; the decoded bytes are passed directly
    /// to PK3, which performs PKHeX's own decrypt-if-encrypted behavior.
    /// </summary>
    [JSExport]
    public static string Validate(string storedPokemonBase64, string environment)
    {
        var normalizedEnvironment = environment ?? string.Empty;

        try
        {
            normalizedEnvironment = NormalizeEnvironment(normalizedEnvironment);
            var input = Convert.FromBase64String(storedPokemonBase64);
            if (input.Length != Gen3StoredSize)
                return SerializeError(normalizedEnvironment,
                    $"Expected exactly {Gen3StoredSize} bytes, received {input.Length}.");

            // PK3 decrypts in place. Keep the caller-owned data immutable and
            // make the exact boundary copy here before PKHeX sees the bytes.
            var exactCopy = input.AsMemory().ToArray();

            lock (Gate)
            {
                ConfigureEnvironment(normalizedEnvironment);

                var pk = new PK3(exactCopy.AsMemory());
                var checksumValid = pk.ChecksumValid;
                var analysis = new LegalityAnalysis(pk);
                var localization = LegalityLocalizationContext.Create(analysis);
                var formatter = new BaseLegalityFormatter();

                var checks = new List<LegalityCheckDto>(analysis.Results.Count + 1);
                checks.Add(checksumValid
                    ? new LegalityCheckDto("Checksum", "Valid", "Valid: Stored data checksum is valid.")
                    : new LegalityCheckDto("Checksum", "Invalid", "Invalid: Stored data checksum does not match the decrypted payload."));
                for (var i = 0; i < analysis.Results.Count; i++)
                    checks.Add(MapCheck(analysis.Results[i], localization));

                var simpleReport = formatter.GetReport(localization);
                var verboseReport = formatter.GetReportVerbose(localization);
                if (!checksumValid)
                {
                    const string checksumMessage = "Invalid: Stored data checksum does not match the decrypted payload.";
                    simpleReport = checksumMessage;
                    verboseReport = $"{checksumMessage}{Environment.NewLine}{Environment.NewLine}" +
                        $"PKHeX legality analysis excluding checksum:{Environment.NewLine}{verboseReport}";
                }

                var response = new ValidationResultDto(
                    analysis.Valid && checksumValid,
                    analysis.Parsed,
                    simpleReport,
                    verboseReport,
                    checks,
                    normalizedEnvironment,
                    GetPkhexVersion(),
                    null);

                return JsonSerializer.Serialize(response, JsonOptions);
            }
        }
        catch (Exception ex)
        {
            return SerializeError(normalizedEnvironment, $"{ex.GetType().Name}: {ex.Message}");
        }
    }

    [JSExport]
    public static string GetVersion() => GetPkhexVersion();

    private static LegalityCheckDto MapCheck(
        CheckResult result,
        LegalityLocalizationContext localization) => new(
            result.Identifier.ToString(),
            result.Judgement.ToString(),
            localization.Humanize(in result));

    private static void ConfigureEnvironment(string environment)
    {
        ParseSettings.ClearActiveTrainer();

        var cartridge = environment == CartridgeEnvironment;
        ParseSettings.AllowEraCartGBA = cartridge;
        ParseSettings.AllowEraSwitchGBA = !cartridge;
    }

    private static string NormalizeEnvironment(string environment) => environment switch
    {
        CartridgeEnvironment => CartridgeEnvironment,
        SwitchEnvironment => SwitchEnvironment,
        _ => throw new ArgumentException(
            $"Environment must be '{CartridgeEnvironment}' or '{SwitchEnvironment}'.",
            nameof(environment)),
    };

    private static string SerializeError(string environment, string error)
    {
        var response = new ValidationResultDto(
            false,
            false,
            string.Empty,
            string.Empty,
            [],
            environment,
            GetPkhexVersion(),
            error);

        return JsonSerializer.Serialize(response, JsonOptions);
    }

    private static string GetPkhexVersion()
    {
        var assembly = typeof(PK3).Assembly;
        var informational = assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion;

        if (!string.IsNullOrWhiteSpace(informational))
            return informational.Split('+', 2)[0];

        var version = assembly.GetName().Version;
        return version is null
            ? PinnedPkhexVersion
            : $"{version.Major}.{version.Minor}.{version.Build}";
    }
}
