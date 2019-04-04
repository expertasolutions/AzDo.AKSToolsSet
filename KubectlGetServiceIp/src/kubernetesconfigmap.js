"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const path = require("path");
const fs = require("fs");
const kubernetesCommand = require("./kubernetescommand");

function run(connection, configMapName) {
    if (tl.getBoolInput("forceUpdateConfigMap") == false) {
        return executeKubetclGetConfigmapCommand(connection, configMapName).then(function success() {
            tl.debug(tl.loc('ConfigMapExists', configMapName));
        }, function failure() {
            return createConfigMap(connection, configMapName);
        });
    }
    else if (tl.getBoolInput("forceUpdateConfigMap") == true) {
        return deleteConfigMap(connection, configMapName).fin(() => {
            return createConfigMap(connection, configMapName);
        });
    }
}

exports.run = run;

function deleteConfigMap(connection, configMapName) {
    tl.debug(tl.loc('DeleteConfigMap', configMapName));
    var command = connection.createCommand();
    command.arg(kubernetesCommand.getNameSpace());
    command.arg("delete");
    command.arg("configmap");
    command.arg(configMapName);
    var executionOption = {
        silent: true,
        failOnStdErr: false,
        ignoreReturnCode: true
    };
    return connection.execCommand(command, executionOption);
}

function getConfigMapArguments() {
    if (tl.getBoolInput("useConfigMapFile") == true) {
        var configMapFileOrDirectoryPath = tl.getInput("configMapFile", false);
        var configMapFromFromFileArgument = "";
        if (configMapFileOrDirectoryPath && tl.exist(configMapFileOrDirectoryPath)) {
            if (fs.statSync(configMapFileOrDirectoryPath).isFile()) {
                var fileName = path.basename(configMapFileOrDirectoryPath);
                configMapFromFromFileArgument = "--from-file=" + fileName + "=" + configMapFileOrDirectoryPath;
            }
            else if (fs.statSync(configMapFileOrDirectoryPath).isDirectory()) {
                configMapFromFromFileArgument = "--from-file=" + configMapFileOrDirectoryPath;
            }
        }
        return configMapFromFromFileArgument;
    }
    else {
        return tl.getInput("configMapArguments", false);
    }
}

function createConfigMap(connection, configMapName) {
    tl.debug(tl.loc('CreatingConfigMap', configMapName));
    var command = connection.createCommand();
    command.arg(kubernetesCommand.getNameSpace());
    command.arg("create");
    command.arg("configmap");
    command.arg(configMapName);
    command.line(getConfigMapArguments());
    return connection.execCommand(command);
}

function executeKubetclGetConfigmapCommand(connection, configMapName) {
    tl.debug(tl.loc('GetConfigMap', configMapName));
    var command = connection.createCommand();
    command.arg(kubernetesCommand.getNameSpace());
    command.arg("get");
    command.arg("configmap");
    command.arg(configMapName);
    var executionOption = {
        silent: true
    };
    return connection.execCommand(command, executionOption);
}