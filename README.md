# Azure Kubernetes helper tasks package
Tools to help getting dynamic informations from Azure Kubernetes cluster services. See ***[Release notes](https://github.com/expertasolutions/AKSToolsSet/releases)***

## Available tasks

### KubectlGetServiceIp
![KubectlGetServiceIp_Task_inputs](img/v1/getServiceIp.v1.jpg)

#### Task output variables
- $referenceName.podServiceIp

### KubernetesGetServiceSelector
![KubectlGetServiceSelector_Task_inputs](img/v1/getSelectorValue.v1.jpg)

#### Task output variables
- $referenceName.selectorValue
- $referenceName.serviceExists (true|false)

## Supported build agents
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)
