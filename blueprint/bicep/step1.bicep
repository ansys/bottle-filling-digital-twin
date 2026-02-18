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
param vnetAddressPrefix string
param aksSubnetAddressPrefix string
param wafSubnetAddressPrefix string
param nsgNameExternal string
param nsgNameInternal string
param virtualNetworkName string
// param backendDnsZoneName string  // PRIVATE_DNS_ZONE_NAME disabled
param logAnalyticsName string
// Public IP params
param publicIpName string = 'pip-okas-ansys'
param publicIpDnsLabel string
// Storage Account param
param storageAccountName string
// Azure Container Registry param
param acrName string

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

resource nsgInternal 'Microsoft.Network/networkSecurityGroups@2021-02-01' = {
  name: nsgNameInternal
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAllInternalTraffic'
        properties: {
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
          direction: 'Inbound'
          access: 'Allow'
          priority: 105
        }
      }
      {
        name: 'AllowCidrBlockCustom80'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '80'
          direction: 'Inbound'
          access: 'Allow'
          priority: 100
        }
      }
      {
        name: 'AllowCidrBlockCustom443'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.0.0/8'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
          direction: 'Inbound'
          access: 'Allow'
          priority: 110
        }
      }
      {
        name: 'AllowTagCustom3443Inbound'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: 'ApiManagement'
          sourcePortRange: '*'
          destinationAddressPrefix: 'VirtualNetwork'
          destinationPortRange: '3443'
          direction: 'Inbound'
          access: 'Allow'
          priority: 120
        }
      }
      {
        name: 'AllowCidrBlockCustom31000-31002Inbound'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '31000-31002'
          direction: 'Inbound'
          access: 'Allow'
          priority: 130
        }
      }
      {
        name: 'AllowCidrBlockCustom31000-31002InboundUdp'
        properties: {
          protocol: 'Udp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '31000-31002'
          direction: 'Inbound'
          access: 'Allow'
          priority: 140
        }
      }
    ]
  }
}

resource nsgExternal 'Microsoft.Network/networkSecurityGroups@2021-02-01' = {
  name: nsgNameExternal
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowCidrBlockCustom80'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '80'
          direction: 'Inbound'
          access: 'Allow'
          priority: 100
        }
      }
      {
        name: 'AllowAllExternalTraffic'
        properties: {
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
          direction: 'Inbound'
          access: 'Allow'
          priority: 105
        }
      }
      {
        name: 'AllowCidrBlockCustom443'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
          direction: 'Inbound'
          access: 'Allow'
          priority: 110
        }
      }
      {
        name: 'AllowGatewayManagerInbound'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: 'GatewayManager'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '65200-65535'
          direction: 'Inbound'
          access: 'Allow'
          priority: 120
        }
      }
      {
        name: 'AllowCidrBlockCustom31000-31002Inbound'
        properties: {
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '31000-31002'
          direction: 'Inbound'
          access: 'Allow'
          priority: 130
        }
      }
      {
        name: 'AllowCidrBlockCustom31000-31002InboundUdp'
        properties: {
          protocol: 'Udp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '31000-31002'
          direction: 'Inbound'
          access: 'Allow'
          priority: 140
        }
      }
    ]
  }
}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: virtualNetworkName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
          name: 'subnet-aks'
          properties: {
              addressPrefix: aksSubnetAddressPrefix
              networkSecurityGroup: {
                  id: nsgInternal.id
              }
          }
      }
      {
          name: 'subnet-waf'
          properties: {
              addressPrefix: wafSubnetAddressPrefix
              networkSecurityGroup: {
                id: nsgExternal.id
            }
          }
      }
    ]
  }
}

// resource privateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
//   location: 'Global'
//   name: backendDnsZoneName
//   properties: {}
// }


resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  location: location
  name: logAnalyticsName
  properties: {
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    retentionInDays: 30
    sku: {
      name: 'pergb2018'
    }
    workspaceCapping: {
      dailyQuotaGb: -1
    }
  }
}

output logAnalyticsWorkspaceId string = logAnalytics.id

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id

// Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'disabled'
      }
    }
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output acrId string = acr.id

resource aksPublicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: publicIpName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: publicIpDnsLabel
    }
  }
}

// Surface key outputs for use by scripts
output publicIpAddress string = aksPublicIp.properties.ipAddress
output publicIpFqdn string = aksPublicIp.properties.dnsSettings.fqdn
output publicIpID string = aksPublicIp.id
