/* install.js
 * ProTip 2015-2018
 * License: GPL v3.0
 */

function initDefaultBlacklistedHostnames() {
    var hostnames = [{
        hostname: "archive.is"
    }, {
        hostname: "archive.org"
    }, {
        homename: "bitcoin.com"
    }, {
        hostname: "wallet.bitcoin.com"
    }, {
        hostname: "bitconnect.co"
    }, {
        hostname: "bitcoinmillions.co"
    }, {
        hostname: "www.bitfinex.com"
    }, {
        hostname: "bittrex.com"
    }, {
        hostname: "www.bitstamp.net"
    }, {
        hostname: "www.blockexperts.com"
    }, {
        hostname: "blockexplorer.com"
    }, {
        hostname: "blockchain.info"
    }, {
        hostname: "www.blockcypher.com"
    }, {
        hostname: "live.blockcypher.com"
    }, {
        hostname: "www.blocktrail.com"
    }, {
        hostname: "btc-e.com"
    }, {
        hostname: "www.btcc.com"
    }, {
        hostname: "circle.com"
    }, {
        hostname: "coinbase.com"
    }, {
        hostname: "coinmarketcap.com"
    }, {
        hostname: "edgesecure.co"
    }, {
        hostname: "google.com"
    }, {
        hostname: "google.co.uk"
    }, {
        hostname: "insight.bitpay.com"
    }, {
        hostname: "kraken.com"
    }, {
        hostname: "ledgerwallet.com"
    }, {
        hostname: "poloniex.com"
    }, {
        hostname: "www.poloniex.com"
    }, {
        hostname: "trezor.io"
    }]

    db.put('blacklistedhostnames', hostnames);
}

function initSponsors() {
    var sponsorTwitterHandles = [{
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

function initFiatCurrency() {
    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    var currencies = currencyManager.getAvailableCurrencies();
    for (let i in currencies) {
        var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
        $('#fiat-currency-select').append(option);
    }

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    updateFiatCurrencyCode();

    $('#fiat-currency-select').change(function() {
        $('#ajax-loader').show();
        var updateCurrency
        var updateGlobalOptionsAmount
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
}

function updateFiatCurrencyCode() {
    currencyManager.getSymbol().then(function(symbol) {
        $.each($(".fiat-code"), function(key, element) {
            element.textContent = symbol[0];
        });
    });
}

function setupWallet() {

    function setAddress() {
        preferences.getPrivateKey().then(function(privateKey) {
            $('#private-key-input').val(privateKey);
        });
        preferences.getAddress().then(function(address) {
            $('#textAddress').text(address());
        });
    }

    wallet.restoreAddress().then(setAddress(),
        function() {
            return wallet.generateAddress();
        }).then(function() {
            setAddress();
        },
        function() {
            alert('Failed to generate wallet. Refresh and try again.');
        }
    );
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
    var extraHour = 3600000;
    var alarm = now + milliSecondsInWeek + extraHour;
    localStorage['endOfWeek'] = alarm;
}

var db;

$(document).ready(function() {

    db = new ydn.db.Storage('protip', schema);

    initFiatCurrency();
    initDefaultBlacklistedHostnames();
    initSponsors();
    setupWallet();
    allowExternalLinks();

    if (!localStorage['availableBalanceFiat']) {
        localStorage['availableBalanceFiat'] = 0.00;
    }
    if (!localStorage['bitcoinFeeFiat']) {
        localStorage['bitcoinFeeFiat'] = 0.02;
    }
    if (!localStorage['subscriptionTotalFiat']) {
        localStorage['subscriptionTotalFiat'] = 0.00
    }
    if (!localStorage['incidentalTotalFiat']) {
        localStorage['incidentalTotalFiat'] = 0.00
    }

    $('#launch').click(function() {
        localStorage['proTipInstalled'] = true;
        if (localStorage['protipPopupInstall']) {
           browser.tabs.create({
                url: "/views/home.html"
           });
        } else {
           window.location.href = "home.html";
        }
    });

    // Start the clock running.
    window.alarmManager.doToggleAlarm();
    restartTheWeek();

    //  Import Private Key
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
