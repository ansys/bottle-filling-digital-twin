# build-kit-app.ps1
# This script builds a kit application using Visual Studio 2022
#
# FEATURES:
# - Automatically detects Visual Studio 2022 installation
# - Self-relaunches in Developer PowerShell if needed
# - No manual environment setup required!
#
param(
    [Parameter(Mandatory = $false)]
    [string]$ContainerName = "fluent.cae_streaming.kit",
    [Parameter(Mandatory = $false)]
    [string]$WorkDir,
    [Parameter(Mandatory = $false)]
    [switch]$SkipEnvironmentCheck
)

# Colors for output
$Colors = @{
    Red    = "Red"
    Green  = "Green"
    Yellow = "Yellow"
    Blue   = "Blue"
    White  = "White"
}

function Log-Info    { param($msg) Write-Host "[INFO] $msg"    -ForegroundColor $Colors.Blue }
function Log-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor $Colors.Green }
function Log-Warning { param($msg) Write-Host "[WARNING] $msg" -ForegroundColor $Colors.Yellow }
function Log-Error   { param($msg) Write-Host "[ERROR] $msg"   -ForegroundColor $Colors.Red }

function Show-Usage {
    Write-Host "Usage: .\build-kit-app.ps1 [container-name] [work-dir]"
    Write-Host "  container-name: Name for the container package (default: fluent.cae_streaming.kit)"
    Write-Host "  work-dir: Working directory for cloning (optional, defaults to _temp-build in repo root)"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  - Automatically detects Visual Studio 2022"
    Write-Host "  - Self-relaunches in Developer PowerShell if needed"
    Write-Host "  - No manual environment setup required!"
    Write-Host ""
    Write-Host "REQUIREMENTS:"
    Write-Host "  - Visual Studio 2022 with C++ build tools installed"
    Write-Host ""
    exit 1
}

function Test-VisualStudio2022 {
    Log-Info "Checking for Visual Studio 2022 installation..."

    # Common VS 2022 installation paths
    $VsPaths = @(
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Enterprise",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Professional",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Community"
    )

    foreach ($path in $VsPaths) {
        if (Test-Path "$path\Common7\IDE\devenv.exe") {
            Log-Success "Found Visual Studio 2022 at: $path"
            return $path
        }
    }

    # Also check via vswhere if available
    $VsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $VsWhere) {
        $VsInstallation = & $VsWhere -version '[17.0,18.0)' -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath -latest
        if ($VsInstallation) {
            Log-Success "Found Visual Studio 2022 via vswhere at: $VsInstallation"
            return $VsInstallation
        }
    }

    return $null
}

function Test-DeveloperPowerShell {
    Log-Info "Checking if running in Visual Studio Developer PowerShell..."

    # Check for VS environment variables
    $VsDevEnvVars = @("VSINSTALLDIR", "VCToolsVersion", "WindowsSDKVersion")
    $MissingVars = @()

    foreach ($var in $VsDevEnvVars) {
        if (-not (Get-Variable -Name $var -Scope Global -ErrorAction SilentlyContinue) -and
            -not [Environment]::GetEnvironmentVariable($var)) {
            $MissingVars += $var
        }
    }

    if ($MissingVars.Count -gt 0) {
        Log-Warning "Not running in Visual Studio Developer PowerShell"
        Log-Warning "Missing environment variables: $($MissingVars -join ', ')"
        return $false
    } else {
        Log-Success "Running in Visual Studio Developer PowerShell"
        return $true
    }
}

function Initialize-DeveloperEnvironment {
    param([string]$VsPath)

    Log-Info "Visual Studio 2022 found but not running in Developer PowerShell"
    Log-Info "Attempting to relaunch script in Developer PowerShell..."

    # Look for Launch-VsDevShell.ps1 (newer method)
    $LaunchScript = "$VsPath\Common7\Tools\Launch-VsDevShell.ps1"
    if (Test-Path $LaunchScript) {
        Log-Info "Using Launch-VsDevShell.ps1 method..."

        # Get the current script path more reliably
        $ScriptPath = $PSCommandPath
        if (-not $ScriptPath) {
            $ScriptPath = $MyInvocation.MyCommand.Definition
        }
        if (-not $ScriptPath) {
            $ScriptPath = (Get-Location).Path + "\" + $MyInvocation.MyCommand.Name
        }

        Log-Info "Script path: $ScriptPath"

        $Arguments = @()
        if ($ContainerName -and $ContainerName -ne "fluent.cae_streaming.kit") {
            $Arguments += "-ContainerName '$ContainerName'"
        }
        if ($WorkDir) { $Arguments += "-WorkDir '$WorkDir'" }
        $Arguments += "-SkipEnvironmentCheck"

        $RelaunchCommand = "& '$LaunchScript'; & '$ScriptPath' $($Arguments -join ' ')"

        Log-Info "Relaunch command: $RelaunchCommand"
        Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $RelaunchCommand
        Log-Success "Script relaunched in Developer PowerShell. You can close this window."
        exit 0
    }

    # Fallback to VsDevCmd.bat method
    $VsDevCmd = "$VsPath\Common7\Tools\VsDevCmd.bat"
    if (Test-Path $VsDevCmd) {
        Log-Warning "Please run this script from Developer PowerShell for VS 2022"
        Log-Warning "Or run this command first to initialize the environment:"
        Log-Warning "cmd /k '$VsDevCmd' -arch=x64 -host_arch=x64"
        return $false
    }

    Log-Error "Could not find VS Developer Shell tools"
    return $false
}

