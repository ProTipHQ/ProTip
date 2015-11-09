
function initDefaultBlacklistedHostnames() {
    hostnames = [{
        hostname: "www.bitfinex.com"
    }, {
        hostname: "btc-e.com"
    }, {
        hostname: "www.bitstamp.net"
    }, {
        hostname: "blockexplorer.com"
    }, {
        hostname: "insight.bitpay.com"
    }, {
        hostname: "blockchain.info"
    }, {
        hostname: "google.com"
    }, {
        hostname: "google.co.uk"
    }]

    db.put('blacklistedhostnames', hostnames);
}

function initSponsors() {
    sponsorTwitterHandles = [{
        twitterhandle: "KiskaZilla"
    }, {
        twitterhandle: "mrchrisellis"
    }, {
        twitterhandle: "victoriavaneyk"
    }, {
        twitterhandle: "shop_rocket"
    }, {
        twitterhandle: "HardBTC"
    }, {
        twitterhandle: "M3metic"
    }, {
        twitterhandle: "brennannovak"
    }, {
        twitterhandle: "Bittylicious_"
    }, {
        twitterhandle: "agoodman1111"
    }, {
        twitterhandle: "Calem_Smith"
    }, {
        twitterhandle: "makevoid"
    }, {
        twitterhandle: "bitcoinpotato"
    }, {
        twitterhandle: "MadBitcoins"
    }, {
        twitterhandle: "LesleeFrost"
    }, {
        twitterhandle: "prestonjbyrne"
    }, {
        twitterhandle: "j32804"
    }, {
        twitterhandle: "NixiePixel"
    }, {
        twitterhandle: "OllyNewport"
    }, {
        twitterhandle: "mormo_music"
    }, {
        twitterhandle: "MinuteEarth"
    }, {
        twitterhandle: "rhian_is"
    }, {
        twitterhandle: "fliptopbox13"
    }, {
        twitterhandle: "TomerKantor"
    }, {
        twitterhandle: "louissschang"
    }, {
        twitterhandle: "ProofOfWork"
    }, {
        twitterhandle: "LaraCelenza"
    }];

    db.put('sponsors', sponsorTwitterHandles);
}

// function initFiatCurrency() {
//     if (!localStorage["fiatCurrencyCode"]) {
//         localStorage["fiatCurrencyCode"] = "USD"
//     }
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//         localStorage["fiatCurrencyCode"] = this.value;
//         db.values('subscriptions').done(function(records) {
//             util.getJSON('http://api.fixer.io/latest?symbols=' + localStorage["fiatCurrencyCode"] + ',' + oldFiatCurrencyCode).then(
//                 function(ratesData){
//                     var exchangeRate = ratesData.rates[localStorage["fiatCurrencyCode"]] / ratesData.rates[oldFiatCurrencyCode];
//                     for (var i in records) {
//                         records[i].amountFiat = records[i].amountFiat * exchangeRate;
//                     }
//                     db.put('subscriptions', records);
//
//                     localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * exchangeRate;
//                     $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//                     localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * exchangeRate;
//                 }
//             ).then(function(){
//                 preferences.setCurrency($(this.selectedOptions).val());
//                 updateFiatCurrencyCode();
//             });
//         });
//     });
// }

function initFiatCurrency() {
    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    var currencies = currencyManager.getAvailableCurrencies();
    for (var i in currencies) {
        var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
        $('#fiat-currency-select').append(option);
    }

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>

    $('#fiat-currency-select').change(function() {
        $('#ajax-loader').show();
        currencyManager.getExchangeRateCoeff({
            newCurrencyCode: this.value,
            oldFiatCurrencyCode: localStorage["fiatCurrencyCode"]
        }).then(function(response){
            perferences.setCurrency(response.newCurrencyCode).then(function(){
                updateGlobalOptionsAmount(response.exchangeRateCoeff, response.newCurrencyCode);
                localStorage["fiatCurrencyCode"] = response.newCurrencyCode;
                updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
                $('#ajax-loader').hide();
            });
        });
        // }, function(response){
        //   // If all fails, reset to USD
        //   localStorage["fiatCurrencyCode"] = 'USD';
        //   $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
        //   updateFiatCurrencyCode();
        // });
    });
}

