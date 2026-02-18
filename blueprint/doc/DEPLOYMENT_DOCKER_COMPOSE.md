# Docker Compose Deployment Guide

This guide covers deploying the Bottle-Filling Digital Twin using Docker Compose. There are two deployment scenarios supported:

1. **Local deployment** - Running on your local machine or a cloud VM with VDI where you access via `localhost`
2. **Remote deployment** - Running on a cloud VM where you access via the public IP address

## Prerequisites

### Common requirements

- Docker and Docker Compose installed
- NVIDIA RTX GPU with CUDA support (8+ GB VRAM recommended) (RTX (2000, 4000, 6000 and such), A10, A100, H100, H200, B100, B200 or L40 series)
- [NVIDIA Container Toolkit configured](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- Ansys Fluent license server access
- Minimum 16 GB RAM, 8 GB GPU memory
- At least 100 GB free disk space

### Platform compatibility

- **Linux (Ubuntu 22.04)**: Recommended for best compatibility
- **Windows/WSL**: May require additional configuration and has not been fully tested

### Cloud VM requirements (for remote deployment)

- VM with NVIDIA GPU (e.g., Azure NV-series: Standard_NV12ads_A10_v5)
- OS: Ubuntu Server 22.04 LTS
- Secure boot disabled
- Required ports open:
  - 22 (SSH)
  - 49100 (Kit WebSocket)
  - 1024 (Kit UDP)
  - 3001 (Web UI)
  - 40007 (Fluent service)

## Deployment Scenarios

### Scenario 1: Local Deployment

Use this deployment when:

- Running on your local development machine
- Running on a cloud VM with VDI/remote desktop access
- Accessing the application via `localhost` or `127.0.0.1` in your browser

#### Configuration files

**File: `docker/.env`**

```bash
# Public IP configuration
PUBLIC_IPV4="127.0.0.1"
PUBLIC_IPV4_SUBNET="127.0.0.0/24"

# Ansys License Configuration
# Option 1: License server on host machine
ANSYSLMD_LICENSE_FILE="1055@host.docker.internal"

# Option 2: Remote license server
# ANSYSLMD_LICENSE_FILE="1055@<license-server-ip-or-hostname>"
```

**File: `docker/stream.config.json`**

```json
{
  "$comment": "Omniverse streaming configuration - source can be 'gfn', 'local' or 'stream'",
  "source": "local",
  "local": {
    "$comment": "Required props if source is set to 'local'.",
    "server": "127.0.0.1",
    "signalingPort": 49100,
    "mediaPort": 1024
  }
}
```

#### Deploy locally

```bash
# Navigate to scripts directory
cd blueprint/scripts

# Run deployment script for local setup
./deploy-docker-compose.sh

# Or manually:
cd blueprint/docker
docker compose -f compose.yml up -d
```

#### Access the application

Open your browser and navigate to:

```text
http://localhost:3001
```

---

### Scenario 2: Remote Cloud VM Deployment

Use this deployment when:

- Running on a cloud VM (Azure, AWS, GCP)
- Accessing the application via the VM's public IP address
- No VDI or remote desktop - browser access only

#### Step 1: Set up cloud VM

**Azure example:**

1. Create a VM with NVIDIA GPU (e.g., Standard_NV12ads_A10_v5)
2. Select Ubuntu Server 22.04 LTS
3. Configure authentication with SSH key
4. Open required ports: 22, 49100, 1024, 3001, 40007
5. Ensure at least 100 GB OS disk
6. Disable secure boot in VM settings and reboot the VM
7. Install NVIDIA driver:
   - Go to VM settings > Extensions + Applications
   - Add `NvidiaGpuDriverLinux`
8. SSH into the VM using your private key

#### Step 2: Configure environment

**Get your VM's IP addresses:**

```bash
# Public IP (external)
curl ifconfig.me

# Private IP (internal) - for license server communication
ip addr show | grep inet
```

**File: `docker/.env`**

```bash
# Public IP configuration
# Replace with YOUR VM's public IP
PUBLIC_IPV4="10.11.12.13"  # Example - use your actual public IP
PUBLIC_IPV4_SUBNET="10.11.12.0/24"  # Replace last octet with 0/24

# Ansys License Configuration
# Use the INTERNAL/PRIVATE IP of your license server VM
ANSYSLMD_LICENSE_FILE="1055@10.2.0.4"  # Example - use your license server's internal IP
```

**File: `docker/stream.config.json`**

```json
{
  "$comment": "Omniverse streaming configuration - source can be 'gfn', 'local' or 'stream'",
  "source": "local",
  "local": {
    "$comment": "For remote deployment, set server to your VM's public IP",
    "server": "10.11.12.13",
    "signalingPort": 49100,
    "mediaPort": 1024
  }
}
```

#### Step 3: Deploy on remote VM

```bash
# Navigate to scripts directory
cd blueprint/scripts

# Run deployment script for remote setup
./deploy-docker-compose.sh --remote

# Or manually:
cd blueprint/docker
docker compose -f compose.remote.yml up -d
```

#### Step 4: Access the application

Open your browser and navigate to:

```text
http://<your-vm-public-ip>:3001
```

For example: `http://10.11.12.13:3001`

---

## Deployment Script Usage

The `deploy-docker-compose.sh` script automates the complete deployment process with a clean, structured workflow similar to the Kubernetes deployment script. It handles image building, configuration validation, and Docker Compose deployment.

### Basic usage

```bash
# Local deployment (builds kit-app and web-app)
./deploy-docker-compose.sh

# Remote deployment (builds kit-app and web-app)
./deploy-docker-compose.sh --remote

# Local deployment with Fluent build
./deploy-docker-compose.sh --build-fluent /ansys_inc

# Remote deployment with all images
./deploy-docker-compose.sh --remote --build-fluent /ansys_inc

# Show help
./deploy-docker-compose.sh --help
```

### What the script does

The script follows a structured three-step deployment process:

**STEP 1: VALIDATE CONFIGURATION**
- Checks Docker and Docker Compose availability
- Validates directory structure and required files
- Reads and displays current configuration from `.env` and `stream.config.json`
- Validates configuration matches deployment mode:
  - **Local**: Ensures `PUBLIC_IPV4=127.0.0.1` and `server=127.0.0.1`
  - **Remote**: Ensures `PUBLIC_IPV4` and `server` are set to VM's public IP
- Provides interactive confirmation for remote deployments

**STEP 2: BUILD DOCKER IMAGES**
- **Fluent image** (optional with `--build-fluent` flag)
  - Requires path to Ansys installation directory
  - Clones PyFluent repository temporarily
  - Copies required files from Ansys installation
  - Builds Docker image with tag `fluent:v25.2.0`
  - Verifies image exists if build is skipped
- **Kit App image** (always built)
  - Clones kit-cae repository (v1.0.0 tag)
  - Copies blueprint extensions and apps
  - Modifies configuration files
  - Builds with tag `kit-app:latest` (local) or `kit-app:latest` (remote)
- **Web App image** (always built)
  - Builds React application with pnpm
  - Creates nginx-based production container
  - Tags as `web-app:latest` (local) or `web-app:latest` (remote)

**STEP 3: DEPLOY WITH DOCKER COMPOSE**
- Stops any existing containers
- Starts all services using the appropriate compose file
- Displays container status
- Shows comprehensive deployment summary with:
  - Deployment configuration
  - Built image tags
  - Access URLs
  - Useful management commands

### Building images separately

If you prefer to build images manually:

```bash
# Build Fluent image
cd blueprint/scripts
./35-build-fluent-image.sh /ansys_inc fluent:v25.2.0

# Build Kit App image
cd blueprint/scripts
./35-build-kit-app-image.sh ../_build kit-app:latest

# Build Web App image
cd blueprint/docker
docker build -t web-app:latest -f Dockerfile.web-app ../web-app
```

### Script features

- **Color-coded output**: Easy-to-read logs with clear visual hierarchy
- **Configuration validation**: Automatic checks for deployment mode
- **Interactive confirmations**: Prevents accidental deployments with wrong config
- **Image verification**: Checks if Fluent image exists when skipping build
- **Comprehensive summary**: Clear display of what was deployed and how to access it
- **Error handling**: Fails fast with clear error messages
- **Structured sections**: Clean separation of deployment steps

---

## Configuration Reference

### Environment Variables (.env)

| Variable | Description | Local Example | Remote Example |
| -------- | ----------- | ------------- | -------------- |
| `PUBLIC_IPV4` | IP address for accessing the app | `127.0.0.1` | `10.11.12.13` |
| `PUBLIC_IPV4_SUBNET` | Subnet for network configuration | `127.0.0.0/24` | `10.11.12.0/24` |
| `ANSYSLMD_LICENSE_FILE` | License server address | `1055@host.docker.internal` | `1055@10.2.0.4` |

### Stream Configuration (stream.config.json)

| Field | Description | Local Value | Remote Value |
| ----- | ----------- | ----------- | ------------ |
| `local.server` | Streaming server address | `127.0.0.1` | VM's public IP |

---

## Docker Compose Files

### compose.yml (Local Deployment)

- Simpler network configuration
- Uses default Docker bridge network
- Fluent image: `fluent:v25.2.0`
- Kit app image: `kit-app:latest`
- Web app image: `web-app:latest`
- Suitable for local development and testing

### compose.remote.yml (Remote Deployment)

- Custom bridge network with subnet configuration
- Assigns static IP to kit-app container
- Fluent image: `fluent:v25.2.0`
- Kit app image: `kit-app:latest`
- Web app image: `web-app:latest`
- Optimized for cloud VM deployment with public access

---

## Common Operations

### View logs

```bash
cd blueprint/docker

# All services
docker compose logs -f

# Specific service
docker compose logs -f kit-app
docker compose logs -f fluent-v25
docker compose logs -f web-app
```

### Check status

```bash
cd blueprint/docker
docker compose ps
```

### Restart services

```bash
cd blueprint/docker

# Restart all
docker compose restart

# Restart specific service
docker compose restart kit-app
```

### Stop services

```bash
cd blueprint/docker
docker compose down
```

### Rebuild and restart

```bash
cd blueprint/docker
docker compose up -d --build
```

---

## Troubleshooting

### GPU not detected

**Symptoms:**

- Container starts but GPU is not available
- CUDA errors in logs

**Solutions:**

1. Verify NVIDIA driver installation:

   ```bash
   nvidia-smi
   ```

2. Check NVIDIA Container Toolkit:

   ```bash
   docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

3. Ensure GPU is exposed in compose file:

   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: all
             capabilities: [gpu]
   ```

### License server errors

**Symptoms:**

- Fluent fails to start
- License checkout errors in logs

**Solutions:**

1. Verify license server is reachable:

   ```bash
   # From VM
   ping <license-server-ip>
   telnet <license-server-ip> 1055
   ```

2. Check `ANSYSLMD_LICENSE_FILE` format:
   - Cloud VM: `1055@<internal-ip>` (e.g., `1055@10.2.0.4`)
   - Local with host license server: `1055@host.docker.internal`
3. Ensure firewall allows port 1055 communication
4. Verify license server is running and has available licenses

### Cannot access web UI

**Symptoms:**

- Browser cannot connect to the application
- Connection timeout or refused

**Solutions:**

**For local deployment:**

1. Verify services are running:

   ```bash
   docker compose ps
   ```

2. Check port 3001 is not in use:

   ```bash
   netstat -tulpn | grep 3001
   ```

3. Access via `http://localhost:3001`

**For remote deployment:**

1. Verify VM firewall rules allow port 3001
2. Check security group/NSG settings in cloud console
3. Ensure `PUBLIC_IPV4` is set correctly in `.env`
4. Verify `stream.config.json` has correct public IP
5. Access via `http://<public-ip>:3001`

### Streaming not working

**Symptoms:**

- Web UI loads but 3D view is black or shows connection error
- WebSocket connection fails

**Solutions:**

1. Check `stream.config.json` configuration matches deployment type
2. Verify ports 49100 (TCP) and 1024 (UDP) are open
3. For remote deployment, ensure `local.server` is set to public IP
4. Check kit-app logs:

   ```bash
   docker compose logs -f kit-app
   ```

5. Verify GPU is working in kit-app container:

   ```bash
   docker compose exec kit-app nvidia-smi
   ```

### Container crashes or restarts

**Symptoms:**

- Service keeps restarting
- Exit code errors in `docker compose ps`

**Solutions:**

1. Check container logs for specific errors:

   ```bash
   docker compose logs fluent-v25
   docker compose logs kit-app
   ```

2. Verify sufficient system resources:

   ```bash
   free -h  # Check RAM
   df -h    # Check disk space
   nvidia-smi  # Check GPU memory
   ```

3. Ensure all required volumes and paths exist
4. Check for port conflicts

### Network issues in remote deployment

**Symptoms:**

- Kit app cannot communicate with Fluent
- Services cannot reach each other

**Solutions:**

1. Verify `PUBLIC_IPV4_SUBNET` is correct:
   - Must match your VM's actual subnet
   - Format: `x.y.z.0/24`
2. Check Docker networks:

   ```bash
   docker network ls
   docker network inspect <network-name>
   ```

3. Ensure both services are on the correct networks:

   ```bash
   docker compose ps
   docker inspect <container-name>
   ```

---

## Security Considerations

### For remote deployments

1. **Firewall configuration**: Only open required ports
2. **SSH access**: Use key-based authentication, disable password auth
3. **Network isolation**: License server should be on internal network only
4. **Updates**: Keep VM OS and Docker updated regularly

### Best practices

- Use strong SSH keys (4096-bit RSA or Ed25519)
- Regularly rotate credentials
- Monitor logs for suspicious activity
- Use VPC/VNet network segmentation
- Consider VPN for accessing sensitive deployments

---

## Performance Optimization

### GPU optimization

- Use VMs with dedicated GPUs (not shared/fractional)
- Ensure GPU drivers are up to date
- Monitor GPU utilization with `nvidia-smi`

### Network optimization

- For remote deployments, use regions close to end users
- Consider using CDN for web assets
- Optimize streaming quality in Kit app settings

### Resource limits

Adjust Docker Compose resource limits if needed:

```yaml
services:
  kit-app:
    deploy:
      resources:
        limits:
          memory: 32G
        reservations:
          memory: 16G
```

---

## Next Steps

After successful deployment:

1. **Test the application**: Run a simulation with default parameters
2. **Monitor performance**: Watch GPU utilization and simulation speed
3. **Review logs**: Check for any warnings or errors
4. **Backup configuration**: Save your working `.env` and `stream.config.json` files

For advanced configuration, see the main [README.md](./README.md) for additional customization options.

---

## Additional Resources

- **Main documentation**: [README.md](./README.md)
- **Kubernetes deployment**: [DEPLOYMENT_OKAS.md](./DEPLOYMENT_OKAS.md)
- **Docker Compose reference**: <https://docs.docker.com/compose/>
- **NVIDIA Container Toolkit**: <https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/>
