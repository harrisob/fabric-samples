/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { Network, Gateway } from 'fabric-network';
export declare namespace Lifecycle {
    function queryInstalledChaincode(options: QueryInstalledChaincodeOptions): Promise<InstalledChannelChaincodeAttributes[]>;
    interface QueryInstalledChaincodeOptions {
        network: Network;
        peerName: string;
        timeout?: number;
        packageId: string;
    }
    interface InstalledChannelChaincodeAttributes {
        channelName: string;
        chaincodeName: string;
        chaincodeVersion: string;
        label: string;
        packageId: string;
    }
    function queryAllInstalledChaincodes(options: QueryAllInstalledChaincodesOptions): Promise<InstalledChannelChaincodeAttributes[]>;
    interface QueryAllInstalledChaincodesOptions {
        network: Network;
        peerName: string;
        timeout?: number;
    }
    function queryInstalledChaincodePackageFile(options: QueryInstalledChaincodePackageFileOptions): Promise<Buffer>;
    interface QueryInstalledChaincodePackageFileOptions {
        network: Network;
        peerName: string;
        timeout?: number;
        packageId: string;
    }
    function queryDefinedChaincode(options: QueryDefinedChaincodeOptions): Promise<DefinedChaincodeAttributes>;
    interface QueryDefinedChaincodeOptions {
        network: Network;
        peerName: string;
        timeout?: number;
        chaincodeName: string;
    }
    interface DefinedChaincodeApprovalsAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
        sequence: number;
        endorsementPolicy?: string | object | Buffer;
        collectionConfig?: object | Buffer;
        initRequired?: boolean;
        endorsementPlugin?: string;
        validationPlugin?: string;
        approvals: Map<string, boolean>;
    }
    function queryDefinedChaincodes(options: QueryDefinedChaincodesOptions): Promise<DefinedChaincodeAttributes[]>;
    interface QueryDefinedChaincodesOptions {
        network: Network;
        peerName: string;
        timeout?: number;
    }
    interface DefinedChaincodeAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
        sequence: number;
        endorsementPolicy?: string | object | Buffer;
        collectionConfig?: object | Buffer;
        initRequired?: boolean;
        endorsementPlugin?: string;
        validationPlugin?: string;
    }
    function queryCommitReadiness(options: QueryCommitReadinessOptions): Promise<Map<string, boolean>>;
    interface QueryCommitReadinessOptions {
        chaincodeName: string;
        chaincodeVersion: string;
        sequence: number;
        endorsementPolicy?: string | object | Buffer;
        collectionConfig?: object | Buffer;
        initRequired?: boolean;
        endorsementPlugin?: string;
        validationPlugin?: string;
        network: Network;
        peerName: string;
        timeout?: number;
    }
    function newChaincodeSource(options: ChaincodeSourceAttributes): ChaincodeSource;
    interface ChaincodeSourceAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
    }
    interface ChaincodeSource extends ChaincodeSourceAttributes {
        package(options: PackagingOptions): Promise<PackagedChaincode>;
    }
    interface PackagingOptions {
        chaincodePath: string;
        metadataPath?: string;
        golangPath?: string;
        chaincodeType: string;
        label: string;
    }
    interface QueryPackagedChaincodeOptions {
        gateway: Gateway;
        peerName: string;
        timeout: number;
        packageId: string;
    }
    function newPackagedChaincode(options: PackagedChaincodeAttributes): PackagedChaincode;
    interface PackagedChaincode extends PackagedChaincodeAttributes {
        install(options: InstallingOptions): Promise<InstalledChaincode>;
    }
    interface PackagedChaincodeAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
        packageFile: Buffer;
        label: string;
    }
    interface InstallingOptions {
        network: Network;
        peerNames: string[];
        timeout?: number;
    }
    function newInstalledChaincode(options: InstalledChaincodeAttributes): InstalledChaincode;
    interface InstalledChaincode extends InstalledChaincodeAttributes {
        approve(options: ApprovingOptions): Promise<ApprovedChaincode>;
    }
    interface InstalledChaincodeAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
        packageFile?: Buffer;
        label: string;
        packageId: string;
    }
    interface ApprovingOptions {
        sequence: number;
        endorsementPlugin?: string;
        validationPlugin?: string;
        endorsementPolicy?: string | object | Buffer;
        collectionConfig?: object | Buffer;
        initRequired?: boolean;
        network: Network;
        peerNames?: string[];
        timeout?: number;
    }
    function newApprovedChaincode(options: ApprovedChaincodeAttributes): ApprovedChaincode;
    interface ApprovedChaincode extends ApprovedChaincodeAttributes {
        isCommitted(): boolean;
        commit(options: CommittingOptions): Promise<void>;
    }
    interface ApprovedChaincodeAttributes {
        chaincodeName: string;
        chaincodeVersion: string;
        packageFile?: Buffer;
        label: string;
        packageId: string;
        sequence: number;
        endorsementPolicy?: string | object | Buffer;
        collectionConfig?: object | Buffer;
        initRequired?: boolean;
        endorsementPlugin?: string;
        validationPlugin?: string;
    }
    interface CommittingOptions {
        network: Network;
        peerNames?: string[];
        timeout?: number;
    }
}
