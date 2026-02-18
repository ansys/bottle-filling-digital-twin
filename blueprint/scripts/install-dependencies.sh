#!/bin/bash

###############################################################################
# Homebrew Dependency Installation Script
#
# This script installs all required packages for the deployment process
# using Homebrew (works on both macOS and Linux).
#
# Usage: ./install-dependencies.sh [options]
# Options:
#   --skip-existing      Skip packages that are already installed
#   --help, -h           Show this help message
#
# Note: This script will install Homebrew if it's not already installed
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Parse command line arguments
SKIP_EXISTING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-existing)
            SKIP_EXISTING=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-existing      Skip packages that are already installed"
            echo "  --help, -h            Show this help message"
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
        *)
            echo "Error: Unexpected argument: $1" >&2
            echo "Usage: $0 [options]" >&2
            exit 1
            ;;
    esac
done

###############################################################################
# Helper Functions
###############################################################################

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if a Homebrew package is installed
brew_package_installed() {
    local package="$1"
    brew list "$package" &> /dev/null 2>&1
}

# Install Homebrew if not present
install_homebrew() {
    log_section "CHECKING HOMEBREW INSTALLATION"

    if command_exists brew; then
        log_success "Homebrew is already installed"
        BREW_VERSION=$(brew --version | head -n 1)
        log_info "Version: $BREW_VERSION"

        # Update Homebrew
        log_step "Updating Homebrew..."
        brew update || log_warning "Homebrew update failed, continuing anyway"
        return 0
    fi

    log_warning "Homebrew is not installed"
    log_info "Installing Homebrew..."

    OS=$(detect_os)
    if [ "$OS" = "macos" ]; then
        # macOS installation
        # Note: Homebrew installer handles permissions automatically, do NOT run with sudo
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    elif [ "$OS" = "linux" ]; then
        # Linux installation
        # Note: Do NOT run with sudo - the installer will check for sudo access itself if needed
        # The installer will prompt you to choose:
        # - Enter password to install to /home/linuxbrew/.linuxbrew (system-wide, requires sudo)
        # - Press Control-D to install to ~/.linuxbrew (user-specific, no sudo)
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Linux
        # Check which location was used and set up PATH accordingly
        if [[ -f "/home/linuxbrew/.linuxbrew/bin/brew" ]]; then
            eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
            BREW_PREFIX="/home/linuxbrew/.linuxbrew"
        elif [[ -f "$HOME/.linuxbrew/bin/brew" ]]; then
            eval "$($HOME/.linuxbrew/bin/brew shellenv)"
            BREW_PREFIX="$HOME/.linuxbrew"
        else
            BREW_PREFIX=""
        fi

        # Add to shell profile (use the actual installation location)
        if [ -n "$BREW_PREFIX" ]; then
            if [ -f "$HOME/.bashrc" ]; then
                if ! grep -q "linuxbrew" "$HOME/.bashrc"; then
                    echo "eval \"\$($BREW_PREFIX/bin/brew shellenv)\"" >> "$HOME/.bashrc"
                fi
            fi
            if [ -f "$HOME/.zshrc" ]; then
                if ! grep -q "linuxbrew" "$HOME/.zshrc"; then
                    echo "eval \"\$($BREW_PREFIX/bin/brew shellenv)\"" >> "$HOME/.zshrc"
                fi
            fi
        fi
    else
        log_error "Unsupported OS: $OSTYPE"
        exit 1
    fi

    # Verify installation
    if command_exists brew; then
        log_success "Homebrew installed successfully"
        BREW_VERSION=$(brew --version | head -n 1)
        log_info "Version: $BREW_VERSION"
    else
        log_error "Homebrew installation failed"
        exit 1
    fi
}

