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
var https = require('https');
var fs = require('fs');
const path = require("path");
const tl = require("vsts-task-lib/task");
const os = require("os");
const toolLib = require("vsts-task-tool-lib/tool");
const kubectlutility = require("utility-common/kubectlutility");

function getTempDirectory() {
    return tl.getVariable('agent.tempDirectory') || os.tmpdir();
}

exports.getTempDirectory = getTempDirectory;

function getCurrentTime() {
    return new Date().getTime();
}

exports.getCurrentTime = getCurrentTime;

function getNewUserDirPath() {
    var userDir = path.join(getTempDirectory(), "kubectlTask");
    ensureDirExists(userDir);
    userDir = path.join(userDir, getCurrentTime().toString());
    ensureDirExists(userDir);
    return userDir;
}

exports.getNewUserDirPath = getNewUserDirPath;

function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
}

function getKubectlVersion(versionSpec, checkLatest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (checkLatest) {
            return yield kubectlutility.getStableKubectlVersion();
        }
        else if (versionSpec) {
            if (versionSpec === "1.7") {
                // Backward compat handle
                tl.warning(tl.loc("UsingLatestStableVersion"));
                return kubectlutility.getStableKubectlVersion();
            }
            else {
                return sanitizeVersionString(versionSpec);
            }
        }
        return kubectlutility.stableKubectlVersion;
    });
}

exports.getKubectlVersion = getKubectlVersion;

function downloadKubectl(version) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield kubectlutility.downloadKubectl(version);
    });
}

exports.downloadKubectl = downloadKubectl;

function sanitizeVersionString(inputVersion) {
    var version = toolLib.cleanVersion(inputVersion);
    if (!version) {
        throw new Error(tl.loc("NotAValidSemverVersion"));
    }
    return "v" + version;
}

exports.sanitizeVersionString = sanitizeVersionString;

function assertFileExists(path) {
    if (!fs.existsSync(path)) {
        tl.error(tl.loc('FileNotFoundException', path));
        throw new Error(tl.loc('FileNotFoundException', path));
    }
}

exports.assertFileExists = assertFileExists;
