/* options.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

function setExampleMetaTag() {
    $('#example-metatag')
        .html('<meta name="microtip" content="' + wallet.getAddress() + '" data-currency="btc">');
}

function resetToDefaults() {
    localStorage['defaultSubscriptionAmountFiat'] = "0.25"
    localStorage["fiatCurrencyCode"] = 'USD';
    localStorage["incidentalTotalFiat"] = '1';
    preferences.set({
        currency: 'USD'
    });
}

function initDefaultSubscriptionAmountFiat() {
    if (!localStorage['defaultSubscriptionAmountFiat']) {
        localStorage['defaultSubscriptionAmountFiat'] = "0.25"
    }

    $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);

    $('#default-subscription-amount-fiat').change(function() {
        localStorage['defaultSubscriptionAmountFiat'] = this.value;
    });
}

function initErrorLog() {
    var errors = JSON.parse(localStorage.getItem("errorLog"));
    errors.forEach(function(element) {
      $('#console-log').append(element + '&#xA;');
    });
}

function clearLog() {
    localStorage.setItem("errorLog", JSON.stringify([]));
    $('#console-log').empty();
}

$(document).ready(function() {

    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    // Going to use *localStore* for the options/preferences because
    // IndexedDB isn't built for a single record options array very well.
    // When wiping the IndexedDB must remember not to wipe the Blacklists.
    db = new ydn.db.Storage('protip', schema);

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    $('#fiat-currency-select').change(function() {
        $('#ajax-loader').show();
        updateCurrency(this.value, localStorage["fiatCurrencyCode"]).then(function(response) {
            updateGlobalOptionsAmount(response.exchangeRateCoeff, response.newCurrencyCode);
            localStorage["fiatCurrencyCode"] = response.newCurrencyCode;
            updateFiatCurrencyCode();
            $('#ajax-loader').hide();
        }, function() {
            // If all fails, reset to USD
            localStorage["fiatCurrencyCode"] = 'USD';
            preferences.setCurrency(localStorage['fiatCurrencyCode']);
            $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
            updateFiatCurrencyCode();
            $('#ajax-loader').hide();
        });
    });

    $('#clear-log').click(function() {
        clearLog()
    });

    initAvailableCurrenciesOptions();
    initDefaultSubscriptionAmountFiat();
    initErrorLog();
    allowExternalLinks();

    wallet.restoreAddress().then(function() {
        setExampleMetaTag();
    });
});