# Install a package via Homebrew
install_brew_package() {
    local package="$1"
    local display_name="${2:-$package}"
    local post_install="${3:-}"

    # Check if already installed
    if command_exists "$package" 2>/dev/null || brew_package_installed "$package" 2>/dev/null; then
        if [ "$SKIP_EXISTING" = true ]; then
            log_info "Skipping $display_name (already installed)"
            return 0
        else
            log_info "$display_name is already installed, reinstalling..."
        fi
    fi

    log_step "Installing $display_name..."
    if brew install "$package"; then
        log_success "$display_name installed successfully"

        # Run post-install commands if provided
        if [ -n "$post_install" ]; then
            eval "$post_install"
        fi
        return 0
    else
        log_error "Failed to install $display_name"
        return 1
    fi
}

# Install Static Web Apps CLI via npm
install_static_web_apps_cli() {
    log_step "Installing Static Web Apps CLI..."

    if command_exists npm; then
        if npm install -g @azure/static-web-apps-cli 2>/dev/null; then
            log_success "Static Web Apps CLI installed via npm"
            return 0
        else
            log_warning "Failed to install Static Web Apps CLI via npm"
            return 1
        fi
    else
        log_warning "npm not found, skipping Static Web Apps CLI installation"
        return 1
    fi
}

# Install Docker Engine on Linux
install_docker_linux() {
    log_step "Installing Docker Engine on Linux..."

    # Check if Docker is already installed and running
    if command_exists docker && docker info >/dev/null 2>&1; then
        log_success "Docker Engine is already installed and running"
        return 0
    fi

    # Check if Docker CLI is installed but daemon is not running
    if command_exists docker; then
        log_info "Docker CLI found, checking if Docker daemon is running..."
        if docker info >/dev/null 2>&1; then
            log_success "Docker Engine is running"
            return 0
        else
            log_warning "Docker CLI is installed but daemon is not running"
            log_info "Attempting to start Docker service..."
            if command_exists systemctl; then
                if sudo systemctl start docker 2>/dev/null; then
                    if docker info >/dev/null 2>&1; then
                        log_success "Docker Engine started successfully"
                        # Enable Docker to start on boot
                        sudo systemctl enable docker >/dev/null 2>&1 || true
                        return 0
                    fi
                fi
            fi
        fi
    fi

    # Install Docker CLI via Homebrew first (if not already installed)
    if ! command_exists docker; then
        log_info "Installing Docker CLI via Homebrew..."
        if command_exists brew && brew install docker 2>/dev/null; then
            log_info "Docker CLI installed via Homebrew"
        fi
    fi

    # Check if we can use Docker's convenience script
    log_info "Installing Docker Engine using official Docker installation method..."

    # Check if curl is available
    if ! command_exists curl; then
        log_error "curl is required to install Docker Engine"
        return 1
    fi

    # Use Docker's convenience script for installation
    log_info "Downloading and running Docker installation script..."
    if curl -fsSL https://get.docker.com -o /tmp/get-docker.sh 2>/dev/null; then
        if sudo sh /tmp/get-docker.sh 2>/dev/null; then
            # Add current user to docker group (if not root)
            if [ "$(id -u)" != "0" ]; then
                log_info "Adding current user to docker group..."
                sudo usermod -aG docker "$USER" 2>/dev/null || true
            fi

            # Start Docker service
            if command_exists systemctl; then
                log_info "Starting Docker service..."
                sudo systemctl start docker 2>/dev/null || true
                sudo systemctl enable docker >/dev/null 2>&1 || true
            fi

            # Verify installation
            if docker info >/dev/null 2>&1 || sudo docker info >/dev/null 2>&1; then
                log_success "Docker Engine installed successfully"
                log_warning "You may need to log out and back in for group changes to take effect"
                log_info "Or run: newgrp docker"
                rm -f /tmp/get-docker.sh
                return 0
            fi
            rm -f /tmp/get-docker.sh
        else
            rm -f /tmp/get-docker.sh
        fi
    fi

    log_warning "Docker Engine installation failed via convenience script"
    log_info "You may need to install Docker Engine manually:"
    log_info "  Visit: https://docs.docker.com/engine/install/"
    log_info "  Or run: curl -fsSL https://get.docker.com | sudo sh"
    return 1
}

