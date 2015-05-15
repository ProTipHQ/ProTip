function addToBlacklist(url) {
    db.put('blacklist', {
        url: url
    });
    db.remove('sites', url);
}

function clearBrowsingHistory() {
    $('#browsing-table').fadeOut();
    $('#browsing-table').empty();
    db.clear('sites');
}

function daysTillEndOWeek(endOfWeek) {
    var now = (new Date).getTime();
    var milliseconds = endOfWeek - now;
    return millisecondsToDays(milliseconds)
}

function restartTheWeek() {
    //var now = (new Date).getTime();
    //var milliSecondsInWeek = 604800000;
    //var extraHour = 3600000; // add an hour to help the UI design.

    //var alarm = now + milliSecondsInWeek + extraHour;

    //var endOfWeek = new Date(alarm);

    //var daysRemaining = daysTillEndOWeek(endOfWeek);

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

function millisecondsToDays(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    return days;
}

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

// function updateFiatAmounts() {
//     var subscriptions = parseFloat($('#subscription-fiat-amount').html()); // don't recalculate subscriptions constantly
//     var incidental = parseFloat($('#incidental-fiat-amount').val());
//     var bitcoinFeeFiat = parseFloat(localStorage['bitcoinFeeFiat']);
//     $('#total-fiat-amount').html((subscriptions + incidental + bitcoinFeeFiat).toFixed(2));
//     localStorage['totalWeelyBudgetFiat'] = (subscriptions + incidental).toFixed(2);
//
//     refreshTotalCoffeeCupProgressBar('total-amount-progress-bar');
// }

function initialize() {
    db = new ydn.db.Storage('protip', schema);

    updateFiatCurrencyCode();
    allowExternalLinks();
    //initCurrentWeek();

    // initDefaultSubscriptionAmountFiat();
    // initDefaultBlacklistedHostnames();

    buildBrowsingTable('browsing-table');

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
}

$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    initialize();

    $('#show-bitcoin-artists-close').click(function() {
        localStorage['showBitcoinArtists'] = false;
    });

    $("#clear-data").click(function() {
        clearBrowsingHistory();
    });
});