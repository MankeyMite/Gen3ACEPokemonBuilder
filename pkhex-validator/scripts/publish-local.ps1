param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release'
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $projectDirectory 'PkhexValidator.Browser.csproj'
$outputPath = Join-Path $projectDirectory 'dist'

dotnet restore $projectPath --locked-mode
dotnet publish $projectPath -c $Configuration --no-restore -o $outputPath

Write-Host "Local PKHeX validator assets published to $outputPath\wwwroot"