# Install build-essential (or equivalent development tools)
install_build_essential() {
    log_step "Installing build-essential (development tools)..."

    OS=$(detect_os)

    if [ "$OS" = "linux" ]; then
        # On Linux, build-essential is a system package
        # Try to install via apt-get if available
        if command_exists apt-get; then
            log_info "Installing build-essential and dependencies for fluent via apt-get..."
            if sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y build-essential libfontconfig1 libice6 libjpeg62 libsm6 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-render0 libxcb-shape0 libxcb-shm0 libxcb-sync1 libxcb-util1 libxcb-xfixes0 libxcb-xinerama0 libxcb-xkb1 libxkbcommon-x11-0 libxkbcommon0 xfonts-100dpi xfonts-75dpi >/dev/null 2>&1; then
                log_success "build-essential installed via apt-get"
                return 0
            else
                log_warning "Failed to install build-essential via apt-get"
            fi
        fi

        # Fallback: Try installing via Homebrew (gcc, make, etc.)
        if command_exists brew; then
            log_info "Installing development tools via Homebrew..."
            local packages_installed=0
            if install_brew_package "gcc" "gcc"; then
                packages_installed=$((packages_installed + 1))
            fi
            if install_brew_package "make" "make"; then
                packages_installed=$((packages_installed + 1))
            fi
            if [ $packages_installed -gt 0 ]; then
                log_success "Development tools installed via Homebrew"
                return 0
            fi
        fi

        log_warning "Could not install build-essential. You may need to install it manually:"
        log_info "  sudo apt-get update && sudo apt-get install -y build-essential"
        return 1
    elif [ "$OS" = "macos" ]; then
        # On macOS, ensure Xcode Command Line Tools are installed
        if xcode-select -p >/dev/null 2>&1; then
            log_success "Xcode Command Line Tools are already installed"
            return 0
        fi

        log_info "Installing Xcode Command Line Tools..."
        if xcode-select --install >/dev/null 2>&1; then
            log_info "Xcode Command Line Tools installation initiated"
            log_warning "Please complete the installation in the popup window"
            return 0
        else
            # Try installing gcc via Homebrew as fallback
            if command_exists brew; then
                log_info "Installing gcc via Homebrew..."
                if install_brew_package "gcc" "gcc"; then
                    log_success "gcc installed via Homebrew"
                    return 0
                fi
            fi
            log_warning "Could not install Xcode Command Line Tools automatically"
            log_info "  Install manually: xcode-select --install"
            return 1
        fi
    else
        log_warning "Unsupported OS for build-essential installation"
        return 1
    fi
}

