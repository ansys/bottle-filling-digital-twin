# Omniverse Cache Cleanup Guide

## Overview

The Omniverse cache is a shared Azure File Share that stores cached data for faster application loading. Use this script to manage and clean the cache when needed.

## When to Clean the Cache

- Kit-app fails to start or crashes (corrupted cache)
- Cache has grown too large (default: 50GB)
- After updating Omniverse Kit or extensions
- Slow application startup or loading times
- Troubleshooting application issues

## Prerequisites

Ensure dependencies are installed:
```bash
./install-dependencies.sh
```

The script requires:
- AzCopy (installed via `install-dependencies.sh`)
- Azure CLI configured and logged in
- `exports.sh` properly configured

## Usage

### List Cache Contents
```bash
cd blueprint/scripts
./cleanup-cache.sh list
```

### Clear the Cache

**Warning**: This deletes all cached data. The cache will rebuild on next application startup.

```bash
# Interactive mode (prompts for confirmation)
./cleanup-cache.sh clear

# Non-interactive mode
./cleanup-cache.sh clear --force
```

## Troubleshooting

### "AzCopy deletion failed after 10 attempts"

Files are locked by running pods. **Solution**: Stop pods first:

```bash
# Scale down deployments
kubectl scale deployment --replicas=0 -n omni-streaming --all

# Wait for pods to terminate
kubectl wait --for=delete pod --all -n omni-streaming --timeout=300s

# Clear cache
./cleanup-cache.sh clear --force

# Scale back up
kubectl scale deployment --replicas=1 -n omni-streaming --all
```

### "SharingViolation" or "DirectoryNotEmpty" errors

The script automatically retries up to 10 times. If it persists:
1. Stop all Kit-app pods
2. Wait 30-60 seconds
3. Run cleanup again

## Cache Details

- **Location**: `<FILE_SHARE_NAME>-omniverse-cache` (Azure File Share)
- **Mounted in pods**: `/home/ubuntu/.cache` (Kit-app containers)
- **Access Mode**: `ReadWriteMany` (shared across all sessions)
- **Retry Logic**: Up to 10 attempts with 5-second delays

## Best Practices

1. **Stop pods before cleanup** for guaranteed success
2. **Use `--force` carefully** - only in automated scripts
3. **Check Azure Portal** for detailed cache metrics and usage

