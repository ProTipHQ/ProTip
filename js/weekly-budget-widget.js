function totalSubscriptionsFiatAmount() {
    return new Promise(function(resolve, reject) {
        db.values('subscriptions').done(function(records) {
            var total = 0.0;
            for (var i in records) {
                total = total + parseFloat(records[i].amountFiat);
            }
            resolve(total);
        });
    })
}

function setBudgetWidget(availableBalanceFiat, bitcoinFeeFiat) {
    initFiatCurrency();
    initDefaultSubscriptionAmountFiat();
    localStorage['bitcoinFeeFiat'] = bitcoinFeeFiat;
    totalSubscriptionsFiatAmount().then(function(totalSubscriptionFiat) {
        return (function() {
            localStorage['subscriptionTotalFiat'] = totalSubscriptionFiat;
            $('#subscription-fiat-amount').html(totalSubscriptionFiat);

            var incidentalTotalFiat = setIncidentalTotalFiat(availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionFiat);
            var weeklyTotalFiat = setWeeklyTotalFiat(incidentalTotalFiat, availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionFiat);

            if (weeklyTotalFiat > 0) {
                var balanceCoversXWeeks = (availableBalanceFiat - weeklyTotalFiat) / weeklyTotalFiat;
                if (balanceCoversXWeeks < 0) {
                    balanceCoversXWeeks = 0
                }
                $('#balance-covers-weeks').html(balanceCoversXWeeks.toFixed(1));
            } else {
                // bypass divide by zero error from wallet with 0 balance
                $('#balance-covers-weeks').html(0);
            }

        })(totalSubscriptionFiat, availableBalanceFiat, bitcoinFeeFiat)
    });
}

function setIncidentalTotalFiat(availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionsFiat) {
    if (!localStorage['incidentalTotalFiat']) {
        localStorage['incidentalTotalFiat'] = 0;
    }
    var total = parseFloat(localStorage['incidentalTotalFiat']) + parseFloat(bitcoinFeeFiat) + parseFloat(totalSubscriptionsFiat)
    var availableIncidentalTotalFiat = parseFloat(availableBalanceFiat) - (parseFloat(bitcoinFeeFiat) + parseFloat(totalSubscriptionsFiat));
    if (availableIncidentalTotalFiat < 0) {
        availableIncidentalTotalFiat = 0
    } // Handle first time loading with empty wallet.
    $('#incidental-fiat-amount').val(localStorage['incidentalTotalFiat']);
    return parseFloat(localStorage['incidentalTotalFiat']);
}

function setWeeklyTotalFiat(incidentalTotalFiat, availableBalanceFiat, bitcoinFeeFiat, totalSubscriptionsFiat) {

    var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
    weeklyTotalFiat = parseFloat(weeklyTotalFiat).toFixed(2);
    if (weeklyTotalFiat < 0) {
        weeklyTotalFiat = 0
    } // fix initializations problem.
    $('#total-fiat-amount').html(weeklyTotalFiat); // use standard money formattor
    return weeklyTotalFiat;
}

function initFiatCurrency() {
    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD";
    }
}

function initDefaultSubscriptionAmountFiat() {
    if (!localStorage['defaultSubscriptionAmountFiat']) {
        localStorage['defaultSubscriptionAmountFiat'] = "0.25";
    }
}