"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");

function run(connection, kubecommand, outputUpdate) {
    var defer = Q.defer();
    connection.unsetKubeConfigEnvVariable();
    defer.resolve(undefined);
    return defer.promise;
}

exports.run = run;