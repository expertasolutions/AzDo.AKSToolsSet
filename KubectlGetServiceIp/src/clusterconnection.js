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
const fs = require("fs");
const path = require("path");
const tl = require('azure-pipelines-task-lib');
const utils = require("./utilities");
const toolLib = require("azure-pipelines-task-lib");

class ClusterConnection {
    
    constructor(existingKubeConfigPath) {
        console.log("ClusterConnection constructor");
        this.kubectlPath = tl.which("kubectl", false);
        this.userDir = utils.getNewUserDirPath();
        if (existingKubeConfigPath) {
            this.kubeconfigFile = existingKubeConfigPath;
        }
    }
    
    loadClusterType(connectionType) {
        return require("./clusters/armkubernetescluster");
    }
    
    // get kubeconfig file path
    getKubeConfig(connectionType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.loadClusterType(connectionType).getKubeConfig().then((config) => {
                return config;
            });
        });
    }
    
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getKubectl().then((kubectlpath) => {
                this.kubectlPath = kubectlpath;
                // prepend the tools path. instructs the agent to prepend for future tasks
                if (!process.env['PATH'].toLowerCase().startsWith(path.dirname(this.kubectlPath.toLowerCase()))) {
                    toolLib.prependPath(path.dirname(this.kubectlPath));
                }
            });
        });
    }
    
    createCommand() {
        var command = tl.tool(this.kubectlPath);
        return command;
    }
    
    // open kubernetes connection
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            //var connectionType = tl.getInput("connectionType", true);
            var connectionType = "Azure Resource Manager";
            if (connectionType === "None") {
                return;
            }
            var kubeconfig;
            if (!this.kubeconfigFile) {
                kubeconfig = yield this.getKubeConfig(connectionType);
            }
            return this.initialize().then(() => {
                if (kubeconfig) {
                    this.kubeconfigFile = path.join(this.userDir, "config");
                    fs.writeFileSync(this.kubeconfigFile, kubeconfig);
                }
                process.env["KUBECONFIG"] = this.kubeconfigFile;
            });
        });
    }
    
    // close kubernetes connection
    close() {
        //var connectionType = tl.getInput("connectionType", true);
        var connectionType = "Azure Resource Manager";
        if (connectionType === "None") {
            return;
        }
        if (this.kubeconfigFile != null && fs.existsSync(this.kubeconfigFile)) {
            delete process.env["KUBECONFIG"];
            fs.unlinkSync(this.kubeconfigFile);
        }
    }
    
    setKubeConfigEnvVariable() {
        if (this.kubeconfigFile && fs.existsSync(this.kubeconfigFile)) {
            tl.setVariable("KUBECONFIG", this.kubeconfigFile);
        }
        else {
            tl.error(tl.loc('KubernetesServiceConnectionNotFound'));
            throw new Error(tl.loc('KubernetesServiceConnectionNotFound'));
        }
    }
    
    unsetKubeConfigEnvVariable() {
        var kubeConfigPath = tl.getVariable("KUBECONFIG");
        if (kubeConfigPath) {
            tl.setVariable("KUBECONFIG", "");
        }
    }
    
    //excute kubernetes command
    execCommand(command, options) {
        var errlines = [];
        command.on("errline", line => {
            errlines.push(line);
        });
        return command.exec(options).fail(error => {
            errlines.forEach(line => tl.error(line));
            throw error;
        });
    }
    
    getKubectl() {
        return __awaiter(this, void 0, void 0, function* () {
            let versionOrLocation = "version";
            if (versionOrLocation === "location") {
                let pathToKubectl = tl.getPathInput("specifyLocation", true, true);
                fs.chmodSync(pathToKubectl, "777");
                return pathToKubectl;
            }
            else if (versionOrLocation === "version") {
                var defaultVersionSpec = "1.7.0";
                let versionSpec = tl.getInput("versionSpec");
                let checkLatest = tl.getBoolInput('checkLatest', false);
                var version = yield utils.getKubectlVersion(versionSpec, checkLatest);
                if (versionSpec != defaultVersionSpec || checkLatest) {
                    tl.debug(tl.loc("DownloadingClient"));
                    var version = yield utils.getKubectlVersion(versionSpec, checkLatest);
                    return yield utils.downloadKubectl(version);
                }
                // Reached here => default version
                // Now to handle back-compat, return the version installed on the machine
                if (this.kubectlPath && fs.existsSync(this.kubectlPath)) {
                    return this.kubectlPath;
                }
                // Download the default version
                tl.debug(tl.loc("DownloadingClient"));
                var version = yield utils.getKubectlVersion(versionSpec, checkLatest);
                return yield utils.downloadKubectl(version);
            }
        });
    }
}
exports.default = ClusterConnection;