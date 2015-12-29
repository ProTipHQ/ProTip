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

        getAllUnspentInputs: function (address) {
            var host = 'https://api.blockcypher.com/v1/btc/main/addrs/';
            return util.getJSON(host + address + '?unspentOnly=true&limit=50').then(function (json) {
                var unspent_inputs = [];
                for(var i=0;i<json.txs.length;i++){
                    var tx = json.txs[i];
                    var output = {};
                    output.tx_hash = tx.hash;
                    output.output_index = tx.inputs[0].output_index;
                    for(var j=0;j<tx.outputs.length;j++){
                        if(tx.outputs[j].addresses[0] == address){
                             output.script = tx.outputs[j].script;
                             break;
                        }
                    }
                    unspent_inputs.push(output);
                }
                return unspent_inputs;
            });
        },

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

                var keyPair = bitcoin.ECPair.makeRandom();
                var address = keyPair.getAddress();
                var privateKey = keyPair.toWIF();
                Promise.all([
                    preferences.setAddress(address),
                    preferences.setPrivateKey(privateKey)
                ]).then(function () {
                    updateBalance(0);
                    resolve(address);
                });

                // if (ret.validatePassword(password)) {
                //     var eckey = new bitcoin.ECPair(false);
                //     if (isEncrypted) {
                //         if (typeof chrome !== 'undefined') {
                //             privateKey = CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password);
                //         } else {
                //             privateKey = JSON.parse(CryptoJS.AES.encrypt(eckey.getExportedPrivateKey(), password, {format:jsonFormatter}));
                //         }
                //     } else {
                //         privateKey = eckey.getExportedPrivateKey();
                //     }
                //     address = eckey.getBitcoinAddress().toString();
                //     balance = 0;
                //     Promise.all([preferences.setAddress(address), preferences.setPrivateKey(privateKey), preferences.setIsEncrypted(isEncrypted)]).then(function () {
                //         updateBalance()
                //         resolve();
                //     });
                //
                //
                // } else {
                //     reject(Error('Incorrect password'));
                // }
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
                        var keyPair = bitcoin.ECPair.fromWIF(_privateKey);
                        //var eckey = new bitcoin.ECPair(_privateKey);
                        address = keyPair.getAddress();
                        privateKey = keyPair.toWIF();
                        balance = 0;
                        Promise.all([preferences.setAddress(address), preferences.setPrivateKey(privateKey), preferences.setLastBalance(0)]).then(function () {
                            updateBalance();
                            resolve(address);
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
                util.get('https://api.blockcypher.com/v1/btc/main/addrs/' + address + '/balance').then(function (response) {
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
        if (txOutputs.length <= 0) {
            return Error('No outputs');
        }
        return new Promise(function (resolve, reject) {
            var decryptedPrivateKey = ret.getDecryptedPrivateKey(password);
            if (decryptedPrivateKey) {
                var keyPair = bitcoin.ECPair.fromWIF(decryptedPrivateKey);
                var host = 'https://api.blockcypher.com/v1/btc/main/addrs/';
                util.getJSON(host + keyPair.getAddress() + '?unspentOnly=true&limit=50').then(function (json) {

                    // Include unconfirmed unspent outputs.
                    var txrefs = []
                    if(json.unconfirmed_txrefs){
                        txrefs = txrefs.concat(json.unconfirmed_txrefs);
                    }
                    if(json.txrefs){
                        txrefs = txrefs.concat(json.txrefs);
                    }

                    // Remove duplicates
                    var unspentOutputs = _.map(_.groupBy(txrefs,function(doc){
                        return doc.tx_hash;
                    }),function(grouped){
                        return grouped[0];
                    });

                    var tx = new bitcoin.TransactionBuilder();
                    var totalAvailableUnspentOutputs = 0;
                    for (var i = 0; i < unspentOutputs.length; i++) {
                        tx.addInput(unspentOutputs[i].tx_hash, unspentOutputs[i].tx_output_n);
                        //console.log("tx.addInput('" + unspentOutputs[i].tx_hash + "', "+ unspentOutputs[i].tx_output_n + ");");
                        totalAvailableUnspentOutputs += unspentOutputs[i].value;
                    }

                    var fee = 10000;
                    var dust = 5430;
                    if(totalAvailableUnspentOutputs < (fee + dust)){
                      var msg = 'Available funds ['+totalAvailableUnspentOutputs+'] must exceed the mining fee ['+fee+'] + min transaction ['+dust+'].';
                      reject(Error(msg));
                    }
                    // subtract the fee
                    totalAvailableUnspentOutputs -= fee;

                    // filter dust.
                    txOutputs = _.reject(txOutputs, function(txOutput){ return txOutput.txSatoshis <= dust; });
                    var txValue = 0;
                    for (var i = 0; i < txOutputs.length; i++) {
                        txValue += txOutputs[i].txSatoshis;
                        if(totalAvailableUnspentOutputs - txValue >= 0){
                            tx.addOutput(txOutputs[i].txDest, txOutputs[i].txSatoshis);
                            //console.log("tx.addOutput('"+txOutputs[i].txDest+"', "+txOutputs[i].txSatoshis+");");
                        } else { break }
                    }

                    // Add any leftover value to the transaction as an output pointing back to this wallet,
                    var changeValue = totalAvailableUnspentOutputs - txValue;
                    if (changeValue > dust) {
                        tx.addOutput(keyPair.getAddress(), changeValue);
                        //console.log("tx.addOutput('"+keyPair.getAddress()+"', "+changeValue+");");
                    } // else leave this tiny amount for the miner's fee. Sub-dust outputs should be avoided.

                    // Ensure that the miner's fee must never be more than the standard fee + dust.
                    var totalOut = _.reduce(tx.tx.outs, function(memo, obj){ return obj.value + memo; }, 0);
                    var totalIn = _.reduce(unspentOutputs, function(memo, obj){ return obj.value + memo; }, 0);
                    if(totalIn <= totalOut + fee + dust){ // fixed fee. Tx must be totalIn == totalOut + 10000
                        Error('Transaction malformed, excessive fee. tx.tx.outs:' + tx.tx.outs + " unspentOutputs" + unspentOutputs);
                    }

                    // Sign all inputs with the same key.
                    for (var i = 0; i < tx.inputs.length; i++) {
                        tx.sign(i, keyPair);
                        //console.log("tx.sign("+i+", "+keyPair+");");
                    }

                    // var data = tx.build().toHex();
                    // var blockcypherPush = 'https://api.blockcypher.com/v1/btc/main/txs/push';
                    // return util.post(blockcypherPush, JSON.stringify({tx: data})).then(function (response) {
                    //     //resolve(response);
                    //     resolve('Transaction Sent')
                    // }, function(error){
                    //     reject(Error(error));
                    // });
                }, function (error) {
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