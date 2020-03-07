"use strict";
/*
SPDX-License-Identifier: Apache-2.0
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs-extra");
var path = require("path");
//const yaml = require('js-yaml');
var fabric_network_1 = require("fabric-network");
var lifecycle_1 = require("../lib/lifecycle");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var walletPath, wallet, gateway, userName, chaincodeName, chaincodeVersion, sequence, chaincodeType, init_required, endorsement_policy, channelName, peerName, goPath, chaincodePath, metadataPath, ccpPath, ccp, connectionOptions, network, sourceAttributes, chaincodeSource, packageOptions, chaincodePackaged, installingOptions, chaincodeInstalled, queryInstalled, installedChannelChaincode, queryAllInstalled, installedChannelChaincodes, getPackageFileRequest, packageBytes, approvingOptions, chaincodeApproved, queryDefinedChaincode, chaincodeDef, queryDefinedChaincodes, chaincodeDefs, queryCommitReadiness, readiness, committingOptions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    walletPath = path.join(process.cwd(), 'wallet');
                    return [4 /*yield*/, fabric_network_1.Wallets.newFileSystemWallet(walletPath)];
                case 1:
                    wallet = _a.sent();
                    gateway = new fabric_network_1.Gateway();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 15, 16, 17]);
                    userName = 'user3';
                    chaincodeName = 'fabcar';
                    chaincodeVersion = 'v15';
                    sequence = 6;
                    chaincodeType = 'node';
                    init_required = true;
                    endorsement_policy = { "identities": [
                            { "role": { "name": "member", "mspId": "Org1MSP" } },
                            { "role": { "name": "admin", "mspId": "Org1MSP" } }
                        ],
                        "policy": {
                            "1-of": [{ "signed-by": 0 }, { "signed-by": 1 }]
                        }
                    };
                    channelName = 'mychannel';
                    peerName = 'peer0.org1.example.com';
                    goPath = null;
                    chaincodePath = '../../chaincode/fabcar/javascript/lib';
                    metadataPath = null;
                    ccpPath = path.resolve(__dirname, '../..', 'basic-network', 'connection.json');
                    ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
                    connectionOptions = {
                        identity: userName,
                        wallet: wallet,
                        discovery: { enabled: false }
                    };
                    console.log('Connect to gateway.');
                    return [4 /*yield*/, gateway.connect(ccp, connectionOptions)];
                case 3:
                    _a.sent();
                    console.log("Use network channel: " + channelName);
                    return [4 /*yield*/, gateway.getNetwork(channelName)];
                case 4:
                    network = _a.sent();
                    if (metadataPath) {
                        metadataPath = path.join(__dirname, metadataPath);
                    }
                    chaincodePath = path.join(__dirname, chaincodePath);
                    sourceAttributes = {
                        chaincodeName: chaincodeName,
                        chaincodeVersion: chaincodeVersion
                    };
                    chaincodeSource = lifecycle_1.Lifecycle.newChaincodeSource(sourceAttributes);
                    console.log(" -- sourced -  named:" + chaincodeSource.chaincodeName + " version:" + chaincodeSource.chaincodeVersion);
                    packageOptions = {
                        chaincodePath: chaincodePath,
                        //metadataPath: metadataPath,
                        chaincodeType: chaincodeType,
                        //golangPath: goPath,
                        label: chaincodeName + '_' + chaincodeVersion
                    };
                    return [4 /*yield*/, chaincodeSource.package(packageOptions)];
                case 5:
                    chaincodePackaged = _a.sent();
                    console.log('Packaging complete. ==>' + chaincodePackaged.packageFile.toString());
                    installingOptions = {
                        network: network,
                        peerNames: [peerName],
                        timeout: 20000
                    };
                    console.log(" -- installing -  peer:" + peerName);
                    return [4 /*yield*/, chaincodePackaged.install(installingOptions)];
                case 6:
                    chaincodeInstalled = _a.sent();
                    console.log('Install complete.  packageId:' + chaincodeInstalled.packageId);
                    queryInstalled = {
                        peerName: peerName,
                        network: network,
                        packageId: chaincodeInstalled.packageId
                    };
                    console.log(" -- query installed -  peer " + peerName);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryInstalledChaincode(queryInstalled)];
                case 7:
                    installedChannelChaincode = _a.sent();
                    console.log('Query Installed complete.   ==>' + JSON.stringify(installedChannelChaincode));
                    queryAllInstalled = {
                        peerName: peerName,
                        network: network
                    };
                    console.log(" -- query all installed -  peer " + peerName);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryAllInstalledChaincodes(queryAllInstalled)];
                case 8:
                    installedChannelChaincodes = _a.sent();
                    console.log('Query ALL Installed complete.   ==>' + JSON.stringify(installedChannelChaincodes));
                    getPackageFileRequest = {
                        peerName: peerName,
                        network: network,
                        packageId: chaincodeInstalled.packageId
                    };
                    console.log(" -- get installed package-  package_id: " + chaincodeInstalled.packageId);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryInstalledChaincodePackageFile(getPackageFileRequest)];
                case 9:
                    packageBytes = _a.sent();
                    console.log('Get Installed Package complete.   ==>' + packageBytes);
                    approvingOptions = {
                        sequence: sequence,
                        network: network,
                        peerNames: [peerName],
                        timeout: 3000
                    };
                    console.log(" -- approving -  peer " + peerName);
                    console.log(" -- approving -  package_id " + chaincodeInstalled.packageId);
                    return [4 /*yield*/, chaincodeInstalled.approve(approvingOptions)];
                case 10:
                    chaincodeApproved = _a.sent();
                    console.log("Approve complete.   package_id: " + chaincodeApproved.packageId);
                    queryDefinedChaincode = {
                        chaincodeName: chaincodeApproved.chaincodeName,
                        network: network,
                        peerName: peerName,
                        timeout: 3000
                    };
                    console.log(" -- query definition -  peer " + peerName);
                    console.log(" -- query definition -  chaincode " + chaincodeApproved.chaincodeName);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryDefinedChaincode(queryDefinedChaincode)];
                case 11:
                    chaincodeDef = _a.sent();
                    console.log('Query Definition complete.   ::' + JSON.stringify(chaincodeDef));
                    queryDefinedChaincodes = {
                        network: network,
                        peerName: peerName,
                        timeout: 3000
                    };
                    console.log(" -- query definitions -  peer " + peerName);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryDefinedChaincodes(queryDefinedChaincodes)];
                case 12:
                    chaincodeDefs = _a.sent();
                    console.log('Query Definitions complete.   ::' + JSON.stringify(chaincodeDefs));
                    queryCommitReadiness = {
                        chaincodeName: chaincodeApproved.chaincodeName,
                        sequence: chaincodeApproved.sequence,
                        chaincodeVersion: chaincodeApproved.chaincodeVersion,
                        initRequired: chaincodeApproved.initRequired,
                        endorsementPlugin: chaincodeApproved.endorsementPlugin,
                        validationPlugin: chaincodeApproved.validationPlugin,
                        endorsementPolicy: chaincodeApproved.endorsementPolicy,
                        collectionConfig: chaincodeApproved.collectionConfig,
                        network: network,
                        peerName: peerName,
                        timeout: 3000
                    };
                    console.log(" -- check commit readiness -  chaincodeName " + chaincodeApproved.chaincodeName);
                    return [4 /*yield*/, lifecycle_1.Lifecycle.queryCommitReadiness(queryCommitReadiness)];
                case 13:
                    readiness = _a.sent();
                    console.log('Readiness complete.   readiness:' + JSON.stringify(readiness));
                    committingOptions = {
                        network: network,
                        peerNames: [peerName]
                    };
                    console.log(" -- commit -  peer " + peerName);
                    return [4 /*yield*/, chaincodeApproved.commit(committingOptions)];
                case 14:
                    _a.sent();
                    console.log('Commit complete.   isCommitted:' + chaincodeApproved.isCommitted());
                    // --------------------------- done
                    console.log(' -- lifecycle actions complete');
                    return [3 /*break*/, 17];
                case 15:
                    error_1 = _a.sent();
                    console.log("Error processing transaction. " + error_1);
                    console.log(error_1.stack);
                    return [3 /*break*/, 17];
                case 16:
                    console.log('Disconnect from Fabric gateway.');
                    gateway.disconnect();
                    return [7 /*endfinally*/];
                case 17: return [2 /*return*/];
            }
        });
    });
} // endof main()
console.log('***** start *****');
main().then(function () {
    console.log('***** end *****');
})["catch"](function (e) {
    console.log('------>>>> exception');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});
