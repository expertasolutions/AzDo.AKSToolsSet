"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib");
const kubernetesCommand = require("./kubernetescommand");
const acrauthenticationtokenprovider_1 = require("docker-common/registryauthenticationprovider/acrauthenticationtokenprovider");
const genericauthenticationtokenprovider_1 = require("docker-common/registryauthenticationprovider/genericauthenticationtokenprovider");

function run(connection, secret) {
    if (tl.getBoolInput("forceUpdate") == true) {
        return deleteSecret(connection, secret).fin(() => {
            return createSecret(connection, secret);
        });
    }
    else {
        return createSecret(connection, secret);
    }
}

exports.run = run;

function createSecret(connection, secret) {
    var typeOfSecret = tl.getInput("secretType", true);
    if (typeOfSecret === "dockerRegistry") {
        var authenticationToken = getRegistryAuthenticationToken();
        return createDockerRegistrySecret(connection, authenticationToken, secret);
    }
    else if (typeOfSecret === "generic") {
        return createGenericSecret(connection, secret);
    }
}

function deleteSecret(connection, secret) {
    tl.debug(tl.loc('DeleteSecret', secret));
    var command = connection.createCommand();
    command.arg(kubernetesCommand.getNameSpace());
    command.arg("delete");
    command.arg("secret");
    command.arg(secret);
    var executionOption = {
        silent: true,
        failOnStdErr: false,
        ignoreReturnCode: true
    };
    return connection.execCommand(command, executionOption);
}

function createDockerRegistrySecret(connection, authenticationToken, secret) {
    if (authenticationToken) {
        tl.debug(tl.loc('CreatingSecret', secret));
        var command = connection.createCommand();
        command.arg(kubernetesCommand.getNameSpace());
        command.arg("create");
        command.arg("secret");
        command.arg("docker-registry");
        command.arg(secret);
        command.arg("--docker-server=" + authenticationToken.getLoginServerUrl());
        command.arg("--docker-username=" + authenticationToken.getUsername());
        command.arg("--docker-password=" + authenticationToken.getPassword());
        command.arg("--docker-email=" + authenticationToken.getEmail());
        return connection.execCommand(command);
    }
    else {
        tl.error(tl.loc("DockerRegistryConnectionNotSpecified"));
        throw new Error(tl.loc("DockerRegistryConnectionNotSpecified"));
    }
}

function createGenericSecret(connection, secret) {
    tl.debug(tl.loc('CreatingSecret', secret));
    var command = connection.createCommand();
    command.arg(kubernetesCommand.getNameSpace());
    command.arg("create");
    command.arg("secret");
    command.arg("generic");
    command.arg(secret);
    var secretArguments = tl.getInput("secretArguments", false);
    if (secretArguments) {
        command.line(secretArguments);
    }
    return connection.execCommand(command);
}

function getRegistryAuthenticationToken() {
    var registryType = tl.getInput("containerRegistryType", true);
    var authenticationProvider;
    if (registryType == "Azure Container Registry") {
        authenticationProvider = new acrauthenticationtokenprovider_1.default(tl.getInput("azureSubscriptionEndpointForSecrets"), tl.getInput("azureContainerRegistry"));
    }
    else {
        authenticationProvider = new genericauthenticationtokenprovider_1.default(tl.getInput("dockerRegistryEndpoint"));
    }
    return authenticationProvider.getAuthenticationToken();
}