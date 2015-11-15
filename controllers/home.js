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
            });
        }
   });
}

function setupWallet() {
    wallet.restoreAddress().then(function(){
        setQRCodes();
        updateBalance(wallet.getAddress());
        },
        function() {
            return wallet.generateAddress();
        }).then(function(address){
            setQRCodes;
            updateBalance(wallet.getAddress());
        },
        function() {
            alert('Failed to generate wallet. Refresh and try again.');
        }
    );

    function setQRCodes() {
        $('#qrcode').html(createQRCodeCanvas(wallet.getAddress()));
        $('#textAddress').text(wallet.getAddress());
        var blockchainURL = 'https://blockchain.info/address/' + wallet.getAddress();
        $('#payment-history-link').attr('href', blockchainURL);
    }

}

function updateBalance(address) {
    var host = 'https://api.blockcypher.com/v1/btc/main/addrs/';
    util.getJSON(host + address + '?unspentOnly=true&limit=50').then(function (response) { // This API call is an unnesscesary duplicate of a earlier call in wallest.restoreAddress. Intergrate there.

        if(response.txrefs){
            response.balance = _.reduce(response.txrefs, function(memo, obj){ return obj.value + memo; }, 0);
        } else {
            response.balance = 0;
        }

        if(!response.unconfirmed_txrefs && !response.txrefs){
            // The wallet is empty
            response.balance = 0;
        } else if(response.unconfirmed_txrefs){
            // The attribute 'unconfirmed_balance' from Blockcypher does not
            // indicate the total of the unconfirmed unspent outputs.
            // Even from http://dev.blockcypher.com/#address I cannot workout
            // what this number really represents.
            //
            var pendingConfirmation = _.reduce(response.unconfirmed_txrefs, function(memo, obj){ return obj.value + memo; }, 0);
            $('#balance-pending-confirmation-container').show();
            currencyManager.formatCurrency(pendingConfirmation).then(function(balancePendingConfirmation){
                $('#balance-pending-confirmation').html(balancePendingConfirmation);
            });
        }
        currencyManager.amount(response.balance).then(function(moneyWithoutSymbol) {
            localStorage['availableBalanceFiat'] = moneyWithoutSymbol;
            currencyManager.amount(FEE).then(function(bitcoinFeeFiat) {
                $('#bitcoin-fee').text(bitcoinFeeFiat);
                setBudgetWidget(localStorage['availableBalanceFiat'], bitcoinFeeFiat);
            });
            chrome.browserAction.setBadgeText({text: moneyWithoutSymbol}); // May as well use this API call to also update this value.
        });
        //$('#head-line-balance').text('BTC ' + response.balance);
        currencyManager.formatCurrency(response.balance).then(function(formattedMoney) {
            for(i=0;i < $('.btc-balance-to-fiat').length; i++){
                $('.btc-balance-to-fiat')[i].textContent = formattedMoney;
            }
        });
    });
}

function setMinIncidentalFiatAmounts(incidentalTotalFiat){
    if(parseFloat(incidentalTotalFiat) >= 0.00) {
        // If the Tx is less than <= 0.01 it takes many many hours to confirm, and your change is locked up.
        // Making 0.03 the min.
        return parseFloat(incidentalTotalFiat);
    } else {
        return 0.00;
    }
}

function restartCountDown(){
    window.alarmManager.doToggleAlarm();
    initAlarmDisplay();
    $('#date-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }
    window.FEE = 10000;

    db = new ydn.db.Storage('protip', schema);

    updateFiatCurrencyCode();
    allowExternalLinks();

    initAlarmDisplay();

    setupWallet();
    buildBrowsingTable('browsing-table');

    var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
    var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
    var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
    var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);
    var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
    $('#weekly-spend-manual-pay-reminder-btn').html(parseFloat(weeklyTotalFiat).toFixed(2));

    $('#confirm-donate-now').click(function() {
        $('#donate-now').button('Sending...');
        $('#notice-dialogue').slideUp().fadeOut();
        //localStorage['weeklyAlarmReminder'] = false;
        chrome.browserAction.setBadgeText({
            text: ''
        });

        paymentManager.payAll(localStorage['incidentalTotalFiat'], localStorage['subscriptionTotalFiat']).then(function(response){
            localStorage['weeklyAlarmReminder'] = false;
            window.alarmManager.doToggleAlarm();
            restartCountDown();
            $('#payment-history').effect("highlight", {
                color: 'rgb(100, 189, 99)'
            }, 4000);
            //$('#notice').html(response);
            db.clear('sites');
            $('#notice').html('Transaction Submitted');
            $('#notice-dialogue').fadeIn().slideDown();
            $('#donate-now').button('reset');
            $('#confirm-donate-now-dialogue').slideUp().fadeOut();
            updateBalance(wallet.getAddress());

        }, function(response){
            // blockCypher is returning a error code when the transaction was successfull?
            //$('#notice').html(response);
            localStorage['weeklyAlarmReminder'] = false;
            window.alarmManager.doToggleAlarm();
            restartCountDown();
            $('#payment-history').effect("highlight", {
                color: 'rgb(100, 189, 99)'
            }, 4000);
            db.clear('sites');
            updateBalance(wallet.getAddress());
            $('#notice').html('Transaction Submitted');
            $('#notice-dialogue').fadeIn().slideDown();
            $('#donate-now').button('reset');
            $('#confirm-donate-now-dialogue').slideUp().fadeOut();
        });
    });

    $('#dismiss-manual-reminder-popover').click(function(){
        $('#donate-now-reminder').fadeOut('fast');
    });

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
            alarmManager.alarmExpired(localStorage['alarmExpireDate'], function(expired){
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