/* weekly-budget-widget.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

var weeklyBudgetWidget = {
    totalSubscriptionsFiatAmount: function() {
        return new Promise(function(resolve) {
            db.values('subscriptions').done(function(records) {
                var total = 0.0;
                for (let i in records) {
                    total = total + parseFloat(records[i].amountFiat);
                }
                resolve(total);
            });
        })
    },
    setBudgetWidget: function(availableBalanceFiat, bitcoinFeeFiat) {
        this.initFiatCurrency();
        this.initIncidentalTotalFiat();
        this.initDefaultSubscriptionAmountFiat();
        localStorage['bitcoinFeeFiat'] = bitcoinFeeFiat;

        totalSubscriptionsFiatAmount().then(function(totalSubscriptionFiat) {
            return (function() {
                localStorage['subscriptionTotalFiat'] = totalSubscriptionFiat;
                $('#subscription-fiat-amount').html(parseFloat(totalSubscriptionFiat).formatMoney(2));

                var incidentalTotalFiat = this.setIncidentalTotalFiat(availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionFiat);
                $('#incidental-fiat-amount').val(localStorage['incidentalTotalFiat']);

                var weeklyTotalFiat = this.setWeeklyTotalFiat(localStorage['incidentalTotalFiat'], bitcoinFeeFiat, totalSubscriptionFiat);
                $('#total-fiat-amount').html(weeklyTotalFiat); // use standard money formattor
                currencyManager.amount(availableBalanceFiat).then(function(amountFiat) {
                    if (weeklyTotalFiat > 0) {
                        var balanceCoversXWeeks = (amountFiat - weeklyTotalFiat) / weeklyTotalFiat;
                        if (balanceCoversXWeeks < 0) {
                            balanceCoversXWeeks = 0
                        }
                        $('#balance-covers-weeks').html(balanceCoversXWeeks.toFixed(1));
                    } else {
                        // bypass divide by zero error from wallet with 0 balance
                        $('#balance-covers-weeks').html(0);
                    }
                });

            })(totalSubscriptionFiat, availableBalanceFiat, bitcoinFeeFiat)
        });
    },
    setIncidentalTotalFiat: function(availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionsFiat) {

        var availableIncidentalTotalFiat = parseFloat(availableBalanceFiat) - (parseFloat(bitcoinFeeFiat) + parseFloat(totalSubscriptionsFiat));
        // Handle first time loading with empty wallet.
        if (availableIncidentalTotalFiat < 0) {
            availableIncidentalTotalFiat = 0
        }

        return parseFloat(availableIncidentalTotalFiat);
    },
    setWeeklyTotalFiat: function(incidentalTotalFiat, bitcoinFeeFiat, totalSubscriptionsFiat) {
        var weeklyTotalFiat = parseFloat(bitcoinFeeFiat) + parseFloat(totalSubscriptionsFiat) + parseFloat(incidentalTotalFiat);
        weeklyTotalFiat = parseFloat(weeklyTotalFiat).toFixed(2);
        // fix initializations problem
        if (weeklyTotalFiat < 0) {
            weeklyTotalFiat = 0
        }
        return weeklyTotalFiat;
    },
    initFiatCurrency: function() {
        if (!localStorage["fiatCurrencyCode"]) {
            localStorage["fiatCurrencyCode"] = "USD";
        }
    },
    initDefaultSubscriptionAmountFiat: function() {
        if (!localStorage['defaultSubscriptionAmountFiat']) {
            localStorage['defaultSubscriptionAmountFiat'] = "0.25";
        }
    },
    initIncidentalTotalFiat: function() {
        if (!localStorage['incidentalTotalFiat']) {
            localStorage['incidentalTotalFiat'] = 0;
        }
    }
}

module.exports = weeklyBudgetWidget
