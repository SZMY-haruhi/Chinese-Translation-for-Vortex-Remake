param(
  [Parameter(Mandatory = $true)][string]$Staging,
  [Parameter(Mandatory = $true)][string]$ZipPath
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath
}

$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, "Create")
try {
  $readme = Join-Path $Staging "readme.txt"
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $readme, "readme.txt") | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $Staging "zh") -Filter *.json | ForEach-Object {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, ("zh/" + $_.Name)) | Out-Null
  }
}
finally {
  $zip.Dispose()
}
