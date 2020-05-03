import * as tl from 'azure-pipelines-task-lib';
import * as msRestNodeAuth from '@azure/ms-rest-nodeauth';
import * as resourceManagement from '@azure/arm-resources';
import * as graph from '@azure/graph';
import * as kubectlUtility from 'utility-common/kubectlutility';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as https from 'https';

async function LoginToAzure(servicePrincipalId:string, servicePrincipalKey:string, tenantId:string) {
  return await msRestNodeAuth.loginWithServicePrincipalSecret(servicePrincipalId, servicePrincipalKey, tenantId );
};

async function kubectl(cmd:string, namespace:[], configFile:[],type:string, line:string, kubectlPath:string, failOnNotFound: boolean) {
  let kubectlCmd = tl.tool(kubectlPath);

  kubectlCmd.arg(cmd);
  kubectlCmd.arg(namespace);
  kubectlCmd.arg(configFile);
  kubectlCmd.line(type)
  kubectlCmd.line(line);
  
  if(cmd !== "delete" ) {
    kubectlCmd.line("-o json");
  }

  kubectlCmd.on("stout", output => {
    console.log("stdout called");
  });

  let outputResult = kubectlCmd.execSync();
  if(outputResult.stderr.indexOf("Error from server (NotFound)") === 0) {
    if(failOnNotFound){
      throw new Error(outputResult.stderr);
    } else {
      return undefined;
    }
  }
  else if(cmd === "delete") {
    return JSON.parse('{ "actionCompleted":"true"}');
  } else {
    outputResult = JSON.parse(kubectlCmd.execSync().stdout);
  }
  return outputResult;
}

function httpsGetRequest(httpsOptions:any) {
  return new Promise((resolve, reject) => {
    const req = https.request(httpsOptions, (response) => {
      let data:any[] = [];
    
      response.on('data', d => {
        data.push(d);
      });

      response.on('end', () => {
        let response_body = Buffer.concat(data);
        resolve(response_body.toString());
      });

      response.on('error', err => {
        reject(err);
      });
    });
    
    req.end();
  });  
}

