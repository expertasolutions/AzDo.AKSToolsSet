# Azure Kubernetes helper tasks package
Set of tasks to help getting dynamic informations from POD's from Azure Kubernetes Services cluster. See ***[Release notes](https://github.com/expertasolutions/AKSToolsSet/releases)***

![MasterBuildStatus](https://dev.azure.com/experta/Community/_apis/build/status/expertasolutions.AKSToolsSet?branchName=master)

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
