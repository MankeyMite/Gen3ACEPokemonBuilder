param(
  [Parameter(Mandatory = $false)]
  [string] $PublishDirectory
)

if ([string]::IsNullOrWhiteSpace($PublishDirectory)) {
  $PublishDirectory = Join-Path $PSScriptRoot '..\bin\Release\net10.0\publish\wwwroot'
}

$resolved = Resolve-Path -LiteralPath $PublishDirectory -ErrorAction Stop
$files = Get-ChildItem -LiteralPath $resolved -File -Recurse
$frameworkFiles = $files | Where-Object FullName -Like '*\_framework\*'
$brotliFiles = $files | Where-Object Extension -EQ '.br'
$gzipFiles = $files | Where-Object Extension -EQ '.gz'
$uncompressedFiles = $files | Where-Object Extension -NotIn @('.br', '.gz')
$pkhexCoreFiles = $frameworkFiles | Where-Object Name -Like 'PKHeX.Core.*.wasm*'
$pkhexCoreUncompressedFiles = $pkhexCoreFiles | Where-Object Extension -NotIn @('.br', '.gz')
$pkhexCoreBrotliFiles = $pkhexCoreFiles | Where-Object Extension -EQ '.br'
$pkhexCoreGzipFiles = $pkhexCoreFiles | Where-Object Extension -EQ '.gz'

[pscustomobject]@{
  publishDirectory = $resolved.Path
  fileCount = $files.Count
  totalBytes = ($files | Measure-Object Length -Sum).Sum
  uncompressedBytes = ($uncompressedFiles | Measure-Object Length -Sum).Sum
  frameworkBytes = ($frameworkFiles | Measure-Object Length -Sum).Sum
  brotliBytes = ($brotliFiles | Measure-Object Length -Sum).Sum
  gzipBytes = ($gzipFiles | Measure-Object Length -Sum).Sum
  pkhexCore = [pscustomobject]@{
    totalBytes = ($pkhexCoreFiles | Measure-Object Length -Sum).Sum
    uncompressedBytes = ($pkhexCoreUncompressedFiles | Measure-Object Length -Sum).Sum
    brotliBytes = ($pkhexCoreBrotliFiles | Measure-Object Length -Sum).Sum
    gzipBytes = ($pkhexCoreGzipFiles | Measure-Object Length -Sum).Sum
    files = @($pkhexCoreFiles | ForEach-Object { $_.FullName.Substring($resolved.Path.Length + 1) })
  }
  largestFiles = @($files | Sort-Object Length -Descending | Select-Object -First 12 @{n='path';e={$_.FullName.Substring($resolved.Path.Length + 1)}}, Length)
} | ConvertTo-Json -Depth 4
