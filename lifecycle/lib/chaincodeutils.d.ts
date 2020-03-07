/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { Lifecycle } from './lifecycle';
export declare namespace ChaincodeUtils {
    function packageChaincode(attributes: Lifecycle.ChaincodeSourceAttributes, options: Lifecycle.PackagingOptions): Promise<Buffer>;
    function installPackage(attributes: Lifecycle.PackagedChaincodeAttributes, options: Lifecycle.InstallingOptions): Promise<string>;
    function approvePackage(attributes: Lifecycle.InstalledChaincodeAttributes, options: Lifecycle.ApprovingOptions): Promise<void>;
    function commitPackage(attributes: Lifecycle.ApprovedChaincodeAttributes, options: Lifecycle.CommittingOptions): Promise<void>;
    function queryInstalledChaincode(options: Lifecycle.QueryInstalledChaincodeOptions): Promise<Lifecycle.InstalledChannelChaincodeAttributes[]>;
    function queryAllInstalledChaincodes(options: Lifecycle.QueryAllInstalledChaincodesOptions): Promise<Lifecycle.InstalledChannelChaincodeAttributes[]>;
    function queryInstalledChaincodePackageFile(options: Lifecycle.QueryInstalledChaincodePackageFileOptions): Promise<Buffer>;
    function queryDefinedChaincode(options: Lifecycle.QueryDefinedChaincodeOptions): Promise<Lifecycle.DefinedChaincodeApprovalsAttributes>;
    function queryDefinedChaincodes(options: Lifecycle.QueryDefinedChaincodesOptions): Promise<Lifecycle.DefinedChaincodeAttributes[]>;
    function queryCommitReadiness(options: Lifecycle.QueryCommitReadinessOptions): Promise<Map<string, boolean>>;
}
