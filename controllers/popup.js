function buildPopupBrowsingTable(domId) {
    var tbody = $('#' + domId);
    tbody.empty();

    // The Sites records should be filtered,
    // first, by removing the subscriptions
    // second, by tallying up the total amount
    // of time spent overall.

    // Remove subscriptions for daily browsing.
    db.values('subscriptions').done(function(records) {
        for (var i in records) {
            db.remove('sites', records[i].url);
        }
    });

    // Update the totalTime, this global needs to be updated frequently to allow
    // the correct values for the percentages of each site.
    db.values('sites').done(function(records) {
        localStorage['totalTime'] = 0;
        for (var i in records) {
            if (records[i].timeOnPage) { // it is possible to get a new site record which doesn't yet have a timeOnPage.
                localStorage['totalTime'] = parseInt(localStorage['totalTime']) + parseInt(records[i].timeOnPage);
            }
        };
    });

    db.from('sites').order('timeOnPage').reverse().list(10).done(function(records) {
        if(records.length < 1){
            showEmptyTableNotice('browsing-table');
        }
        for (var i in records) {
            tbody.append(buildPopupRow(records[i]));
        }
    });
}

function buildPopupRow(record) {
    var row = document.createElement("tr");

    row.appendChild(subscriptionSwitchCell(record));
    row.appendChild(browseLabelCell(record));
    row.appendChild(browseAmountCell(record));
    row.appendChild(subscriptionBitcoinAddressCell(record));
    row.appendChild(browseIgnoreCell(record));

    return row;
}

