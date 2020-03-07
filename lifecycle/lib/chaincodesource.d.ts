/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Lifecycle } from './lifecycle';
export declare class ChaincodeSourceImpl implements Lifecycle.ChaincodeSource {
    chaincodeName: string;
    chaincodeVersion: string;
    constructor(options: Lifecycle.ChaincodeSourceAttributes);
    package(options: Lifecycle.PackagingOptions): Promise<Lifecycle.PackagedChaincode>;
    queryPackagedChaincode(options: Lifecycle.QueryPackagedChaincodeOptions): Promise<Lifecycle.PackagedChaincode>;
}
