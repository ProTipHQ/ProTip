function initDefaultProTipSubscriptions() {
    db.put('subscriptions', {
        title: "Support ProTip's ongoing development",
        bitcoinAddress: '1ProTip9x3uoqKDJeMQJdQUCQawDLauNiF',
        amountFiat: '0.25',
        url: 'my.protip.is'
    });
}

function initDefaultExampleWebsite() {
    db.put('sites', {
        title: "Example website",
        bitcoinAddress: '1xxxxxxxxxxxxxxxxxxxxxx',
        url: 'http://example.com'
    });
}

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

function initPriceOfCoffee() {
    if (!localStorage["priceOfCoffee"]) {
        localStorage["priceOfCoffee"] = "2.0"
    }
    $('#price-of-coffee').change(function() {
        localStorage["priceOfCoffee"] = $('#price-of-coffee').val();
    });
    $('#price-of-coffee').val(localStorage["priceOfCoffee"]);
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
    $.each($(".fiat-code"), function(key, element) {
        element.textContent = localStorage["fiatCurrencyCode"];
    });
}

$(document).ready(function() {
    db = new ydn.db.Storage('protip', schema);


    initPriceOfCoffee();
    initFiatCurrency();
    initDefaultBlacklistedHostnames();
    //initDefaultProTipSubscriptions();
    initSponsors();

    $('#launch').click(function(){
        localStorage['proTipInstalled'] = true;
        window.location.replace("popup.html");
    });

    // Setup the wallet, page values and callbacks
    var val = '',
        address = '',
        SATOSHIS = 100000000,
        FEE = SATOSHIS * .0001,
        BTCUnits = 'BTC',
        BTCMultiplier = SATOSHIS;

    function setupWallet() {
        wallet.restoreAddress().then(setQRCodes,
            function() {
                return wallet.generateAddress();
            }).then(setQRCodes,
            function() {
                alert('Failed to generate wallet. Refresh and try again.');
            });

        function setQRCodes() {
            //$('#qrcode').html(createQRCodeCanvas(wallet.getAddress()));
            //$('#qrcode').html(createQRCodeCanvas(wallet.getDecryptedPrivateKey(''));

            $('#textAddress').text(wallet.getAddress());
            //$('#private-key').text(wallet.getDecryptedPrivateKey(''));

            //$('#text-address-input').val(wallet.getAddress());
            $('#private-key-input').val(wallet.getDecryptedPrivateKey(''));
        }
    }
    setupWallet();
    // $('#generate-wallet').click(function() {
    //     setupWallet();
    // });

    function createQRCodeCanvas(text) {
        var sizeMultiplier = 4;
        var typeNumber;
        var lengthCalculation = text.length * 8 + 12;
        if (lengthCalculation < 72) {
            typeNumber = 1;
        } else if (lengthCalculation < 128) {
            typeNumber = 2;
        } else if (lengthCalculation < 208) {
            typeNumber = 3;
        } else if (lengthCalculation < 288) {
            typeNumber = 4;
        } else if (lengthCalculation < 368) {
            typeNumber = 5;
        } else if (lengthCalculation < 480) {
            typeNumber = 6;
        } else if (lengthCalculation < 528) {
            typeNumber = 7;
        } else if (lengthCalculation < 688) {
            typeNumber = 8;
        } else if (lengthCalculation < 800) {
            typeNumber = 9;
        } else if (lengthCalculation < 976) {
            typeNumber = 10;
        }
        var qrcode = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
        qrcode.addData(text);
        qrcode.make();
        var width = qrcode.getModuleCount() * sizeMultiplier;
        var height = qrcode.getModuleCount() * sizeMultiplier;
        // create canvas element
        var canvas = document.createElement('canvas');
        var scale = 10.0;
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        // compute tileW/tileH based on width/height
        var tileW = width / qrcode.getModuleCount();
        var tileH = height / qrcode.getModuleCount();
        // draw in the canvas
        for (var row = 0; row < qrcode.getModuleCount(); row++) {
            for (var col = 0; col < qrcode.getModuleCount(); col++) {
                ctx.fillStyle = qrcode.isDark(row, col) ? "#000000" : "#ffffff";
                ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
            }
        }
        return canvas;
    }

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