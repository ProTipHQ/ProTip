/**
 * preferences.js
 * Copyright (c) 2014 Andrew Toth
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Preferences handles storing and retrieving saved values
 */

(function (window) {

    var ADDRESS = "wallet.address",
        PRIVATE_KEY = "wallet.private_key",
        IS_ENCRYPTED = "wallet.is_encrypted",
        LAST_BALANCE = "wallet.last_balance",
        EXCHANGE_RATE = 'wallet.exchange_rate',
        BTC_UNITS = 'wallet.btc_units',
        CURRENCY = 'wallet.currency',
        preferences = function() {};

    function sync() {
        return new Promise(function (resolve) {
            // Different APIs for Chrome and Firefox
            if (typeof chrome !== 'undefined') {
                var object = {};
                object[ADDRESS] = '';
                object[PRIVATE_KEY] = '';
                object[IS_ENCRYPTED] = false;
                object[LAST_BALANCE] = 0;
                object[EXCHANGE_RATE] = 0;
                object[BTC_UNITS] = 'BTC';
                object[CURRENCY] = 'USD';
                chrome.storage.sync.get(object, resolve);
            } else {
                util.message('get').then(function (message) {
                    if (typeof message[PRIVATE_KEY] === 'undefined') {
                        message[ADDRESS] = '';
                        message[PRIVATE_KEY] = '';
                        message[IS_ENCRYPTED] = false;
                        message[LAST_BALANCE] = 0;
                        message[EXCHANGE_RATE] = 0;
                        message[BTC_UNITS] = 'BTC';
                        message[CURRENCY] = 'USD';
                        return util.message('save', message);
                    } else {
                        return message;
                    }
                }).then(function (message) {
                    resolve(message);
                });
            }
        });
    }

    function get(pref) {
        return function () {
            return sync().then(function (values) {
                return values[pref];
            });
        };
    };

    function set(key, value) {
        return new Promise(function (resolve) {
            var object = {};
            object[key] = value;
            // Different APIs for Chrome and Firefox
            if (typeof chrome !== 'undefined') {
                chrome.storage.sync.set(object, resolve);
            } else {
                util.message('save', object).then(resolve);
            }
        });
    };

    preferences.prototype = {

        getAddress: get(ADDRESS),
        setAddress: function (address) {
            return set(ADDRESS, address);
        },

        getPrivateKey: get(PRIVATE_KEY),
        setPrivateKey: function (privateKey) {
            return set(PRIVATE_KEY, privateKey);
        },

        getIsEncrypted: get(IS_ENCRYPTED),
        setIsEncrypted: function (isEncrypted) {
            return set(IS_ENCRYPTED, isEncrypted);
        },

        getLastBalance: get(LAST_BALANCE),
        setLastBalance: function (lastBalance) {
            return set(LAST_BALANCE, lastBalance);
        },

        getExchangeRate: get(EXCHANGE_RATE),
        setExchangeRate: function (exchangeRate) {
            return set(EXCHANGE_RATE, exchangeRate);
        },

        getBTCUnits: get(BTC_UNITS),
        setBTCUnits: function (btcUnits) {
            return set(BTC_UNITS, btcUnits);
        },

        getCurrency: get(CURRENCY),
        setCurrency: function (currency) {
            return set(CURRENCY, currency).then(function () {
                currencyManager.updateExchangeRate();
            });
        }
    };

    window.preferences = new preferences();

})(window);