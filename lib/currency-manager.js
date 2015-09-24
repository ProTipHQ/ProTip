/**
 * currency-manager.js
 * Copyright (c) 2014 Andrew Toth
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Currency manager handles the exchange rate of the currency
 * and the proper formatting of the currency value
 */

(function (window) {
    var currencyManager = function () {};
    currencyManager.prototype = {

        updateExchangeRate: function () {
            return preferences.getCurrency().then(function (currency) {
                switch (currency) {
                    // for BTC and mBTC we don't need to get exchange rate
                    // Bit of a hack for BTC. The wallet balance is always stored in Satoshi.
                    case 'BTC':
                        return new Promise(function (resolve, reject) { return {'24h_avg': 1}}); // hack hack
                    case 'mBTC':
                        return new Promise(function (resolve, reject) { return {'24h_avg': 1000}}); // hack hack
                    default:
                        return util.getJSON('https://api.bitcoinaverage.com/ticker/' + currency);
                }
            }).then(function (response) {
                return preferences.setExchangeRate(response['24h_avg']);
            });
        },

        getSymbol: function () {
            return preferences.getCurrency().then(function (currency) {
                switch (currency) {
                    case 'BTC':
                        return(['BTC', 'before']);
                    case 'mBTC':
                        return(['mBTC', 'before']);
                    case 'AUD':
                    case 'CAD':
                    case 'NZD':
                    case 'SGD':
                    case 'USD':
                        return(['$', 'before']);
                    case 'BRL':
                        return(['R$', 'before']);
                    case 'CHF':
                        return([' Fr.', 'after']);
                    case 'CNY':
                    case 'JPY':
                        return(['¥', 'before']);
                    case 'CZK':
                        return([' Kč', 'after']);
                    case 'EUR':
                        return(['€', 'before']);
                    case 'GBP':
                        return(['£', 'before']);
                    case 'ILS':
                        return(['₪', 'before']);
                    case 'NOK':
                    case 'SEK':
                        return([' kr', 'after']);
                    case 'PLN':
                        return(['zł', 'after']);
                    case 'RUB':
                        return([' RUB', 'after']);
                    case 'ZAR':
                        return([' R', 'after']);
                    default:
                        return(['$', 'before']);
                }
            });
        },

        getAvailableCurrencies: function () {
            return ['BTC', 'mBTC', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'EUR', 'GBP', 'ILS', 'JPY', 'NOK', 'NZD', 'PLN', 'RUB', 'SEK', 'SGD', 'USD', 'ZAR'];
        },

        amount: function (valueSatoshi) {
            return Promise.all([preferences.getExchangeRate(), this.getSymbol()]).then(function (values) {
                var rate,
                    SATOSHIS = 100000000;
                switch (values[1][0]) {
                    case 'BTC':
                        return valueSatoshi / SATOSHIS;
                    case 'mBTC':
                        return valueSatoshi / 100000;
                    default:
                        return (valueSatoshi / SATOSHIS * values[0]).formatMoney(2);
                }
            });
        },

        formatCurrency: function(value) {
            return Promise.all([this.amount(value), this.getSymbol()]).then(function (results) {
                var symbol = results[1][0],
                    beforeOrAfter = results[1][1],
                    amount = results[0];
                switch (symbol) {
                    // 'BTC' should not be rounded and not formatted like regular fiat.
                    case 'BTC':
                        return 'BTC ' + amount;
                    case 'mBTC':
                        return 'mBTC ' + amount;
                    default:
                        // Format fiat money
                        if ( amount < 0.01 ) { amount = 0 } // We only want to do this Fiat currency.
                        var text = parseFloat(amount.formatMoney(2));
                        if (beforeOrAfter === 'before') {
                            text = symbol + text;
                        } else {
                              text += symbol;
                        }
                        return text;
                }
           });
        },

        formatAmount: function (value) {
            return Promise.all([preferences.getExchangeRate(), this.getSymbol()]).then(function (values) {
                var rate = values[0],
                    symbol = values[1][0],
                    beforeOrAfter = values[1][1],
                    SATOSHIS = 100000000,
                    amount = (value / SATOSHIS * rate);
                if ( amount < 0.01 ) { amount = 0 }
                var text = amount.formatMoney(2);
                if (beforeOrAfter === 'before') {
                    text = symbol + text;
                } else {
                    text += symbol;
                }
                return text;
            });
        },
    };

    Number.prototype.formatMoney = function(c, d, t){
        var n = this,
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    };

    var ret = new currencyManager();
    ret.updateExchangeRate();
    window.currencyManager = ret;

})(window);