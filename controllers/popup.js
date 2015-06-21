function addToBlacklist(url) {
    db.put('blacklist', {
        url: url
    });
    db.remove('sites', url);
}

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

function daysTillEndOfWeek(endOfWeek) {
    var now = (new Date).getTime();
    var milliseconds = endOfWeek - now;
    return millisecondsToDays(milliseconds)
}

function initCurrentWeek() {
    var now = (new Date).getTime();
    if (parseInt(localStorage['endOfWeek']) > now) {
        var endOfWeek = new Date(parseInt(localStorage['endOfWeek']));

        var daysRemaining = daysTillEndOfWeek(endOfWeek);

        var remindInfo = document.createElement('div');
        remindInfo.style.float = 'right';
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

function millisecondsToDays(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    return days;
}

function restartTheWeek() {
    var now = (new Date).getTime();
    var milliSecondsInWeek = 604800000;
    var extraHour = 3600000; // add an hour to help the UI design.

    var alarm = now + milliSecondsInWeek + extraHour;

    var endOfWeek = new Date(alarm);

    var daysRemaining = daysTillEndOWeek(endOfWeek);

    localStorage['endOfWeek'] = alarm;

    $('#days-till-end-of-week').html(daysRemaining);
    $('#days-till-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);

    $('#date-end-of-week').html(endOfWeek.format("dddd, mmmm dS, yyyy, h:MM:ss TT"));
    $('#date-end-of-week').effect("highlight", {
        color: 'rgb(100, 189, 99)'
    }, 1000);

    $('#donate-now-reminder').fadeOut();
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
        if(balance == '0'){ $('#buy-bitcoins-info').show() }
        Promise.all([currencyManager.amount(balance), currencyManager.amount(FEE)]).then(function(results) {
            localStorage['availableBalanceFiat'] = results[0];
            //setBudgetWidget(results[0], results[1]);
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
            currencyManager.formatAmount(balance).then(function(formattedMoney) {
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
        window.location.replace("install.html");
    }

    db = new ydn.db.Storage('protip', schema);

    initBitcoinWallet();
    updateFiatCurrencyCode();
    allowExternalLinks();
    initCurrentWeek();
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

    $('#confirm-donate-now').click(function() {
        restartTheWeek();
        db.clear('sites');
        $('#confirm-donate-now').button('reset')
        $('#browsing-table').fadeOut();
        $('#browsing-table').empty();
        $('#confirm-donate-now-dialogue').slideUp().fadeOut();
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

    // if (typeof localStorage['showBitcoinArtists'] === "undefined") {
    //     localStorage['showBitcoinArtists'] = true;
    // }

    if (localStorage['showBitcoinArtists'] == 'true') {
        $('#show-bitcoin-artists').show();
    }

    if (localStorage['automaticDonate'] == 'true') {
        $('#automatic-payment-info').show();
    } else {
        $('#manual-remind-info').show();
    }

    // $('#show-bitcoin-artists-close').click(function() {
    //     localStorage['showBitcoinArtists'] = false;
    // });

});
