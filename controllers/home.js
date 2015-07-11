// function addToBlacklist(url) {
//     db.put('blacklist', {
//         url: url
//     });
//     db.remove('sites', url);
// }

// function clearBrowsingHistory() {
//     $('#browsing-table').fadeOut();
//     $('#browsing-table').empty();
//     db.clear('sites');
// }

// function daysTillEndOWeek(endOfWeek) {
//     var now = (new Date).getTime();
//     var milliseconds = endOfWeek - now;
//     return millisecondsToDays(milliseconds)
// }
//
// function restartTheWeek() {
//     var now = (new Date).getTime();
//     var milliSecondsInWeek = 604800000;
//     var extraHour = 3600000; // add an hour to help the UI design.
//
//     var alarm = now + milliSecondsInWeek + extraHour;
//
//     var endOfWeek = new Date(alarm);
//
//     var daysRemaining = daysTillEndOWeek(endOfWeek);
//
//     localStorage['endOfWeek'] = alarm;
//
//     $('#days-till-end-of-week').html(daysRemaining);
//     $('#days-till-end-of-week').effect("highlight", {
//         color: 'rgb(100, 189, 99)'
//     }, 1000);
//
//     $('#date-end-of-week').html(endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
//     $('#date-end-of-week').effect("highlight", {
//         color: 'rgb(100, 189, 99)'
//     }, 1000);
//
//     $('#donate-now-reminder').fadeOut();
// }
//
// function millisecondsToDays(milliseconds) {
//     var seconds = Math.floor(milliseconds / 1000);
//     var minutes = Math.floor(seconds / 60);
//     var hours = Math.floor(minutes / 60);
//     var days = Math.floor(hours / 24);
//     return days;
// }
//
// function initCurrentWeek() {
//     var now = (new Date).getTime();
//     if (parseInt(localStorage['endOfWeek']) > now) {
//         // All okay, all variables set,
//         var milliSecondsInWeek = 604800000;
//         var extraHour = 3600000; // add an hour to help the UI design.
//
//         var alarm = now + milliSecondsInWeek + extraHour
//
//         var endOfWeek = new Date(parseInt(localStorage['endOfWeek']));
//
//         var daysRemaining = daysTillEndOWeek(endOfWeek)
//
//         $('#days-till-end-of-week').html(daysRemaining);
//
//         $('#date-end-of-week').html(endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
//
//     } else {
//         // Catch any missing variables and other rubbish, just restart.
//         // Good for initalization on first load.
//         restartTheWeek();
//     }
// }


function initCurrentWeek() {
    var now = (new Date).getTime();
    if (parseInt(localStorage['endOfWeek']) > now) {
        // All okay, all variables set,
        var milliSecondsInWeek = 604800000;
        var extraHour = 3600000; // add an hour to help the UI design.

        var alarm = now + milliSecondsInWeek + extraHour

        var endOfWeek = new Date(parseInt(localStorage['endOfWeek']));

        var daysRemaining = daysTillEndOfWeek(endOfWeek)

        // $('#days-till-end-of-week').html(daysRemaining);
        //
        // $('#date-end-of-week').html(endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));

    } else {
        // Catch any missing variables and other rubbish, just restart.
        // Good for initalization on first load.
        restartTheWeek();
    }
    return {endOfWeek: endOfWeek, daysRemaining: daysRemaining}
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
    var countDownObj = restartTheWeek();
    $('#days-till-end-of-week').html(countDownObj.daysRemaining);
    $('#days-till-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);

    $('#date-end-of-week').html(countDownObj.endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
    $('#date-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);

    $('#donate-now-reminder').fadeOut();
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    updateFiatCurrencyCode();
    allowExternalLinks();

    var currentWeekObj = initCurrentWeek();
    $('#days-till-end-of-week').html(currentWeekObj.daysRemaining);
    $('#date-end-of-week').html(currentWeekObj.endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));

    setupWalletBalance();
    buildBrowsingTable('browsing-table');

    $('#confirm-donate-now').click(function() {
        $('#donate-now').button('Sending...');
        $('#notice-dialogue').hide();
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
                $('#payment-history').effect("highlight", {
                    color: 'rgb(100, 189, 99)'
                }, 4000);
                $('#notice').html(response);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
                if (response.trim() != 'Transaction Submitted'){
                    $('#payment-error').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    restartCountDown();
                } else {
                    $('#transaction-submitted').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    $('#browsing-table').fadeOut();
                    $('#browsing-table').empty();
                    $('#confirm-donate-now-dialogue').slideUp().fadeOut();
                }
            }, function(response){
                $('#notice').html(response);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
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

    $( "#slider" ).slider({
        range: "max",
        min: 0.01,
        max: 10,
        value: parseFloat(localStorage['incidentalTotalFiat']),
        slide: function( event, ui ) {
          $( "#incidental-fiat-amount" ).val( ui.value );
          $('#incidental-fiat-amount').trigger('change');
        }
    });

    $("input[name=remind-me]:radio").change(function(value) {
        if (this.value == 'automaticDonate') {
            $('#automatic-donate-container').toggleClass('list-group-item-success');
            $('#manual-remind-container').toggleClass('list-group-item-success');
            //restartTheWeek();

            localStorage['automaticDonate'] = true;
            localStorage['manualRemind'] = false;
        } else {
            $('#automatic-donate-container').toggleClass('list-group-item-success');
            $('#manual-remind-container').toggleClass('list-group-item-success');
            //restartTheWeek();
            localStorage['automaticDonate'] = false;
            localStorage['manualRemind'] = true;
        }
        restartCountDown();
    });

    $('#incidental-fiat-amount').change(function() {
        localStorage['incidentalTotalFiat'] = $(this).val();
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
        var totalFiatAmount = parseFloat($('#total-fiat-amount').html());
        var currentBalance = parseFloat(localStorage['availableBalanceFiat']);
        if (totalFiatAmount > currentBalance) {
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
        //restartTheWeek();
    });

    $("#clear-data").click(function() {
      $('#browsing-table').fadeOut();
      $('#browsing-table').empty();
      db.clear('sites');
    });
});