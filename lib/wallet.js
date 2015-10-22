/**
 * wallet.js
 * Copyright (c) 2014 Andrew Toth
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Wallet handles the address, private key and encryption,
 * as well as sending and determining balance
 */

/**
 * NOTE:
 * Added wallet.mulitpleOutputsSend to handle Protip's block
 * payments. Also released under MIT license.
 * Leo Campbell
 */

(function (window) {
    var balance = 0,
        address = '',
        privateKey = '',
        isEncrypted = false,
        websocket = null,
        balanceListener = null;

    var wallet = function () {};
    wallet.prototype = {

        calculateFee: function(number_of_inputs, number_of_outputs){
            // This limit only applies to reasonably-sized (< 253 inputs and outputs)
            // and standard (one signature required) transactions.
            estimatedFeeSatoshi = Math.ceil((number_of_inputs * 181 + number_of_outputs * 34 + 10)/1000) * 10000;
            return new BigInteger('' + estimatedFeeSatoshi, 10);
        },

        ensureOutputsDoNotExceedInputs: function (txOutputs, inputs) {
            // Adjusts txOutputs to fit within the available inputs.
            // txOutputs should be in decending in priority.
            var selectedOuts = [];
            var totalAmount = BigInteger.ZERO;
            var availableInputsSatoshi = BigInteger.ZERO;
            var fee = new BigInteger('' + 10000, 10);
            var j = 0;
            while (j < inputs.length) {
                // Add the fee first.
                availableInputsSatoshi = availableInputsSatoshi.add(new BigInteger('' + inputs[j].value, 10));
                selectedOuts.push(inputs[j]);
                j++;
                if (availableInputsSatoshi.compareTo(fee) >= 0) break;
            }

            for (var i = 0; i < txOutputs.length; i++) {
                totalAmount = totalAmount.add(new BigInteger('' + txOutputs[i].txSatoshis, 10));
                while (availableInputsSatoshi.compareTo(totalAmount) < 0) {
                    availableInputsSatoshi = availableInputsSatoshi.add(new BigInteger('' + inputs[j].value, 10));
                    if(inputs.length == j) { // on last input
                        var remainingInputSatoshi = inputs[j].value - (totalAmount - availableInputsSatoshi);
                        if(remainingInputSatoshi > 0) {
                            txOutputs[i].txSatoshis = remainingInputSatoshi;
                        }
                        txOutputs = txOutputs.slice(0,i); // truncate txOutputs, no more inputs. Wallet is empty.
                        // This also breaks out of the parent For Loop. txOutputs.length = i;
                        availableInputsSatoshi = 0; // disable the while loop.
                        selectedOuts.push(inputs[j]);
                        break;
                    } else if(inputs.length > j) {
                        selectedOuts.push(inputs[j]);
                        j++;
                    }
                }
            }
            // todo. Check again if fee was correctly calculated. Some txOutputs may have been truncated.
            var totalOutputsSatoshi = _.reduce(selectedOuts, function(memo, obj){ return obj.value + memo; }, 0);
            var totalInputsSatoshi = _.reduce(txOutputs, function(memo, obj){ return obj.txSatoshis + memo; }, 0);

            return {
                txOutputs: txOutputs,
                selectedOuts: selectedOuts,
                totalOutputsSatoshi: new BigInteger('' + totalOutputsSatoshi, 10),
                totalInputsSatoshi: new BigInteger('' + totalInputsSatoshi, 10)
            }
        },

        getAddress: function () {
            return address;
        },

        getBalance: function () {
            return balance;
        },

        isEncrypted: function () {
            return isEncrypted;
        },

        // Balance listener gets called with new balance whenever it updates
        setBalanceListener: function (listener) {
            balanceListener = listener;
        },

        // Create a new address
        generateAddress: function (password) {
            return new Promise(function (resolve, reject) {
                if (ret.validatePassword(password)) {
                    var eckey = new Bitcoin.ECKey(false);
                    if (isEncrypted) {
                        if (typeof chrome !== 'undefined') {
                            privateKey = CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password);
                        } else {
                            privateKey = JSON.parse(CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password, {format:jsonFormatter}));
                        }
                    } else {
                        privateKey = eckey.getExportedPrivateKey();
                    }
                    address = eckey.getBitcoinAddress().toString();
                    balance = 0;
                    Promise.all([preferences.setAddress(address), preferences.setPrivateKey(privateKey), preferences.setIsEncrypted(isEncrypted)]).then(function () {
                        updateBalance()
                        resolve();
                    });
                } else {
                    reject(Error('Incorrect password'));
                }
            });
        },

        // Restore the previously saved address
        restoreAddress: function () {
            return new Promise(function (resolve, reject) {
                Promise.all([preferences.getAddress(), preferences.getPrivateKey(), preferences.getIsEncrypted()]).then(function (values) {
                    if (values[0].length > 0) {
                        address = values[0];
                        privateKey = values[1];
                        isEncrypted = values[2];
                        updateBalance();
                        resolve();
                    } else {
                        reject(Error('No address'));
                    }
                });
            });
        },

        // Import an address using a private key
        importAddress: function (password, _privateKey) {
            return new Promise(function (resolve, reject) {
                if (ret.validatePassword(password)) {
                    try {
                        var eckey = new Bitcoin.ECKey(_privateKey);
                        if (isEncrypted) {
                            if (typeof chrome !== 'undefined') {
                                privateKey = CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password);
                            } else {
                                privateKey = JSON.parse(CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password, {format:jsonFormatter}));
                            }
                        } else {
                            privateKey = eckey.getExportedPrivateKey();
                        }
                        address = eckey.getBitcoinAddress().toString();
                        balance = 0;
                        Promise.all([preferences.setAddress(address), preferences.setPrivateKey(privateKey), preferences.setLastBalance(0)]).then(function () {
                            updateBalance();
                            resolve();
                        });
                    } catch (e) {
                        reject(Error('Invalid private key'));
                    }
                } else {
                    reject(Error('Incorrect password'));
                }
            });
        },

        // Check if the password is valid
        validatePassword: function (password) {
            if (isEncrypted) {
                try {
                    // If we can decrypt the private key with the password, then the password is correct
                    // We never store a copy of the password anywhere
                    if (typeof chrome !== 'undefined') {
                        return CryptoJS.AES.decrypt(privateKey, password).toString(CryptoJS.enc.Utf8);
                    } else {
                        return CryptoJS.AES.decrypt(JSON.stringify(privateKey), password, {format:jsonFormatter}).toString(CryptoJS.enc.Utf8);
                    }
                } catch (e) {
                    return false;
                }
            } else {
                return true;
            }
        },

        // Return a decrypted private key using the password
        getDecryptedPrivateKey: function (password) {
            if (isEncrypted) {
                if (typeof chrome !== 'undefined') {
                    var decryptedPrivateKey = CryptoJS.AES.decrypt(privateKey, password);
                } else {
                    var decryptedPrivateKey = CryptoJS.AES.decrypt(JSON.stringify(privateKey), password, {format:jsonFormatter});
                }
                try {
                    if (!decryptedPrivateKey.toString(CryptoJS.enc.Utf8)) {
                        return null;
                    }
                } catch (e) {
                    return null;
                }
                return decryptedPrivateKey.toString(CryptoJS.enc.Utf8);
            } else {
                return privateKey;
            }
        },

        //         calculateFee: function(number_of_inputs, number_of_outputs){
        //            // This limit only applies to reasonably-sized (< 253 inputs and outputs)
        //            // and standard (one signature required) transactions.
        //            return Math.ceil((number_of_inputs * 181 + number_of_outputs * 34 + 10)/1000) * 10000
        //         },
        //
        // adjustTxValue: function(availableBalance, txOutputs, txValue, selectedOuts, inputs, miniumfee){
        //             // TxValue is converted from Fiat to Satoshi
        //    // adjust TxValue to compensate for minor exchange rate variation
        //    var selectedOuts = [];
        //             var eckey = new Bitcoin.ECKey(decryptedPrivateKey);
        //             // Total cost is amount plus fee
        //             var totalAmount = 0;
        //             for (i = 0; i < txOutputs.length; i++) {
        //                 totalAmount += parseInt(txOutputs[i].txSatoshis);
        //             }
        //             var totalInt = Number(totalAmount) + Number(fee);
        //
        //             var txValue = new BigInteger('' + totalInt, 10);
        //             availableValue = BigInteger.ZERO;
        //             // Gather enough inputs so that their value is greater than or equal to the total cost
        //             for (var i = 0; i < inputs.length; i++) {
        //                 selectedOuts.push(inputs[i]);
        //                 availableValue = availableValue.add(new BigInteger('' + inputs[i].value, 10));
        //                 if (availableValue.compareTo(txValue) >= 0) break;
        //             }
        //    var rangeWiggleRoom.
        //    if (availableValue.compareTo(txValue) < 0) {
        //        return {  }
        //    } else {
        //        totalAmount = totalAmount - 5000;
        //        compileInputs(totalAmount, fee)
        //    }
        //
        //    return {txValue: , selectedOuts: ,
        // }
    };

    // Gets the current balance and sets up a websocket to monitor new transactions
    function updateBalance(confirmations) {
        if(!confirmations){confirmations = 6}
        // Make sure we have an address
        if (address.length) {
            // Last stored balance is the fastest way to update
            preferences.getLastBalance().then(function (result) {
                balance = result;
                if (balanceListener) balanceListener(balance);
                // Check blockchain.info for the current balance
                util.get('https://blockchain.info/q/addressbalance/' + address + '?confirmations=' + confirmations).then(function (response) {
                    balance = response;
                    return preferences.setLastBalance(balance);
                })
                // Websocket just isn't working! It subscribes, but nothing is *ever* received. Disabling until I can make it work.
                // Disabled websocket reduces the number of API calls made.
                // .then(function () {
                //                     if (balanceListener) balanceListener(balance);
                //                     // Close the websocket if it was still open
                //                     if (websocket) {
                //                         websocket.close();
                //                     }
                //                     // Create a new websocket to blockchain.info
                //                     websocket = new WebSocket("wss://ws.blockchain.info/inv");
                //                     websocket.onopen = function() {
                //                         // Tell the websocket we want to monitor the address
                //                         websocket.send('{"op":"addr_sub", "addr":"' + address + '"}');
                //                     };
                //                     websocket.onmessage = function (evt) {
                //
                //                         // Parse the new transaction
                //                         var json = JSON.parse(evt.data);
                //                         var inputs = json.x.inputs;
                //                         var outputs = json.x.out;
                //                         var i;
                //                         // Subtract all inputs from the balance
                //                         for (i = 0; i < inputs.length; i++) {
                //                             var input = inputs[i].prev_out;
                //                             if (input.addr === address) {
                //                                 balance = Number(balance) - Number(input.value);
                //                             }
                //                         }
                //                         // Add all output to the balance
                //                         for (i = 0; i < outputs.length; i++) {
                //                             var output = outputs[i];
                //                             if (output.addr === address) {
                //                                 balance = Number(balance) + Number(output.value);
                //                             }
                //                         }
                //                         // Save the new balance and notify the listener
                //                         preferences.setLastBalance(balance).then(function () {
                //                             if (balanceListener) balanceListener(balance);
                //                         });
                //                     };
                //});
            });
        }
    }

    var ret = new wallet();

    // Change the password to a new password
    wallet.prototype.updatePassword = function (password, newPassword) {
        return new Promise(function (resolve, reject) {
            // Make sure the previous password is correct
            var decryptedPrivateKey = ret.getDecryptedPrivateKey(password);
            if (decryptedPrivateKey) {
                // If we have a new password we use it, otherwise leave cleartext
                if (newPassword) {
                    if (typeof chrome !== 'undefined') {
                        privateKey = CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), newPassword);
                    } else {
                        privateKey = JSON.parse(CryptoJS.AES.encrypt(decryptedPrivateKey, newPassword, {format:jsonFormatter}));
                    }
                    isEncrypted = true;
                } else {
                    privateKey = decryptedPrivateKey;
                    isEncrypted = false;
                }
                // Save the encrypted private key
                // Passwords are never saved anywhere
                Promise.all([preferences.setIsEncrypted(isEncrypted), preferences.setPrivateKey(privateKey)]).then(resolve);
            } else {
                reject(Error('Incorrect password'));
            }
        });
    };

    wallet.prototype.mulitpleOutputsSend = function (txOutputs, fee, password) {
        return new Promise(function (resolve, reject) {
            var decryptedPrivateKey = ret.getDecryptedPrivateKey(password);
            if (decryptedPrivateKey) {
                // Get all unspent outputs from blockchain.info to generate our inputs
                util.getJSON('https://blockchain.info/unspent?address=' + address).then(function (json) {
                    if(typeof json.notice !== "undefined"){
                        reject(Error(json.notice.trim()));
                    }
                    for (i = 0; i < txOutputs.length; i++) {
                      try {
                          new Bitcoin.Address(txOutputs[i].txDest);
                      } catch(e) {
                          // A invalid bitcoin address has entered the DB! Extra filters have been added, so this shouldn't happen,
                          // However if it does happen, just bypass.
                          txOutputs = txOutputs.splice(i,i); // remove invalid bitcoin address
                          continue;
                      }
                    }
                    var inputs = json.unspent_outputs;
                    var eckey = new Bitcoin.ECKey(decryptedPrivateKey);

                    // Create the transaction
                    var sendTx = new Bitcoin.Transaction();
                    // Add *all* unspent inputs, then return the leftover as change. Prevents the wallet
                    // from accumlating many low value inputs. This reduces the fees in the long run and makes the
                    // transaction less likely to be ignored by mining nodes.
                    for (i = 0; i < inputs.length; i++) {
                        var hash = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(inputs[i].tx_hash));
                        var script = new Bitcoin.Script(Crypto.util.hexToBytes(inputs[i].script));
                        var txin = new Bitcoin.TransactionIn({
                            outpoint: {
                                hash: hash,
                                index: inputs[i].tx_output_n
                            },
                            script: script,
                            sequence: 4294967295
                        });
                        sendTx.addInput(txin);
                    }

                    // filter dust.
                    txOutputs = _.reject(txOutputs, function(txOutput){ return txOutput.txSatoshis <= 5430; });

                    var availableInputsSatoshi = _.reduce(inputs, function(memo, obj){ return obj.value + memo; }, 0);
                    availableInputsSatoshi = new BigInteger('' + availableInputsSatoshi, 10);
                    // subtract the fee
                    availableInputsSatoshi = availableInputsSatoshi.subtract(new BigInteger('' + 10000, 10));
                    var dust = new BigInteger('' + 5431, 10);
                    if (availableInputsSatoshi.compareTo(dust) < 0){
                        var msg = 'Available funds ['+availableInputsSatoshi+'] must exceed the mining fee [10000] + min transaction [5430].'
                        reject(Error(msg));
                    }

                    // Add as many send addresses to the transaction as the output as possible.
                    var txValue = BigInteger.ZERO;
                    for (i = 0; i < txOutputs.length; i++) {
                        var inputValue = new BigInteger('' + txOutputs[i].txSatoshis, 10);
                        txValue = txValue.add(inputValue);
                        sendTx.addOutput(new Bitcoin.Address(txOutputs[i].txDest), inputValue);
                        if(availableInputsSatoshi.compareTo(txValue) <= 0){
                            break;
                        }
                    }

                    // Add any leftover value to the transaction as an output pointing back to this wallet,
                    // minus the fee of course
                    var changeValue = availableInputsSatoshi.subtract(txValue);
                    if (changeValue.compareTo(BigInteger.ZERO) > 0) {
                        sendTx.addOutput(eckey.getBitcoinAddress(), changeValue);
                    }

                    // Sign all the input hashes
                    var hashType = 1; // SIGHASH_ALL
                    for (i = 0; i < sendTx.ins.length; i++) {
                        var connectedScript = sendTx.ins[i].script;
                        hash = sendTx.hashTransactionForSignature(connectedScript, i, hashType);
                        var signature = eckey.sign(hash);
                        signature.push(parseInt(hashType, 10));
                        var pubKey = eckey.getPub();
                        script = new Bitcoin.Script();
                        script.writeBytes(signature);
                        script.writeBytes(pubKey);
                        sendTx.ins[i].script = script;
                    }
                    // Push the transaction to blockchain.info
                    var data = 'tx=' + Crypto.util.bytesToHex(sendTx.serialize());
                    console.log(data);
                    util.post('https://blockchain.info/pushtx', data).then(function (response) {
                        try {
                            if (balanceListener) balanceListener(balance - amount - fee);
                        } catch(err) {} // The balance just won't immediately update. It isn't a big deal. The websocket is always dropping out.
                        resolve(response);
                    }, function (response) {
                        reject(Error(response.response.trim()));
                    });
                }, function (error) {
                    if(error.message){error.response = error.message} // Hack to handle network errors on our end.
                    reject(Error(response.response.trim()));
                });
            } else {
                reject(Error('Incorrect password'));
            }
        });
    };

    var jsonFormatter = {
        stringify: function (cipherParams) {
            // create json object with ciphertext
            var jsonObj = {
                ct: cipherParams.ciphertext.toString(CryptoJS.enc.Hex)
            };

            // optionally add iv and salt
            if (cipherParams.iv) {
                jsonObj.iv = cipherParams.iv.toString();
            }
            if (cipherParams.salt) {
                jsonObj.s = cipherParams.salt.toString();
            }

            // stringify json object
            return JSON.stringify(jsonObj);
        },

        parse: function (jsonStr) {
            // parse json string
            var jsonObj = JSON.parse(jsonStr);

            // extract ciphertext from json object, and create cipher params object
            var cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Hex.parse(jsonObj.ct)
            });

            // optionally extract iv and salt
            if (jsonObj.iv) {
                cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
            }
            if (jsonObj.s) {
                cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
            }

            return cipherParams;
        }
    };

    window.wallet = ret;
})(window);