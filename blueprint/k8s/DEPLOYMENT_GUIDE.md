# Deploy the bottle-filling digital twin app to OKAS

This deployment guide explains how to deploy the bottle-filling digital twin app to your Azure NVIDIA OKAS deployment.

## Prerequisites

### Deploy OKAS on AKS using Azure Marketplace product from NVIDIA

Go to [Kit App Streaming on Azure Marketplace](https://docs.omniverse.nvidia.com/ovas/latest/marketplace/azure/index.html) and follow the instructions up to the **Cluster Access** page.

**IMPORTANT:** While you are on the Azure Portal and filling in the details in **Deployment Specifications**, for the **Private Base Domain for your AKS cluster ingress** textbox, you can change the value to whatever domain you want to use. Using the `kitapp.omniverse.com` default results in your apps and streaming servers being deployed in `api.backend.kitapp.omniverse.com`.
You must edit your `/etc/hosts` file to point your browser to the external IP address when trying to reach this domain, which is discussed later.

You can obtain the NGC API token by signing up in NVIDIA's NGC Catalog.

### Create Azure Container Registry

Go to the Azure Portal and search for `container registries`. Click **Create** and then create a basic registry in the same resource group and location as your AKS cluster. Once created, go to the resource and select **Settings > Access Keys**. Select the **Admin user** checkbox and copy the username and password.

These credentials are used during Docker login to push the built container images. They are also used to upload Helm charts and by K8s to pull the images.

The `Login Server` is the ACR domain where your images and Helm charts reside.

### Create Ansys License Server

In the same resource group as the AKS cluster, create a new VM with the following details:

- OS: Linux (Ubuntu 24.04)
- Size: Standard D2s v3 (2 vcpus, 8 GiB memory)
- Virtual network/subnet: vnet-aks-omniverse/subnet-aks
- A public IP address is provisioned
- An RSA key or username/password combo is used for accessing this VM.

You must ensure that the machine is in the same subnet as the internal subnet for the OKAS AKS cluster.

Once the machine starts, go to the resource group created by the Azure marketplace product when you deployed OKAS.
In this resource group, find the internal Network Security Group (NSG) created for the AKS cluster. This is usually named `nsg-<aks-cluster-name>-external`.
In the inbound security rule of this NSG, add an entry for the private IP address (10.2.0.x) of this VM to allow traffic from:

  Source: My IP address
  Source Port Ranges: *
  Destination: IP Addresses
  Destination IP Addresses: `<private-ip-address>` (usually 10.2.0.x)
  Service: SSH
  Action: Allow
  Priority: `<leave-as-is>`
  Name: AllowSSHToLicenseServerFromMyIP (or something that is suitable)

Save the entry. This allows you to use a secure shell (SSH) connection to access the VM and install the license server.

In the inbound security rule of this NSG, add an entry for the private IP address (10.2.0.x) of this VM to allow traffic from:

Source: My IP address
  Source Port Ranges: *
Destination: IP Addresses
  Destination IP Addresses: `<private-ip-address>` (usually 10.2.0.x)
  Service: Custom
  Destination port ranges: 1084
  Protocol: Any
  Action: Allow
  Priority: `<leave-as-is>`
  Name: LicenseManagerUIAccessFromMyIP (or something that is suitable)

Save the entry. This allows you to access the Ansys License Manager UI from your IP address.

In the inbound security rule of this NSG, add an entry for the private IP address (10.2.0.x) of this VM to allow traffic from:

  Source: IP Addresses
  Source IP addresses/CIDR ranges: 10.0.0.0/8
  Source Port Ranges: *
  Destination: IP Addresses
  Destination IP Addresses: `<private-ip-address>` (usually 10.2.0.x)
  Service: Custom
  Destination port ranges: 1055
  Protocol: Any
  Action: Allow
  Priority: `<leave-as-is>`
  Name: LicenseManagerAccessForPodAKS (or something that is suitable)

Save the entry. This allows the Fluent containers in the pods to access the Ansys License Manager for license checks.

**NOTE:** Logging into the machine and installing the Ansys License Server is outside the scope of this document.

Once the license server is installed and configured, note the internal IP address and port 1055. These are used later to configure your Helm chart.

### Modify nginx ingress controller

The nginx ingress controller version 1.12.2 is used in the AKS with Helm chart version 11.6.20. This chart, deployed by the Azure Marketplace offering, creates an internal ingress controller. To expose it to the public internet, you must change it to an external ingress controller with a load balancer service and a public IP address.

Fetch the current values supplied to the Helm chart:

```bash
helm list -n nginx-ingress-controller
```

This should return the name, namespace, chart, and other details of the deployment. These values are likely:

  Name: nginx-ingress-controller-internal
  Namespace: nginx-ingress-controller
  Chart: nginx-ingress-controller-11.6.20

Use these values in the following commands.

```bash
# helm get values <Name> -n <Namespace>
helm get values nginx-ingress-controller-internal -n nginx-ingress-controller > current-values.yaml
```

Edit the `current-values.yaml` file:

```yaml
defaultBackend:
  image:
    repository: bitnamilegacy/nginx
global:
  security:
    allowInsecureImages: true
image:
  repository: bitnamilegacy/nginx-ingress-controller
```

Change the `service.beta.kubernetes.io/azure-load-balancer-internal` annotation to `"false"`.

Update the chart deployment:

```bash
# helm upgrade <release-name> <chart-name> -n <namespace> -f current-values.yaml
helm upgrade nginx-ingress-controller-internal nginx-ingress-controller-11.6.20 -n nginx-ingress-controller -f current-values.yaml
```

Use `helm list -n nginx-ingress-controller` to check the status. It should say `deployed`.

Now, if you wait for a bit, you can see the public IP address of the nginx ingress controller service. This is your entry point to all the apps.

Run the following command to get the public IP address that Azure has provisioned for your ingress controller:

```bash
kubectl get svc -n nginx-ingress-controller
```

The output should look something like this:

```bash
NAME                                                TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)                      AGE
nginx-ingress-controller-internal                   LoadBalancer   10.0.123.11   <external-ip>   80:32229/TCP,443:30690/TCP   5d21h
nginx-ingress-controller-internal-default-backend   ClusterIP      10.0.38.162   <none>          80/TCP                       5d21h
```

**NOTE:** This bypasses using the internal NSG to connect to the subnet where the cluster is running to reach the ingress controller pod. This is not recommended. Use the external security group and/or DNS zones and connect using the WAF subnet and security best practices when using in later stages.

Now go to the resource group created by the Azure marketplace product when you deployed OKAS.
In this resource group, find the internal NSG created for the AKS cluster. This is usually named `nsg-<aks-cluster-name>-external`.
In the inbound security rule of this NSG, add an entry for this external IP address to allow traffic from:

  Source: Service Tag
  Source Service Tag: Internet
  Source Port Ranges: *
  Destination: IP Addresses
  Destination IP Addresses: `<external-ip-addess>`
  Destination Port Ranges: 443,80
  Protocol: Any
  Action: Allow
  Priority: `<leave-as-is>`
  Name: InternetToIngressControllerAllow (or something that is suitable)

Save the entry. This allows you to reach the external IP address of the ingress controller through port 443 and 80 and through it the ingress-controller port.

Now edit your `/etc/hosts` file (`C:\Windows\System32\drivers\etc\hosts` for Windows) with the domain name you added while deploying OKAS with the Azure marketplace product.

Add this entry in the bottom of the file. If you did not make any changes to the default value, `<hostname-you-provided>` is `kitapp.omniverse.com`.

```text
<external-ip-address>   api.backend.<hostname-you-provided>
<external-ip-address>   frontend.<hostname-you-provided>
```

This is a temporary workaround. If you have a registered domain name (like `ansys.com`) or subdomains, use them while creating the deployment in marketplace and use Azure DNS Zones to configure the subdomains `api.backend` and `frontend` to be resolved to the external IP of the ingress controller. The `frontend` subdomain is used by the frontend app. You can use other subdomains as per your requirements. Make sure to match them in both places.

Log in to the Azure Container Registry:

```bash
# docker login myacrserver-optionalUniqueID.azurecr.io
doc# docker login myacrserver-optionalUniqueID.azurecr.io
ker login <your-login-server>
```

Enter the username and password when prompted.

The scripts for building all the containers are defined in the `../scripts` folder.

To build the init container that deploys the necessary contents folder to the pod, run the following command from the parent folder (blueprint).

```bash
# ./scripts/build-content-image.sh <container-registry-server>/bottle-filling-digital-twin/content <tag>
./scripts/build-content-image.sh myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/content latest
```

To build the Fluent container, make sure you have Ansys Fluent 2025 R2 installed locally on the machine where you are going to run this script.

```bash
# ./scripts/build-fluent-image.sh <ansys-install-folder> <container-registry-server>/ansys/pyfluent <tag>
./scripts/build-fluent-image.sh /ansys_inc myacr-UniqueId.azurecr.io/ansys/pyfluent v25.2.0
```

To build the `kit-app` container, run the following command:

```bash
# ./scripts/build-kit-app-image.sh <container-registry-server>/bottle-filling-digital-twin/kit-app <tag>
./scripts/build-kit-app-image.sh myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/kit-app latest
```

To build the `web-app` container, run the following command:

```bash
# ./scripts/build-web-app-image.sh <container-registry-server>/bottle-filling-digital-twin/web-app <tag>
./scripts/build-web-app-image.sh myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/web-app latest
```

Once these containers are created, push them to your ACR using the `docker push` command:

```bash
docker push myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/content:latest
docker push myacr-UniqueId.azurecr.io/ansys/pyfluent:v25.2.0
docker push myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/kit-app:latest
docker push myacr-UniqueId.azurecr.io/bottle-filling-digital-twin/web-app:latest
```

## Step 2: Prepare your Helm chart

Edit the `k8s/bottle-filling-twin/values.yaml` file with the container image names. Package and push the chart:

```bash
cd k8s

# Package the chart
helm package bottle-filling-twin

# Login to Azure Container Registry
az acr login --name <acr-name>

# Push to ACR Helm repo (OCI)
helm push bottle-filling-twin-1.0.0.tgz oci://<acr-name>.azurecr.io/helm
```

Update the `bottle-filling-application-version.yaml` file:

```yaml
spec:
  helm_chart: oci://<acr-name>.azurecr.io/helm/bottle-filling-twin
  helm_chart_version: '1.0.0'
```

## Step 3: Create required secrets

```bash
# Get your OKAS namespace
OKAS_NAMESPACE="omni-streaming"  # Or your actual namespace

# Create Azure Container Registry image pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=<acr-name>.azurecr.io \
  --docker-username=<acr-username> \
  --docker-password=<acr-password> \
  --namespace=$OKAS_NAMESPACE

# Create Ansys license secret
kubectl create secret generic ansys-license-secret \
  --from-literal=ANSYSLMD_LICENSE_FILE='<port>@<license-server>' \
  --namespace=$OKAS_NAMESPACE
```

**NOTE:** The `acr-secret` is referenced in your Helm repository and used for image pulls from ACR.
The port and license server used for `ANSYSLMD_LICENSE_FILE` were defined in the earlier step where you created the license manager virtaul machine. These are usually `1055@internal-ip-of-vm>`. For example, `1055@10.2.0.4`.

## Step 3.1: Register the ACR Helm repository (Flux/OKAS)

Apply the provided `acr-helm-repository.yaml` file to register your ACR Helm repository with Flux/OKAS:

```bash
kubectl apply -f acr-helm-repository.yaml
```

Example `acr-helm-repository.yaml`:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: HelmRepository
metadata:
  name: ansys-acr
  namespace: omni-streaming
spec:
  type: oci
  url: oci://<acr-name>.azurecr.io/helm
  interval: 10m
  provider: generic
  secretRef:
    name: acr-secret
```

This enables Flux/OKAS to pull Helm charts from your ACR securely.

# Step 4: Apply OKAS CRDs

```bash
cd k8s

# Apply in order
kubectl apply -f bottle-filling-application.yaml
kubectl apply -f bottle-filling-application-version.yaml
kubectl apply -f bottle-filling-application-profile.yaml
```

## Step 5: Verify registration

```bash
# Check application is registered
kubectl get applications
# Should show: bottle-filling-twin

# Check version is registered
kubectl get applicationversions
# Should show: bottle-filling-twin-1.0.0

# Check profiles are registered
kubectl get applicationprofiles
# Should show: default, high-performance

# Detailed view
kubectl describe application bottle-filling-twin
kubectl describe applicationversion bottle-filling-twin-1.0.0
kubectl describe applicationprofile default
```

## Step 6: Deploy the web app frontend

The web app deployment and configuration manifest files are in the `web-app` folder. Read the [README file](./web-app/README.md) for details.

## Step 7: Access the web app frontend

Access the web app at `frontend.kitapp.omniverse.com` or `<frontend-subdomain>.<yourdomain>`.

## Troubleshooting

### App not showing in UI

```bash
# Check CRD status
kubectl describe application bottle-filling-twin

# Check OKAS controller logs
kubectl logs -n okas-system -l app=okas-controller --tail=100
```

### Session fails to start

```bash
# List stream sessions
kubectl get streamsessions -A

# Check specific session
kubectl describe streamsession <session-name> -n <namespace>

# Check pod logs
kubectl logs -n <namespace> <pod-name>

# Check init container logs
kubectl logs -n <namespace> <pod-name> -c init-volumes
```

### Content initialization fails

```bash
# Verify content image exists
docker pull <acr-name>.azurecr.io/bottle-filling-digital-twin/content:latest

# Check init container logs
kubectl logs <pod> -c init-volumes

# Verify PVC creation
kubectl get pvc -n <namespace>
```

### Image pull errors occur

```bash
# Verify secrets exist in session namespace
kubectl get secrets -n <session-namespace>

# Test image pull manually
kubectl run test --image=<acr-name>.azurecr.io/bottle-filling-digital-twin/kit-app:latest \
  --image-pull-policy=Always --dry-run=client -o yaml
```

## Customization examples

### Change simulation parameters

Edit `bottle-filling-application-profile.yaml`:

```yaml
chartValues:
  fluent:
    simulation:
      bottlesPerHour: "1500"
      fillingHeight: "0.85"
      viscosity: "0.002"
```

Then re-apply:

```bash
kubectl apply -f bottle-filling-application-profile.yaml
```

### Adjust resources

```yaml
chartValues:
  kitApp:
    resources:
      limits:
        memory: "96Gi"
        cpu: "24"
```

### Use different storage class

```yaml
chartValues:
  storage:
    storageClass: "premium-rwo"  # Azure Premium SSD
```

## Monitoring

### Check running sessions

```bash
kubectl get streamsessions -A
kubectl get pods -A -l app.kubernetes.io/name=bottle-filling-twin
```

### View session logs

```bash
# Fluent logs
kubectl logs -n <namespace> <pod> -c fluent

# Kit-app logs
kubectl logs -n <namespace> <pod> -c kit-app

# Envoy logs
kubectl logs -n <namespace> <pod> -c envoy-sidecar
```

### Check resource usage

```bash
kubectl top pods -n <namespace>
kubectl top nodes
```

# Cleanup

### Remove a specific session

```bash
kubectl delete streamsession <session-name> -n <namespace>
```

### Unregister app

```bash
kubectl delete applicationprofile default
kubectl delete applicationprofile high-performance
kubectl delete applicationversion bottle-filling-twin-1.0.0
kubectl delete application bottle-filling-twin
```

## Next steps

- Monitor session performance and adjust resources.
- Create custom profiles for different use cases.
- Set up automated content updates.
- Configure monitoring and alerting.
- Implement session quotas and limits.

## Support

For issues specific to:
- OKAS platform: See Azure OKAS documentation.
- Helm chart: See `k8s/bottle-filling-twin/README.md`.
- Content initialization: See `k8s/CONTENT_INITIALIZATION_GUIDE.md`.
- Azure Container Registry: See Azure ACR documentation.
- Ansys Fluent: Consult Ansys support.
