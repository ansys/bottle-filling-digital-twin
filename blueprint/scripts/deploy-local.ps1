# deploy-local.ps1
# Script to run Fluent and fluent.cae_streaming.kit.bat with environment variables
# Windows PowerShell version of the deployment script

param(
    [Parameter(Mandatory = $false)]
    [int]$FluentWaitTime = 30,
    [Parameter(Mandatory = $false)]
    # [string]$FluentHost = (
    #     (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.AddressState -eq 'Preferred' -and $_.ValidLifetime -lt '24:00:00' })
    #     | Select-Object -ExpandProperty IPAddress -First 1
    # ),
    [string]$FluentHost = "127.0.0.1",
    [Parameter(Mandatory = $false)]
    [int]$FluentPort = 40007,
    [Parameter(Mandatory = $false)]
    [switch]$NoGPU
)

# Colors for output
$Colors = @{
    Red    = "Red"
    Green  = "Green"
    Yellow = "Yellow"
    Blue   = "Blue"
    Cyan   = "Cyan"
    White  = "White"
}

function Log-Info    { param($msg) Write-Host "[INFO] $msg"    -ForegroundColor $Colors.Blue }
function Log-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor $Colors.Green }
function Log-Warning { param($msg) Write-Host "[WARNING] $msg" -ForegroundColor $Colors.Yellow }
function Log-Error   { param($msg) Write-Host "[ERROR] $msg"   -ForegroundColor $Colors.Red }
function Log-Step    { param($msg) Write-Host "[STEP] $msg"    -ForegroundColor $Colors.Cyan }

# Get script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($ScriptDir -like "*blueprint\scripts") {
    # Running from blueprint/scripts directory - go up two levels to project root
    $BlueprintDir = Split-Path -Parent $ScriptDir
    $ProjectRoot = Split-Path -Parent $BlueprintDir
} else {
    # Running from elsewhere - assume script dir is project root
    $ProjectRoot = Split-Path -Parent $ScriptDir
}

# Define paths
$FluentExe = "${env:AWP_ROOT261}\fluent\ntbin\win64\fluent.exe"
$ServerInfoFile = "$env:TEMP\serverinfo.txt"
$KitBuildDir = "$ProjectRoot\_temp-build\kit-cae\_build\windows-x86_64\release"
$KitScript = "$KitBuildDir\fluent.cae_streaming.kit.bat"

# Resolve content directory: use ../content relative to this script
$Candidate = Join-Path $ScriptDir '..\content'
$Resolved = Resolve-Path $Candidate -ErrorAction SilentlyContinue
if ($Resolved) {
    $ContentPath = $Resolved.ProviderPath
    Log-Info "Using content path (relative to script): $ContentPath"
} else {
    Log-Error "Content directory not found at: $Candidate"
    Log-Error "Please create the folder ../content relative to this script"
    exit 1
}

Log-Info "=============================================="
Log-Info "Local Deployment Script"
Log-Info "=============================================="
Log-Info "Project root: $ProjectRoot"
Log-Info "Fluent executable: $FluentExe"
Log-Info "Kit script: $KitScript"
Log-Info "Content path: $ContentPath"
Log-Info "=============================================="

# Check prerequisites
Log-Step "Checking prerequisites..."

if (-not $env:AWP_ROOT261) {
    Log-Error "AWP_ROOT261 environment variable not set. Please install Ansys Fluent 2025 R2."
    exit 1
}

if (-not (Test-Path $FluentExe)) {
    Log-Error "Fluent executable not found at: $FluentExe"
    Log-Error "Please verify Ansys Fluent 2025 R2 installation."
    exit 1
}

if (-not (Test-Path $KitScript)) {
    Log-Error "Kit script not found at: $KitScript"
    Log-Error "Please run the build script first: blueprint\scripts\build-kit-app.ps1"
    exit 1
}

if (-not (Test-Path $ContentPath)) {
    Log-Error "Content directory not found: $ContentPath"
    exit 1
}

Log-Success "All prerequisites checked successfully"

# Set environment variables for the Kit application
Log-Step "Setting environment variables..."

