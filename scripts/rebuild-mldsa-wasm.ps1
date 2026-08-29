param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$sourceCommit = "6d661fd1865b38d8612692c52160cf76193785fb"
$zigHash = "3A0ED1E8799A2F8CE2A6E6290A9FF22E6906F8227865911FB7DDEDC3CC14CB0C"
$wasmHash = "960EA1D9CEB0449F91301CB4168DB83AB1CBA3F0A86FA1BED0515F880B85F802"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Split-Path -Parent $scriptRoot
$vendorRoot = Join-Path $repositoryRoot "workers\trusted-runtime\vendor\mldsa-native"
$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("aethelgard-mldsa-rebuild-" + [guid]::NewGuid().ToString("N"))
$sourceRoot = Join-Path $temporaryRoot "mldsa-native"
$zigArchive = Join-Path $temporaryRoot "zig.zip"
$zigRoot = Join-Path $temporaryRoot "zig-x86_64-windows-0.15.2"
$builtWasm = Join-Path $temporaryRoot "mldsa65.wasm"

New-Item -ItemType Directory -Path $temporaryRoot | Out-Null
try {
  git clone --quiet --filter=blob:none https://github.com/pq-code-package/mldsa-native.git $sourceRoot
  if ($LASTEXITCODE -ne 0) { throw "Source clone failed." }
  git -C $sourceRoot checkout --quiet --detach $sourceCommit
  if ($LASTEXITCODE -ne 0) { throw "Source checkout failed." }
  $actualCommit = (git -C $sourceRoot rev-parse HEAD).Trim()
  if ($actualCommit -ne $sourceCommit) { throw "Source commit check failed." }

  curl.exe -L --fail --connect-timeout 15 --max-time 90 `
    "https://ziglang.org/download/0.15.2/zig-x86_64-windows-0.15.2.zip" `
    -o $zigArchive
  if ($LASTEXITCODE -ne 0) { throw "Toolchain download failed." }
  if ((Get-FileHash -Algorithm SHA256 $zigArchive).Hash -ne $zigHash) {
    throw "Toolchain hash check failed."
  }
  tar.exe -xf $zigArchive -C $temporaryRoot
  if ($LASTEXITCODE -ne 0) { throw "Toolchain extraction failed." }

  $env:ZIG_GLOBAL_CACHE_DIR = Join-Path $temporaryRoot "zig-global-cache"
  $env:ZIG_LOCAL_CACHE_DIR = Join-Path $temporaryRoot "zig-local-cache"
  & (Join-Path $zigRoot "zig.exe") cc `
    '-target' 'wasm32-freestanding' '-O3' '-flto' '-std=c99' '-nostdlib' '-fno-builtin' `
    '-DMLD_CONFIG_PARAMETER_SET=65' '-DMLD_CONFIG_CORE_API_ONLY' `
    '-DMLD_CONFIG_NO_RANDOMIZED_API' '-DMLD_CONFIG_NO_ASM' '-DMLD_CONFIG_CUSTOM_ZEROIZE' `
    '-include' (Join-Path $vendorRoot "include\phase1d_zeroize.h") `
    ("-I" + (Join-Path $vendorRoot "include")) `
    ("-I" + (Join-Path $sourceRoot "mldsa")) `
    (Join-Path $vendorRoot "mldsa-wrapper.c") `
    (Join-Path $sourceRoot "mldsa\mldsa_native.c") `
    '-Wl,--no-entry' '-Wl,--export-memory' '-Wl,--export=phase1d_arena_ptr' `
    '-Wl,--export=phase1d_keypair' '-Wl,--export=phase1d_sign' `
    '-Wl,--export=phase1d_verify' '-Wl,--export=phase1d_wipe' `
    '-Wl,--initial-memory=2097152' '-Wl,--max-memory=8388608' `
    '-Wl,-z,stack-size=1048576' '-Wl,--strip-all' '-o' $builtWasm
  if ($LASTEXITCODE -ne 0) { throw "Wasm build failed." }
  if ((Get-Item $builtWasm).Length -ne 40843) { throw "Wasm size check failed." }
  if ((Get-FileHash -Algorithm SHA256 $builtWasm).Hash -ne $wasmHash) {
    throw "Wasm hash check failed."
  }

  $resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $resolvedOutput) | Out-Null
  Copy-Item -LiteralPath $builtWasm -Destination $resolvedOutput -Force
  Write-Output "PASS - reproducible ML-DSA-65 Wasm - 40843 bytes / $wasmHash"
}
finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    $resolvedTemporary = [IO.Path]::GetFullPath($temporaryRoot)
    $resolvedSystemTemporary = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if (-not $resolvedTemporary.StartsWith($resolvedSystemTemporary, [StringComparison]::OrdinalIgnoreCase) -or
        -not (Split-Path -Leaf $resolvedTemporary).StartsWith("aethelgard-mldsa-rebuild-")) {
      throw "Refusing unsafe temporary cleanup."
    }
    Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
  }
}
