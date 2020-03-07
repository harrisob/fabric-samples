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
const fabric_common_1 = require("fabric-common");
const { format } = require('util');
const Long = require('long');
const Packager = require('./Packager.js');
const Policy = require('./Policy.js');
const CollectionConfig = require('./CollectionConfig.js');
const fabricProtos = require('fabric-protos').protos;
const fabricCommonProtos = require('fabric-protos').common;
const lifecycleProtos = require('fabric-protos').lifecycle;
const logger = fabric_common_1.Utils.getLogger('Chaincode.js');
const types = new Map();
types.set('golang', fabricProtos.ChaincodeSpec.Type.GOLANG);
types.set('java', fabricProtos.ChaincodeSpec.Type.JAVA);
types.set('node', fabricProtos.ChaincodeSpec.Type.NODE);
function checkType(type) {
    const chaincodeType = type.toLowerCase();
    const value = types.get(chaincodeType);
    if (value) {
        return chaincodeType;
    }
    else {
        throw new Error(format('Chaincode type is not a known type %s', type));
    }
}
function getEndorsers(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const method = 'getEndorsers';
        logger.debug('%s - start', method);
        const endorsers = [];
        for (const peerName of options.peerNames) {
            const endorser = yield getEndorser(peerName, options.network);
            logger.debug('%s - adding %s to list of endorsers', method, peerName);
            endorsers.push(endorser);
        }
        return endorsers;
    });
}
function getEndorser(peerName, network) {
    return __awaiter(this, void 0, void 0, function* () {
        const endorser = network.getChannel().getEndorser(peerName);
        if (!endorser) {
            throw new Error(`Peer named ${peerName} not found`);
        }
        // make sure the peer is connected, should be connected
        // when it is created by the network config (ccp) parser
        const check = yield endorser.checkConnection();
        if (!check) {
            throw Error(`Peer ${peerName} is not connected`);
        }
        return endorser;
    });
}
/**
 * Provide the endorsement policy definition for this chaincode. The input is a JSON object.
 *
 * @example <caption>Object Endorsement policy: "Signed by any member from one of the organizations"</caption>
 * {
 *   identities: [
 *     { role: {name: "member", mspId: "org1"}},
 *     { role: {name: "member", mspId: "org2"}}
 *   ],
 *   policy: {
 *     "1-of": [{"signed-by": 0}, {"signed-by": 1}]
 *   }
 * }
 * @example <caption>Object Endorsement policy: "Signed by admin of the ordererOrg and any member from one of the peer organizations"</caption>
 * {
 *   identities: [
 *     {role: {name: "member", mspId: "peerOrg1"}},
 *     {role: {name: "member", mspId: "peerOrg2"}},
 *     {role: {name: "admin", mspId: "ordererOrg"}}
 *   ],
 *   policy: {
 *     "2-of": [
 *       {"signed-by": 2},
 *       {"1-of": [{"signed-by": 0}, {"signed-by": 1}]}
 *     ]
 *   }
 * }
 * @example <caption>String Endorsement policy: "Policy reference of an existing policy in your channel configuration"</caption>
 *    /Channel/Application/Endorsement
 * @param {string | Buffer | object} policy - When the policy is a string it will be
 * the canonical path to a policy in the Channel configuration.
 * When an object, it will be the fabric-client's JSON representation
 * of an fabric endorsement policy.
 * When the policy is a Buffer it will the bytes of the 'ApplicationPolicy'
 * gRPC protobuf object, which may have been read from a approved chaincode
 * definition on a peer.
 */