$env:TEMP = $env:TEMP  # Use existing Windows TEMP
$env:FLUENT_HOST = $FluentHost
$env:FLUENT_PORT = $FluentPort.ToString()
$env:VISCOSITY = "0.002"
$env:BOTTLES_PER_HOUR = "50000"
$env:FILLING_HEIGHT = "28"
$env:TIMESTEP_SIZE = "0.001"
$env:BOTTLE_UNITS_1 = "48.0"
$env:BOTTLE_UNITS_2 = "36.0"
$env:BOTTLE_UNITS_3 = "24.0"
$env:FIRST_ITERATION_TIMESTEPS = "500"
$env:CONTENT_PATH = "$ContentPath/"
$env:OM_KIT_VERBOSE = "1"
$env:NVDA_KIT_ARGS = ""
$env:NVDA_KIT_NUCLEUS = ""

# Windows-specific GPU environment variables
$env:NVIDIA_VISIBLE_DEVICES = "all"
$env:NVIDIA_DRIVER_CAPABILITIES = "compute,utility,video,graphics"

Log-Success "Environment variables set:"
Write-Host "  FLUENT_HOST = $env:FLUENT_HOST" -ForegroundColor Gray
Write-Host "  FLUENT_PORT = $env:FLUENT_PORT" -ForegroundColor Gray
Write-Host "  VISCOSITY = $env:VISCOSITY" -ForegroundColor Gray
Write-Host "  BOTTLES_PER_HOUR = $env:BOTTLES_PER_HOUR" -ForegroundColor Gray
Write-Host "  FILLING_HEIGHT = $env:FILLING_HEIGHT" -ForegroundColor Gray
Write-Host "  TIMESTEP_SIZE = $env:TIMESTEP_SIZE" -ForegroundColor Gray
Write-Host "  CONTENT_PATH = $env:CONTENT_PATH" -ForegroundColor Gray
Write-Host "  OM_KIT_VERBOSE = $env:OM_KIT_VERBOSE" -ForegroundColor Gray
Write-Host ""

# Start Fluent server
Log-Step "Starting Ansys Fluent server..."

$FluentEnvVars = @{
    FLUENT_PORT = $FluentPort.ToString()
}

