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

function initFilterLevel() {
    if (!localStorage["filterLevel"]) {
        localStorage["filterLevel"] = "2"
    }

    $.each($("input[name=payment-filters]:radio"), function(key, radioBtn) {
        if (localStorage["filterLevel"] == radioBtn.value) {
            radioBtn.checked = true
        }

        $(radioBtn).change(function() {
            localStorage["filterLevel"] = this.value
        });
    });
}

function initPriceOfCoffee() {
    if (!localStorage["priceOfCoffee"]) {
        localStorage["priceOfCoffee"] = "1.0"
    }
    $('#price-of-coffee').change(function() {
        localStorage["priceOfCoffee"] = $('#price-of-coffee').val();
    });
    $('#price-of-coffee').val(localStorage["priceOfCoffee"]);
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

function initialize() {

    // db = new ydn.db.Storage('protip', schema);
    // Going to use *localStore* for the options/preferences because
    // IndexedDB isn't built for a single record options array very
    // well. When wiping the IndexedDB must remember not to wipe the
    // Blacklists.

    initFiatCurrency();
    updateFiatCurrencyCode();
    initFilterLevel();
    initPriceOfCoffee();
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

    initialize()
});