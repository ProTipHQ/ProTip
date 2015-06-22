
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

    allowExternalLinks();
    $('#launch').click(function(){
        localStorage['proTipInstalled'] = true;
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
            new Bitcoin.ECKey(privateKey).getExportedPrivateKey();
        } catch (e) {
            $('#importPrivateKeyBadPrivateKey').slideDown();
            return;
        }
        wallet.importAddress($('#importPrivateKeyPassword').val(), privateKey).then(function() {
            setupWallet();
            $('#successAlertLabel').text('Private key imported successfully.');
            $('#successAlertLabel').slideDown();
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