# Start Fluent in the background
$FluentArgs = @("3d", "-t1", "-sifile=`"$ServerInfoFile`"")
if (-not $NoGPU) {
    $FluentArgs += "-gpu"
    Log-Info "Launching Fluent with GPU acceleration with the command: `"$FluentExe`" $($FluentArgs -join ' ')"
} else {
    Log-Info "Launching Fluent without GPU acceleration with the command: `"$FluentExe`" $($FluentArgs -join ' ')"
}

Log-Info "Command: `"$FluentExe`" $($FluentArgs -join ' ')"

# Remove any stale serverinfo file from previous runs so we only read the new one
if (Test-Path $ServerInfoFile) {
    try {
        Remove-Item $ServerInfoFile -Force -ErrorAction Stop
        Log-Info "Removed existing serverinfo file to avoid stale values: $ServerInfoFile"
    } catch {
        Log-Warning "Failed to remove existing serverinfo file: $_"
    }
}

$FluentProcess = Start-Process -FilePath $FluentExe -ArgumentList $FluentArgs -PassThru -WindowStyle Normal

if (-not $FluentProcess) {
    Log-Error "Failed to start Fluent process"
    exit 1
}

Log-Success "Fluent process started (PID: $($FluentProcess.Id))"
Log-Info "Fluent is running in a separate window - please don't close it!"

# Wait for Fluent to initialize
Log-Step "Waiting for Fluent to initialize..."
Log-Info "Looking for server info file at: $ServerInfoFile"
$WaitCount = 0
$MaxWaitCount = $FluentWaitTime

while ($WaitCount -lt $MaxWaitCount) {
    Start-Sleep -Seconds 1
    $WaitCount++

    # Check if server info file exists (indicates Fluent is ready)
    if (Test-Path $ServerInfoFile) {
        Log-Success "Fluent server info file created - server is ready"
        break
    }

    # Only check process occasionally to avoid false positives
    if ($WaitCount % 10 -eq 0) {
        try {
            $FluentProcess.Refresh()
            if ($FluentProcess.HasExited) {
                Log-Warning "Fluent process appears to have exited (Exit code: $($FluentProcess.ExitCode))"
                Log-Info "This might be normal if Fluent started successfully in its own process"
                Log-Info "Continuing to wait for server info file..."
            }
        } catch {
            Log-Warning "Cannot check Fluent process status - this is normal if Fluent detached"
        }
    }

    if ($WaitCount % 5 -eq 0) {
        Log-Info "Waiting for Fluent to start... ($WaitCount/$MaxWaitCount seconds)"
    }
}

if ($WaitCount -ge $MaxWaitCount) {
    Log-Warning "Fluent server info file not found after $FluentWaitTime seconds"
    Log-Warning "Proceeding anyway - Fluent might still be starting..."
} else {
    # Read and display server info if available
    if (Test-Path $ServerInfoFile) {
        # Read serverinfo as lines so we can parse the first non-empty line
        $ServerInfoLines = Get-Content $ServerInfoFile -ErrorAction SilentlyContinue
        Log-Info "Fluent server information:"
        foreach ($ln in $ServerInfoLines) { Write-Host $ln -ForegroundColor Gray }

        # Find the first non-empty line and parse host@port or host:port
        $firstLine = $ServerInfoLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1
        if ($firstLine) {
            $candidateHost = $null
            $candidatePort = $null

            if ($firstLine -match '@') {
                $parts = $firstLine -split '@'
                if ($parts.Count -ge 2) {
                    $candidateHost = $parts[0].Trim()
                    $candidatePort = $parts[1].Trim()
                }
            } elseif ($firstLine -match ':') {
                # split on last colon to handle IPv6 bracketed or other cases
                $lastColonIndex = $firstLine.LastIndexOf(':')
                if ($lastColonIndex -ge 0) {
                    $candidateHost = $firstLine.Substring(0, $lastColonIndex).Trim()
                    $candidatePort = $firstLine.Substring($lastColonIndex + 1).Trim()
                }
            }

            if ($candidateHost -and $candidatePort -and ($candidatePort -match '^[0-9]+$')) {
                # Override environment variables so the Kit app uses the actual Fluent host/port
                $env:FLUENT_HOST = $candidateHost
                $env:FLUENT_PORT = $candidatePort
                Log-Success "FLUENT_HOST and FLUENT_PORT set from serverinfo: $candidateHost`:$candidatePort"
                Write-Host "  FLUENT_HOST = $env:FLUENT_HOST" -ForegroundColor Gray
                Write-Host "  FLUENT_PORT = $env:FLUENT_PORT" -ForegroundColor Gray
            } else {
                Log-Warning "Parsed serverinfo but host or port was invalid or empty: '$firstLine'"
            }
        } else {
            Log-Warning "Serverinfo file is empty: $ServerInfoFile"
        }
    }
}

# Change to kit build directory
Log-Step "Changing to kit build directory..."
Set-Location $KitBuildDir
Log-Info "Current directory: $(Get-Location)"

# Start Kit application
Log-Step "Starting Kit application..."
Log-Info "Executing: $KitScript --no-window"
Log-Info "This will start the NVIDIA Omniverse Kit application with Fluent integration..."
Write-Host ""

try {
    # Execute the kit script and wait for it to complete
    & $KitScript --no-window

    if ($LASTEXITCODE -eq 0) {
        Log-Success "Kit application completed successfully"
    } else {
        Log-Error "Kit application exited with code: $LASTEXITCODE"
    }
} catch {
    Log-Error "Failed to execute Kit script: $_"
    exit 1
} finally {
    # Cleanup: Ask user if they want to stop Fluent
    Write-Host ""
    Log-Info "=============================================="
    $StopFluent = Read-Host "Do you want to stop the Fluent server process? (y/N)"

    if ($StopFluent -eq 'y' -or $StopFluent -eq 'Y') {
        if (-not $FluentProcess.HasExited) {
            Log-Info "Stopping Fluent process..."
            $FluentProcess.Kill()
            $FluentProcess.WaitForExit(5000)  # Wait up to 5 seconds

            if ($FluentProcess.HasExited) {
                Log-Success "Fluent process stopped"
            } else {
                Log-Warning "Fluent process may still be running"
            }
        } else {
            Log-Info "Fluent process already exited"
        }

        # Clean up server info file
        if (Test-Path $ServerInfoFile) {
            Remove-Item $ServerInfoFile -Force
            Log-Info "Cleaned up server info file"
        }
    } else {
        Log-Info "Fluent server left running (PID: $($FluentProcess.Id))"
        Log-Info "Server info file: $ServerInfoFile"
    }
}

Log-Info "Deployment script completed"