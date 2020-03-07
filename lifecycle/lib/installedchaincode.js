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
// @ts-ignore no implicit any
const lifecycle_1 = require("./lifecycle");
const chaincodeutils_1 = require("./chaincodeutils");
class InstalledChaincodeImpl {
    constructor(attributes) {
        this.chaincodeName = attributes.chaincodeName;
        this.chaincodeVersion = attributes.chaincodeVersion;
        this.label = attributes.label;
        this.packageFile = attributes.packageFile;
        this.packageId = attributes.packageId;
    }
    approve(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // use the utility to approve this installed package for this organization
            // each organization must approve the package
            yield chaincodeutils_1.ChaincodeUtils.approvePackage(this, options);
            // now build the object to return the results
            // in this case approve only returns success, so we have all we need
            // from 'this' and the passed in options
            const approvedAttributes = {
                chaincodeName: this.chaincodeName,
                chaincodeVersion: this.chaincodeVersion,
                packageFile: this.packageFile,
                label: this.label,
                packageId: this.packageId,
                sequence: options.sequence,
                endorsementPolicy: options.endorsementPolicy,
                collectionConfig: options.collectionConfig,
                initRequired: options.initRequired,
                endorsementPlugin: options.endorsementPlugin,
                validationPlugin: options.validationPlugin
            };
            return lifecycle_1.Lifecycle.newApprovedChaincode(approvedAttributes);
        });
    }
}
exports.InstalledChaincodeImpl = InstalledChaincodeImpl;
//# sourceMappingURL=installedchaincode.js.map