async function run() {
  try {

    let aksSubscriptionEndpoint = tl.getInput("azureSubscriptionEndpoint", true) as string;
    let aksSubcriptionId = tl.getEndpointDataParameter(aksSubscriptionEndpoint, "subscriptionId", false) as string;
    let aksServicePrincipalId = tl.getEndpointAuthorizationParameter(aksSubscriptionEndpoint, "serviceprincipalid", false) as string;
    let aksServicePrincipalKey = tl.getEndpointAuthorizationParameter(aksSubscriptionEndpoint, "serviceprincipalkey", false) as string;
    let aksTenantId = tl.getEndpointAuthorizationParameter(aksSubscriptionEndpoint,"tenantid", false) as string;
    let aksResourceGroup = tl.getInput("containerAzureResourceGroup", true) as string;
    let aksCluster = tl.getInput("kubernetesCluster", true) as string;
    let targetServiceName = tl.getInput("targetService", true) as string;
    let targetNamespace = tl.getInput("targetNamespace", true) as string;
    let selectorName = tl.getInput("targetSelectorName", true) as string;
    let failOnNotFound = tl.getBoolInput("failOnNotFound", false);

    console.log("");
    console.log("AKS Azure Subscription Id: " + aksSubcriptionId);
    console.log("AKS ServicePrincipalId: " + aksServicePrincipalId);
    console.log("AKS ServicePrincipalKey: " + aksServicePrincipalKey);
    console.log("AKS Tenant Id: " + aksTenantId);
    console.log("targetService: " + targetServiceName);
    console.log("targetNamespace: " + targetNamespace);
    console.log("selectorName: " + selectorName);
    console.log("failOnNotFound: " + failOnNotFound);
    console.log("");

    console.log("Looking for Azure Kubernetes service cluster ...");
    const aksCreds:any = await LoginToAzure(aksServicePrincipalId, aksServicePrincipalKey, aksTenantId);
    let aksResourceClient = new resourceManagement.ResourceManagementClient(aksCreds, aksSubcriptionId);
    let rsList = await aksResourceClient.resources.list();
    let aksClusterInstance:any = rsList.find((element: any) => {
      return element.name === aksCluster;
    });
    let aksInfoResult = await aksResourceClient.resources.getById(aksClusterInstance?.id, '2019-10-01');
    const clientId = aksInfoResult.properties.servicePrincipalProfile.clientId;
    let aksAppCreds:any = new msRestNodeAuth.ApplicationTokenCredentials(aksCreds.clientId, aksTenantId, aksCreds.secret, 'graph');
    let aksGraphClient = new graph.GraphRbacManagementClient(aksAppCreds, aksTenantId, { baseUri: 'https://graph.windows.net' });
    let aksFilterValue = "appId eq '" + clientId + "'";
    let aksServiceFilter = { filter: aksFilterValue };

    let aksSearch = await aksGraphClient.servicePrincipals.list(aksServiceFilter);
    let aksServicePrincipal:any = aksSearch.find((element : any) => {
      return element.appId === clientId;
    });

    if(aksServicePrincipal === undefined){
      throw new Error("AKS Service Principal not found");
    }

    let kubectlPath = tl.which("kubectl", false);
    let kubectlVersion = await kubectlUtility.getStableKubectlVersion();
    let tmpDir = path.join(tl.getVariable('agent.tempDirectory') || os.tmpdir(), "kubectlTask");
    if(!fs.existsSync(tmpDir)){
      fs.mkdirSync(tmpDir);
    }
    let userDir = path.join(tmpDir, new Date().getTime().toString());
    if(!fs.existsSync(userDir)){
      fs.mkdirSync(userDir);
    }

    let kubectlDownload = await kubectlUtility.downloadKubectl(kubectlVersion);
    kubectlPath = kubectlDownload;
    
    let bearerToken = aksCreds.tokenCache._entries[0].accessToken;
    let apiVersion = "2020-02-01"
    let apiPath = "/subscriptions/" + aksSubcriptionId + "/resourceGroups/" + aksResourceGroup + "/providers/Microsoft.ContainerService/managedClusters/" + aksCluster + "/accessProfiles/clusterUser?api-version=" + apiVersion;
    let getOptions = {
      hostname: 'management.azure.com',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        Authorization: ' Bearer ' + bearerToken
      }
    };

    let httpResponse = await httpsGetRequest(getOptions);
    let rawKubeConfig = JSON.parse(httpResponse as string).properties.kubeConfig;
    let base64KubeConfig = Buffer.from(rawKubeConfig, 'base64');

    let kubeConfig = base64KubeConfig.toString();
    let kubeConfigFile = path.join(userDir, "config");
    fs.writeFileSync(kubeConfigFile, kubeConfig);
    process.env["KUBECONFIG"] = kubeConfigFile;

    try {
      let cmdNamespace:any[] = [];
      if(targetNamespace !== "") {
        cmdNamespace = [ "-n", targetNamespace];
      }

      let podService = await kubectl("get", cmdNamespace as [] ,[], "service", targetServiceName, kubectlPath, failOnNotFound);
      if(podService === undefined) {
        let errorMsg = "selectorValue for '" + selectorName + "' doesn't exists for service '" + targetServiceName + "'";
        tl.warning(errorMsg);
        tl.setVariable("selectorValue", "not found");
        tl.setVariable("serviceExists", "false");
      } else {     
        let selectorValue = podService.spec.selector[selectorName];
        if(selectorValue !== undefined) {
          let selectorValue = podService.spec.selector[selectorName];
          console.log("selectorValue: " + selectorValue);
          tl.setVariable("selectorValue", selectorValue);
          tl.setVariable("serviceExists", "true");
        } else {
          let errorMsg = "selectorValue for '" + selectorName + "' doesn't exists for service '" + targetServiceName + "'";
          tl.warning(errorMsg);
          tl.setVariable("selectorValue", "not found");
          tl.setVariable("serviceExists", "true");
        }
      }
    } catch (error) {
      throw error;      
    } finally {
      if(kubeConfigFile != null && fs.existsSync(kubeConfigFile)) {
        delete process.env["KUBECONFIG"];
        fs.unlinkSync(kubeConfigFile);
      }
    }
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
  }
}

run();