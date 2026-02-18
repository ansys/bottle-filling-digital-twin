# Application Profiles Documentation

## Overview

Two profiles are available for different use cases:

- **Default Profile** (`bottle-filling-twin-default`): Full simulation with Fluent and Kit-app
- **Viewer Profile** (`bottle-filling-twin-viewer-default`): Viewer-only with Kit-app (no Fluent)

## Profile Comparison

| Feature | Default Profile | Viewer Profile |
| ------- | --------------- | -------------- |
| Route | `/simulation` | `/reviewer` |
| Fluent Engine | Enabled | Disabled |
| Kit-app | Enabled | Enabled |
| Envoy Proxy | Enabled | Enabled |
| Content Storage | Read-write | Read-only |
| Fluent Workdir | Enabled | Not needed |

## Default Profile

**Use Case**: Run simulations and visualize results

**Components**: Fluent (CFD solver) + Kit-app (visualization) + Envoy

**When to Use**:
- Running new simulations
- Setting up solver parameters
- Executing calculations
- Viewing live simulation results

## Viewer Profile

**Use Case**: View existing solved cases only (no simulation)

**Components**: Kit-app (visualization) + Envoy (no Fluent)

**When to Use**:
- Reviewing completed simulations
- Visualizing solved cases
- Analyzing results from previous runs

## Key Differences

1. **Fluent Engine**: Default profile includes Fluent on `fluentpool` node pool; Viewer profile does not
2. **Storage**: Default profile has writable content (generates journal files); Viewer profile is read-only
3. **Resources**: Default requires Fluent + Kit-app resources; Viewer only needs Kit-app resources

## Configuration

- Default: `blueprint/k8s/templates/bottle-filling-application-profile.yaml`
- Viewer: `blueprint/k8s/templates/bottle-filling-application-profile-viewer.yaml`

The web app automatically selects the profile based on route:
- `/simulation` uses default profile
- `/reviewer` uses viewer profile

Both profiles are deployed by `35-deploy-apps.sh` and reference the same Helm chart with different values.

