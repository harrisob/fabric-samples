/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { Lifecycle } from './lifecycle';
export declare class PackagedChaincodeImpl implements Lifecycle.PackagedChaincode {
    chaincodeName: string;
    chaincodeVersion: string;
    packageFile: Buffer;
    label: string;
    constructor(options: Lifecycle.PackagedChaincodeAttributes);
    install(options: Lifecycle.InstallingOptions): Promise<Lifecycle.InstalledChaincode>;
}