# Install AzCopy with multiple fallback methods
install_azcopy() {
    log_step "Installing AzCopy..."

    # Check if already installed
    if command_exists azcopy; then
        log_success "AzCopy is already installed"
        AZCOPY_VERSION=$(azcopy --version 2>/dev/null | head -n 1 || echo "installed")
        log_info "Version: $AZCOPY_VERSION"
        return 0
    fi

    OS=$(detect_os)

    # Method 1: Try via package manager (Linux)
    if [ "$OS" = "linux" ]; then
        # Try Ubuntu/Debian package manager
        if command_exists apt-get; then
            log_info "Attempting to install AzCopy via apt-get..."
            # Download Microsoft package repository configuration
            if curl -sSL -O "https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb" 2>/dev/null; then
                if sudo dpkg -i packages-microsoft-prod.deb 2>/dev/null; then
                    if sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y azcopy >/dev/null 2>&1; then
                        rm -f packages-microsoft-prod.deb
                        if command_exists azcopy; then
                            log_success "AzCopy installed via apt-get"
                            return 0
                        fi
                    fi
                fi
                rm -f packages-microsoft-prod.deb
            fi
        fi
    fi

    # Method 2: Download portable binary (works on both Linux and macOS)
    log_info "Attempting to install AzCopy from official download..."
    local arch="amd64"
    if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then
        arch="arm64"
    fi

    local os="linux"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os="darwin"
    fi

    local install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"

    # Download AzCopy
    if wget -q -O /tmp/azcopy.tar.gz "https://aka.ms/downloadazcopy-v10-${os}" 2>/dev/null || \
       curl -fsSL -o /tmp/azcopy.tar.gz "https://aka.ms/downloadazcopy-v10-${os}" 2>/dev/null; then
        # Extract
        if tar -xzf /tmp/azcopy.tar.gz -C /tmp/ 2>/dev/null; then
            # Find the azcopy binary
            local azcopy_binary
            azcopy_binary=$(find /tmp -name "azcopy" -type f 2>/dev/null | head -n 1)
            if [ -n "$azcopy_binary" ] && [ -f "$azcopy_binary" ]; then
                # Move to install directory
                mv "$azcopy_binary" "$install_dir/azcopy" 2>/dev/null || \
                cp "$azcopy_binary" "$install_dir/azcopy" 2>/dev/null
                chmod +x "$install_dir/azcopy"
                rm -rf /tmp/azcopy.tar.gz /tmp/azcopy_* 2>/dev/null || true

                # Add to PATH if not already there
                if [[ ":$PATH:" != *":$install_dir:"* ]]; then
                    export PATH="$install_dir:$PATH"
                    # Add to shell profile
                    if [ -f "$HOME/.bashrc" ] && ! grep -q "$install_dir" "$HOME/.bashrc"; then
                        echo "export PATH=\"$install_dir:\$PATH\"" >> "$HOME/.bashrc"
                    fi
                    if [ -f "$HOME/.zshrc" ] && ! grep -q "$install_dir" "$HOME/.zshrc"; then
                        echo "export PATH=\"$install_dir:\$PATH\"" >> "$HOME/.zshrc"
                    fi
                fi

                if command_exists azcopy; then
                    log_success "AzCopy installed from official download"
                    return 0
                fi
            fi
        fi
        rm -f /tmp/azcopy.tar.gz
        rm -rf /tmp/azcopy_* 2>/dev/null || true
    fi

    log_warning "Failed to install AzCopy. You may need to install it manually."
    log_info "Installation options:"
    log_info "  1. Linux (Ubuntu/Debian): sudo apt-get install azcopy"
    log_info "  2. Download from: https://aka.ms/downloadazcopy-v10-linux"
    log_info "  3. macOS: Download from: https://aka.ms/downloadazcopy-v10-darwin"
    return 1
}

