function buildPopupBrowsingTable(domId) {
    var tbody = $('#' + domId);
    tbody.empty();

    // The Sites records should be filtered, first, by removing the subscriptions
    // second, by tallying up the total amount of time spent overall.

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
        // it is possible to get a new site record which doesn't yet have a timeOnPage.
        for (var i in records) {
            if (records[i].timeOnPage) {
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

    wallet.restoreAddress().then(function() {},
        function() {
            return wallet.generateAddress();
        }).then(function(address){
            updateBalance(wallet.getAddress());
        },
        function() {
            alert('Failed to generate wallet. Refresh and try again.');
        }
    );

    function updateBalance(address) {

        // TODO: This API call is an unnesscesary duplicate of a earlier call in wallest.restoreAddress
        var host = 'https://api.blockcypher.com/v1/btc/main/addrs/';
        util.getJSON(host + address + '?unspentOnly=true&limit=50').then(function (response) {

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
                var pendingConfirmation = _.reduce(response.unconfirmed_txrefs, function(memo, obj){ return obj.value + memo; }, 0);
                $('#balance-pending-confirmation-container').show();
                currencyManager.formatCurrency(pendingConfirmation).then(function(balancePendingConfirmation){
                    $('#balance-pending-confirmation').html(balancePendingConfirmation);
                });
            }
            currencyManager.amount(response.balance).then(function(moneyWithoutSymbol) {
                localStorage['availableBalanceFiat'] = moneyWithoutSymbol;
                // May as well use this API call to also update this value.
                browser.browserAction.setBadgeText({text: moneyWithoutSymbol});
            });
            currencyManager.formatCurrency(response.balance).then(function(formattedMoney) {
                $('#btc-balance-to-fiat').html(formattedMoney);
            });
        });
    }

    function setBudgetAmounts(){

        var availableBalanceFiat = parseFloat(localStorage['availableBalanceFiat']);
        var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
        var totalSubscriptionsFiat = parseFloat(localStorage['subscriptionTotalFiat']);
        var incidentalTotalFiat = parseFloat(localStorage['incidentalTotalFiat']);

        var weeklyTotalFiat = bitcoinFeeFiat + totalSubscriptionsFiat + incidentalTotalFiat;
        // use standard money formattor
        $('#total-fiat-amount').html(parseFloat(weeklyTotalFiat).toFixed(2));
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
    $('#weekly-spend-manual-pay-reminder-btn').html(parseFloat(weeklyTotalFiat).toFixed(2));

    $('#confirm-donate-now').click(function() {

        browser.browserAction.setBadgeText({
            text: ''
        });

        Promise.all([
            preferences.setCurrency(localStorage["fiatCurrencyCode"]),
        ]).then(function() {
            paymentManager.payAll(localStorage['incidentalTotalFiat'], localStorage['subscriptionTotalFiat']).then(function(response){
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
