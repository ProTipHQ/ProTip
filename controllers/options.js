function initFiatCurrency() {
    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>

    $('#fiat-currency-select').change(function() {
        preferences.setCurrency($(this.selectedOptions).val());
        localStorage["fiatCurrencyCode"] = this.value;
        updateFiatCurrencyCode();
    });
}

function setExampleMetaTag(){
  $('#example-metatag').html(
   '<meta name="microtip" content="' + wallet.getAddress() + '" data-currency="btc">'
  );
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



// function initAvailableCurrenciesOptions() {
//     if (!localStorage["fiatCurrencyCode"]) {
//         localStorage["fiatCurrencyCode"] = "USD"
//     }
//
//     var currencies = currencyManager.getAvailableCurrencies();
//     for (var i in currencies) {
//         var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
//         $('#fiat-currency-select').append(option);
//     }
//
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         preferences.setCurrency($(this.selectedOptions).val());
//         localStorage["fiatCurrencyCode"] = this.value;
//         updateFiatCurrencyCode();
//     });
// }

// function initAvailableCurrenciesOptions() {
//   var currencies = currencyManager.getAvailableCurrencies();
//   for (var i in currencies) {
//       var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
//       $('#fiat-currency-select').append(option);
//   }
// }

function initialize() {

    // db = new ydn.db.Storage('protip', schema);
    // Going to use *localStore* for the options/preferences because
    // IndexedDB isn't built for a single record options array very
    // well. When wiping the IndexedDB must remember not to wipe the
    // Blacklists.

    initFiatCurrency();
    updateFiatCurrencyCode();
    initAvailableCurrenciesOptions();
    initDefaultSubscriptionAmountFiat();

    allowExternalLinks();

    wallet.restoreAddress().then(function () {
        $('#textAddress').text(wallet.getAddress());
        setExampleMetaTag();
    });

}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    initialize()
});