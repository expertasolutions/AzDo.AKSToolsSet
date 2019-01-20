"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
function run(connection, kubecommand, args, outputUpdate) {
    var command = connection.createCommand();
    command.on("stdout", output => {
        outputUpdate(output);
    });
    command.arg(kubecommand);
    command.arg(getNameSpace());
    command.arg(getCommandConfigurationFile());
    command.line(args);
    command.line("-o json");
    return connection.execCommand(command);
}
exports.run = run;

function getCommandConfigurationFile() {
    var args = [];
    var useConfigurationFile = tl.getBoolInput("useConfigurationFile", false);
    if (useConfigurationFile) {
        var configurationPath = tl.getInput("configuration", true);
        if (configurationPath && tl.exist(configurationPath)) {
            args[0] = "-f";
            args[1] = configurationPath;
        }
        else {
            throw new Error(tl.loc('ConfigurationFileNotFound', configurationPath));
        }
    }
    return args;
}

function getCommandArguments() {
    return tl.getInput("arguments", false);
}

function getNameSpace() {
    var args = [];
    var namespace = tl.getInput("namespace", false);
    if (namespace) {
        args[0] = "-n";
        args[1] = namespace;
    }
    return args;
}
exports.getNameSpace = getNameSpace;