function updateFiatCurrencyCode() {
    currencyManager.getSymbol().then(function(symbol){
        $.each($(".fiat-code"), function(key, element) {
            element.textContent = symbol[0];
        });
    });
}

function setupWallet() {
    wallet.restoreAddress().then(setAddress,
        function() {
            return wallet.generateAddress();
        }).then(setAddress,
        function() {
            alert('Failed to generate wallet. Refresh and try again.');
        });

    function setAddress() {
        $('#textAddress').text(wallet.getAddress());
        $('#private-key-input').val(wallet.getDecryptedPrivateKey(''));
    }
}

function millisecondsToDays(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    return days;
}

function daysTillEndOWeek(endOfWeek) {
    var now = (new Date).getTime();
    var milliseconds = endOfWeek - now;
    return millisecondsToDays(milliseconds)
}

function restartTheWeek() {
    var now = (new Date).getTime();
    var milliSecondsInWeek = 604800000;
    var extraHour = 3600000; // add an hour to help the UI design.

    var alarm = now + milliSecondsInWeek + extraHour;

    var endOfWeek = new Date(alarm);

    var daysRemaining = daysTillEndOWeek(endOfWeek);

    localStorage['endOfWeek'] = alarm;
}

$(document).ready(function() {
    db = new ydn.db.Storage('protip', schema);

    initFiatCurrency();
    initDefaultBlacklistedHostnames();
    initSponsors();
    setupWallet();

    if(!localStorage['availableBalanceFiat']){
        localStorage['availableBalanceFiat'] = 0.00;
    }
    if(!localStorage['bitcoinFeeFiat']){
        localStorage['bitcoinFeeFiat'] = 0.02;
    }
    if(!localStorage['subscriptionTotalFiat']){
        localStorage['subscriptionTotalFiat'] = 0.00
    }
    if(!localStorage['incidentalTotalFiat']){
        localStorage['incidentalTotalFiat'] = 0.00
    }

    allowExternalLinks();

    $('#launch').click(function(obj){
        localStorage['proTipInstalled'] = true;
        if(localStorage['protip-popup-install']){
           chrome.tabs.create({
                url: "views/home.html" // obj.href
           });
        } else {
           window.location.href = "home.html";
        }
    });

    // Start the clock running.
    window.alarmManager.doToggleAlarm();
    restartTheWeek();

    /*
     *  Import Private Key
     */
    $('#importPrivateKey').click(function() {
        $('#importPrivateKeyPasswordIncorrect').hide();
        $('#importPrivateKeyBadPrivateKey').hide();
        if (wallet.isEncrypted()) {
            $('#importPrivateKeyPassword').val(null).show();
        } else {
            $('#importPrivateKeyPassword').hide();
        }
        $('#importPrivateKeyPrivateKey').val(null);
        $('#importPrivateKeyModal').modal().show();
    });

    $('#importPrivateKeyConfirm').click(function() {
        var privateKey = $('#importPrivateKeyPrivateKey').val();
        try {
            new bitcoin.ECPair.fromWIF(privateKey);
            //new bitcoin.ECPair(privateKey).getExportedPrivateKey();
        } catch (e) {
            $('#importPrivateKeyBadPrivateKey').slideDown();
            return;
        }
        wallet.importAddress($('#importPrivateKeyPassword').val(), privateKey).then(function() {
            setupWallet();
            $('#successAlertLabel').text('Private key imported successfully.');
            $('#successAlertLabel').slideDown();
            $('#private').slideUp();
            $('#middle-aligned-media').slideUp();
        }, function(e) {
            if (e.message === 'Incorrect password') {
                $('#importPrivateKeyBadPrivateKey').slideUp();
                $('#importPrivateKeyPasswordIncorrect').slideDown();
            } else {
                $('#importPrivateKeyPasswordIncorrect').slideUp();
                $('#importPrivateKeyBadPrivateKey').slideDown();
            }
        });
    });

});