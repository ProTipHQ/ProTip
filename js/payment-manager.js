(function(window) {
    var paymentManager = function() {};

    var satoshis = 100000000;
    var fee = satoshis * .0001;

    paymentManager.prototype = {

        subscriptions: function(fiatCurrencyCode) {
            return new Promise(function(resolve, reject) {
                var subscriptions = [];
                db.values('subscriptions').done(function(records) {
                    for (i = 0; i < records.length; i++) {
                        subscriptions.push({
                            txDest: records[i].bitcoinAddress.trim(),
                            amountFiat: records[i].amountFiat,
                            currencyCode: fiatCurrencyCode,
                            paymentType: 'subscription'
                        });
                    }
                    resolve(subscriptions);
                });
            });
        },

        browsing: function(incidentalTotalFiat, fiatCurrencyCode) {
            return new Promise(function(resolve, reject) {
                var sites = [];
                db.values('sites').done(function(records) {
                    var totalTime = 0;
                    for (i = 0; i < records.length; i++) {
                        if (records[i].timeOnPage) {
                            totalTime += parseInt(records[i].timeOnPage);
                        }
                    };
                    for (i = 0; i < records.length; i++) {
                        var slice = (records[i].timeOnPage / totalTime).toFixed(2);
                        var amountFiat = parseFloat(slice * parseFloat(incidentalTotalFiat));
                        amountFiat = parseFloat(amountFiat.toFixed(2)); // Don't send less than 1 cent
                        if (amountFiat > 0) {
                            sites.push({
                                txDest: records[i].bitcoinAddress.trim(),
                                amountFiat: amountFiat,
                                currencyCode: fiatCurrencyCode,
                                paymentType: 'browsing'
                            });
                        }
                    }
                    resolve(sites);
                });
            });
        },

        processPayments: function(paymentFiatData, totalWeeklyBudgetSatoshis, exchangeRate) {
            // Add the payments *upto* fiat budget.
            var paymentObjs = [];

            var txTotalSatoshis = 0;

            paymentFiatData = _.sortBy(paymentFiatData, 'amountFiat').reverse(); // sort descending
            // Most browsers do return properties in the same order as they were inserted,
            // but it is explicitly not guaranteed behaviour so you should not rely upon it.
            // In particular see section 12.6.4 of the ECMAScript specification:

            for (i = 0; i < paymentFiatData.length; i++) {
                var satoshisAsFloat = (parseFloat(paymentFiatData[i].amountFiat) / exchangeRate) * satoshis;
                paymentFiatData[i].txSatoshis = parseInt(satoshisAsFloat);
                paymentFiatData[i].exchangeRate = exchangeRate;
                txTotalSatoshis += paymentFiatData[i].txSatoshis;

                if (txTotalSatoshis > totalWeeklyBudgetSatoshis) { // if exceeded the budget, empty the wallet.
                    paymentFiatData[i].txSatoshis = paymentFiatData[i].txSatoshis - (txTotalSatoshis - totalWeeklyBudgetSatoshis);
                    paymentFiatData[i].amountFiat = ((paymentFiatData[i].txSatoshis / satoshis) * exchangeRate).toFixed(2);
                    paymentFiatData[i].errors = 'Budget exceeded reducing the amount by' + (txTotalSatoshis - totalWeeklyBudgetSatoshis) + 'satoshis'; // for record keeping
                    paymentObjs.push(paymentFiatData[i]);
                    break;
                }
                paymentObjs.push(paymentFiatData[i]);
            }
            return paymentObjs;
        },

        totalSubscriptionsFiat: function(subscriptions) {
            var total = 0.0;
            for (i = 0; i < subscriptions.length; i++) {
                total += parseFloat(subscriptions[i].amountFiat);
            }
            return total
        },

        totalIncidentalFiat: function(sites) {
            var total = 0;
            for (i = 0; i < sites.length; i++) {
                if (sites[i].amountFiat) {
                    total += parseFloat(sites[i].amountFiat);
                }
            }
            return total;
        },

        payAll: function() {
            return new Promise(function(resolve, reject) {
                Promise.all([
                    preferences.getExchangeRate(),
                    ret.browsing(
                        localStorage['incidentalTotalFiat'],
                        localStorage['totalTime'],
                        localStorage['fiatCurrencyCode']
                    ),
                    ret.subscriptions(localStorage['fiatCurrencyCode'])
                ]).then(function(result) {
                    var exchangeRate = result[0];
                    var browsing = result[1];
                    var subscriptions = result[2];
                    var totalSubscriptionsFiat = ret.totalSubscriptionsFiat(subscriptions);
                    var totalIncidentalFiat = ret.totalIncidentalFiat(browsing);

                    var totalFiat = parseFloat(totalIncidentalFiat) + parseFloat(totalSubscriptionsFiat);

                    var totalWeeklyBudgetSatoshis = parseInt(totalFiat / exchangeRate * satoshis);

                    var balanceSatoshis = parseInt(wallet.getBalance());

                    if (balanceSatoshis < fee) {
                        // wallet is effectively empty
                        reject(Error('Balance must at least exceed minimum Bitcoin fee.'));
                        //console.log('wallet is effectively empty');
                        //return false;
                    } else if ((totalWeeklyBudgetSatoshis + fee) > balanceSatoshis) { // do not exceed current balance.
                        totalWeeklyBudgetSatoshis = balanceSatoshis - fee; // If insufficent funds just empty the wallet.
                    }

                    subscriptions = ret.processPayments(subscriptions, totalWeeklyBudgetSatoshis, exchangeRate); // fulfil subscriptions first.
                    browsing = ret.processPayments(browsing, totalWeeklyBudgetSatoshis, exchangeRate);
                    var paymentObjs = subscriptions.concat(browsing);

                    if (paymentObjs.length > 0) {
                        wallet.mulitpleOutputsSend(paymentObjs, fee, '').then(function(response) {
                            // console.log('---Automatic Payments ---');
                            // console.log(paymentObjs);
                            // console.log('-------------------------');
                            db.clear('sites');
                            resolve(response);
                        }, function(error){
                            reject(Error(error.message));
                        });
                    } else {
                        reject(Error('No browsing history or subscriptions.'));
                    }
                });
            });
        }
    }

    var ret = new paymentManager();
    window.paymentManager = ret;

})(window);