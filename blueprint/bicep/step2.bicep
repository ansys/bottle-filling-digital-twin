// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

targetScope='resourceGroup'

param location string
param virtualNetworkName string
param aksClusterName string
param aksDnsPrefix string
param agentNodeCount int = 1
param cacheNodeCount int = 1
param gpuNodeCount int = 2
param gpuNodeCount_2nd int = 2
param agentMaxPods int = 30
param agentPoolName string
param cachePoolName string
param gpuPoolName string
param gpuPoolName_2nd string
param agentVMSize string
param cacheVMSize string
param gpuVMSize string
param gpuVMSize_2nd string
param logAnalyticsName string
// param backendDnsZoneName string
// param externalDnsManagedIdentityName string
param aksOutboundPublicIpName string
param aksOutboundPublicIpID string

resource cua 'Microsoft.Resources/deployments@2020-06-01' = {
  name: 'pid-f32afc01-3846-4af6-83d8-b1d2c92aa57d'
  properties: {
    mode: 'Incremental'
    template: {
      '$schema': 'https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#'
      contentVersion: '1.0.0'
      resources: []
    }
  }
}


resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  name: virtualNetworkName
}

resource aksOutboundPublicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: aksOutboundPublicIpName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// ============================================
// USER-ASSIGNED MANAGED IDENTITY FOR AKS
// Microsoft recommended for AKS with custom VNet
// See: https://learn.microsoft.com/en-us/azure/aks/use-managed-identity
// ============================================
resource aksIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${aksClusterName}-identity'
  location: location
}

// Network Contributor role definition ID
var networkContribRoleDefinitionID = '4d97b98b-1d4f-4787-a291-c67834d212e7'

// ============================================
// ROLE ASSIGNMENTS - BEFORE AKS CREATION
// Using user-assigned identity avoids RoleAssignmentUpdateNotPermitted errors
// when AKS cluster is recreated (identity persists independently)
// GUID uses identity resource ID (deterministic) - identity persists across AKS recreations
// ============================================

// Network Contributor on VNet - for subnet integration
resource aksNetworkContribRoleVnet 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vnet.id, aksIdentity.id, networkContribRoleDefinitionID)
  scope: vnet
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', networkContribRoleDefinitionID)
    principalId: aksIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    description: 'AKS cluster identity needs Network Contributor on VNet for subnet integration'
  }
}

// Network Contributor on Resource Group - for Public IP access (load balancer)
resource aksNetworkContribRoleRG 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, aksIdentity.id, networkContribRoleDefinitionID)
  scope: resourceGroup()
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', networkContribRoleDefinitionID)
    principalId: aksIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    description: 'AKS cluster identity needs Network Contributor on RG for Public IP access'
  }
}

// ============================================
// AKS CLUSTER WITH USER-ASSIGNED IDENTITY
// ============================================
resource aks 'Microsoft.ContainerService/managedClusters@2024-10-01' = {
  name: aksClusterName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${aksIdentity.id}': {}
    }
  }
  properties: {
    aadProfile: {
      managed: true
      enableAzureRBAC: true
    }
    dnsPrefix: aksDnsPrefix
    agentPoolProfiles: [
      {
        name: agentPoolName
        count: agentNodeCount
        vmSize: agentVMSize
        osType: 'Linux'
        mode: 'System'
        maxPods: agentMaxPods
        enableAutoScaling: true
        minCount: 1
        maxCount: 3
        vnetSubnetID: '${vnet.id}/subnets/subnet-aks'
      }
      {
        name: cachePoolName
        count: cacheNodeCount
        vmSize: cacheVMSize
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: 1
        maxCount: 3
        vnetSubnetID: '${vnet.id}/subnets/subnet-aks'
      }
      {
        name: gpuPoolName
        count: gpuNodeCount
        vmSize: gpuVMSize
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: 1
        maxCount: 3
        vnetSubnetID: '${vnet.id}/subnets/subnet-aks'
      }
      {
        name: gpuPoolName_2nd
        count: gpuNodeCount_2nd
        vmSize: gpuVMSize_2nd
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: 1
        maxCount: 3
        vnetSubnetID: '${vnet.id}/subnets/subnet-aks'
      }
    ]
    networkProfile: {
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      networkPolicy: 'none'
      outboundType: 'loadBalancer'
      loadBalancerProfile: {
        outboundIPs: {
          publicIPs: [
            {
              id: aksOutboundPublicIpID
            }
          ]
        }
      }
    }
    securityProfile: {
      workloadIdentity: { enabled: true }
    }
    oidcIssuerProfile: { enabled: true }
    ingressProfile: {
      webAppRouting: {
        enabled: true
      }
    }
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceId: logAnalytics.id
        }
      }
    }
  }
  // Explicit dependency ensures role assignments complete before AKS creation
  dependsOn: [
    aksNetworkContribRoleVnet
    aksNetworkContribRoleRG
  ]
}

resource aksDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'Log Analytics'
  scope: aks
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'kube-apiserver'
        enabled: true
      }
      {
        category: 'kube-audit'
        enabled: true
      }
      {
        category: 'kube-audit-admin'
        enabled: true
      }
      {
        category: 'kube-controller-manager'
        enabled: true
      }
      {
        category: 'kube-scheduler'
        enabled: true
      }
      {
        category: 'cluster-autoscaler'
        enabled: true
      }
      {
        category: 'cloud-controller-manager'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// resource privateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' existing = {
//   name: backendDnsZoneName
// }


// resource privateDnsZoneVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
//   parent: privateDnsZone
//   location: 'Global'
//   name: 'link-${vnet.name}'
//   properties: {
//     registrationEnabled: false
//     virtualNetwork: {
//       id: vnet.id
//     }
//   }
// }


// resource aksMsi 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-07-31-preview' = {
//   location: location
//   name: externalDnsManagedIdentityName
// }

// Reader role assignment for ExternalDNS - commented out as aksMsi is not created
// Uncomment and update if ExternalDNS managed identity is needed
// var readerRoleAssignmentId = 'acdd72a7-3385-48ef-bd42-f606fba81ae7'
// var readerRoleAssignmentName = guid(aksMsi.name, readerRoleAssignmentId, resourceGroup().id)
//
// resource readerRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
//   name: readerRoleAssignmentName
//   scope: resourceGroup()
//   properties: {
//     roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', readerRoleAssignmentId)
//     principalId: aksMsi.properties.principalId
//     principalType: 'ServicePrincipal'
//   }
// }

// var clusterRoleAssignmentId = 'b1ff04bb-8a4e-4dc4-8eb5-8693973ce19b' // Unused variable

output aksOutboundPublicIpAddress string = aksOutboundPublicIp.properties.ipAddress
output aksOutboundPublicIpId string = aksOutboundPublicIp.id
output aksIdentityPrincipalId string = aksIdentity.properties.principalId
output aksIdentityClientId string = aksIdentity.properties.clientId
