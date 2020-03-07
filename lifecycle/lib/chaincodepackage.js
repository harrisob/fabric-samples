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
const lifecycle_1 = require("./lifecycle");
const chaincodeutils_1 = require("./chaincodeutils");
class PackagedChaincodeImpl {
    constructor(options) {
        this.chaincodeName = options.chaincodeName;
        this.chaincodeVersion = options.chaincodeVersion;
        this.packageFile = options.packageFile;
        this.label = options.label;
    }
    install(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // use the utility to install this package on the peers
            const packageId = yield chaincodeutils_1.ChaincodeUtils.installPackage(this, options);
            // now build the object to return the results
            const installedattributes = {
                chaincodeName: this.chaincodeName,
                chaincodeVersion: this.chaincodeVersion,
                label: this.label,
                packageId: packageId
            };
            return lifecycle_1.Lifecycle.newInstalledChaincode(installedattributes);
        });
    }
}
exports.PackagedChaincodeImpl = PackagedChaincodeImpl;
//# sourceMappingURL=chaincodepackage.js.map