/*
SPDX-License-Identifier: Apache-2.0
*/

import * as fs from 'fs-extra';
import * as path from 'path';

//const yaml = require('js-yaml');
import { Wallets, Gateway } from 'fabric-network';
import { Lifecycle } from '../lib/lifecycle'

async function main () {
	const walletPath = path.join(process.cwd(), 'wallet');
	const wallet = await Wallets.newFileSystemWallet(walletPath);
	const gateway = new Gateway();

	try {

		const userName = 'user3';
		const chaincodeName: string = 'fabcar';
		const chaincodeVersion = 'v15';
		const sequence = 6;
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
		let chaincodePath = '../../chaincode/fabcar/javascript/lib';
		let metadataPath = null;

		// Load connection profile; will be used to locate a gateway
		const ccpPath = path.resolve(__dirname, '../..', 'basic-network', 'connection.json');
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

		chaincodePath = path.join(__dirname, chaincodePath);

		// ------------------------- source
		const sourceAttributes: Lifecycle.ChaincodeSourceAttributes = {
			chaincodeName: chaincodeName,
			chaincodeVersion: chaincodeVersion
		};

		const chaincodeSource =  Lifecycle.newChaincodeSource(sourceAttributes);
		console.log(` -- sourced -  named:${chaincodeSource.chaincodeName} version:${chaincodeSource.chaincodeVersion}`);

		// ------------------------- package
		const packageOptions: Lifecycle.PackagingOptions = {
			chaincodePath: chaincodePath,
			//metadataPath: metadataPath,
			chaincodeType: chaincodeType,
			//golangPath: goPath,
			label: chaincodeName + '_' + chaincodeVersion
		};

		const chaincodePackaged = await chaincodeSource.package(packageOptions);
		console.log('Packaging complete. ==>' + chaincodePackaged.packageFile.toString());

		// -------------------------- install
		const installingOptions: Lifecycle.InstallingOptions = {
			network: network,
			peerNames: [peerName],
			timeout: 20000
		};
		console.log(` -- installing -  peer:${peerName}`);
		const chaincodeInstalled = await chaincodePackaged.install(installingOptions);
		console.log('Install complete.  packageId:' + chaincodeInstalled.packageId);

		// --------------------------- query installed
		const queryInstalled: Lifecycle.QueryInstalledChaincodeOptions = {
			peerName: peerName,
			network: network,
			packageId: chaincodeInstalled.packageId
		};
		console.log(` -- query installed -  peer ${peerName}`);
		// this will return the specific package ID and where it is being used
		const installedChannelChaincode = await Lifecycle.queryInstalledChaincode(queryInstalled);
		console.log('Query Installed complete.   ==>' + JSON.stringify(installedChannelChaincode));

		// --------------------------- query all installed
		const queryAllInstalled: Lifecycle.QueryAllInstalledChaincodesOptions = {
			peerName: peerName,
			network: network
		};
		console.log(` -- query all installed -  peer ${peerName}`);
		const installedChannelChaincodes = await Lifecycle.queryAllInstalledChaincodes(queryAllInstalled);
		console.log('Query ALL Installed complete.   ==>' + JSON.stringify(installedChannelChaincodes));

		// --------------------------- get the installed package file
		const getPackageFileRequest: Lifecycle.QueryInstalledChaincodePackageFileOptions = {
			peerName: peerName,
			network: network,
			packageId: chaincodeInstalled.packageId
		};
		console.log(` -- get installed package-  package_id: ${chaincodeInstalled.packageId}`);
		const packageBytes = await Lifecycle.queryInstalledChaincodePackageFile(getPackageFileRequest);
		console.log('Get Installed Package complete.   ==>' + packageBytes);

		// --------------------------- approve
		const approvingOptions: Lifecycle.ApprovingOptions = {
			sequence: sequence,
			network: network,
			peerNames: [peerName],
			timeout: 3000
		};
		console.log(` -- approving -  peer ${peerName}`);
		console.log(` -- approving -  package_id ${chaincodeInstalled.packageId}`);
		const chaincodeApproved = await chaincodeInstalled.approve(approvingOptions);
		console.log(`Approve complete.   package_id: ${chaincodeApproved.packageId}`);


		// --------------------------- query definition
		const queryDefinedChaincode: Lifecycle.QueryDefinedChaincodeOptions = {
			chaincodeName: chaincodeApproved.chaincodeName,
			network: network,
			peerName: peerName,
			timeout: 3000
		}
		console.log(` -- query definition -  peer ${peerName}`);
		console.log(` -- query definition -  chaincode ${chaincodeApproved.chaincodeName}`);
		const chaincodeDef = await Lifecycle.queryDefinedChaincode(queryDefinedChaincode);
		console.log('Query Definition complete.   ::' + JSON.stringify(chaincodeDef));


		// --------------------------- query definitions
		const queryDefinedChaincodes: Lifecycle.QueryDefinedChaincodesOptions = {
			network: network,
			peerName: peerName,
			timeout: 3000
		}
		console.log(` -- query definitions -  peer ${peerName}`);
		const chaincodeDefs = await Lifecycle.queryDefinedChaincodes(queryDefinedChaincodes);
		console.log('Query Definitions complete.   ::' + JSON.stringify(chaincodeDefs));

		// --------------------------- check commit readiness
		const queryCommitReadiness: Lifecycle.QueryCommitReadinessOptions = {
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
		}
		console.log(` -- check commit readiness -  chaincodeName ${chaincodeApproved.chaincodeName}`);
		const readiness = await Lifecycle.queryCommitReadiness(queryCommitReadiness);
		console.log('Readiness complete.   readiness:' + JSON.stringify(readiness));

		// --------------------------- commit
		const committingOptions: Lifecycle.CommittingOptions = {
			network: network,
			peerNames: [peerName]
		}
		console.log(` -- commit -  peer ${peerName}`);
		await chaincodeApproved.commit(committingOptions);
		console.log('Commit complete.   isCommitted:' + chaincodeApproved.isCommitted());

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
