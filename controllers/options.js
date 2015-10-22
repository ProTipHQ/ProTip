$(function() {
    if(!localStorage['proTipInstalled']) {
        window.location.replace("install.html");
    }

    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    //initialize()
    // db = new ydn.db.Storage('protip', schema);
    // Going to use *localStore* for the options/preferences because
    // IndexedDB isn't built for a single record options array very
    // well. When wiping the IndexedDB must remember not to wipe the
    // Blacklists.
    db = new ydn.db.Storage('protip', schema);

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    $('#fiat-currency-select').change(function() {
        $('#ajax-loader').show();
        updateCurrency(this.value).then(function(response){
            console.log(response.exchangeRateCoeff);
            updateGlobalOptionsAmount(response.exchangeRateCoeff);
            localStorage["fiatCurrencyCode"] = response.new_currency_code;

            updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
            $('#ajax-loader').hide();
        }, function(response){
          // If all fails, reset to USD
          localStorage["fiatCurrencyCode"] = 'USD';
          $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
          updateFiatCurrencyCode();
          console.log('barrrr')
        });
    });
    //updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>

    // initFiatCurrency();
    //updateFiatCurrencyCode();
    initAvailableCurrenciesOptions();
    initDefaultSubscriptionAmountFiat();

    allowExternalLinks();

    wallet.restoreAddress().then(function () {
        //$('#textAddress').text(wallet.getAddress());
        setExampleMetaTag();
    });
});


function updateCurrency(new_currency_code) {
  var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
  var exchangeRateCoeff;

  return preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
      return currencyManager.updateExchangeRate();
  }).then(function(exchangeToBTC){
      return new Promise(function (resolve, reject) {
          if (oldFiatCurrencyCode == 'BTC' && new_currency_code == 'mBTC') {
              // from BTC to mBTC
              exchangeRateCoeff = 1000;
              resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
          } else if (oldFiatCurrencyCode == 'mBTC' && new_currency_code == 'BTC') {
              // from mBTC to BTC
              exchangeRateCoeff = 1/1000;
              resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
          } else if (new_currency_code == 'BTC') {
              // from fiat to BTC
              currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
                  exchangeRateCoeff = 1/rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
              });
          } else if (new_currency_code == 'mBTC'){
              currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
                  // from fiat to mBTC
                  exchangeRateCoeff = 1000/rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
              });
          } else if (oldFiatCurrencyCode == 'BTC') {
              currencyManager.getExchangeRate(new_currency_code).then(function(rateObj) {
                  // from BTC to fiat
                  exchangeRateCoeff = rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
              });
          } else if (oldFiatCurrencyCode == 'mBTC') {
            currencyManager.getExchangeRate(new_currency_code).then(function(rateObj) {
                // from mBTC to fiat
                exchangeRateCoeff = rateObj['24h_avg']/1000;
                resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
            });
          } else { // fiat to fiat
              util.getJSON('http://api.fixer.io/latest?symbols=' + new_currency_code + ',' + oldFiatCurrencyCode)
              .then(function(ratesData){
                  exchangeRateCoeff = ratesData.rates[new_currency_code] / ratesData.rates[oldFiatCurrencyCode];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, new_currency_code: new_currency_code});
              });
          }
      });
  });
}