# Get script, blueprint, and project root directories
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($ScriptDir -like "*blueprint\scripts") {
    # Running from blueprint/scripts directory
    $BlueprintDir = Split-Path -Parent $ScriptDir
    $ProjectRoot  = Split-Path -Parent $BlueprintDir
} else {
    # Running from bottle-filling-digital-twin directory or elsewhere
    $BlueprintDir = Join-Path $ScriptDir "blueprint"
    $ProjectRoot  = Split-Path -Parent $ScriptDir
}

if (-not $WorkDir) { $WorkDir = Join-Path $ProjectRoot "_temp-build" }

# Validate arguments
if ($ContainerName -notmatch '^[a-zA-Z0-9_.-]+$') {
    Log-Error "Invalid container name. Use only alphanumeric characters, dots, hyphens, and underscores."
    exit 1
}

Log-Info    "=========================================="
Log-Info    "Kit Application Builder"
Log-Info    "=========================================="
Log-Info    "Script directory: $ScriptDir"
Log-Info    "Blueprint directory: $BlueprintDir"
Log-Info    "Project root: $ProjectRoot"
Log-Info    "Container name: $ContainerName"
Log-Info    "Work directory: $WorkDir"
Log-Info    "=========================================="

# Check for Visual Studio 2022 installation
$VsPath = Test-VisualStudio2022
if (-not $VsPath) {
    Log-Error "Visual Studio 2022 is required but not found!"
    Log-Error "Please install Visual Studio 2022 with the following components:"
    Log-Error "  - MSVC v143 - VS 2022 C++ x64/x86 build tools"
    Log-Error "  - Windows 11 SDK (10.0.22621.0 or later)"
    Log-Error "  - CMake tools for Visual Studio"
    exit 1
}

# Check if running in Developer PowerShell (unless skipped for relaunch)
if (-not $SkipEnvironmentCheck -and -not (Test-DeveloperPowerShell)) {
    if (-not (Initialize-DeveloperEnvironment -VsPath $VsPath)) {
        exit 1
    }
}

# Validate blueprint structure
if (-not (Test-Path "$BlueprintDir\kit-app-source\source\apps")) {
    Log-Error "Blueprint kit-app-source structure not found at $BlueprintDir\kit-app-source"
    exit 1
}
if (-not (Test-Path "$BlueprintDir\kit-app-source\source\extensions")) {
    Log-Error "Blueprint extensions not found at $BlueprintDir\kit-app-source\source\extensions"
    exit 1
}

# Create work directory (remove if exists first)
Log-Info "Creating work directory: $WorkDir"
if (Test-Path $WorkDir) {
    Log-Warning "Work directory already exists. Removing it..."
    Remove-Item -Recurse -Force $WorkDir
}
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Set-Location $WorkDir

# Step 1: Clone the kit-cae repository
Log-Info "Cloning NVIDIA-Omniverse/kit-cae repository..."
if (Test-Path "kit-cae") {
    Log-Warning "kit-cae directory already exists. Removing it..."
    Remove-Item -Recurse -Force "kit-cae"
}
git clone https://github.com/NVIDIA-Omniverse/kit-cae.git
if ($LASTEXITCODE -ne 0) { Log-Error "Git clone failed"; exit 1 }
Set-Location "kit-cae"
git checkout tags/v1.0.0
if ($LASTEXITCODE -ne 0) { Log-Error "Git checkout failed"; exit 1 }
Log-Success "Cloned kit-cae repository and checked out v1.0.0"

# Step 2: Replace source/apps with blueprint version
Log-Info "Replacing source/apps with blueprint version..."
Copy-Item -Recurse -Force "$BlueprintDir\kit-app-source\source\apps\fluent.cae_streaming.kit" "source\apps\"

# Step 3: Copy extensions from blueprint
Log-Info "Copying extensions from blueprint..."
if (Test-Path "$BlueprintDir\kit-app-source\source\extensions\ansys.fluent_ext") {
    Copy-Item -Recurse -Force "$BlueprintDir\kit-app-source\source\extensions\ansys.fluent_ext" "source\extensions\"
    Log-Success "Copied ansys.fluent_ext extension"
} else {
    Log-Error "ansys.fluent_ext extension not found in blueprint"
    exit 1
}
if (Test-Path "$BlueprintDir\kit-app-source\source\extensions\ansys.messaging") {
    Copy-Item -Recurse -Force "$BlueprintDir\kit-app-source\source\extensions\ansys.messaging" "source\extensions\"
    Log-Success "Copied ansys.messaging extension"
} else {
    Log-Error "ansys.messaging extension not found in blueprint"
    exit 1
}

