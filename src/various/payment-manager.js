/* payment-manager.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

var paymentManager = function() {};

paymentManager.prototype = {
    satoshis: 100000000,
    fee: function() {
        return this.satoshis * .0001
    },
    subscriptions: function(exchangeRateToSatoshi) {
        return new Promise(function(resolve, reject) {
            var subscriptions = [];
            db.values('subscriptions').done(function(records) {
                var txSatoshis;
                for (let i = 0; i < records.length; i++) {
                    txSatoshis = Math.floor(records[i].amountFiat / exchangeRateToSatoshi);
                    subscriptions.push({
                        txDest: records[i].bitcoinAddress.trim(),
                        txSatoshis: txSatoshis,
                        paymentType: 'subscription'
                    });
                }
                resolve(subscriptions);
            });
        });
    },
    browsing: function(incidentalTotalSatoshi) {
        return new Promise(function(resolve, reject) {
            var sites = [];
            db.values('sites').done(function(records) {

                records = _.filter(records, function(record){ return record.timeOnPage > 0; });
                records = _.sortBy(records, 'timeOnPage').reverse().slice(0,9);

                var totalTime = 0;
                for (let i = 0; i < records.length; i++) {
                    if (records[i].timeOnPage) {
                        totalTime += parseInt(records[i].timeOnPage);
                    }
                }
                var amountCoeff;
                var txSatoshis;
                for (let i = 0; i < records.length; i++) {
                    amountCoeff = (records[i].timeOnPage / totalTime);
                    // Round down. Rounding errors may cause the sumation
                    // of sites[x].txSatoshis to exceed incidentalTotalSatoshi
                    txSatoshis = Math.floor(amountCoeff * incidentalTotalSatoshi);
                    if (txSatoshis > 0) {
                        sites.push({
                            txDest: records[i].bitcoinAddress.trim(),
                            txSatoshis: txSatoshis,
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
        // sort descending
        paymentFiatData = _.sortBy(paymentFiatData, 'amountFiat').reverse();
        // Most browsers do return properties in the same order as they were inserted,
        // but it is explicitly not guaranteed behaviour so you should not rely upon it.
        // In particular see section 12.6.4 of the ECMAScript specification:
        for (let i = 0; i < paymentFiatData.length; i++) {
            var satoshisAsFloat = (parseFloat(paymentFiatData[i].amountFiat) / exchangeRate) * this.satoshis;
            paymentFiatData[i].txSatoshis = Math.floor(parseFloat(satoshisAsFloat));
            paymentFiatData[i].exchangeRate = exchangeRate;
            txTotalSatoshis += paymentFiatData[i].txSatoshis;

            // if exceeded the budget, empty the wallet.
            if (txTotalSatoshis > totalWeeklyBudgetSatoshis) {
                paymentFiatData[i].txSatoshis = paymentFiatData[i].txSatoshis - (txTotalSatoshis - totalWeeklyBudgetSatoshis);
                paymentFiatData[i].amountFiat = ((paymentFiatData[i].txSatoshis / this.satoshis) * exchangeRate).toFixed(2);
                // for record keeping
                paymentFiatData[i].errors = 'Budget exceeded reducing the amount by' + (txTotalSatoshis - totalWeeklyBudgetSatoshis) + 'satoshis';
                paymentObjs.push(paymentFiatData[i]);
                break;
            }
            paymentObjs.push(paymentFiatData[i]);
        }
        return paymentObjs;
    },
    payAll: function(incidentalTotalFiat, subscriptionTotalFiat) {
        // Very important, many currency conversions cause rounding
        // errors, which can result in very small, but important
        // over run of the total weekly budget.
        //
        // This function is intended to produce an array of payment Objects
        // which reflect as accuately as possible the user's desired
        // distribution of funds, and not to exceed the weekly budgets
        // of browsing and subscriptions.
        // The actual balance of the wallet isn't considered here. It is
        // considered in the wallet.mulitpleOutputsSend.
        return new Promise(function(resolve, reject) {
            preferences.getExchangeRate().then(function(exchangeRateToBTC) {
                var exchangeRateToSatoshi = exchangeRateToBTC / this.satoshis;
                var incidentalTotalSatoshi = Math.floor(incidentalTotalFiat / exchangeRateToSatoshi);
                var subscriptionTotalSatoshi = Math.floor(subscriptionTotalFiat / exchangeRateToSatoshi);

                if(this.fee > wallet.getBalance()){
                    reject(Error('Balance must at least exceed minimum Bitcoin fee.'));
                }
                // If the weekly budget exceeds the total balance, then this function
                // just empties the wallet.
                return {
                    exchangeRateToSatoshi: exchangeRateToSatoshi,
                    incidentalTotalSatoshi: incidentalTotalSatoshi,
                    subscriptionTotalSatoshi: subscriptionTotalSatoshi
                }
            }).then(function(resultObj){
                return Promise.all([
                    ret.browsing(resultObj.incidentalTotalSatoshi),
                    ret.subscriptions(resultObj.exchangeRateToSatoshi),
                    new Promise(function (resolve) {
                        resolve(resultObj.incidentalTotalSatoshi)
                    }),
                    new Promise(function (resolve) {
                        resolve(resultObj.subscriptionTotalSatoshi)
                    })
                ]).then(function(results){
                     var browsingPaymentObjs = results[0];
                     var subscriptionsPaymentObjs = results[1];
                     var incidentalTotalSatoshi = results[2];
                     var subscriptionTotalSatoshi = results[3];
                     var availableSatoshi = incidentalTotalSatoshi + subscriptionTotalSatoshi;
                     var selectedPayments = [];
                     var runningTotal = 0;

                   // The Subscriptions have priority over Browsing to the
                   // totalWeeklyBudgetSatoshi do subscriptions first.
                   for (let i=0; subscriptionsPaymentObjs.length > i;i++) {
                       if (runningTotal >= availableSatoshi) {
                           break;
                       }
                       runningTotal += subscriptionsPaymentObjs[i].txSatoshis;
                       if (runningTotal - availableSatoshi > 0) {
                           //empty the wallet
                           subscriptionsPaymentObjs[i].txSatoshis -= runningTotal - availableSatoshi;
                           runningTotal = availableSatoshi;
                       }
                       selectedPayments.push(subscriptionsPaymentObjs[i]);
                   }
                   // Give priority to the remainer of the funds to the largest payments.
                   browsingPaymentObjs = _.sortBy(browsingPaymentObjs, 'txSatoshis').reverse();
                   for (let i=0; browsingPaymentObjs.length > i;i++) {
                       if (runningTotal >= availableSatoshi) {
                           break;
                       }
                       runningTotal += browsingPaymentObjs[i].txSatoshis;
                       if (runningTotal - availableSatoshi > 0) {
                           //empty the wallet
                           browsingPaymentObjs[i].txSatoshis -= runningTotal - availableSatoshi;
                           runningTotal = availableSatoshi;
                       }
                       selectedPayments.push(browsingPaymentObjs[i]);
                   }
                   if (selectedPayments.length == 0) {
                       reject(Error('No browsing history or subscriptions.'));
                   }
                   var calculatedTotalAmountSatoshi = _.reduce(selectedPayments, function(memo, obj){ return obj.txSatoshis + memo; }, 0);
                   if (availableSatoshi >= calculatedTotalAmountSatoshi) {
                       wallet.mulitpleOutputsSend(selectedPayments, this.fee, '').then(function(response) {
                           resolve(response);
                       }, function(error) {
                           reject(Error(error.message));
                       });
                   } else {
                       return Error(
                             'Error: payment totals mismatch. No payments sent.' +
                             'Please report this error to https://github.com/ProTipHQ/ProTip.'
                       );
                   }
               });
            });
        });
    }
}

module.exports = paymentManager
