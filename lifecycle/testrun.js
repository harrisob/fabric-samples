/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. select an identity from a wallet
 * 2. connect to network gateway
 * 3. create chaincode object
 * 4. build package
 * 5. install package
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Long = require('long');
//const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const Chaincode = require('./lib/Chaincode.js');

async function main () {
	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);
	const gateway = new Gateway();

	try {

		const userName = 'user3';
		const chaincodeName = 'fabcar';
		const chaincodeVersion = 'v4';
		const sequence = Long.fromValue(3);
		const chaincodeType = 'node';
		const init_required = true;
		const endorsement_policy = {"identities": [
			{ "role": { "name": "member", "mspId": "Org1MSP" }},
			{ "role": { "name": "admin", "mspId": "Org1MSP" }}
		],
		"policy": {
			"1-of": [{ "signed-by": 0}, { "signed-by": 1 }]
		}
	}

		const channelName = 'mychannel';
		const peerName = 'peer0.org1.example.com'; // must be part of the channel

		let goPath = null;
		let chaincodePath = '../chaincode/fabcar/javascript/lib';
		let metadataPath = null;

		// Load connection profile; will be used to locate a gateway
		const ccpPath = path.resolve(__dirname, '..', 'basic-network', 'connection.json');
		const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

		// Set connection options; identity and wallet
		let connectionOptions = {
			identity: userName,
			wallet: wallet,
			discovery: {enabled: false}
		};

		console.log('Connect to gateway.');
		await gateway.connect(ccp, connectionOptions);

		console.log(`Use network channel: ${channelName}`);
		const network = await gateway.getNetwork(channelName);

		if (metadataPath) {
			metadataPath = path.join(__dirname, metadataPath);
		}

		// golang packaging uses the environment gopath to build up the file paths
		// to include in the tar
		if (chaincodeType === 'golang') {
			goPath = path.join(__dirname, goPath);
		} else {
			chaincodePath = path.join(__dirname, chaincodePath);
		}

		const chaincode =  new Chaincode(chaincodeName, chaincodeVersion, network);
		chaincode.setInitRequired(init_required);
		chaincode.setSequence(sequence);


		// ------------------------- package
		const package_request = {
			chaincodePath: chaincodePath,
			metadataPath: metadataPath,
			chaincodeType: chaincodeType,
			goPath: goPath
		};

		console.log(` -- packaging -  type ${chaincodeType} named ${chaincodeName}`);
		await chaincode.package(package_request);
		console.log('Packaging complete.');

		// -------------------------- install
		const install_request = {
			target: peerName,
			requestTimeout: 20000
		};
		console.log(` -- installing -  peer ${peerName}`);
		const package_id = await chaincode.install(install_request);
		console.log('Install complete.   package_id:' + package_id);

		// --------------------------- query installed
		const query_request = {
			target: peerName
		};
		console.log(` -- query installed -  peer ${peerName}`);
		const results = await chaincode.queryInstalledChaincode(query_request);
		console.log('Query Installed complete.   ==>' + JSON.stringify(results));

		// --------------------------- query all installed
		const query_all_request = {
			target: peerName
		};
		console.log(` -- query all installed -  peer ${peerName}`);
		const all_results = await chaincode.queryInstalledChaincodes(query_all_request);
		console.log('Query All Installed complete.   ==>' + JSON.stringify(all_results));

		// --------------------------- get the installed package
		const get_package_request = {
			target: peerName
		};
		console.log(` -- get installed package-  package_id: ${chaincode.getPackageId()}`);
		const package_bytes = await chaincode.getInstalledChaincodePackage(get_package_request);
		console.log('Get Installed Package complete.   ==>' + package_bytes);

		// --------------------------- approve
		chaincode.setEndorsementPolicyDefinition(endorsement_policy);
		const approve_request = {
			target: peerName
		}
		console.log(` -- approving -  peer ${peerName}`);
		console.log(` -- approving -  package_id ${chaincode.getPackageId()}`);
		await chaincode.approve(approve_request);
		console.log('Approve complete.   package_id:' + package_id);

		// --------------------------- query definition
		const query_def_request = {
			target: peerName,
			populate: false
		}
		console.log(` -- query definition -  peer ${peerName}`);
		console.log(` -- query definition -  chaincode ${chaincode.getName()}`);
		const chaincode_def = await chaincode.queryChaincodeDefinition(query_def_request);
		console.log('Query Definition complete.   ::' + JSON.stringify(chaincode_def));

		// --------------------------- query definition to populate chaincode
		const query_def_populate_request = {
			target: peerName,
			populate: true
		}
		const empty_chaincode = new Chaincode(chaincodeName, chaincodeVersion, network);
		console.log(` -- query definition to populate-  peer ${peerName}`);
		console.log(` -- query definition to populate -  chaincode ${empty_chaincode.getName()}`);
		const chaincode_def2 = await empty_chaincode.queryChaincodeDefinition(query_def_populate_request);
		console.log(` -- populated with -  package_id ${empty_chaincode.getPackageId()}`);
		console.log(` -- populated with -  sequence ${empty_chaincode.getSequence()}`);
		console.log(` -- populated with -  endorsement policy ${empty_chaincode.getEndorsementPolicyEncoded()}`);
		console.log('Query Definition to populate complete. Chaincode definition:' + JSON.stringify(chaincode_def2));

		// --------------------------- query definitions
		const query_defs_request = {
			target: peerName
		}
		console.log(` -- query definitions -  peer ${peerName}`);
		const chaincode_defs = await chaincode.queryChaincodeDefinitions(query_defs_request);
		console.log('Query Definitions complete.   ::' + JSON.stringify(chaincode_defs));

		// --------------------------- check commit readiness
		const readiness_request = {
			target: peerName
		}
		console.log(` -- check commit readiness -  package_id ${chaincode.getPackageId()}`);
		const readiness = await chaincode.checkCommitReadiness(readiness_request);
		console.log('Readiness complete.   readiness:' + JSON.stringify(readiness));

		// --------------------------- commit
		const commit_request = {
			targets: [peerName]
		}
		console.log(` -- commit -  peer ${peerName}`);
		await chaincode.commit(commit_request);
		console.log('Commit complete.   package_id:' + package_id);
		// --------------------------- done
		console.log(' -- lifecycle actions complete');
	} catch (error) {
		console.log(`Error processing transaction. ${error}`);
		console.log(error.stack);
	} finally {
		console.log('Disconnect from Fabric gateway.');
		gateway.disconnect();

	}
} // endof main()

console.log('***** start *****');
main().then(() => {
	console.log('***** end *****');
}).catch((e) => {
	console.log('------>>>> exception');
	console.log(e);
	console.log(e.stack);
	process.exit(-1);
});
