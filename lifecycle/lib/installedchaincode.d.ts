/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { Lifecycle } from './lifecycle';
export declare class InstalledChaincodeImpl implements Lifecycle.InstalledChaincode {
    chaincodeName: string;
    chaincodeVersion: string;
    label: string;
    packageFile?: Buffer;
    packageId: string;
    constructor(attributes: Lifecycle.InstalledChaincodeAttributes);
    approve(options: Lifecycle.ApprovingOptions): Promise<Lifecycle.ApprovedChaincode>;
}