// function updateCurrency(new_currency_code) {
//   var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//   var exchangeRateCoeff;
//
//   return preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
//       return currencyManager.updateExchangeRate();
//   }).then(function(exchangeToBTC){
//       return new Promise(function (resolve, reject) {
//       if (oldFiatCurrencyCode == 'BTC' && new_currency_code == 'mBTC') {
//           // from BTC to mBTC
//           exchangeRateCoeff = 1000;
//           resolve(exchangeRateCoeff);
//       } else if (oldFiatCurrencyCode == 'mBTC' && new_currency_code == 'BTC') {
//           // from mBTC to BTC
//           exchangeRateCoeff = 1/1000;
//           resolve(exchangeRateCoeff);
//       } else if (new_currency_code == 'BTC') {
//           // from fiat to BTC
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               exchangeRateCoeff = 1/rateObj['24h_avg'];
//               resolve(exchangeRateCoeff);
//           });
//       } else if (new_currency_code == 'mBTC'){
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               // from fiat to mBTC
//               exchangeRateCoeff = 1000/rateObj['24h_avg'];
//               resolve(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'BTC') {
//           currencyManager.getExchangeRate(new_currency_code).then(function(rateObj) {
//               // from BTC to fiat
//               exchangeRateCoeff = rateObj['24h_avg'];
//               resolve(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'mBTC') {
//         currencyManager.getExchangeRate(new_currency_code).then(function(rateObj) {
//             // from mBTC to fiat
//             exchangeRateCoeff = rateObj['24h_avg']/1000;
//             resolve(exchangeRateCoeff);
//         });
//       } else { // fiat to fiat
//           util.getJSON('http://api.fixer.io/latest?symbols=' + new_currency_code + ',' + oldFiatCurrencyCode)
//           .then(function(ratesData){
//               exchangeRateCoeff = ratesData.rates[new_currency_code] / ratesData.rates[oldFiatCurrencyCode];
//               resolve(exchangeRateCoeff);
//           });
//       }
//     }).then(function(exchangeRateCoeff){
//       console.log(exchangeRateCoeff);
//       updateGlobalOptionsAmount(exchangeRateCoeff);
//       localStorage["fiatCurrencyCode"] = new_currency_code;
//     });
//   });
// }

function updateGlobalOptionsAmount(exchangeRateCoeff){
    localStorage['defaultSubscriptionAmountFiat'] = exchangeRateCoeff * localStorage['defaultSubscriptionAmountFiat'];
    $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
    localStorage['incidentalTotalFiat'] = exchangeRateCoeff * localStorage['incidentalTotalFiat'];
    db.values('subscriptions').done(function(records) {
        for (var i in records) {
            records[i].amountFiat = exchangeRateCoeff * records[i].amountFiat;
        }
        db.put('subscriptions', records);
    });
}

function setExampleMetaTag(){
  $('#example-metatag').html(
   '<meta name="microtip" content="' + wallet.getAddress() + '" data-currency="btc">'
  );
}

function initDefaultSubscriptionAmountFiat() {
    if (!localStorage['defaultSubscriptionAmountFiat']) {
        localStorage['defaultSubscriptionAmountFiat'] = "0.25"
    }

    $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);

    $('#default-subscription-amount-fiat').change(function() {
        localStorage['defaultSubscriptionAmountFiat'] = this.value;
    });
}

