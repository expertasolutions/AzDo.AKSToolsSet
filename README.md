# Azure Kubernetes helper tasks package

### Available tasks:
- Get Pod Service Ip Address
- Get Pod Service Selector value

### Supported build agents
- Hosted macOS build agent (supported)
- Hosted VS2017 (supported)

## KubectlGetServiceIp
![KubectlGetServiceIp_Task_inputs](img/v1/getServiceIp.v1.jpg)

### Task output variables
- $referenceName.podServiceIp

## KubernetesGetServiceSelector
![KubectlGetServiceSelector_Task_inputs](img/v1/getSelectorValue.v1.jpg)

### Task output variables
- $referenceName.selectorValue
- $referenceName.serviceExists (true|false)