# Step 4: Check pip.toml (leave as-is for now)
Log-Info "Checking tools/deps/pip.toml..."
$PipTomlFile = "tools\deps\pip.toml"
if (-not (Test-Path $PipTomlFile)) {
    Log-Error "pip.toml not found at $PipTomlFile"
    exit 1
}
Log-Success "Found pip.toml configuration (keeping original dependencies)"

# Step 5: Modify premake5.lua
Log-Info "Updating premake5.lua..."
$PremakeFile = "premake5.lua"
if (-not (Test-Path $PremakeFile)) {
    Log-Error "premake5.lua not found"
    exit 1
}
(Get-Content $PremakeFile) -replace 'define_app\("omni\.cae_vtk\.kit"\)', 'define_app("fluent.cae_streaming.kit")' | Set-Content $PremakeFile
Log-Success "Updated premake5.lua"

# Step 6: Modify repo.toml
Log-Info "Updating repo.toml..."
$RepoTomlFile = "repo.toml"
if (-not (Test-Path $RepoTomlFile)) {
    Log-Error "repo.toml not found"
    exit 1
}
(Get-Content $RepoTomlFile) -replace '\$\{root\}/source/apps/omni\.cae_vtk\.kit', '${root}/source/apps/fluent.cae_streaming.kit' | Set-Content $RepoTomlFile
Log-Success "Updated repo.toml"

# Step 6.5: Handle kit-cae dependencies
Log-Info "Configuring kit-cae dependencies..."
$KitCaeDepsFile = "tools\deps\kit-cae-deps.packman.xml"
if (Test-Path $KitCaeDepsFile) {
    Log-Info "Checking kit-cae-deps.packman.xml configuration..."
    $depsContent = Get-Content $KitCaeDepsFile -Raw

    # Check if omni_cae dependency points to a local source that doesn't exist
    if ($depsContent -match '<dependency name="omni_cae"[^>]*><source path="([^"]+)"') {
        $sourcePath = $matches[1] -replace '\$\{config\}', 'release' -replace '\$\{platform_target\}', 'windows-x86_64'
        $resolvedPath = Resolve-Path $sourcePath -ErrorAction SilentlyContinue

        if (-not $resolvedPath -or -not (Test-Path $resolvedPath)) {
            Log-Warning "omni_cae dependency source path not found: $sourcePath"
            Log-Info "Commenting out omni_cae dependency to allow build to continue..."

            # Comment out the problematic dependency - using simpler regex
            $pattern = '<dependency name="omni_cae"[^>]*>.*?</dependency>'
            $replacement = '<!-- <dependency name="omni_cae" commented out due to missing source path> -->'
            $depsContent = $depsContent -replace $pattern, $replacement, 'Singleline'
            Set-Content -Path $KitCaeDepsFile -Value $depsContent -Encoding UTF8
            Log-Success "Commented out omni_cae dependency"
        } else {
            Log-Success "omni_cae dependency source path verified: $resolvedPath"
        }
    }
} else {
    Log-Warning "kit-cae-deps.packman.xml not found - this may be expected"
}

# Step 7: Build process
Log-Info "Starting build process..."

# Verify build tools are available
Log-Info "Verifying build environment..."
if (-not (Get-Command "msbuild.exe" -ErrorAction SilentlyContinue)) {
    Log-Error "MSBuild not found in PATH. Ensure you're running in Visual Studio Developer PowerShell."
    exit 1
}
if (-not (Get-Command "cl.exe" -ErrorAction SilentlyContinue)) {
    Log-Error "MSVC compiler (cl.exe) not found in PATH. Ensure you're running in Visual Studio Developer PowerShell."
    exit 1
}
Log-Success "Build environment verified - MSBuild and MSVC compiler found"

# Run repo.bat schema
Log-Info "Running repo.bat schema with Visual Studio 2022..."
& .\repo.bat schema --vs2022
if ($LASTEXITCODE -ne 0) { Log-Error "repo.bat schema failed"; exit 1 }
Log-Success "Schema generation completed"

# Run repo.bat build
Log-Info "Running repo.bat build with Visual Studio 2022..."
& .\repo.bat --set-token vs_version:vs2022 build -r
if ($LASTEXITCODE -ne 0) { Log-Error "repo.bat build failed"; exit 1 }
Log-Success "Build completed"

Write-Host ""
Log-Success "============================================="
Log-Success "Build completed successfully!"
Log-Success "============================================="
Log-Info "Work directory: $WorkDir\kit-cae"
Log-Info "You can find the built artifacts in the _build directory"
Write-Host ""