# Install kubelogin with multiple fallback methods
install_kubelogin() {
    log_step "Installing kubelogin..."

    # Check if already installed
    if command_exists kubelogin; then
        log_success "kubelogin is already installed"
        return 0
    fi

    # Method 1: Try via Homebrew (if available)
    if command_exists brew; then
        log_info "Attempting to install kubelogin via Homebrew..."
        if brew install kubelogin 2>/dev/null; then
            if command_exists kubelogin; then
                log_success "kubelogin installed via Homebrew"
                return 0
            fi
        fi
    fi

    # Method 2: Try via Azure CLI (kubelogin is installed alongside kubectl)
    if command_exists az; then
        log_info "Attempting to install kubelogin via Azure CLI..."
        # az aks install-cli installs both kubectl and kubelogin
        # It installs to ~/.azure-kubelogin/ by default, but we need to check common locations
        local install_dir="${HOME}/.local/bin"
        mkdir -p "$install_dir"

        # Try the install command - it may install kubelogin to a specific location
        if az aks install-cli --only-show-errors 2>/dev/null; then
            # Check common installation locations
            local possible_locations=(
                "${HOME}/.azure-kubelogin/kubelogin"
                "${HOME}/.local/bin/kubelogin"
                "/usr/local/bin/kubelogin"
                "/usr/bin/kubelogin"
            )

            for location in "${possible_locations[@]}"; do
                if [ -f "$location" ] && [ -x "$location" ]; then
                    # If not in a PATH location, copy it to one
                    if [[ "$location" != "${install_dir}/kubelogin" ]]; then
                        cp "$location" "${install_dir}/kubelogin" 2>/dev/null || true
                        chmod +x "${install_dir}/kubelogin" 2>/dev/null || true
                    fi
                    # Add to PATH if not already there
                    if [[ ":$PATH:" != *":$install_dir:"* ]]; then
                        export PATH="$install_dir:$PATH"
                        # Add to shell profile
                        if [ -f "$HOME/.bashrc" ] && ! grep -q "$install_dir" "$HOME/.bashrc"; then
                            echo "export PATH=\"$install_dir:\$PATH\"" >> "$HOME/.bashrc"
                        fi
                    fi
                    if command_exists kubelogin; then
                        log_success "kubelogin installed via Azure CLI"
                        return 0
                    fi
                fi
            done
        fi
    fi

    # Method 3: Download from GitHub releases
    log_info "Attempting to install kubelogin from GitHub releases..."
    local arch="amd64"
    if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then
        arch="arm64"
    fi

    local os="linux"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os="darwin"
    fi

    local install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"

    # Try to get latest version from GitHub API
    local latest_version
    latest_version=$(curl -s https://api.github.com/repos/Azure/kubelogin/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/^v//' 2>/dev/null || echo "")

    if [ -n "$latest_version" ]; then
        local download_url="https://github.com/Azure/kubelogin/releases/download/v${latest_version}/kubelogin-${os}-${arch}.zip"
        log_info "Downloading kubelogin v${latest_version} from GitHub..."

        if curl -fsSL "$download_url" -o /tmp/kubelogin.zip 2>/dev/null; then
            if command_exists unzip; then
                if unzip -q -o /tmp/kubelogin.zip -d /tmp/ 2>/dev/null; then
                    local kubelogin_binary
                    kubelogin_binary=$(find /tmp -name "kubelogin" -type f 2>/dev/null | head -n 1)
                    if [ -n "$kubelogin_binary" ] && [ -f "$kubelogin_binary" ]; then
                        mv "$kubelogin_binary" "$install_dir/kubelogin" 2>/dev/null || cp "$kubelogin_binary" "$install_dir/kubelogin" 2>/dev/null
                        chmod +x "$install_dir/kubelogin"
                        rm -f /tmp/kubelogin.zip
                        # Add to PATH if not already there
                        if [[ ":$PATH:" != *":$install_dir:"* ]]; then
                            export PATH="$install_dir:$PATH"
                            # Add to shell profile
                            if [ -f "$HOME/.bashrc" ] && ! grep -q "$install_dir" "$HOME/.bashrc"; then
                                echo "export PATH=\"$install_dir:\$PATH\"" >> "$HOME/.bashrc"
                            fi
                        fi
                        if command_exists kubelogin; then
                            log_success "kubelogin installed from GitHub releases"
                            return 0
                        fi
                    fi
                fi
            fi
            rm -f /tmp/kubelogin.zip
        fi
    fi

    log_warning "Failed to install kubelogin. You may need to install it manually."
    log_info "Installation options:"
    log_info "  1. brew install kubelogin (if available)"
    log_info "  2. az aks install-cli"
    log_info "  3. Download from: https://github.com/Azure/kubelogin/releases"
    return 1
}

# Verify all required tools
verify_installations() {
    log_section "VERIFYING INSTALLATIONS"

    local all_installed=true
    local missing_tools=()

    # Define tools to check: "command:display_name"
    declare -a TOOLS=(
        "az:Azure CLI"
        "kubectl:kubectl"
        "kubelogin:kubelogin"
        "helm:Helm"
        "jq:jq"
        "envsubst:envsubst (gettext)"
        "git:git"
        "node:Node.js"
        "npm:npm"
        "npx:npx"
        "python3:Python 3"
        "kustomize:kustomize"
        "azcopy:AzCopy"
    )

    for tool_info in "${TOOLS[@]}"; do
        IFS=':' read -r cmd display_name <<< "$tool_info"

        if command_exists "$cmd"; then
            VERSION=$("$cmd" --version 2>/dev/null | head -n 1 || echo "installed")
            log_success "$display_name: $VERSION"
        else
            log_error "$display_name: Not found"
            all_installed=false
            missing_tools+=("$display_name")
        fi
    done

    # Check Docker separately (verify both CLI and daemon)
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version 2>/dev/null | head -n 1 || echo "installed")
        # Check if Docker daemon is running
        if docker info >/dev/null 2>&1 || sudo docker info >/dev/null 2>&1; then
            log_success "Docker: $DOCKER_VERSION (daemon running)"
        else
            log_warning "Docker: $DOCKER_VERSION (CLI installed but daemon not running)"
            log_info "  Start Docker with: sudo systemctl start docker"
            log_info "  Or if you just installed, you may need to log out and back in"
            # Don't mark as missing, just warn
        fi
    else
        log_error "Docker: Not found"
        all_installed=false
        missing_tools+=("Docker")
    fi

    # Check git-lfs separately
    if command_exists git && git lfs version &> /dev/null; then
        GIT_LFS_VERSION=$(git lfs version 2>/dev/null | head -n 1 || echo "installed")
        log_success "git-lfs: $GIT_LFS_VERSION"
    else
        log_error "git-lfs: Not found"
        all_installed=false
        missing_tools+=("git-lfs")
    fi

    # Check pip
    PIP_FOUND=false
    if command_exists pip3; then
        PIP_VERSION=$(pip3 --version 2>/dev/null | head -n 1 || echo "installed")
        log_success "pip: $PIP_VERSION"
        PIP_FOUND=true
    elif command_exists pip; then
        PIP_VERSION=$(pip --version 2>/dev/null | head -n 1 || echo "installed")
        log_success "pip: $PIP_VERSION"
        PIP_FOUND=true
    elif command_exists python3 && python3 -m pip --version &> /dev/null; then
        PIP_VERSION=$(python3 -m pip --version 2>/dev/null | head -n 1 || echo "installed")
        log_success "pip: $PIP_VERSION (via python3 -m pip)"
        PIP_FOUND=true
    fi

    if [ "$PIP_FOUND" = false ]; then
        log_warning "pip: Not found (may need to install python3-pip separately)"
    fi

    # Check Static Web Apps CLI (optional)
    if command_exists swa; then
        SWA_VERSION=$(swa --version 2>/dev/null | head -n 1 || echo "installed")
        log_success "Static Web Apps CLI: $SWA_VERSION"
    elif command_exists az && az extension list --query "[?name=='staticwebapp'].name" -o tsv 2>/dev/null | grep -q "staticwebapp"; then
        log_success "Static Web Apps CLI: installed (Azure CLI extension)"
    else
        log_warning "Static Web Apps CLI: Not found (optional)"
    fi

    echo ""

    if [ "$all_installed" = true ]; then
        log_success "All required tools are installed!"
        return 0
    else
        log_error "Some tools are missing:"
        for tool in "${missing_tools[@]}"; do
            echo -e "  ${RED}✗${NC} $tool"
        done
        return 1
    fi
}

