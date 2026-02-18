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

| Requirement | Details |
| ----------- | ------- |
| **Operating System** | Ubuntu 22.04 (required) |
| **Azure Subscription** | Active subscription with Contributor or Owner role |
| **Azure Permissions** | Ability to create resource groups, VNets, AKS clusters, storage accounts, ACR |
| **Compute Quotas** | NVads A10 v5 family: 72+ vCPUs, Ds_v3 family: 12+ vCPUs |
| **Application Prerequisites** | Kit application image, Fluent image, Ansys license server accessible |

## Prerequisites for a Docker Compose deployment

- Docker and Docker Compose
- NVIDIA RTX GPU with CUDA support (RTX (2000, 4000, 6000 and such), A10, A100, H100, H200, B100, B200 or L40 series)
- NVIDIA Container Toolkit
- Ansys Fluent license server access
- Minimum 16 GB RAM, 8 GB GPU memory recommended
- Preferably run on Linux for best compatibility with NVIDIA drivers. Windows and WSL can cause additional configuration overhead and have not been tested.

## Deployment on OKAS on AKS

See the deployment guide: [Bottle Filling Digital Twin - Deployment Guide](./doc/DEPLOYMENT_OKAS.md).

## Deployment in Docker Compose

For detailed Docker Compose deployment instructions, see the comprehensive guide: [Docker Compose Deployment Guide](./doc/DEPLOYMENT_DOCKER_COMPOSE.md).

The guide covers:

- **Local deployment** - For local machines or VMs with VDI (access via localhost)
- **Remote deployment** - For cloud VMs accessed via public IP
- Complete configuration reference for both scenarios
- Building Fluent, Kit App, and Web App images
- Step-by-step setup instructions
- Troubleshooting and common issues

### Quick Start

**Local deployment:**
```bash
cd blueprint/scripts
./deploy-docker-compose.sh
```
Access at: `http://localhost:3001`

**Remote deployment:**
```bash
cd blueprint/scripts
./deploy-docker-compose.sh --remote
```
Access at: `http://<your-vm-public-ip>:3001`

**With Fluent image build:**
```bash
cd blueprint/scripts
./deploy-docker-compose.sh --build-fluent /ansys_inc
```

The script builds kit-app and web-app images by default. Use `--build-fluent` with the path to your Ansys installation to also build the Fluent image.

For detailed instructions, prerequisites, and configuration details, see [DEPLOYMENT_DOCKER_COMPOSE.md](./doc/DEPLOYMENT_DOCKER_COMPOSE.md).

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
