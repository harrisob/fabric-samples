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
const chaincodeutils_1 = require("./chaincodeutils");
class ApprovedChaincodeImpl {
    constructor(attributes) {
        this.chaincodeName = attributes.chaincodeName;
        this.chaincodeVersion = attributes.chaincodeVersion;
        this.label = attributes.label;
        this.packageId = attributes.packageId;
        this.sequence = attributes.sequence;
        this.endorsementPolicy = attributes.endorsementPolicy;
        this.collectionConfig = attributes.collectionConfig;
        this.initRequired = attributes.initRequired;
        this.endorsementPlugin = attributes.endorsementPlugin;
        this.validationPlugin = attributes.validationPlugin;
        this.committed = false;
    }
    commit(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // use the utility to commit this approved packaged
            yield chaincodeutils_1.ChaincodeUtils.commitPackage(this, options);
            this.committed = true;
        });
    }
    isCommitted() {
        return this.committed;
    }
    checkCommitReadiness(options) {
        //
        return true;
    }
}
exports.ApprovedChaincodeImpl = ApprovedChaincodeImpl;
//# sourceMappingURL=approvedchaincode.js.map