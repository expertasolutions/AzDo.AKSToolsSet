Tasks packages to manage extract Kubernetes Pod Service Ip address

Available task:
- Get Pod Service Ip Address

This task package is compatible with:
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)
- Any private build agent with Powershell and Azure CLI installed

#Branches builds status
- Dev -> <img src="https://dev.azure.com/experta/ExpertaSolutions/_apis/build/status/AKSToolsSet-CI?branchName=Dev"/>
- Master -> <img src="https://dev.azure.com/experta/ExpertaSolutions/_apis/build/status/AKSToolsSet-CI?branchName=master"/>

#Release status
- Dev -> <img src="https://vsrm.dev.azure.com/experta/_apis/public/Release/badge/5b43050d-0a01-4269-ace5-9e22c920391c/13/43"/>
- Master -> <img src="https://vsrm.dev.azure.com/experta/_apis/public/Release/badge/5b43050d-0a01-4269-ace5-9e22c920391c/13/45"/>

## KubectlGetServiceIp (required parameters)
- Azure subscription
- Azure resource group
- Kubernetes Cluster
- Target pod service name

#Task Output variables
- $referenceName.podServiceIp

# Requirements

- Azure CLI must be installed on the build agent