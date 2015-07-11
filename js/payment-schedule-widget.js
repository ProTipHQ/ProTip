//$(document).ready(function() {
    // Setup the wallet, page values and callbacks
    // var val = '',
    //     address = '',
    //     SATOSHIS = 100000000,
    //     FEE = SATOSHIS * .0001,
    //     BTCUnits = 'BTC',
    //     BTCMultiplier = SATOSHIS;
    //
    // function setupWallet() {
    //     wallet.restoreAddress().then(setQRCodes,
    //         function() {
    //             return wallet.generateAddress();
    //         }).then(setQRCodes,
    //         function() {
    //             //alert('Failed to generate wallet. Refresh and try again.');
    //         });
    //
    //     function setQRCodes() {
    //         $('#qrcode').html(createQRCodeCanvas(wallet.getAddress()));
    //         $('#textAddress').text(wallet.getAddress());
    //     }
    // }
    //
    // wallet.setBalanceListener(function(balance) {
    //     setBalance(balance);
    //     Promise.all([currencyManager.amount(balance), currencyManager.amount(FEE)]).then(function(results) {
    //         localStorage['availableBalanceFiat'] = results[0];
    //         setBudgetWidget(results[0], results[1]);
    //         $('#bitcoin-fee').html(results[1]);
    //     });
    // });
    // setupWallet();
    // preferences.getBTCUnits().then(setBTCUnits);
    //
    // function setBTCUnits(units) {
    //     BTCUnits = units;
    //     if (units === 'µBTC') {
    //         BTCMultiplier = SATOSHIS / 1000000;
    //     } else if (units === 'mBTC') {
    //         BTCMultiplier = SATOSHIS / 1000;
    //     } else {
    //         BTCMultiplier = SATOSHIS;
    //     }
    //
    //     setBalance(wallet.getBalance());
    //     $('#sendUnit').html(BTCUnits);
    //     $('#amount').attr('placeholder', '(Plus ' + FEE / BTCMultiplier + ' ' + BTCUnits + ' fee)').attr('step', 100000 / BTCMultiplier).val(null);
    //     $('#amountLabel').text('Amount:');
    // }
    //
    //
    // function setBalance(balance) {
    //     if (Number(balance) < 0 || isNaN(balance)) {
    //         balance = 0;
    //     }
    //     $('#head-line-balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);
    //     $('#balance').text(parseInt(balance) / BTCMultiplier + ' ' + BTCUnits);
    //
    //     if (balance > 0) {
    //         currencyManager.formatAmount(balance).then(function(formattedMoney) {
    //             var text = formattedMoney;
    //             $('#btc-balance-to-fiat').text(text);
    //         });
    //     } else {
    //         $('#btc-balance-to-fiat').text('0');
    //     }
    // }

    // function payAll(){
    //     localStorage['weeklyAlarmReminder'] = false;
    //     chrome.browserAction.setBadgeText({
    //         text: ''
    //     });
    //
    //     Promise.all([
    //         preferences.setCurrency(localStorage['fiatCurrencyCode']),
    //         //wallet.restoreAddress()
    //     ]).then(function() {
    //         paymentManager.payAll().then(function(response){
    //             localStorage['weeklyAlarmReminder'] = false;
    //             $('#payment-history').effect("highlight", {
    //                 color: 'rgb(100, 189, 99)'
    //             }, 4000);
    //             $('#notice').html(response);
    //             $('#notice-dialogue').slideDown();
    //             $('#donate-now').button('reset');
    //             if (response.trim() != 'Transaction Submitted'){
    //                 $('#payment-error').html(response);
    //                 $('#payment-error').slideDown();
    //             } else {
    //                 $('#transaction-submitted').html(response);
    //                 $('#payment-error').slideDown();
    //             }
    //             //resolve(response);
    //         }, function(response){
    //             // if(typeof response.notice !== "undefined"){
    //             //   $('#notice').html(response.notice);
    //             // }
    //             $('#notice').html(response);
    //             $('#notice-dialogue').slideDown();
    //             $('#donate-now').button('reset');
    //         });
    //     });
    // }
    //
    // function payAll(){
    //     Promise.all([
    //         preferences.setCurrency(localStorage['fiatCurrencyCode']),
    //     ]).then(function() {
    //         paymentManager.payAll().then(function(response){
    //             localStorage['weeklyAlarmReminder'] = false;
    //             resolve(response);
    //         }, function(response){
    //                reject(Error(response));
    //         });
    //     });
    // }
    //
    //
    // localStorage['weeklyAlarmReminder'] = false;
    // chrome.browserAction.setBadgeText({
    //     text: ''
    // });
    // $('#payment-history').effect("highlight", {
    //     color: 'rgb(100, 189, 99)'
    // }, 4000);
    // $('#notice').html(response);
    // $('#notice-dialogue').slideDown();
    // $('#donate-now').button('reset');
    // if (response.trim() != 'Transaction Submitted'){
    //     $('#payment-error').html(response);
    //     $('#payment-error').slideDown();
    // } else {
    //     $('#transaction-submitted').html(response);
    //     $('#payment-error').slideDown();
    // }



    // $('#confirm-donate-now').click(function() {
    //     localStorage['weeklyAlarmReminder'] = false;
    //     chrome.browserAction.setBadgeText({
    //         text: ''
    //     });
    //
    //     Promise.all([
    //         preferences.setCurrency(localStorage['fiatCurrencyCode']),
    //         //wallet.restoreAddress()
    //     ]).then(function() {
    //         paymentManager.payAll().then(function(response){
    //             localStorage['weeklyAlarmReminder'] = false;
    //             $('#payment-history').effect("highlight", {
    //                 color: 'rgb(100, 189, 99)'
    //             }, 4000);
    //             $('#notice').html(response);
    //             $('#notice-dialogue').slideDown();
    //             $('#donate-now').button('reset');
    //             if (response.trim() != 'Transaction Submitted'){
    //                 $('#payment-error').html(response);
    //                 $('#payment-error').slideDown();
    //             } else {
    //                 $('#transaction-submitted').html(response);
    //                 $('#payment-error').slideDown();
    //             }
    //             //resolve(response);
    //         }, function(response){
    //             // if(typeof response.notice !== "undefined"){
    //             //   $('#notice').html(response.notice);
    //             // }
    //             $('#notice').html(response);
    //             $('#notice-dialogue').slideDown();
    //             $('#donate-now').button('reset');
    //         });
    //     });
    // });

//});