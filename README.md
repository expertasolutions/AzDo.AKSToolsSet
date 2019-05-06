# Azure Kubernetes helper tasks package

### Available tasks:
- Get Pod Service Ip Address
- Get Pod Service Selector value

### Supported build agents
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)
- Any private build agent with Powershell and Azure CLI installed

## KubectlGetServiceIp
### Parameters
- Azure subscription
- Azure resource group
- Kubernetes Cluster
- Target pod service name
![KubectlGetServiceIp_Task_inputs](img/getServiceIp.v1.jpg)

### Task output variables
- $referenceName.podServiceIp

## KubernetesGetServiceSelector
### Parameters
- Azure subscription
- Azure resource group
- Kubernetes Cluster
- Target pod service name
- Selector tag name
![KubectlGetServiceSelector_Task_inputs](img/getSelectorValue.v1.jpg)

### Task output variables
- $referenceName.selectorValue
- $referenceName.serviceExists (true|false)

### Requirements
- Azure CLI must be installed on the build agent