function restartCountDown(){
    var countDownObj = restartTheWeek();
    $('#days-till-end-of-week').html(countDownObj.daysRemaining);
    $('#days-till-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);
}

// function initPopupCurrentWeek() {
//     alarmManager.alarmExpired(localStorage['alarmExpireDate'], function(expired){
//
//         var remindInfo = document.createElement('div');
//         remindInfo.style.float = 'left';
//         remindInfo.style.padding = '4px';
//
//         if (localStorage['automaticDonate'] == 'true') {
//             remindInfoText = document.createTextNode('Next automatic payment in ');
//         } else {
//             remindInfoText = document.createTextNode('Reminder in ');
//         }
//         remindInfo.appendChild(remindInfoText);
//
//         var daysTillEndOfWeekInfo = document.createElement('span');
//         daysTillEndOfWeekInfo.id = 'days-till-end-of-week';
//
//         var daysRemaining = daysTillEndOfWeek(localStorage['alarmExpireDate']);
//
//         daysTillEndOfWeekInfo.textContent = daysRemaining;
//         daysTillEndOfWeekInfo.className = 'label label-info';
//         daysTillEndOfWeekInfo.style = 'float: none;font-size:7px;border-radius:10px;';
//         remindInfo.appendChild(daysTillEndOfWeekInfo);
//         remindInfo.appendChild(document.createTextNode(' days.'));
//         $('#reminder-info-container').append(remindInfo);
//
//         if(expired){
//
//         } else {
//             var alarmExpireDate = new Date(localStorage['alarmExpireDate']);
//             var daysRemaining = daysTillEndOfWeek(alarmExpireDate);
//
//             $('days-till-end-of-week');
//
//
//             daysTillEndOfWeekInfo.textContent = daysRemaining;
//             daysTillEndOfWeekInfo.className = 'label label-info';
//             daysTillEndOfWeekInfo.style = 'float: none;font-size:7px;border-radius:10px;';
//             remindInfo.appendChild(daysTillEndOfWeekInfo);
//             //remindInfo.appendChild(document.createTextNode(' days.'));
//             $('#reminder-info-container').append(remindInfo);
//         }
//    });
// }

function initPopupCurrentWeek() {
    var now = (new Date).getTime();
    if (parseInt(localStorage['endOfWeek']) > now) {
        var endOfWeek = new Date(parseInt(localStorage['endOfWeek']));

        var daysRemaining = daysTillEndOfWeek(endOfWeek) - 1;

        var remindInfo = document.createElement('div');
        remindInfo.style.float = 'left';
        remindInfo.style.padding = '4px';

        if (localStorage['automaticDonate'] == 'true') {
            remindInfoText = document.createTextNode('Next automatic payment in ');
        } else {
            remindInfoText = document.createTextNode('Reminder in ');
        }
        remindInfo.appendChild(remindInfoText);

        var daysTillEndOfWeekInfo = document.createElement('span');
        daysTillEndOfWeekInfo.id = 'days-till-end-of-week';
        daysTillEndOfWeekInfo.textContent = daysRemaining;
        daysTillEndOfWeekInfo.className = 'label label-info';
        daysTillEndOfWeekInfo.style = 'float: none;font-size:7px;border-radius:10px;';
        remindInfo.appendChild(daysTillEndOfWeekInfo);
        remindInfo.appendChild(document.createTextNode(' days.'));
        $('#reminder-info-container').append(remindInfo);
    }
}

function initBitcoinWallet(){
  // Setup the wallet, page values and callbacks
    var val = '',
        address = '',
        SATOSHIS = 100000000,
        FEE = SATOSHIS * .0001,
        BTCUnits = 'BTC',
        BTCMultiplier = SATOSHIS;

    function setupWallet() {
        wallet.restoreAddress();
    }
    wallet.setBalanceListener(function(balance) {
        setBalance(balance);
        Promise.all([currencyManager.amount(balance), currencyManager.amount(FEE)]).then(function(results) {
            localStorage['availableBalanceFiat'] = results[0];
        });
    });
    setupWallet();


    function setBalance(balance) {
        if (Number(balance) < 0 || isNaN(balance)) {
            balance = 0;
        }
        $('#head-line-balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);
        $('#balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);

        if (balance > 0) {
            currencyManager.formatCurrency(balance).then(function(formattedMoney) {
                var text = formattedMoney;
                $('#btc-balance-to-fiat').text(text);
            });
        } else {
            $('#btc-balance-to-fiat').text('0.00');
        }
    }
    setBalance();

    function setBudgetAmounts(){

        var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
        var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
        var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
        var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);

        var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
        $('#total-fiat-amount').html(parseFloat(weeklyTotalFiat).toFixed(2)); // use standard money formattor
    };
    setBudgetAmounts();
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        localStorage['protip-popup-install'] = true;
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    initBitcoinWallet();
    updateFiatCurrencyCode();
    allowExternalLinks();
    initPopupCurrentWeek();
    buildPopupBrowsingTable('browsing-table');

    if (localStorage['weeklyAlarmReminder'] == "true" && localStorage['manualRemind'] == "true") {
        $('#donate-now-reminder').show();
    }

    var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
    var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
    var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
    var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);

    var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
    $('#weekly-spend-manual-pay-reminder-btn').html(parseFloat(weeklyTotalFiat).toFixed(2)); // use standard money formattor

    $('#confirm-donate-now').click(function() {

        chrome.browserAction.setBadgeText({
            text: ''
        });

        Promise.all([
            preferences.setCurrency(localStorage['fiatCurrencyCode']),
        ]).then(function() {
            paymentManager.payAll().then(function(response){
                localStorage['weeklyAlarmReminder'] = false;
                window.alarmManager.doToggleAlarm();
                $('#notice').html(response);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
                if (response.trim() != 'Transaction Submitted'){
                    $('#payment-error').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    $('#confirm-donate-now-dialogue').fadeOut().slideUp();
                    restartCountDown();
                    alarmManager.doToggleAlarm();
                    initPopupCurrentWeek();
                } else {
                    $('#transaction-submitted').html(response);
                    $('#payment-error').fadeIn().slideDown();
                    $('#browsing-table').fadeOut();
                    $('#browsing-table').empty();
                }
            }, function(error){
                $('#notice').html(error.message);
                $('#notice-dialogue').fadeIn().slideDown();
                $('#donate-now').button('reset');
            });
        });
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

    if (localStorage['showBitcoinArtists'] == 'true') {
        $('#show-bitcoin-artists').show();
    }

    if (localStorage['automaticDonate'] == 'true') {
        $('#automatic-payment-info').show();
    } else {
        $('#manual-remind-info').show();
    }

});