// function updateCurrency(new_currency_code) {
//   var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//   localStorage["fiatCurrencyCode"] = new_currency_code;
//
//   return preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
//       return currencyManager.updateExchangeRate();
//   }).then(function(exchangeToBTC){
//       if (oldFiatCurrencyCode == 'BTC' && localStorage["fiatCurrencyCode"] == 'mBTC') {
//           // from BTC to mBTC
//           var exchangeRateCoeff = 1000;
//           updateGlobalOptionsAmount(exchangeRateCoeff);
//       } else if (oldFiatCurrencyCode == 'mBTC' && localStorage["fiatCurrencyCode"] == 'BTC') {
//           // from mBTC to BTC
//           var exchangeRateCoeff = 1/1000;
//           updateGlobalOptionsAmount(exchangeRateCoeff);
//       } else if (localStorage["fiatCurrencyCode"] == 'BTC') {
//           // from fiat to BTC
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               var exchangeRateCoeff = 1/rateObj['24h_avg'];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (localStorage["fiatCurrencyCode"] == 'mBTC'){
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               // from fiat to mBTC
//               var exchangeRateCoeff = 1000/rateObj['24h_avg']
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'BTC') {
//           currencyManager.getExchangeRate(localStorage["fiatCurrencyCode"]).then(function(rateObj) {
//               // from BTC to fiat
//               var exchangeRateCoeff = rateObj['24h_avg'];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'mBTC') {
//         currencyManager.getExchangeRate(localStorage["fiatCurrencyCode"]).then(function(rateObj) {
//             // from mBTC to fiat
//             var exchangeRateCoeff = rateObj['24h_avg']/1000
//             updateGlobalOptionsAmount(exchangeRateCoeff);
//         });
//       } else { // fiat to fiat
//           util.getJSON('http://api.fixer.io/latest?symbols=' + localStorage["fiatCurrencyCode"] + ',' + oldFiatCurrencyCode)
//           .then(function(ratesData){
//               var exchangeRateCoeff = ratesData.rates[localStorage["fiatCurrencyCode"]] / ratesData.rates[oldFiatCurrencyCode];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       }
//   }).catch(function(){
//       console.log('foooooo');
//   });
// }



// function updateCurrency(new_currency_code) {
//   var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//   localStorage["fiatCurrencyCode"] = new_currency_code;
//
//   preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
//       return currencyManager.updateExchangeRate();
//   }).then(function(exchangeToBTC){
//       if (oldFiatCurrencyCode == 'BTC' && localStorage["fiatCurrencyCode"] == 'mBTC') {
//           // from BTC to mBTC
//           var exchangeRateCoeff = 1000;
//           updateGlobalOptionsAmount(exchangeRateCoeff);
//       } else if (oldFiatCurrencyCode == 'mBTC' && localStorage["fiatCurrencyCode"] == 'BTC') {
//           // from mBTC to BTC
//           var exchangeRateCoeff = 1/1000;
//           updateGlobalOptionsAmount(exchangeRateCoeff);
//       } else if (localStorage["fiatCurrencyCode"] == 'BTC') {
//           // from fiat to BTC
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               var exchangeRateCoeff = 1/rateObj['24h_avg'];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (localStorage["fiatCurrencyCode"] == 'mBTC'){
//           currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
//               // from fiat to mBTC
//               var exchangeRateCoeff = 1000/rateObj['24h_avg']
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'BTC') {
//           currencyManager.getExchangeRate(localStorage["fiatCurrencyCode"]).then(function(rateObj) {
//               // from BTC to fiat
//               var exchangeRateCoeff = rateObj['24h_avg'];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       } else if (oldFiatCurrencyCode == 'mBTC') {
//         currencyManager.getExchangeRate(localStorage["fiatCurrencyCode"]).then(function(rateObj) {
//             // from mBTC to fiat
//             var exchangeRateCoeff = rateObj['24h_avg']/1000
//             updateGlobalOptionsAmount(exchangeRateCoeff);
//         });
//       } else { // fiat to fiat
//           util.getJSON('http://api.fixer.io/latest?symbols=' + localStorage["fiatCurrencyCode"] + ',' + oldFiatCurrencyCode)
//           .then(function(ratesData){
//               var exchangeRateCoeff = ratesData.rates[localStorage["fiatCurrencyCode"]] / ratesData.rates[oldFiatCurrencyCode];
//               updateGlobalOptionsAmount(exchangeRateCoeff);
//           });
//       }
//   });
// }


// function newInitFiatCurrency() {
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         updateCurrency(this.value);
//     });
// }

// function initialize() {
//
//     // db = new ydn.db.Storage('protip', schema);
//     // Going to use *localStore* for the options/preferences because
//     // IndexedDB isn't built for a single record options array very
//     // well. When wiping the IndexedDB must remember not to wipe the
//     // Blacklists.
//     db = new ydn.db.Storage('protip', schema);
//
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         updateCurrency(this.value);
//     });
//     // initFiatCurrency();
//     //updateFiatCurrencyCode();
//     initAvailableCurrenciesOptions();
//     initDefaultSubscriptionAmountFiat();
//
//     allowExternalLinks();
//
//     wallet.restoreAddress().then(function () {
//         $('#textAddress').text(wallet.getAddress());
//         setExampleMetaTag();
//     });
//
// }

// function initAvailableCurrenciesOptions() {
//     if (!localStorage["fiatCurrencyCode"]) {
//         localStorage["fiatCurrencyCode"] = "USD"
//     }
//
//     var currencies = currencyManager.getAvailableCurrencies();
//     for (var i in currencies) {
//         var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
//         $('#fiat-currency-select').append(option);
//     }
//
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         preferences.setCurrency($(this.selectedOptions).val());
//         localStorage["fiatCurrencyCode"] = this.value;
//         updateFiatCurrencyCode();
//     });
// }

// function initAvailableCurrenciesOptions() {
//   var currencies = currencyManager.getAvailableCurrencies();
//   for (var i in currencies) {
//       var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
//       $('#fiat-currency-select').append(option);
//   }
// }
// function initFiatCurrency() {
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//         var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//         localStorage["fiatCurrencyCode"] = this.value;
//
//         if(fiatToFiatConversion(oldFiatCurrencyCode, localStorage["fiatCurrencyCode"])){
//             db.values('subscriptions').done(function(records) {
//                 util.getJSON('http://api.fixer.io/latest?symbols=' + localStorage["fiatCurrencyCode"] + ',' + oldFiatCurrencyCode).then(
//                     function(ratesData){
//                         var exchangeRate = ratesData.rates[localStorage["fiatCurrencyCode"]] / ratesData.rates[oldFiatCurrencyCode];
//                         localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * exchangeRate;
//                         $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//                         localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * exchangeRate;
//                         for (var i in records) {
//                             records[i].amountFiat = records[i].amountFiat * exchangeRate;
//                         }
//                         db.put('subscriptions', records);
//                     }
//                 ).then(function(){
//                     preferences.setCurrency(localStorage["fiatCurrencyCode"]);
//                     updateFiatCurrencyCode();
//                 });
//             });
//         } else {
//             preferences.setCurrency(localStorage["fiatCurrencyCode"]);
//             updateFiatCurrencyCode();
//
//             preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function() {
//                 db.values('subscriptions').done(function(records) {
//                     debugger;
//                     currencyManager.updateExchangeRate().then(function(){
//                         debugger;
//                         preferences.getExchangeRate().then(function(rate){
//                             debugger;
//                             localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * rate;
//                             $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//                             localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * rate;
//                             for (var i in records) {
//                                 records[i].amountFiat = records[i].amountFiat * rate;
//                             }
//                             db.put('subscriptions', records);
//                             updateFiatCurrencyCode();
//                         });
//                     });
//                 })
//             });
//         }
//     });
// }

// function fiatToFiatConversion(old_currency_code, new_currency_code){
//     var old = old_currency_code != 'mBTC' && old_currency_code != 'BTC'
//     var current = new_currency_code != 'mBTC' && new_currency_code != 'BTC'
//     if(old && current){
//       return true
//     }
//     return false
// }

// function fiatToFiatConversion(old_currency_code, new_currency_code){
//     var old = old_currency_code != 'mBTC' && old_currency_code != 'BTC'
//     var current = new_currency_code != 'mBTC' && new_currency_code != 'BTC'
//     if(old && current){
//       return true
//     }
//     return false
// }

// function updateCurrencyDefaults(exchangeToBTC, old_currency_code, new_currency_code) {
//     if(new_currency_code == 'BTC'){
//         // Only have the exchange rate FROM fiat TO Bitcoin,
//         //      NOT
//         // FROM bitcoin TO fiat
//         // need to use the inverse.
//         var exchangeRate = 1 / exchangeToBTC
//     } else {
//         var exchangeRate = exchangeToBTC
//     }
//     localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * exchangeRate;
//     $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//     localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * exchangeRate;
//     db.values('subscriptions').done(function(records) {
//         for (var i in records) {
//             records[i].amountFiat = records[i].amountFiat * exchangeRate;
//         }
//     });
// }


// function updateCurrencyDefaults(exchangeToBTC, old_currency_code, new_currency_code) {
//   if (new_currency_code == 'mBTC' && old_currency_code == 'BTC') {
//       localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * 1000;
//       $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//       localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * 1000;
//       db.values('subscriptions').done(function(records) {
//           for (var i in records) {
//               records[i].amountFiat = records[i].amountFiat * 1000;
//           }
//           db.put('subscriptions', records);
//       });
//   } else if(new_currency_code == 'BTC' && old_currency_code == 'mBTC') {
//       localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * 0.0001;
//       $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//       localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * 0.0001;
//       db.values('subscriptions').done(function(records) {
//           for (var i in records) {
//               records[i].amountFiat = records[i].amountFiat * 0.0001;
//           }
//           db.put('subscriptions', records);
//       });
//     } else if(new_currency_code == 'BTC'){
//         localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] / exchangeToBTC;
//         $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//         localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] / exchangeToBTC;
//         db.values('subscriptions').done(function(records) {
//             for (var i in records) {
//                 records[i].amountFiat = records[i].amountFiat / exchangeToBTC;
//             }
//             db.put('subscriptions', records);
//         });
//     } else if(new_currency_code == 'mBTC') {
//         localStorage['defaultSubscriptionAmountFiat'] = (localStorage['defaultSubscriptionAmountFiat'] / exchangeToBTC) * 1000;
//         $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//         localStorage['incidentalTotalFiat'] = (localStorage['incidentalTotalFiat'] / exchangeToBTC) * 1000;
//         db.values('subscriptions').done(function(records) {
//             for (var i in records) {
//                 records[i].amountFiat = (records[i].amountFiat / exchangeToBTC) * 1000;
//             }
//             db.put('subscriptions', records);
//         });
//     } else if(old_currency_code == 'mBTC') {
//         localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * (exchangeToBTC / 1000);
//         $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//         localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * (exchangeToBTC / 1000);
//         db.values('subscriptions').done(function(records) {
//             for (var i in records) {
//                 records[i].amountFiat = records[i].amountFiat * (exchangeToBTC / 1000);
//             }
//             db.put('subscriptions', records);
//         });
//     } else {
//         localStorage['defaultSubscriptionAmountFiat'] = localStorage['defaultSubscriptionAmountFiat'] * exchangeToBTC;
//         $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
//         localStorage['incidentalTotalFiat'] = localStorage['incidentalTotalFiat'] * exchangeToBTC;
//         db.values('subscriptions').done(function(records) {
//             for (var i in records) {
//                 records[i].amountFiat = records[i].amountFiat * exchangeToBTC;
//             }
//             db.put('subscriptions', records);
//         });
//     }
// }
//
// function initFiatCurrency() {
//     $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
//     updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>
//
//     $('#fiat-currency-select').change(function() {
//
//         var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
//         localStorage["fiatCurrencyCode"] = this.value; // new currency
//         preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
//             return currencyManager.updateExchangeRate();
//         }).then(function(exchangeToBTC){
//                    if (localStorage["fiatCurrencyCode"] == 'mBTC' && oldFiatCurrencyCode == 'BTC') {
//                 updateCurrencyDefaults(1000, oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//             } else if(localStorage["fiatCurrencyCode"] == 'BTC'   && oldFiatCurrencyCode == 'mBTC'){
//                 updateCurrencyDefaults(0.0001, oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//             } else if(localStorage["fiatCurrencyCode"] == 'BTC'){
//                 currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj){
//                     updateCurrencyDefaults(rateObj['24h_avg'], oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//                 });
//             } else if(localStorage["fiatCurrencyCode"] == 'mBTC'){
//                 currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj){
//                     updateCurrencyDefaults(rateObj['24h_avg'], oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//                 });
//             } else if (oldFiatCurrencyCode == 'BTC') {
//                 updateCurrencyDefaults(exchangeToBTC, oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//             } else if(oldFiatCurrencyCode == 'mBTC') {
//                 updateCurrencyDefaults(exchangeToBTC, oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//             } else { // fiat to fiat
//                 util.getJSON('http://api.fixer.io/latest?symbols=' + localStorage["fiatCurrencyCode"] + ',' + oldFiatCurrencyCode)
//                 .then(function(ratesData){
//                     var exchangeRateFiatToFiat = ratesData.rates[localStorage["fiatCurrencyCode"]] / ratesData.rates[oldFiatCurrencyCode];
//                     updateCurrencyDefaults(exchangeRateFiatToFiat, oldFiatCurrencyCode, localStorage["fiatCurrencyCode"]);
//                 });
//             }
//         });
//     });
// }

