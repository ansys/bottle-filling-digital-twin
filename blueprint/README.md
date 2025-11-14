# Bottle-filling digital twin blueprint

## Overview

This blueprint demonstrates a complete digital twin solution for bottle-filling operations using Ansys Fluent and NVIDIA Omniverse. It combines computational fluid dynamics (CFD) simulation with real-time 3D visualization to create an immersive digital twin experience.

### Key components

- **Ansys Fluent**: Runs high-fidelity CFD simulations for accurate bottle-filling physics.
- **NVIDIA Omniverse Kit**: Provides real-time 3D visualization and a digital twin platform.
- **Web interface**: Offers a user-friendly control panel for simulation parameters.
- **Docker containerization**: Enables scalable deployment with GPU acceleration.

### Features

- **Run real-time CFD simulations**: Simulate physics-based bottle filling with customizable parameters.
- **Provide interactive 3D visualization**: Render the filling process with Omniverse-powered graphics.
- **Control parameters**: Adjust viscosity, flow rates, bottle dimensions, and timing.
- **Support multiple bottle sizes**: Simulate different configurations, including 500-milliliter and 200-milliliter bottles.
- **Deploy to the cloud**: Use GPU-enabled cloud infrastructure for scalability.

### Use cases

- **Optimize processes**: Improve filling speeds and reduce waste.
- **Train and educate**: Create immersive training environments for operators.
- **Predict maintenance needs**: Monitor and forecast equipment performance.
- **Validate designs**: Test new bottle designs and filling strategies.

## Architecture

The blueprint consists of three main services:

- **Fluent service**: Runs Ansys Fluent CFD solver with GPU acceleration.
- **Kit app service**: Provides NVIDIA Omniverse Kit for 3D visualization.
- **Web app service**: Offers a React-based user interface for parameter control.

## Prerequisite for OKAS on a Kubernetes deployment

