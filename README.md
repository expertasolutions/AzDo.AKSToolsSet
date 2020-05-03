# Azure Kubernetes helper tasks package
Tools to help getting dynamic informations from Azure Kubernetes cluster services. See ***[Release notes](https://github.com/expertasolutions/AKSToolsSet/releases)***

## Available tasks

### KubectlGetServiceIp
![KubectlGetServiceIp_Task_inputs](img/v2/getServiceIp.v2.png)

#### Task output variables
- $referenceName.podServiceIp

### KubernetesGetServiceSelector
![KubectlGetServiceSelector_Task_inputs](img/v2/getSelectorValue.v2.png)

#### Task output variables
- $referenceName.selectorValue
- $referenceName.serviceExists (true|false)

## Supported build agents
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)
