"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });

const tl = require("vsts-task-lib/task");
const path = require("path");

const clusterconnection_1 = require("./clusterconnection");
tl.setResourcePath(path.join(__dirname, '..', 'task.json'));
// Change to any specified working directory
tl.cd(tl.getInput("cwd"));

var registryType = "Azure Container Registry";
const environmentVariableMaximumSize = 32766;

var command = "get";

var kubeconfigfilePath = "";
if (command === "logout") {
    kubeconfigfilePath = tl.getVariable("KUBECONFIG");
}

var connection = new clusterconnection_1.default(kubeconfigfilePath);

try {
    console.log(connection);
    connection.open()
        .then(() => {
        return run(connection, command);
})
.then(() => {
        tl.setResult(tl.TaskResult.Succeeded, "");
    if (command !== "login") {
        connection.close();
    }
}).catch((error) => {
        tl.setResult(tl.TaskResult.Failed, error.message);
    connection.close();
});
}
catch (error) {
    tl.setResult(tl.TaskResult.Failed, error.message);
}

function run(clusterConnection, command) {
    return __awaiter(this, void 0, void 0, function* () {
        var targetServiceName = tl.getInput("targetService", true);
        console.log("targetService: " + targetServiceName);

        yield executeKubectlCommand(clusterConnection, "get", "service " + targetServiceName)
            .then(function() {
                var podService = tl.getVariable('podServiceContent');
                let json = JSON.parse(podService);
                console.log(json);
                var selectorName = tl.getVariable("targetSelectorName");

                var selectorValue = json.spec.selector[selectorName];
                console.log("selectorValue: " + selectorValue);
                tl.setVariable("selectorValue", selectorValue);
            });
    });
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

// execute kubectl command
function executeKubectlCommand(clusterConnection, command, args) {
    var commandMap = {
        "login": "./kuberneteslogin",
        "logout": "./kuberneteslogout"
    };
    var commandImplementation = require("./kubernetescommand");
    if (command in commandMap) {
        commandImplementation = require(commandMap[command]);
    }
    var telemetry = {
        registryType: registryType,
        command: command
    };
    console.log("##vso[telemetry.publish area=%s;feature=%s]%s", "TaskEndpointId", "KubernetesV1", JSON.stringify(telemetry));
    var result = "";
    return commandImplementation.run(clusterConnection, command, args, (data) => result += data)
        .fin(function cleanup() {
                var commandOutputLength = result.length;
                if (commandOutputLength > environmentVariableMaximumSize) {
                    tl.warning(tl.loc("OutputVariableDataSizeExceeded", commandOutputLength, environmentVariableMaximumSize));
                }
                else {
                    tl.setVariable('podServiceContent', result);
                }
            });
}