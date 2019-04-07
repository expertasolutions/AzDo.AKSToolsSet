# Tasks packages to manage extract Kubernetes Pod Service Ip address

## Available task:
- Get Pod Service Ip Address

## Supported build agents
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)
- Any private build agent with Powershell and Azure CLI installed

## KubectlGetServiceIp (required parameters)
- Azure subscription
- Azure resource group
- Kubernetes Cluster
- Target pod service name

## Task Output variables
- $referenceName.podServiceIp

## Requirements
- Azure CLI must be installed on the build agent