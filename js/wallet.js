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
 * payments.
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
        }

    };

    // Gets the current balance and sets up a websocket to monitor new transactions
    function updateBalance() {
        // Make sure we have an address
        if (address.length) {
            // Last stored balance is the fastest way to update
            preferences.getLastBalance().then(function (result) {
                balance = result;
                if (balanceListener) balanceListener(balance);
                // Check blockchain.info for the current balance
                util.get('https://blockchain.info/q/addressbalance/' + address + '?confirmations=0').then(function (response) {
                    balance = response;
                    return preferences.setLastBalance(balance);
                }).then(function () {
                    if (balanceListener) balanceListener(balance);
                    // Close the websocket if it was still open
                    if (websocket) {
                        websocket.close();
                    }
                    // Create a new websocket to blockchain.info
                    websocket = new WebSocket("ws://ws.blockchain.info:8335/inv");
                    websocket.onopen = function() {
                        // Tell the websocket we want to monitor the address
                        websocket.send('{"op":"addr_sub", "addr":"' + address + '"}');
                    };
                    websocket.onmessage = function (evt) {
                        // Parse the new transaction
                        var json = JSON.parse(evt.data);
                        var inputs = json.x.inputs;
                        var outputs = json.x.out;
                        var i;
                        // Subtract all inputs from the balance
                        for (i = 0; i < inputs.length; i++) {
                            var input = inputs[i].prev_out;
                            if (input.addr === address) {
                                balance = Number(balance) - Number(input.value);
                            }
                        }
                        // Add all output to the balance
                        for (i = 0; i < outputs.length; i++) {
                            var output = outputs[i];
                            if (output.addr === address) {
                                balance = Number(balance) + Number(output.value);
                            }
                        }
                        // Save the new balance and notify the listener
                        preferences.setLastBalance(balance).then(function () {
                            if (balanceListener) balanceListener(balance);
                        });
                    };
                });
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
                    var inputs = json.unspent_outputs;
                    var selectedOuts = [];
                    var eckey = new Bitcoin.ECKey(decryptedPrivateKey);
                    // Total cost is amount plus fee
                    var totalAmount = 0;
                    for (i = 0; i < txOutputs.length; i++) {
                        totalAmount += parseInt(txOutputs[i].txSatoshis);
                    }
                    var totalInt = Number(totalAmount) + Number(fee);
                    var txValue = new BigInteger('' + totalInt, 10);
                    availableValue = BigInteger.ZERO;
                    // Gather enough inputs so that their value is greater than or equal to the total cost
                    for (var i = 0; i < inputs.length; i++) {
                        selectedOuts.push(inputs[i]);
                        availableValue = availableValue.add(new BigInteger('' + inputs[i].value, 10));
                        if (availableValue.compareTo(txValue) >= 0) break;
                    }

                    // If there aren't enough unspent outputs to available then we can't send the transaction
                    if (availableValue.compareTo(txValue) < 0) {
                        reject(Error('Insufficient funds'));
                    } else {
                        // Create the transaction
                        var sendTx = new Bitcoin.Transaction();
                        // Add all our unspent outputs to the transaction as the inputs
                        for (i = 0; i < selectedOuts.length; i++) {
                            var hash = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(selectedOuts[i].tx_hash));
                            var script = new Bitcoin.Script(Crypto.util.hexToBytes(selectedOuts[i].script));
                            var txin = new Bitcoin.TransactionIn({
                                outpoint: {
                                    hash: hash,
                                    index: selectedOuts[i].tx_output_n
                                },
                                script: script,
                                sequence: 4294967295
                            });
                            sendTx.addInput(txin);
                        }
                        // Add the send address to the transaction as the output
                        for (i = 0; i < txOutputs.length; i++) {
                          sendTx.addOutput(new Bitcoin.Address(txOutputs[i].txDest), new BigInteger('' + txOutputs[i].txSatoshis, 10));
                        }
                        // Add any leftover value to the transaction as an output pointing back to this wallet,
                        // minus the fee of course
                        var changeValue = availableValue.subtract(txValue);
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
                        //alert(Crypto.util.bytesToHex(sendTx.serialize()))

                        util.post('https://blockchain.info/pushtx', data).then(function () {
                            // Notify the balance listener of the changed amount immediately,
                            // but don't set the balance since the transaction will be processed by the websocket
                            if (balanceListener) balanceListener(balance - amount - fee);
                            resolve();
                        }, function () {
                            reject(Error('Unknown error'));
                        });
                    }
                }, function () {
                    reject(Error('Unknown error'));
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