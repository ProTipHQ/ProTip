function initAlarmDisplay() {
    alarmManager.alarmExpired(localStorage['alarmExpireDate'], function(expired){
        if(expired){
            var now = (new Date).getTime();
            var weekInTheFuture = new Date(now+(60 * 60 * 24 * 7)); // One week in the future.
            $('#date-end-of-week').html('1 week from now, ' + weekInTheFuture.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
            $('#days-till-end-of-week').html('0');
        } else {
            chrome.alarms.getAll(function(objs){
                var date = new Date(objs[0].scheduledTime);
                $('#date-end-of-week').html('on ' + date.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
                var daysRemaining = daysTillEndOfWeek(date);
                $('#days-till-end-of-week').html(daysRemaining);
                $('#date-end-of-week').effect("highlight", {
                    color: 'rgb(100, 189, 99)'
                }, 1000);
            });
        }
   });
}

function setupWallet() {
    wallet.restoreAddress().then(setQRCodes,
        function() {
            return wallet.generateAddress();
        }).then(setQRCodes,
        function() {
            alert('Failed to generate wallet. Refresh and try again.');
        });

    function setQRCodes() {
        $('#qrcode').html(createQRCodeCanvas(wallet.getAddress()));
        $('#textAddress').text(wallet.getAddress());
        var blockchainURL = 'https://blockchain.info/address/' + wallet.getAddress();
        $('#payment-history-link').attr('href', blockchainURL);
    }
}

function setMinIncidentalFiatAmounts(incidentalTotalFiat){
    if(parseFloat(incidentalTotalFiat) >= 0.03) {
        // If the Tx is less than <= 0.01 it takes many many hours to confirm, and your change is locked up.
        // Making 0.03 the min.
        return parseFloat(incidentalTotalFiat);
    } else {
        return 0.03;
    }
}

function setupWalletBalance(){
    var val = '',
        address = '',
        SATOSHIS = 100000000,
        FEE = SATOSHIS * .0001,
        BTCUnits = 'BTC',
        BTCMultiplier = SATOSHIS;

    wallet.setBalanceListener(function(balance) {
        setBalance(balance);
        Promise.all([currencyManager.amount(balance), currencyManager.amount(FEE)]).then(function(results) {
            localStorage['availableBalanceFiat'] = results[0];
            setBudgetWidget(results[0], results[1]);
        });
    });
    setupWallet();

    function setBalance(balance) {
        if (Number(balance) < 0 || isNaN(balance)) {
            balance = 0.00;
        }
        $('#head-line-balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);
        $('#balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);

        currencyManager.amount(10000).then(function(formattedMoney) {
            $('#bitcoin-fee').text(formattedMoney);
        });

        var text;
        if (balance > 0) {
            currencyManager.formatAmount(balance).then(function(formattedMoney) {
                for(i=0;i < $('.btc-balance-to-fiat').length; i++){
                    $('.btc-balance-to-fiat')[i].textContent = formattedMoney;
                }
            });
        } else {
            for(i=0;i < $('.btc-balance-to-fiat').length; i++){
                $('.btc-balance-to-fiat')[i].textContent = '0.00';
            }
        }
    }
    setBalance();
}

function restartCountDown(){
    window.alarmManager.doToggleAlarm();
    initAlarmDisplay();

    // chrome.alarms.getAll(function(objs){
    //     var date = new Date(objs[0].scheduledTime);
    //     $('#date-end-of-week').html(date.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
    //     $('#date-end-of-week').effect("highlight", {
    //         color: 'rgb(100, 189, 99)'
    //     }, 1000);
    //     $('#donate-now-reminder').fadeOut();
    // });
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    updateFiatCurrencyCode();
    allowExternalLinks();

    initAlarmDisplay();
    // $('#days-till-end-of-week').html(currentWeekObj.daysRemaining);
    // chrome.alarms.getAll(function(objs){
    //     var date = new Date(objs[0].scheduledTime);
    //     $('#date-end-of-week').html(date.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
    // });
    //$('#date-end-of-week').html(currentWeekObj.endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));

    setupWalletBalance();
    buildBrowsingTable('browsing-table');

    $('#confirm-donate-now').click(function() {
        $('#donate-now').button('Sending...');
        $('#notice-dialogue').slideUp().fadeOut();
        //localStorage['weeklyAlarmReminder'] = false;
        chrome.browserAction.setBadgeText({
            text: ''
        });

        Promise.all([
            preferences.setCurrency(localStorage['fiatCurrencyCode']),
            //wallet.restoreAddress()
        ]).then(function() {
            paymentManager.payAll().then(function(response){
                localStorage['weeklyAlarmReminder'] = false;
                window.alarmManager.doToggleAlarm();
                restartCountDown();
                $('#payment-history').effect("highlight", {
                    color: 'rgb(100, 189, 99)'
                }, 4000);
                $('#notice').html(response);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
                if (response.trim() != 'Transaction Submitted'){
                    $('#payment-error').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    //restartCountDown();
                } else {
                    $('#transaction-submitted').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    $('#browsing-table').fadeOut();
                    $('#browsing-table').empty();
                }
                $('#confirm-donate-now-dialogue').slideUp().fadeOut();
            }, function(response){
                $('#notice').html(response);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
                $('#confirm-donate-now-dialogue').slideUp().fadeOut();
            });
        });
    });

    $('#dismiss-manual-reminder-popover').click(function(){
        $('#donate-now-reminder').fadeOut('fast');
    });

    var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
    var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
    var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
    var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);
    var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
    $('#weekly-spend-manual-pay-reminder-btn').html(parseFloat(weeklyTotalFiat).toFixed(2));


    // if(parseFloat(localStorage['incidentalTotalFiat']) >= 0.03){
    //     // If the Tx is less than <= 0.01 it takes many many hours to confirm, and your change is locked up.
    //     // Making 0.03 the min.
    //     var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);
    // } else {
    //     var incidentalTotalFiat = 0.03;
    // }
    $( "#slider" ).slider({
        range: "max",
        min: 0.03,
        max: 10,
        value: parseFloat(localStorage['incidentalTotalFiat']),
        slide: function( event, ui ) {
          $( "#incidental-fiat-amount" ).val( parseFloat(ui.value));
          $('#incidental-fiat-amount').trigger('change');
        }
    });

    $("input[name=remind-me]:radio").change(function(value) {
        if (this.value == 'automaticDonate') {
            localStorage['automaticDonate'] = true;
            localStorage['manualRemind'] = false;
            alarmManager.alarmExpired(function(expired){
                if (expired) {
                    restartTheWeek();
                    window.alarmManager.doToggleAlarm();
                    restartCountDown();
                }
            });
        } else {
            localStorage['automaticDonate'] = false;
            localStorage['manualRemind'] = true;
        }
        //restartCountDown();
    });

    $('#incidental-fiat-amount').change(function() {
        localStorage['incidentalTotalFiat'] = setMinIncidentalFiatAmounts($(this).val());
        $(this).val(setMinIncidentalFiatAmounts($(this).val()));

        var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
        var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
        var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
        var incidentalTotalFiat = parseFloat($(this).val());

        var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
        // if (availableBalanceFiat > 0 && weeklyTotalFiat > availableBalanceFiat - bitcoinFeeFiat) {
        //     weeklyTotalFiat = availableBalanceFiat - bitcoinFeeFiat;
        //     $(this).attr('max', incidentalTotalFiat);
        // }
        var balanceCoversXWeeks = (availableBalanceFiat - weeklyTotalFiat) / weeklyTotalFiat;
        if (balanceCoversXWeeks < 0) {
            balanceCoversXWeeks = 0
        } // initalization with empty wallet.

        $('#balance-covers-weeks').html(balanceCoversXWeeks.toFixed(1));
        $('#balance-covers-weeks').effect("highlight", {
            color: 'rgb(100, 189, 99)'
        }, 400);

        $('#total-fiat-amount').html(parseFloat(weeklyTotalFiat).toFixed(2)); // use standard money formattor
        $('#weekly-spend-manual-pay-reminder-btn').html(parseFloat(weeklyTotalFiat).toFixed(2)); // use standard money formattor
        $( "#slider" ).slider({value: $(this).val() });
    });

    $('#donate-now').click(function() {
        $('#insufficient-funds-dialogue').slideUp().fadeOut();
        $('#notice-dialogue').slideUp().fadeOut();
        var totalFiatAmount = parseFloat($('#total-fiat-amount').html());
        var currentBalance = parseFloat(localStorage['availableBalanceFiat']);
        if(parseFloat(localStorage['incidentalTotalFiat']) + parseFloat(localStorage['subscriptionTotalFiat']) <= 0){
            $('#notice').html('No funds allocated to weekly subscriptions or browsing.');
            $('#notice-dialogue').slideDown().fadeIn();
        } else if (totalFiatAmount > currentBalance) {
            $('#insufficient-funds-dialogue').slideDown().fadeIn();
        } else {
            $('#confirm-donate-now-dialogue').slideDown().fadeIn();
        }
    });

    $('#confirm-donate-cancel').click(function() {
        $('#confirm-donate-now-dialogue').slideUp().fadeOut();
    });

    if (typeof localStorage['automaticDonate'] === "undefined" && typeof localStorage['manualRemind'] === "undefined") {
        localStorage['manualRemind'] = true;
    }

    if (localStorage['weeklyAlarmReminder'] == "true" && localStorage['manualRemind'] == "true") {
        $('#donate-now-reminder').show();
    }

    if (localStorage['automaticDonate'] == 'true') {
        $('#automaticDonate').prop('checked', true);
        $('#automatic-donate-container').addClass('list-group-item-success');
    } else {
        $('#manualRemind').prop('checked', true);
        $('#manual-remind-container').toggleClass('list-group-item-success');
    }

    if (localStorage['automaticDonate'] == "true") {
        $('#automaticDonate').prop('checked', true)
    }

    if (typeof localStorage['showBitcoinArtists'] === "undefined") {
        localStorage['showBitcoinArtists'] = true;
    }

    if (localStorage['showBitcoinArtists'] == 'true') {
        $('#show-bitcoin-artists').show();
    }

    $('#hideBitcoinArtists').click(function() {
       localStorage['showBitcoinArtists'] = false;
       $('#show-bitcoin-artists').fadeOut();
    });

    $('#toggle-alarm').click(function() {
        window.alarmManager.doToggleAlarm();
        restartCountDown();
    });

    $("#clear-data").click(function() {
      $('#browsing-table').fadeOut();
      $('#browsing-table').empty();
      db.clear('sites');
    });
});