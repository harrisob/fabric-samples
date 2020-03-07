"use strict";
/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chaincodesource_1 = require("./chaincodesource");
const chaincodepackage_1 = require("./chaincodepackage");
const installedchaincode_1 = require("./installedchaincode");
const approvedchaincode_1 = require("./approvedchaincode");
const chaincodeutils_1 = require("./chaincodeutils");
var Lifecycle;
(function (Lifecycle) {
    // --------- query a peer for an installed chaincode
    function queryInstalledChaincode(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chaincodeutils_1.ChaincodeUtils.queryInstalledChaincode(options);
        });
    }
    Lifecycle.queryInstalledChaincode = queryInstalledChaincode;
    // --------- query a peer for ALL installed chaincodes
    function queryAllInstalledChaincodes(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chaincodeutils_1.ChaincodeUtils.queryAllInstalledChaincodes(options);
        });
    }
    Lifecycle.queryAllInstalledChaincodes = queryAllInstalledChaincodes;
    // --------- query for the installed package file
    function queryInstalledChaincodePackageFile(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chaincodeutils_1.ChaincodeUtils.queryInstalledChaincodePackageFile(options);
        });
    }
    Lifecycle.queryInstalledChaincodePackageFile = queryInstalledChaincodePackageFile;
    // --------- query a peer for a defined chaincode with it's approvals
    function queryDefinedChaincode(options) {
        return chaincodeutils_1.ChaincodeUtils.queryDefinedChaincode(options);
    }
    Lifecycle.queryDefinedChaincode = queryDefinedChaincode;
    // --------- query a peer for all defined chaincodes
    function queryDefinedChaincodes(options) {
        return chaincodeutils_1.ChaincodeUtils.queryDefinedChaincodes(options);
    }
    Lifecycle.queryDefinedChaincodes = queryDefinedChaincodes;
    // --------- query a peer for a definition's commit readiness
    function queryCommitReadiness(options) {
        return chaincodeutils_1.ChaincodeUtils.queryCommitReadiness(options);
    }
    Lifecycle.queryCommitReadiness = queryCommitReadiness;
    // --------- source
    function newChaincodeSource(options) {
        return new chaincodesource_1.ChaincodeSourceImpl(options);
    }
    Lifecycle.newChaincodeSource = newChaincodeSource;
    function newPackagedChaincode(options) {
        return new chaincodepackage_1.PackagedChaincodeImpl(options);
    }
    Lifecycle.newPackagedChaincode = newPackagedChaincode;
    function newInstalledChaincode(options) {
        return new installedchaincode_1.InstalledChaincodeImpl(options);
    }
    Lifecycle.newInstalledChaincode = newInstalledChaincode;
    function newApprovedChaincode(options) {
        return new approvedchaincode_1.ApprovedChaincodeImpl(options);
    }
    Lifecycle.newApprovedChaincode = newApprovedChaincode;
})(Lifecycle = exports.Lifecycle || (exports.Lifecycle = {}));
//# sourceMappingURL=lifecycle.js.map