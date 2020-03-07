/**
 * Copyright 2020 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { Lifecycle } from './lifecycle';
export declare class ApprovedChaincodeImpl implements Lifecycle.ApprovedChaincode {
    chaincodeName: string;
    chaincodeVersion: string;
    label: string;
    packageId: string;
    sequence: number;
    endorsementPolicy?: string | object | Buffer;
    collectionConfig?: object;
    initRequired?: boolean;
    endorsementPlugin?: string;
    validationPlugin?: string;
    committed: boolean;
    constructor(attributes: Lifecycle.ApprovedChaincodeAttributes);
    commit(options: Lifecycle.CommittingOptions): Promise<void>;
    isCommitted(): boolean;
    checkCommitReadiness(options: Lifecycle.CommittingOptions): boolean;
}
