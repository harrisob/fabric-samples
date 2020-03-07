/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const {format} = require('util');
const Long = require('long');

const {Utils: utils} = require('fabric-common');
const logger = utils.getLogger('Chaincode.js');
const Packager = require('./Packager.js');
const Policy = require('./Policy.js');
const CollectionConfig = require('./CollectionConfig.js');
const fabricProtos = require('fabric-protos').protos;
const fabricCommonProtos = require('fabric-protos').common;
const lifecycleProtos = require('fabric-protos').lifecycle;

/**
 * @classdesc
 * The Chaincode class represents an Chaincode definition.
 * <br><br>
 * see the tutorial {@tutorial chaincode-lifecycle}
 * <br><br>
 * This class allows an application to contain all chaincode attributes and
 * artifacts in one place during runtime. This will assist the administration
 * of the chaincode's lifecycle.
 *
 * From your {@link Client} instance use the {@link Client#newChaincode} method.
 * This will return a Chaincode object instance that has been associated with
 * that client. This will provide access to user credentials used for signing
 * requests, access to peer, orderer, and channel information.
 *
 * @class
 */
const Chaincode = class {

	/**
	 * Construct a Chaincode object.
	 *
	 * @param {string} name - The name of this chaincode
	 * @param {string} version - The version of this chaincode
	 * @param {Network} network - The Network instance, providing access to the
	 * Gateway and Channel.
	 * @returns {Chaincode} The Chaincode instance.
	 */
	constructor(name, version, network) {
		logger.debug('Chaincode.const');
		if (!name) {
			throw new Error('Missing name parameter');
		}
		if (!version) {
			throw new Error('Missing version parameter');
		}
		if (!network) {
			throw new Error('Missing network parameter');
		}
		this._network = network;
		this._gateway = network.gateway;
		this._channelName = null;
		this._name = name;
		this._version = version;

		// definition attributes with defaults
		this._endorsement_plugin = 'escc';
		this._validation_plugin = 'vscc';
		this._init_required = false;
		this._sequence = Long.fromValue(1); // starting value

		this._chaincode_path = null;
		this._metadata_path = null;
		this._golang_path = null;
		this._package = null;
		this._package_id = null;
		this._label = name + '_' + version;
		this._endorsement_policy = null;
		this._endorsement_policy_def = null;
		this._collection_package_proto = null;
		this._collection_package_json = null;
		this._type = null;
	}

	/**
	 * Populate this {@link Chaincode} instance from the QueryChaincodeDefinitionResult protobuf object
	 * that is the result of the "QueryChaincodeDefinition" request to the Chaincode Lifecycle.
	 * @param {*} result
	 *
	 * @return {Chaincode}
	 */
	fromQueryResult(result) {
		this.setSequence(result.getSequence());
		this._endorsement_plugin = result.getEndorsementPlugin();
		this._validation_plugin = result.getValidationPlugin();
		this.setEndorsementPolicy(result.getValidationParameter());
		this.setInitRequired(result.getInitRequired());
		//this.setCollectionConfigPackageDefinition(result.getCollections());
	}

	/**
	 * Get the name of this chaincode.
	 *
	 * @returns {string} The name of this chaincode
	 */
	getName() {
		return this._name;
	}

	/**
	 * Get the version of this chaincode.
	 *
	 * @returns {string} The version of this chaincode
	 */
	getVersion() {
		return this._version;
	}

	/**
	 * Set the version of this chaincode.
	 */
	setVersion(version) {
		this._version = version;

		return this;
	}

	/**
	 * Get the modification sequence of the chaincode definition.
	 *
	 * @returns {Long} The sequence of this chaincode
	 */
	getSequence() {
		return this._sequence;
	}

	/**
	 * Set the modification sequence of the chaincode definition.
	 * The sequence value gives a unique number to a set of attributes for the
	 * the chaincode. When a attribute changes for a chaincode, the sequence
	 * value must be incremented and all organizations must again run
	 * the defineChaincodeForOrg() method to agree to the new definition.
	 * The default is 1, new chaincode.
	 *
	 * @param {Long} sequence - sequence of this chaincode
	 */
	setSequence(sequence) {
		this._sequence = Long.fromValue(sequence);

		// if (!Number.isInteger(sequence) || sequence < 1) {
		// 	throw new Error('Sequence value must be an integer greater than zero');
		// }

		return this;
	}

	/**
	 * Get the source code package
	 *
	 * @returns {byte[]} The package of this chaincode
	 */
	getPackage() {

		return this._package;
	}

	/**
	 * Set the chaincode package
	 * It is recommended to set the package label associated with this package.
	 *
	 * @param {byte[]} package The source package
	 */
	setPackage(packaged_chaincode) {
		this._package = packaged_chaincode;

		return this;
	}

	/**
	 * Get the chaincode type
	 *
	 * @returns {string} The type of this chaincode
	 */
	getType() {

		return this._type;
	}

	/**
	 * Set the chaincode type
	 * @param {string} type The type of this chaincode. Must be "golang",
	 *        "node", "java" or "car".
	 */
	setType(type) {
		this._type = Chaincode.checkType(type);

		return this;
	}

	/**
	 * Set if the chaincode initialize is required
	 * @param {boolean} required Indicates if this chaincode must be initialized
	 */
	setInitRequired(required) {
		this._init_required = required;

		return this;
	}

	/**
	 * Get the initialize required setting
	 *
	 * @returns {boolean}
	 */
	getInitRequired() {

		return this._init_required;
	}

	/**
	 * Get the chaincode path
	 *
	 * @returns {string}
	 */
	getChaincodePath() {

		return this._chaincode_path;
	}

	/**
	 * Set the chaincode path
	 * @param {string} path The path of this chaincode.
	 */
	setChaincodePath(path) {
		this._chaincode_path = path;

		return this;
	}

	/**
	 * Get the chaincode path
	 *
	 * @returns {string}
	 */
	getMetadataPath() {

		return this._metadata_path;
	}

	/**
	 * Set the metadata path
	 * @param {string} path The path of this metadata.
	 */
	setMetadataPath(path) {
		this._metadata_path = path;

		return this;
	}

	/**
	 * Get the goLang path
	 *
	 * @returns {string}
	 */
	getGoLangPath() {

		return this._golang_path;
	}

	/**
	 * Set the goLang path
	 * @param {string} path The golang path.
	 */
	setGoLangPath(path) {
		this._golang_path = path;

		return this;
	}

	/**
	 * Get the chaincode package label
	 *
	 * @returns {string} The label value
	 */
	getLabel() {
		return this._label;
	}

	/**
	 * Set the label to be used for this packaged chaincode
	 * The default of name:version will be used if not set when
	 * the package() method is called.
	 *
	 * @param {string} The label value
	 */
	setLabel(label) {
		this._label = label;

		return this;
	}

	/**
	 * Get the package id value
	 *
	 * @returns {string} The package id value is generated by the peer when the
	 *  package is installed
	 */
	getPackageId() {
		return this._package_id;
	}

	/**
	 * Sets the chaincode package id
	 *
	 * @param {string} package_id The source package id value
	 */
	setPackageId(package_id) {
		this._package_id = package_id;

		return this;
	}

	/**
	 * Get the endorsement policy JSON definition.
	 *
	 * @returns {Object} The JSON endorsement policy
	 */
	getEndorsementPolicyDefinition() {
		return this._endorsement_policy_def;
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
	 * @param {string | object} policy - When the policy is a string it will be
	 * the canonical path to a policy in the Channel configuration.
	 * When an object, it will be the fabric-client's JSON representation
	 * of an fabric endorsement policy.
	 */
	setEndorsementPolicyDefinition(policy) {
		const method = 'setEndorsementPolicyDefinition';
		logger.debug('%s - start', method);

		const application_policy = new fabricCommonProtos.ApplicationPolicy();

		if (typeof policy === 'string') {
			logger.debug('%s - have a policy reference :: %s', method, policy);
			application_policy.setChannelConfigPolicyReference(policy);
		} else if (policy instanceof Object) {
			logger.debug('%s - have a policy object %j', method, policy);
			const signature_policy = Policy.buildPolicy(null, policy, true);
			application_policy.setSignaturePolicy(signature_policy);
		} else {
			throw new Error('The endorsement policy is not valid');
		}

		this._endorsement_policy_def = policy;
		this._endorsement_policy = application_policy.toBuffer();

		return this;
	}

	getEndorsementPolicyEncoded() {
		if (this._endorsement_policy) {
			const application_policy = fabricCommonProtos.ApplicationPolicy.decode(this._endorsement_policy);

			//return JSON.parse(application_policy.encodeJSON());
			return application_policy.encodeJSON();
		}

		return null;
	}

	/**
	 * Get the serialized endorsement policy generated by the endorsement
	 * policy definition or directly assigned to this chaincode instance.
	 * The serialized bytes will be generated when the endorsement policy
	 * definition is assigned with {@link Chaincode#setEndorsementPolicyDefinition setEndorsementPolicyDefinition()}.

	 */
	getEndorsementPolicy() {
		return this._endorsement_policy;
	}

	/**
	 * Set the serialized endorsement policy required for the chaincode approval.
	 * The serialized bytes may have been generated when the endorsement policy
	 * JSON definition was assigned to a {@link Chaincode}. see {@link Chaincode#setEndorsementPolicyDefinition setEndorsementPolicyDefinition()}.
	 *
	 * @param {byte[]} policy the serialized endorsement policy
	 */
	setEndorsementPolicy(policy) {
		const method = 'setEndorsementPolicy';
		logger.debug('%s - start', method);

		this._endorsement_policy = policy;

		return this;
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
	setCollectionConfigPackageDefinition(configPackage) {
		const method = 'setCollectionConfigPackageDefinition';
		logger.debug('%s - start', method);

		if (configPackage instanceof Object) {
			logger.debug('%s - have a collection config package object %j', method, configPackage);
			const config_proto = CollectionConfig.buildCollectionConfigPackage(configPackage);
			this._collection_package_proto = config_proto;
			this._collection_package_json = configPackage;
		} else {
			throw new Error('A JSON config package parameter is required');
		}

		logger.debug('%s - end', method);
		return this;
	}

	/**
	 * Get the collection config package. This is the
	 * protobuf object built by the CollectionConfig class using
	 * the collection package JSON input.
	 *
	 * @returns {CollectionConfigPackage}
	 */
	getCollectionConfigPackage() {
		return this._collection_package_proto;
	}

	/**
	 * Get the collection config package JSON. This is the
	 * input to the CollectionConfig class to build the protobuf
	 * object needed by the Approve Chaincode Fabric request
	 * see {@link Channel#approveChaincodeForOrg}.
	 *
	 * @returns {Object}
	 */
	getCollectionConfigPackageDefinition() {
		return this._collection_package_json;
	}

	/**
	 * Verify that this Chaincode instance has all the required attributes required for an
	 * approval or commit request.
	 */
	validate() {
		if (!this.getSequence()) {
			throw new Error('Chaincode definition must include the chaincode sequence setting');
		}
		if (!this.getName()) {
			throw new Error('Chaincode definition must include the chaincode name setting');
		}
		if (!this.getVersion()) {
			throw new Error('Chaincode definition must include the chaincode version setting');
		}
	}

	/**
	 * @typedef {Object} ChaincodePackageRequest
	 * @property {string} [label] - Optional. This string will identify this
	 *        package. This will be used to associate the package_id returned
	 *        by the Peer when this package is installed. The package_id will
	 *        uniquely identity the package on the Peer, however it may be
	 *        difficult to associate with this package. Since the label is
	 *        supplied by the user, the label will be easier to
	 *        association with the chaincode package. The name and version will
	 *        be combined with a colon (name:version) to be the label if not
	 *        supplied.
	 * @property {string} chaincodeType - Required. Type of chaincode. One of
	 *        'golang', 'car', 'node' or 'java'.
	 * @property {string} chaincodePath - Required. The path to the location of
	 *        the source code of the chaincode. If the chaincode type is golang,
	 *        then this path is the fully qualified package name, such as
	 *        'mycompany.com/myproject/mypackage/mychaincode'
	 * @property {string} metadataPath - Optional. The path to the top-level
	 *        directory containing metadata descriptors.
	 * @property {string} [goPath] - Optional. The path to be used with the golang
	 *        chaincode. Will default to the environment "GOPATH" value. Will be
	 *        used to locate the actual Chaincode 'goLang' files by building a
	 *        fully qualified path = < goPath > / 'src' / < chaincodePath >
	 */

	/**
	 * Package the files at the locations provided.
	 * This method will both return the package and set the package on this instance.
	 * This method will set the label, type, and paths (if provided in the request).
	 * The package_id will be set by the install method or manually by the application.
	 * The package_id must be set before using this object on the {@link Channel#approveChaincodeForOrg}.
	 *
	 * @async
	 * @param {ChaincodePackageRequest} request - Optional. The parameters to build the
	 *        chaincode package. Parameters will be required when the parameter has not
	 *        been set on this instance.
	 */


	async package(request) {
		const method = 'package';
		logger.debug('%s - start', method);

		// just in case reset
		this._package = null;

		if (request) {
			if (request.chaincodeType) {
				this._type = request.chaincodeType;
			}
			if (request.chaincodePath) {
				this._chaincode_path = request.chaincodePath;
			}
			if (request.metadataPath) {
				this._metadata_path = request.metadataPath;
			}
			if (request.goPath) {
				this._golang_path = request.goPath;
			}
			if (request.label) {
				this._label = request.label;
			}
		}

		if (!this._type) {
			throw new Error('Chaincode package "chaincodeType" parameter is required');
		}
		this._type = Chaincode.checkType(this._type);

		if (!this._chaincode_path) {
			throw new Error('Chaincode package "chaincodePath" parameter is required');
		}

		// need a goPath when chaincode is golang
		if (this._type === 'golang') {
			if (!this._golang_path) {
				this._golang_path = process.env.GOPATH;
			}
			if (!this._golang_path) {
				throw new Error('Missing the GOPATH environment setting and the "goPath" parameter.');
			}
			logger.debug('%s - have golang chaincode using goPath %s', method, this._golang_path);
		}

		const inner_tarball = await Packager.package(this._chaincode_path, this._type, false, this._metadata_path, this._golang_path);

		this._package = await Packager.finalPackage(this._label, this._type, inner_tarball, this._chaincode_path);

		return this._package;
	}

	/**
	 * @typedef {Object} ChaincodeInstallRequest
	 * @property {Peer} target - Required. The peer to use for this request
	 * @property {number} request_timeout - Optional. The amount of time for the
	 *  to respond. The default will be the system configuration
	 *  value of 'request-timeout'.
	 */

	/**
	 * Install the package on the specified peers.
	 * This method will send the package to the peers provided.
	 * Each peer will return a hash value of the installed
	 * package.
	 *
	 * @async
	 * @param {ChaincodeInstallRequest} request - The request object with the
	 *  install attributes and settings.
	 * @returns {string} The hash value as calculated by the target peer(s).
	 */
	async install(request) {
		const method = 'install';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Install operation requires a ChaincodeInstallRequest object parameter');
		}

		if (!request.target) {
			throw new Error('Chaincode install "target" parameter is required');
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}

		// check the internal settings that need to be set on this object before
		// it will be able to do an install
		if (!this._package) {
			throw new Error('Install operation requires a chaincode package be assigned to this chaincode');
		}

		try {
			// need to get a system channel
			const client = await this._gateway.client;
			const channel = client.newChannel('system');
			channel.name = ''; // system channel does not have a name

			// make sure the peer is connected, should be connected
			// when it is created by the network config parser
			const check = await peer.checkConnection();
			if (!check) {
				throw Error('Target peer is not connected');
			}

			logger.debug('%s - build the install chaincode request', method);
			const install_chaincode_arg = new lifecycleProtos.InstallChaincodeArgs();
			install_chaincode_arg.setChaincodeInstallPackage(this._package);

			const build_request = {
				fcn: 'InstallChaincode',
				args: [install_chaincode_arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode install ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const {package_id, label} = this._getInfoFromInstallResponse(response.response);
							this._package_id = package_id;
							if (label === this._label) {
								logger.debug('%s- label is the same %s', method, label);
							} else {
								throw new Error(format('Chaincode package label returned is not the same as this chaincode :: %s vs %s', this._label, label));
							}
						} else {
							throw new Error(format('Chaincode install failed with status:%s ::%s', response.status, response.message));
						}
					} else {
						throw new Error('Chaincode install has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer install of chaincode');
			}

			return this._package_id;
		} catch (error) {
			logger.error('Problem building the lifecycle install request :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	static checkType(type) {
		const chaincodeType = type.toLowerCase();

		const map = {
			golang: fabricProtos.ChaincodeSpec.Type.GOLANG,
			java: fabricProtos.ChaincodeSpec.Type.JAVA,
			node: fabricProtos.ChaincodeSpec.Type.NODE
		};
		const value = map[chaincodeType];
		if (value) {
			return chaincodeType;
		} else {
			throw new Error(format('Chaincode type is not a known type %s', type));
		}
	}

	/*
	 * Internal method to get the info returned by the install from the
	 * payload of the invoke response
	 */
	_getInfoFromInstallResponse(response) {
		const installChaincodeResult = lifecycleProtos.InstallChaincodeResult.decode(response.payload);
		const package_id = installChaincodeResult.getPackageId();
		const label = installChaincodeResult.getLabel();

		return {package_id, label};
	}

	/**
	 * @typedef {Object} ApproveRequest
	 *  This object contains the  properties needed when approving
	 *  a chaincode on the channel for an organization
	 * @property {Endorser | string} target. The peer that will
	 *  receive the approval request.
	 * @property {integer} [requestTimeout] - Optional. The timeout value to use
	 * for this request
	 */

	/**
	 * This method will build and send an
	 * approve chaincode definition for this organization.
	 *
	 * @async
	 * @param {ApproveRequest} request - Required.
	 */
	async approve(request) {
		const method = 'approve';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Approve operation requires a ChaincodeRequest object parameter');
		}

		if (!request.target) {
			throw new Error('Chaincode install "target" parameter is required');
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			logger.debug('%s - build the approve chaincode argument', method);
			const chaincode_arg = this.getApproveChaincodeDefinitionForMyOrgArgs();

			const contract = this._network.getContract('_lifecycle');
			await contract.submitTransaction('ApproveChaincodeDefinitionForMyOrg', chaincode_arg.toBuffer());
			logger.debug('%s - submitted successfully', method);

		} catch (error) {
			logger.error('Problem with the lifecycle approval :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/*
	 * Build a ApproveChaincodeDefinitionForMyOrgArgs protobuf object
	 * based on this Chaincode definition
	 */
	getApproveChaincodeDefinitionForMyOrgArgs() {
		const method = 'getApproveChaincodeDefinitionForMyOrgArgs';
		logger.debug('%s - start', method);

		const arg = new lifecycleProtos.ApproveChaincodeDefinitionForMyOrgArgs();
		this._setCommon(arg);

		const source = new lifecycleProtos.ChaincodeSource();
		if (this._package_id) {
			const local = new lifecycleProtos.ChaincodeSource.Local();
			local.setPackageId(this._package_id);
			source.setLocalPackage(local);
		} else {
			const unavailable = new lifecycleProtos.ChaincodeSource.Unavailable();
			source.setUnavailable(unavailable);
		}

		arg.setSource(source);

		logger.debug('%s - end', method);
		return arg;
	}

	/**
	 * @typedef {Object} CommitRequest
	 *  This object contains the  properties needed when approving
	 *  a chaincode on the channel for an organization
	 * @property {Endorser[] | string[]} targets. The peers that will
	 *  receive the approval request.
	 * @property {integer} [requestTimeout] - Optional. The timeout value to use
	 * for this request
	 */

	/**
	 * This method will build and send an
	 * commit chaincode definition for this channel.
	 *
	 * @async
	 * @param {CommitRequest} request - Required.
	 */
	async commit(request) {
		const method = 'commit';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Commit operation requires a ChaincodeRequest object parameter');
		}

		if (!request.targets) {
			throw new Error('Chaincode install "targets" parameter is required');
		}

		const peers = [];

		if (Array.isArray(request.targets)) {
			for (const name of request.targets) {
				let peer;
				if (typeof name === 'string') {
					peer = this._network.channel.getEndorser(name);
					if (!peer) {
						throw new Error(`Peer named ${name} not found`);
					}
				} else {
					peer = name;
				}

				// make sure the peer is connected, should be connected
				// when it is created by the network config parser
				const check = await peer.checkConnection();
				if (!check) {
					throw Error('Target peer is not connected');
				}
				peers.push(peer);
			}
		}

		try {
			logger.debug('%s - build the commit chaincode argument', method);
			const chaincode_arg = this.getCommitChaincodeDefinitionArgs();

			const contract = this._network.getContract('_lifecycle');
			await contract.submitTransaction('CommitChaincodeDefinition', chaincode_arg.toBuffer());
			logger.debug('%s - submitted successfully', method);

		} catch (error) {
			logger.error('Problem with the lifecycle commit :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/*
	 * Build a CommitChaincodeDefinitionArgs protobuf object
	 * based on this Chaincode definition
	 */
	getCommitChaincodeDefinitionArgs() {
		const method = 'getCommitChaincodeDefinitionArgs';
		logger.debug('%s - start', method);

		const arg = new lifecycleProtos.CommitChaincodeDefinitionArgs();
		this._setCommon(arg);

		logger.debug('%s - end', method);
		return arg;
	}

	/**
	 * This method will build and send an
	 * check commit readiness for this package.
	 *
	 * @async
	 * @param {ReadinessRequest} request - Required.
	 */
	async checkCommitReadiness(request) {
		const method = 'checkCommitReadiness';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('checkCommitReadiness operation requires a ChaincodeRequest object parameter');
		}

		if (!request.target) {
			throw new Error('Chaincode install "target" parameter is required');
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			logger.debug('%s - build the checkCommitReadiness argument', method);
			const arg = this.getCheckCommitReadinessArgs();

			const build_request = {
				fcn: 'CheckCommitReadiness',
				args: [arg.toBuffer()]
			};

			// we are going to talk to lifecycle which is really just a chaincode
			const endorsement = this._network.channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const readiness = lifecycleProtos.CheckCommitReadinessResult.decode(response.response.payload);

							return JSON.parse(readiness.encodeJSON());
						} else {
							throw new Error(format('Commit readiness failed with status:%s ::%s', response.response.status, response.response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincodes');
			}
		} catch (error) {
			logger.error('Problem with the lifecycle approval :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}
	/*
	 * Build a CheckCommitReadinessArgs protobuf object
	 * based on this Chaincode definition
	 */
	getCheckCommitReadinessArgs() {
		const method = 'getCheckCommitReadinessArgs';
		logger.debug('%s - start', method);

		const arg = new lifecycleProtos.CheckCommitReadinessArgs();
		this._setCommon(arg);

		logger.debug('%s - end', method);
		return arg;
	}

	/**
	 * This method will build and send a
	 * query chaincode definitions all chaincodes on this channel.
	 *
	 * @async
	 * @param {ReadinessRequest} request - Required.
	 */
	async queryChaincodeDefinitions(request) {
		const method = 'queryChaincodeDefinitions';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('queryChaincodeDefinitions operation requires a ChaincodeRequest object parameter');
		}

		if (!request.target) {
			throw new Error('"target" parameter is required');
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			logger.debug('%s - build the queryChaincodeDefinitions argument', method);
			const arg = new lifecycleProtos.QueryChaincodeDefinitionsArgs();

			const build_request = {
				fcn: 'QueryChaincodeDefinitions',
				args: [arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = this._network.channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const results = lifecycleProtos.QueryChaincodeDefinitionsResult.decode(response.response.payload);

							return JSON.parse(results.encodeJSON());
						} else {
							throw new Error(format('Commit readiness failed with status:%s ::%s', response.response.status, response.response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincodes');
			}
		} catch (error) {
			logger.error('Problem with the lifecycle approval :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/**
	 * This method will build and send a
	 * query chaincode definition for this chaincode on this channel.
	 *
	 * @async
	 * @param {ReadinessRequest} request - Required.
	 */
	async queryChaincodeDefinition(request) {
		const method = 'queryChaincodeDefinition';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('queryChaincodeDefinition operation requires a ChaincodeRequest object parameter');
		}

		if (!request.target) {
			throw new Error('"target" parameter is required');
		}
		let populate = true;
		if (typeof request.populate === 'boolean') {
			populate = request.populate;
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			logger.debug('%s - build the queryChaincodeDefinition argument', method);
			const arg = new lifecycleProtos.QueryChaincodeDefinitionArgs();
			arg.setName(this._name);

			const build_request = {
				fcn: 'QueryChaincodeDefinition',
				args: [arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = this._network.channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const results = lifecycleProtos.QueryChaincodeDefinitionResult.decode(response.response.payload);
							if (populate) {
								this.fromQueryResult(results);
							}

							return JSON.parse(results.encodeJSON());
						} else {
							throw new Error(format('Commit readiness failed with status:%s ::%s', response.response.status, response.response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincodes');
			}
		} catch (error) {
			logger.error('Problem with the lifecycle approval :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/*
	 * Internal method to set the common chaincode attributes into a protobuf object
	*/
	_setCommon(arg) {
		arg.setName(this._name);
		arg.setVersion(this._version);
		arg.setSequence(this._sequence);
		arg.setEndorsementPlugin(this._endorsement_plugin);
		arg.setValidationPlugin(this._validation_plugin);
		if (this._endorsement_policy) {
			arg.setValidationParameter(this._endorsement_policy);
		}
		if (this._collection_package_proto) {
			arg.setCollections(this._collection_package_proto);
		}
		arg.setInitRequired(this._init_required);
	}

	/**
	 * @typedef {Object} QueryInstalledChaincodeRequest
	 * @property {Peer | string} target - Required. The peer that will receive
	 *  this request
	 * @property {string} package_id - Required. Package Id of the chaincode
	 * @property {integer} [request_timeout] - Optional. The timeout value to use for this request
	 * @property {TransactionID} [txId] - Optional. Transaction ID to use for the
	 *  query. Required when using the admin idendity.
	 */

	/**
	 * @typedef {Object} QueryInstalledChaincodeResult
	 * @property {string} package_id - The package ID of the installed chaincode
	 * @property {string} label - The label as provided by the client application
	 */

	/**
	 * Sends a QueryInstalledChaincode request to one peer.
	 *
	 * @param {QueryInstalledChaincodeRequest} request
	 * @returns {Promise} A Promise for a {@link QueryInstalledChaincodeResult}
	 */
	async queryInstalledChaincode(request) {
		const method = 'queryInstalledChaincode';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Missing request object parameter');
		}

		if (!request.target) {
			throw new Error('Missing "target" parameter');
		}

		if (request.package_id) {
			this._package_id = request.package_id;
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			// need to get a system channel
			const client = await this._gateway.client;
			const channel = client.newChannel('system');
			channel.name = ''; // system channel does not have a name

			logger.debug('%s - build the query installed chaincode request', method);
			const arg = new lifecycleProtos.QueryInstalledChaincodeArgs();
			arg.setPackageId(this._package_id);

			const build_request = {
				fcn: 'QueryInstalledChaincode',
				args: [arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const results = lifecycleProtos.QueryInstalledChaincodeResult.decode(response.response.payload);
							return JSON.parse(results.encodeJSON());
						} else {
							throw new Error(format('Chaincode query failed with status:%s ::%s', response.status, response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincode');
			}

		} catch (error) {
			logger.error('Problem with the lifecycle query request :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/**
	 * @typedef {Object} QueryInstalledChaincodesRequest
	 * @property {Peer | string} target - Required. The peer that will receive
	 *  this request
	 * @property {integer} [request_timeout] - Optional. The timeout value to use for this request
	 * @property {TransactionID} [txId] - Optional. Transaction ID to use for the
	 *  query. Required when using the admin idendity.
	 */

	/**
	 * Sends a QueryInstalledChaincodes request to one peer.
	 *
	 * @param {QueryInstalledChaincodesRequest} request
	 * @returns {Promise} A Promise for a {@link QueryInstalledChaincodeResult[]}
	 */
	async queryInstalledChaincodes(request) {
		const method = 'queryInstalledChaincodes';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Missing request object parameter');
		}

		if (!request.target) {
			throw new Error('Missing "target" parameter');
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			// need to get a system channel
			const client = await this._gateway.client;
			const channel = client.newChannel('system');
			channel.name = ''; // system channel does not have a name

			logger.debug('%s - build the query installed chaincodes request', method);
			const arg = new lifecycleProtos.QueryInstalledChaincodesArgs();

			const build_request = {
				fcn: 'QueryInstalledChaincodes',
				args: [arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const results = lifecycleProtos.QueryInstalledChaincodesResult.decode(response.response.payload);
							return JSON.parse(results.encodeJSON());
						} else {
							throw new Error(format('Chaincode query failed with status:%s ::%s', response.status, response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincodes');
			}

		} catch (error) {
			logger.error('Problem with the lifecycle query request :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/**
	 * @typedef {Object} GetInstalledChaincodePackageRequest
	 * @property {Peer | string} target - Required. The peer that will receive
	 *  this request
	 * @property {string} packageId - Required. Package Id of the chaincode
	 * @property {integer} [requestTimeout] - Optional. The timeout value to use for this request
	 *  query. Required when using the admin idendity.
	 */

	/**
 	 * @typedef {Object} GetInstalledChaincodePackageResult
 	 * @property {byte[]} chaincodeInstallPackage - The package bytes
 	 */

	/**
	 * Sends a GetInstalledChaincodePackage request to one peer.
	 *
	 * @param {GetInstalledChaincodePackageRequest} request
	 * @returns {Promise} A Promise for a {byte[]} the installed package.
	 */
	async getInstalledChaincodePackage(request) {
		const method = 'getInstalledChaincodePackage';
		logger.debug('%s - start', method);

		if (!request) {
			throw new Error('Missing request object parameter');
		}
		if (!request.target) {
			throw new Error('Missing "target" parameter');
		}
		if (request.package_id) {
			this._package_id = request.package_id;
		}

		let peer;
		if (typeof request.target === 'string') {
			peer = this._network.channel.getEndorser(request.target);
			if (!peer) {
				throw new Error(`Peer named ${request.target} not found`);
			}
		} else {
			peer = request.target;
		}
		// make sure the peer is connected, should be connected
		// when it is created by the network config parser
		const check = await peer.checkConnection();
		if (!check) {
			throw Error('Target peer is not connected');
		}

		try {
			// need to get a system channel
			const client = await this._gateway.client;
			const channel = client.newChannel('system');
			channel.name = ''; // system channel does not have a name

			logger.debug('%s - build the get package chaincode request', method);
			const arg = new lifecycleProtos.GetInstalledChaincodePackageArgs();
			arg.setPackageId(this._package_id);

			const build_request = {
				fcn: 'GetInstalledChaincodePackage',
				args: [arg.toBuffer()]
			};

			//  we are going to talk to lifecycle which is really just a chaincode
			const endorsement = channel.newEndorsement('_lifecycle');
			endorsement.build(this._gateway.identityContext, build_request);
			endorsement.sign(this._gateway.identityContext);

			const  endorse_request = {
				targets: [peer]
			};

			if (request.requestTimeout) {
				endorse_request.requestTimeout = request.requestTimeout;
			}

			const responses = await endorsement.send(endorse_request);

			if (responses.errors && responses.errors.length > 0) {
				for (const error of responses.errors) {
					logger.error('Problem with the chaincode query ::' + response);
					throw error;
				}
			} else if (responses.responses && responses.responses.length > 0){
				for (const response of responses.responses) {
					logger.debug('%s - looking at response from peer %s', method, request.target);
					if (response.response && response.response.status) {
						if (response.response.status === 200) {
							logger.debug('%s - peer response %j', method, response);
							const results = lifecycleProtos.GetInstalledChaincodePackageResult.decode(response.response.payload);
							return results.getChaincodeInstallPackage(); // the package bytes
						} else {
							throw new Error(format('Chaincode query failed with status:%s ::%s', response.status, response.message));
						}
					} else {
						throw new Error('Chaincode query has failed');
					}
				}
			} else {
				throw new Error('No response returned for peer query of chaincodes');
			}

		} catch (error) {
			logger.error('Problem with the lifecycle query request :: %s', error);
			logger.error(' problem at ::' + error.stack);
			throw error;
		}
	}

	/**
	 * return a printable representation of this object
	 */
	toString() {
		return 'Chaincode : {' +
			'name : ' + this._name +
			', version : ' + this._version +
			', sequence : ' + this._sequence +
		'}';
	}
};

module.exports = Chaincode;