###############################################################################
# Main Installation Process
###############################################################################

main() {
    log_section "HOMEBREW DEPENDENCY INSTALLATION"

    OS=$(detect_os)
    log_info "Detected OS: $OS"

    if [ "$OS" = "unknown" ]; then
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi

    # Install Homebrew
    install_homebrew

    # Ensure brew is in PATH
    if ! command_exists brew; then
        # Try to source brew environment
        if [ "$OS" = "macos" ]; then
            if [[ -f "/opt/homebrew/bin/brew" ]]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
            elif [[ -f "/usr/local/bin/brew" ]]; then
                eval "$(/usr/local/bin/brew shellenv)"
            fi
        elif [ "$OS" = "linux" ]; then
            if [[ -f "/home/linuxbrew/.linuxbrew/bin/brew" ]]; then
                eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
            elif [[ -f "$HOME/.linuxbrew/bin/brew" ]]; then
                eval "$($HOME/.linuxbrew/bin/brew shellenv)"
            fi
        fi
    fi

    log_section "INSTALLING REQUIRED PACKAGES"

    INSTALLED_COUNT=0
    FAILED_COUNT=0

    # Core packages
    log_info "Installing core packages..."

    # Azure CLI
    if install_brew_package "azure-cli" "Azure CLI"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # kubelogin (install after Azure CLI is available)
    if install_kubelogin; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # kubectl
    if install_brew_package "kubectl" "kubectl"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # Helm
    if install_brew_package "helm" "Helm"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # Docker (platform-specific)
    if [ "$OS" = "macos" ]; then
        if install_brew_package "docker" "Docker Desktop"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
            log_info "Note: Docker Desktop may need to be started manually"
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        # Linux: Install Docker Engine (full installation with daemon)
        if install_docker_linux; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi

    # jq
    if install_brew_package "jq" "jq"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # gettext (provides envsubst)
    if install_brew_package "gettext" "gettext (envsubst)"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # git
    if install_brew_package "git" "git"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # git-lfs
    if install_brew_package "git-lfs" "git-lfs"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        # Initialize git-lfs
        if command_exists git; then
            git lfs install &> /dev/null || true
        fi
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # Node.js (includes npm and npx)
    if install_brew_package "node" "Node.js"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # Python
    if [ "$OS" = "macos" ]; then
        # macOS: Use python@3.12 or python@3.11
        if install_brew_package "python@3.12" "Python 3.12"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        elif install_brew_package "python@3.11" "Python 3.11"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        # Linux: Use python3
        if install_brew_package "python@3.12" "Python 3.12"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        elif install_brew_package "python@3.11" "Python 3.11"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi

    # kustomize
    if install_brew_package "kustomize" "kustomize"; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # AzCopy (for efficient Azure Storage operations)
    if install_azcopy; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # openssl (usually pre-installed, but ensure it's available)
    if ! command_exists openssl; then
        if install_brew_package "openssl@3" "OpenSSL"; then
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        log_info "OpenSSL is already installed"
    fi

    # build-essential (development tools)
    if install_build_essential; then
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    # Static Web Apps CLI (optional, via npm)
    log_info "Installing optional packages..."
    install_static_web_apps_cli || true

    # Summary
    log_section "INSTALLATION SUMMARY"
    echo -e "${GREEN}Successfully installed:${NC} $INSTALLED_COUNT packages"
    if [ $FAILED_COUNT -gt 0 ]; then
        echo -e "${RED}Failed to install:${NC} $FAILED_COUNT packages"
    fi
    echo ""

    # Verify installations
    if verify_installations; then
        log_section "INSTALLATION COMPLETE"
        echo -e "${GREEN}${BOLD}All dependencies have been installed successfully!${NC}"
        echo ""
        echo -e "${BOLD}Next steps:${NC}"
        echo "  1. If Docker was installed, ensure it's running:"
        if [ "$OS" = "macos" ]; then
            echo "     - Open Docker Desktop application"
        else
            echo "     - sudo systemctl start docker"
            echo "     - sudo systemctl enable docker"
        fi
        echo ""
        echo "  2. Verify Azure CLI login:"
        echo "     az login"
        echo ""
        echo "  3. You can now run the deployment scripts:"
        echo "     cd blueprint/scripts"
        echo "     ./deploy-all.sh"
        exit 0
    else
        log_section "INSTALLATION COMPLETE WITH WARNINGS"
        echo -e "${YELLOW}${BOLD}Some tools may be missing${NC}"
        echo ""
        echo "Please review the verification output above and install any missing tools manually."
        exit 1
    fi
}

# Run main function
main