function getEndorsementPolicyBytes(policy) {
    const method = 'getEndorsementPolicyBytes';
    logger.debug('%s - start', method);
    const application_policy = new fabricCommonProtos.ApplicationPolicy();
    if (typeof policy === 'string') {
        logger.debug('%s - have a policy reference :: %s', method, policy);
        application_policy.setChannelConfigPolicyReference(policy);
    }
    else if (policy instanceof Buffer) {
        return policy;
    }
    else { // must be a JSON object
        logger.debug('%s - have a policy object %j', method, policy);
        const signaturePolicy = Policy.buildPolicy(null, policy, true);
        application_policy.setSignaturePolicy(signaturePolicy);
    }
    return application_policy.toBuffer();
}
/**
 * Set a collection package for this chaincode. The input is a JSON object.
 *
 * @example <caption>Collection package</caption> An array of collection
 * configurations.
 * [{
 *     name: "detailCol",
 *     policy: {
 *        identities: [
 *           {role: {name: "member", mspId: "Org1MSP"}},
 *           {role: {name: "member", mspId: "Org2MSP"}}
 *         ],
 *         policy: {
 *            1-of: [
 *               {signed-by: 0},
 *               {signed-by: 1}
 *             ]
 *          }
 *     },
 *     requiredPeerCount: 1,
 *     maxPeerCount: 1,
 *     blockToLive: 100
 *   }]
 * @param {Object} configPackage - The JSON representation of a fabric collection package definition.
 */