- [NVIDIA Omniverse Kit App Streaming Prerequisites](https://docs.omniverse.nvidia.com/ovas/latest/marketplace/azure/prerequisites.html) in the Azure marketplace
- Ubuntu VM with Ansys Fluent 2025 R2 and Docker installed
- Kubectl 1.32.7
- Helm 3.14.0
- Azure CLI
- Azure subscription with necessary permissions and quota allowance for `72 NVasd_A10_v5 VCPUs` and `12 Ds_v3 VCPUs`
- Ansys license
- Knowledge of setting up an Ansys license server in a Linux VM

## Prerequisites for a Docker Compose deployment

- Docker and Docker Compose
- NVIDIA RTX GPU with CUDA support
- NVIDIA Container Toolkit
- Ansys Fluent license server access
- Minimum 16 GB RAM, 8 GB GPU memory recommended

## Deployment on OKAS on AKS

See the deployment guide, [Deploy bottle-filling digital twin app to OKAS](./k8s/DEPLOYMENT_GUIDE.md).

## Deployment in Docker Compose

### 1. Set up Cloud VM

#### Azure

A VM with Ansys License Manager is a prerequisite for this deployment. The Fluent solver uses it to check out licenses.

**NOTE:** Installation of the Ansys License Manager is outside the scope of this document.

The Ansys License Manager should be in the same subnet as the VM used for this deployment. Allow communication on port 1055 to the Ansys License Manager from the VM used for this deployment.

1. Create a new VM with an NVIDIA GPU. For example, NV-series (Standard_NV12ads_A10_v5 - 12 vcpus, 110 GiB memory ($662.84/month)).
2. Choose Ubuntu Server 22.04 LTS as the OS.
3. Select US East as the region.
4. Use user and RSA public key authentication. (Keep your private key safe.)
5. Open inbound ports 22 (SSH), 49100 (Kit WebSocket), 1024 (Kit UDP), and 3001 (Web UI).
6. Ensure the VM has at least 100 GB of OS disk size.
7. Ensure secure boot is disabled in the VM settings after creation.
8. Install NVIDIA driver in the VM settings:

   a. Go to **VM settings**.

   b. Navigate to **Extensions + Applications**.

   c. Click **Add**.

   d. Select **NvidiaGpuDriverLinux** from the list.

   e. Click **Create** to install the driver on your VM.

9. Use a secure shell (SSH) connection to access the virtual machine. (Instead of entering a password, use your private SSH key to authenticate your identity.)

### 2. Configure environment

Edit the `.env` file inside the `docker` directory to set environment variables for the services, including license server details and network settings.

#### `PUBLIC_IPV4` and `PUBLIC_IPV4_SUBNET`

- `PUBLIC_IPV4`: Set this to your VM's public IP address.
  - For Azure VMs: Find this in the Azure portal under your VM's networking section.
  - For AWS EC2: Use the `Public IPv4 address` from the instance details.
  - For local deployment: Use your machine's external IP address or `127.0.0.1`
- `PUBLIC_IPV4_SUBNET`: Set this to your VM's subnet range
  - Take your public IP address and replace the last octet with `0/24`.
  - For example, if `PUBLIC_IPV4` is `172.172.244.132`, then `PUBLIC_IPV4_SUBNET` should be `172.172.244.0/24`.

#### `ANSYSLMD_LICENSE_FILE`

Configure `ANSYSLMD_LICENSE_FILE` based on your setup:

- **Cloud VMs**: `"1055@<license-server-internal-ip>"` (Use the internal/private IP address of your license server VM.)
- **Local Docker**: `"1055@host.docker.internal"` (Use if the license server is on the host machine, provided you have a license server running locally and `host.docker.internal` resolves correctly to your host.)
- **Remote license server**: `"1055@<license-server-hostname-or-ip>"`

### 3. Run deployment

Use the automated deployment script to build and start all services:

```bash
# Navigate to the scripts directory
cd blueprint/scripts

# Run the deployment script
./deploy-ansys-cae-kit.sh
```

The script performs these actions:

1. Builds the Ansys CAE Kit container.
2. Tags the container with the required image name.
3. Validates the Docker Compose configuration.
4. Starts all services with the `docker compose up -d` command.

### 4. Deply manually (alternative)

If you prefer manual control, run these commands:

```bash

# Navigate to the scripts directory
cd blueprint/scripts

# Build the Ansys CAE Kit container
./build-kit-app-image.sh kit-app

# Tag the image
docker tag kit-app:latest ghcr.io/ansys/bottle-filling-digital-twin/kit-app:latest

# Navigate to the docker directory
cd blueprint/docker

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 5. Access app

Once deployed, access the services at:

- **Web Interface**: `http://<your-vm-ip>:3001`

### 6. Monitor and troubleshoot

Use these commands to monitor and troubleshoot services:

```bash
# Check service status
docker compose ps

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f kit-app
docker compose logs -f fluent-v25
docker compose logs -f web-app

# Restart services
docker compose restart

# Stop all services
docker compose down
```

## Configuration

### Hardware requirements

- **GPU**: NVIDIA RTX GPU with 8+ GB VRAM
- **CPU**: 8+ cores recommended
- **RAM**: 16+ GB system memory
- **Storage**: 50+ GB free space

If deploying to Azure, use NV-series VMs (such as NV12ads A10 v5 and up) for optimal GPU performance.

## Troubleshooting

### Common issues

- **GPU not found**: Ensure NVIDIA drivers and Container Toolkit are installed.
- **License errors**: Verify `ANSYSLMD_LICENSE_FILE` points to an accessible license server.
- **Network issues**: Check that `PUBLIC_IPV4_SUBNET` matches your network configuration.
- **Port conflicts**: Ensure required ports (8011, 40007, and 3001) are available.

### Support

For technical support and issues:

- Check Docker and service logs.
- Verify GPU and license server connectivity.
- Ensure all environment variables are correctly configured.

## Stream configuration guide

The app supports dynamic streaming configuration using the `stream.config.json` file in the `/docker` folder.

### Configuration options

#### Local streaming (`source: "local"`)

For local development or when the Omniverse Kit app is running locally, you should add the server address where it is running. By default, it is `127.0.0.1`.

```json
{
  "source": "local",
  "local": {
    "server": "127.0.0.1"
  }
}
```

- **server**: IP address of the local Omniverse Kit instance
- **port**: Automatically set to `54321`
- **fps**: 60 FPS for optimal local performance
- **maxReconnects**: 5 (fewer retries for local)
- **authenticate**: false

#### GeForce Now streaming (`source: "gfn"`)

For streaming using NVIDIA GeForce Now:

```json
{
  "source": "gfn",
  "gfn": {
    "catalogClientId": "your-catalog-client-id",
    "clientId": "your-client-id",
    "cmsId": 12345
  }
}
```

- **catalogClientId**: GFN catalog client ID
- **clientId**: App client ID
- **cmsId**: Content management system ID
- **port**: 443 (HTTPS)
- **fps**: 30 FPS (optimized for cloud streaming)
- **maxReconnects**: 20
- **authenticate**: true

#### Remote streaming server (`source: "stream"`)

For streaming from a remote Omniverse streaming server:

```json
{
  "source": "stream",
  "stream": {
    "appServer": "my-streaming-server.example.com",
    "streamServer": "stream.example.com"
  }
}
```

- **appServer**: Omniverse app server hostname/IP address (required)
- **streamServer**: Dedicated streaming server (optional, uses `appServer` if not specified)
- **port**: 54321
- **fps**: 30 FPS
- **maxReconnects**: 20
- **authenticate**: false

## Usage with Docker Compose deployment

1. Edit `docker/stream.config.json` to set your desired configuration.
2. Restart the containers to apply changes:

```bash
# Stop services
docker compose down
# Start services
docker compose up -d
```

### Troubleshooting tips

- **Configuration not loading**: Check the browser network tab for 404 errors on `stream.config.json`.
- **Source indicator not showing**: Verify the `source` field matches one of these values: `"local"`, `"gfn"`, or `"stream"`.
- **Connection issues**: Check console logs for detailed error messages from the AppStream component.

## Console logging

The implementation includes extensive console logging for debugging:

- `SimulationPage: componentDidMount called`: Component is mounting.
- `SimulationPage: Loaded stream configuration: {...}`: Configuration loaded successfully.
- `AppStream: Initializing {type} stream to {server}:{port}`: Stream is initializing.
- `SimulationPage: About to render AppStream with props: {...}`: Properties are being passed to the AppStream component.

Look for these logs in the browser developer tools console.

## UI customizations

### How to add a new logo in the header

1. Add your new logo to the `/public/assets` folder.
2. In the different pages of your app, add the reference of your logo.

   **For a single logo (left side):**

   ```html
   <Header
     appName="Bottle Filling Digital Twin"
     subtitle="Bottle Filling Omniverse"
     primaryLogo={{ src: "/assets/cadfem-logo.png", alt: "Cadfem Logo", width: 40, height: 40 }}
   />
   ```

   **For multiple logos:**

   ```html
   <Header
     appName="Bottle-Filling Digital Twin"
     primaryLogo={{ src:"/assets/cadfem-logo.png", alt: "Cadfem Logo", position:"right" }}
     secondaryLogo={{ src: "/assets/ansys-logo.png", alt: "Ansys Logo" position:"left" }}
     {/* Additional Logos */}
     additionalLogos={[
       { src:"/assets/nvidia-logo.png", alt: "NVIDIA Logo", position: "right" },
       { src:"/assets/azure-logo.png", alt: "Azure Logo", position: "right" }
     ]}
   />
   ```

   **For logo only (no app name):**

   ```html
   <Header
   appName="Hidden App Name"
   showAppName={false}
   primaryLogo={{ src:"/assets/company-logo.png", alt: "Company Logo", width: 150, height: 50 }}
   />
   ```

