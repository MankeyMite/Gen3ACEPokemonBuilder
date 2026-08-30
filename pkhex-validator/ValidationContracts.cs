namespace PkhexValidator;

public sealed record LegalityCheckDto(
    string Identifier,
    string Severity,
    string Message);

public sealed record ValidationResultDto(
    bool Valid,
    bool Parsed,
    string SimpleReport,
    string VerboseReport,
    IReadOnlyList<LegalityCheckDto> Checks,
    string Environment,
    string PkhexVersion,
    string? Error);