function getCollectionConfig(configPackage) {
    const method = 'getCollectionConfig';
    logger.debug('%s - start', method);
    const config = CollectionConfig.buildCollectionConfigPackage(configPackage);
    logger.debug('%s - end', method);
    return config;
}
var ChaincodeUtils;
(function (ChaincodeUtils) {
    // // --------- query a peer for approved chaincodes
    // export async function queryApprovedChaincodes(options: Lifecycle.QueryApprovedChaincodesOptions): Promise<Lifecycle.ApprovedChaincode[]> {
    // }
    // --------- package the chaincode and return the bytes of the "tar" file
    function packageChaincode(attributes, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'packageChaincode';
            logger.debug('%s - start', method);
            logger.debug('%s - packaging chaincode %s %s', method, attributes.chaincodeName, attributes.chaincodeVersion);
            const chaincodeType = checkType(options.chaincodeType);
            let golangPath = options.golangPath;
            // only need a goPath when chaincode type is golang
            if (chaincodeType === 'golang') {
                if (!golangPath) {
                    golangPath = process.env.GOPATH;
                }
                if (!golangPath) {
                    throw new Error('Missing the GOPATH environment setting and the "golangPath" parameter.');
                }
            }
            const innerTarball = yield Packager.package(options.chaincodePath, chaincodeType, false, options.metadataPath, golangPath);
            const packageFile = yield Packager.finalPackage(options.label, chaincodeType, innerTarball, options.chaincodePath);
            return packageFile;
        });
    }
    ChaincodeUtils.packageChaincode = packageChaincode;
    // --------- install a package to peers
    function installPackage(attributes, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'installPackage';
            logger.debug('%s - start', method);
            const endorsers = yield getEndorsers(options);
            if (endorsers.length === 0) {
                throw Error('Peers not found');
            }
            let packageId;
            try {
                const client = yield options.network.getGateway().client;
                const channel = client.newChannel('noname');
                // this will tell the peer it is a system wide request
                // not for a specific channel
                channel.name = '';
                logger.debug('%s - build the install chaincode request', method);
                const arg = new lifecycleProtos.InstallChaincodeArgs();
                arg.setChaincodeInstallPackage(attributes.packageFile);
                const buildRequest = {
                    fcn: 'InstallChaincode',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = channel.newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the install chaincode request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: endorsers
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the install chaincode request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode install ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - check the install chaincode response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const installChaincodeResult = lifecycleProtos.InstallChaincodeResult.decode(response.response.payload);
                                const peerLabel = installChaincodeResult.getLabel();
                                if (peerLabel !== attributes.label) {
                                    throw Error(`Install returned a different laberl - ${attributes.label} :: ${peerLabel}`);
                                }
                                const peerPackageId = installChaincodeResult.getPackageId();
                                if (packageId && packageId !== peerPackageId) {
                                    throw Error(`Install returned a different package ID - ${packageId} :: ${peerPackageId}`);
                                }
                                packageId = peerPackageId;
                            }
                            else {
                                throw new Error(format('Chaincode install failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Chaincode install has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for install of chaincode');
                }
            }
            catch (error) {
                logger.error('Problem building the lifecycle install request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            if (!packageId) {
                throw Error('Package was not installed');
            }
            logger.debug('%s - return %s', method, packageId);
            return packageId;
        });
    }
    ChaincodeUtils.installPackage = installPackage;
    // --------- approve an installed package for one organization
    function approvePackage(attributes, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'approvePackage';
            logger.debug('%s - start', method);
            const endorsers = yield getEndorsers(options);
            try {
                logger.debug('%s - build the approve chaincode argument', method);
                const arg = new lifecycleProtos.ApproveChaincodeDefinitionForMyOrgArgs();
                arg.setName(attributes.chaincodeName);
                arg.setVersion(attributes.chaincodeVersion);
                arg.setSequence(Long.fromValue(options.sequence));
                if (typeof options.initRequired === 'boolean') {
                    arg.setInitRequired(options.initRequired);
                }
                if (options.endorsementPlugin) {
                    arg.setEndorsementPlugin(options.endorsementPlugin);
                }
                if (options.validationPlugin) {
                    arg.setValidationPlugin(options.validationPlugin);
                }
                if (options.endorsementPolicy) {
                    arg.setValidationParameter(getEndorsementPolicyBytes(options.endorsementPolicy));
                }
                if (options.collectionConfig) {
                    arg.setCollections(getCollectionConfig(options.collectionConfig));
                }
                const source = new lifecycleProtos.ChaincodeSource();
                if (attributes.packageId) {
                    const local = new lifecycleProtos.ChaincodeSource.Local();
                    local.setPackageId(attributes.packageId);
                    source.setLocalPackage(local);
                }
                else {
                    const unavailable = new lifecycleProtos.ChaincodeSource.Unavailable();
                    source.setUnavailable(unavailable);
                }
                arg.setSource(source);
                const contract = options.network.getContract('_lifecycle');
                const transaction = contract.createTransaction('ApproveChaincodeDefinitionForMyOrg');
                if (endorsers.length > 0) {
                    transaction.setEndorsingPeers(endorsers);
                }
                yield transaction.submit(arg.toBuffer());
                logger.debug('%s - submitted successfully', method);
            }
            catch (error) {
                logger.error('Problem with the lifecycle approval :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
        });
    }
    ChaincodeUtils.approvePackage = approvePackage;
    // --------- commit an approved package to a channel for chaincode use
    function commitPackage(attributes, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'commitPackage';
            logger.debug('%s - start', method);
            const endorsers = yield getEndorsers(options);
            try {
                logger.debug('%s - build the commit chaincode argument', method);
                const arg = new lifecycleProtos.CommitChaincodeDefinitionArgs();
                arg.setName(attributes.chaincodeName);
                arg.setVersion(attributes.chaincodeVersion);
                arg.setSequence(Long.fromValue(attributes.sequence));
                if (typeof attributes.initRequired === 'boolean') {
                    arg.setInitRequired(attributes.initRequired);
                }
                if (attributes.endorsementPlugin) {
                    arg.setEndorsementPlugin(attributes.endorsementPlugin);
                }
                if (attributes.validationPlugin) {
                    arg.setValidationPlugin(attributes.validationPlugin);
                }
                if (attributes.endorsementPolicy) {
                    arg.setValidationParameter(getEndorsementPolicyBytes(attributes.endorsementPolicy));
                }
                if (attributes.collectionConfig) {
                    arg.setCollections(getCollectionConfig(attributes.collectionConfig));
                }
                const contract = options.network.getContract('_lifecycle');
                const transaction = contract.createTransaction('CommitChaincodeDefinition');
                if (endorsers.length > 0) {
                    transaction.setEndorsingPeers(endorsers);
                }
                yield transaction.submit(arg.toBuffer());
                logger.debug('%s - submitted successfully', method);
            }
            catch (error) {
                logger.error('Problem with the lifecycle approval :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
        });
    }
    ChaincodeUtils.commitPackage = commitPackage;
    // --------- query installed chaincode
    function queryInstalledChaincode(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'queryInstalledChaincode';
            logger.debug('%s - start', method);
            const results = [];
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                const client = yield options.network.getGateway().client;
                const channel = client.newChannel('noname');
                // this will tell the peer it is a system wide request
                // not for a specific channel
                channel.name = '';
                logger.debug('%s - build the install chaincode request', method);
                const arg = new lifecycleProtos.QueryInstalledChaincodeArgs();
                arg.setPackageId(options.packageId);
                const buildRequest = {
                    fcn: 'QueryInstalledChaincode',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = channel.newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const queryResults = lifecycleProtos.QueryInstalledChaincodeResult.decode(response.response.payload);
                                const packageId = queryResults.getPackageId();
                                const label = queryResults.getLabel();
                                const channelMap = queryResults.getReferences();
                                const keys = channelMap.keys();
                                let key;
                                while ((key = keys.next()).done != true) {
                                    const item = channelMap.get(key.value);
                                    for (const index in item.chaincodes) {
                                        const chaincode = item.chaincodes[index];
                                        const found = {
                                            channelName: key.value,
                                            chaincodeName: chaincode.getName(),
                                            chaincodeVersion: chaincode.getVersion(),
                                            packageId: packageId,
                                            label: label
                                        };
                                        results.push(found);
                                    }
                                }
                                if (results.length === 0) {
                                    const empty = {
                                        channelName: '',
                                        chaincodeName: '',
                                        chaincodeVersion: '',
                                        packageId: packageId,
                                        label: label
                                    };
                                    results.push(empty);
                                }
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return results;
        });
    }
    ChaincodeUtils.queryInstalledChaincode = queryInstalledChaincode;
    // --------- query all installed chaincodes
    function queryAllInstalledChaincodes(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'queryInstalledChaincode';
            logger.debug('%s - start', method);
            const results = [];
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                const client = yield options.network.getGateway().client;
                const channel = client.newChannel('noname');
                // this will tell the peer it is a system wide request
                // not for a specific channel
                channel.name = '';
                logger.debug('%s - build the install chaincode request', method);
                const arg = new lifecycleProtos.QueryInstalledChaincodesArgs();
                const buildRequest = {
                    fcn: 'QueryInstalledChaincodes',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = channel.newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const queryAllResults = lifecycleProtos.QueryInstalledChaincodesResult.decode(response.response.payload);
                                for (const queryResults of queryAllResults.getInstalledChaincodes()) {
                                    const packageId = queryResults.getPackageId();
                                    const label = queryResults.getLabel();
                                    const channelMap = queryResults.getReferences();
                                    const keys = channelMap.keys();
                                    let key;
                                    while ((key = keys.next()).done != true) {
                                        const item = channelMap.get(key.value);
                                        for (const index in item.chaincodes) {
                                            const chaincode = item.chaincodes[index];
                                            const found = {
                                                channelName: key.value,
                                                chaincodeName: chaincode.getName(),
                                                chaincodeVersion: chaincode.getVersion(),
                                                packageId: packageId,
                                                label: label
                                            };
                                            results.push(found);
                                        }
                                    }
                                    if (results.length === 0) {
                                        const empty = {
                                            channelName: '',
                                            chaincodeName: '',
                                            chaincodeVersion: '',
                                            packageId: packageId,
                                            label: label
                                        };
                                        results.push(empty);
                                    }
                                }
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return results;
        });
    }
    ChaincodeUtils.queryAllInstalledChaincodes = queryAllInstalledChaincodes;
    // --------- query installed chaincode package file
    function queryInstalledChaincodePackageFile(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'queryInstalledChaincodePackageFile';
            logger.debug('%s - start', method);
            let packageFile = Buffer.from('');
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                const client = yield options.network.getGateway().client;
                const channel = client.newChannel('noname');
                // this will tell the peer it is a system wide request
                // not for a specific channel
                channel.name = '';
                logger.debug('%s - build the get package chaincode request', method);
                const arg = new lifecycleProtos.GetInstalledChaincodePackageArgs();
                arg.setPackageId(options.packageId);
                const buildRequest = {
                    fcn: 'GetInstalledChaincodePackage',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = channel.newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const results = lifecycleProtos.GetInstalledChaincodePackageResult.decode(response.response.payload);
                                packageFile = results.getChaincodeInstallPackage(); // the package bytes
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return packageFile;
        });
    }
    ChaincodeUtils.queryInstalledChaincodePackageFile = queryInstalledChaincodePackageFile;
    // --------- query defined chaincode package
    function queryDefinedChaincode(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'queryDefinedChaincode';
            logger.debug('%s - start', method);
            let defined = {
                chaincodeName: options.chaincodeName,
                sequence: 0,
                chaincodeVersion: '',
                endorsementPlugin: '',
                validationPlugin: '',
                endorsementPolicy: '',
                collectionConfig: {},
                approvals: new Map()
            };
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                logger.debug('%s - build the get defined chaincode request', method);
                const arg = new lifecycleProtos.QueryChaincodeDefinitionArgs();
                arg.setName(options.chaincodeName);
                const buildRequest = {
                    fcn: 'QueryChaincodeDefinition',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = options.network.getChannel().newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const results = lifecycleProtos.QueryChaincodeDefinitionResult.decode(response.response.payload);
                                defined.sequence = results.getSequence().toNumber();
                                defined.chaincodeVersion = results.getVersion();
                                defined.initRequired = results.getInitRequired();
                                defined.endorsementPlugin = results.getEndorsementPlugin();
                                defined.validationPlugin = results.getValidationPlugin();
                                defined.endorsementPolicy = results.getValidationParameter();
                                defined.collectionConfig = results.getCollections().toBuffer();
                                const approvalMap = results.getApprovals();
                                const keys = approvalMap.keys();
                                let key;
                                while ((key = keys.next()).done != true) {
                                    const isApproved = approvalMap.get(key.value);
                                    defined.approvals.set(key.value, isApproved);
                                }
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return defined;
        });
    }
    ChaincodeUtils.queryDefinedChaincode = queryDefinedChaincode;
    // --------- query defined chaincodes package
    function queryDefinedChaincodes(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'queryDefinedChaincodes';
            logger.debug('%s - start', method);
            let definitions = [];
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                logger.debug('%s - build the get defined chaincodes request', method);
                const arg = new lifecycleProtos.QueryChaincodeDefinitionsArgs();
                const buildRequest = {
                    fcn: 'QueryChaincodeDefinitions',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = options.network.getChannel().newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const results = lifecycleProtos.QueryChaincodeDefinitionsResult.decode(response.response.payload);
                                const chaincodeDefinitions = results.getChaincodeDefinitions();
                                for (const chaincodeDefinition of chaincodeDefinitions) {
                                    const defined = {
                                        chaincodeName: chaincodeDefinition.getName(),
                                        sequence: chaincodeDefinition.getSequence().toNumber(),
                                        chaincodeVersion: chaincodeDefinition.getVersion(),
                                        initRequired: chaincodeDefinition.getInitRequired(),
                                        endorsementPlugin: chaincodeDefinition.getEndorsementPlugin(),
                                        validationPlugin: chaincodeDefinition.getValidationPlugin(),
                                        endorsementPolicy: chaincodeDefinition.getValidationParameter(),
                                        collectionConfig: chaincodeDefinition.getCollections().toBuffer(),
                                    };
                                    definitions.push(defined);
                                }
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return definitions;
        });
    }
    ChaincodeUtils.queryDefinedChaincodes = queryDefinedChaincodes;
    // --------- query commit readiness
    function queryCommitReadiness(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const method = 'CheckCommitReadinessResult';
            logger.debug('%s - start', method);
            let commitReadiness = new Map();
            const endorser = yield getEndorser(options.peerName, options.network);
            try {
                logger.debug('%s - build the get defined chaincodes request', method);
                const arg = new lifecycleProtos.CheckCommitReadinessArgs();
                arg.setName(options.chaincodeName);
                arg.setVersion(options.chaincodeVersion);
                arg.setSequence(Long.fromValue(options.sequence));
                if (typeof options.initRequired === 'boolean') {
                    arg.setInitRequired(options.initRequired);
                }
                if (options.endorsementPlugin) {
                    arg.setEndorsementPlugin(options.endorsementPlugin);
                }
                else {
                    arg.setEndorsementPlugin('escc');
                }
                if (options.validationPlugin) {
                    arg.setValidationPlugin(options.validationPlugin);
                }
                else {
                    arg.setValidationPlugin('vscc');
                }
                if (options.endorsementPolicy) {
                    arg.setValidationParameter(getEndorsementPolicyBytes(options.endorsementPolicy));
                }
                if (options.collectionConfig) {
                    arg.setCollections(getCollectionConfig(options.collectionConfig));
                }
                const buildRequest = {
                    fcn: 'CheckCommitReadiness',
                    args: [arg.toBuffer()]
                };
                //  we are going to talk to lifecycle which is really just a chaincode
                const endorsement = options.network.getChannel().newEndorsement('_lifecycle');
                endorsement.build(options.network.getGateway().identityContext, buildRequest);
                logger.debug('%s - sign the request', method);
                endorsement.sign(options.network.getGateway().identityContext);
                const endorseRequest = {
                    targets: [endorser]
                };
                if (options.timeout) {
                    endorseRequest.requestTimeout = options.timeout;
                }
                logger.debug('%s - send the query request', method);
                const responses = yield endorsement.send(endorseRequest);
                if (responses.errors && responses.errors.length > 0) {
                    for (const error of responses.errors) {
                        logger.error('Problem with the chaincode query ::' + error);
                        throw error;
                    }
                }
                else if (responses.responses && responses.responses.length > 0) {
                    logger.debug('%s - checking the query response', method);
                    for (const response of responses.responses) {
                        if (response.response && response.response.status) {
                            if (response.response.status === 200) {
                                logger.debug('%s - peer response %j', method, response);
                                const results = lifecycleProtos.CheckCommitReadinessResult.decode(response.response.payload);
                                const approvalMap = results.getApprovals();
                                const keys = approvalMap.keys();
                                let key;
                                while ((key = keys.next()).done != true) {
                                    const isApproved = approvalMap.get(key.value);
                                    commitReadiness.set(key.value, isApproved);
                                }
                            }
                            else {
                                throw new Error(format('Chaincode query failed with status:%s ::%s', response.response.status, response.response.message));
                            }
                        }
                        else {
                            throw new Error('Query has failed');
                        }
                    }
                }
                else {
                    throw new Error('No response returned for query');
                }
            }
            catch (error) {
                logger.error('Problem building the query request :: %s', error);
                logger.error(' problem at ::' + error.stack);
                throw error;
            }
            logger.debug('%s - end', method);
            return commitReadiness;
        });
    }
    ChaincodeUtils.queryCommitReadiness = queryCommitReadiness;
})(ChaincodeUtils = exports.ChaincodeUtils || (exports.ChaincodeUtils = {}));
//# sourceMappingURL=chaincodeutils.js.map