function allowExternalLinks() {
    $('.external-link').each(function(i, obj) {
        // In a chrome popup page the links won't work without the below.
        $(obj).click(function() {
            chrome.tabs.create({
                url: obj.href
            });
        });
    });
}


function initAvailableCurrenciesOptions() {
    if (!localStorage["fiatCurrencyCode"]) {
        localStorage["fiatCurrencyCode"] = "USD"
    }

    var currencies = currencyManager.getAvailableCurrencies();
    for (var i in currencies) {
        var option = $('<option value="' + currencies[i] + '">' + currencies[i] + '</option>')[0];
        $('#fiat-currency-select').append(option);
    }

    $('#fiat-currency-select').val(localStorage["fiatCurrencyCode"]);
    updateFiatCurrencyCode(); // update any in page <span class="fiat-code">USD</span>

    $('#fiat-currency-select').change(function() {
        preferences.setCurrency($(this.selectedOptions).val());
        localStorage["fiatCurrencyCode"] = this.value;
        updateFiatCurrencyCode();
    });
}


function updateCurrency(newCurrencyCode) {
  var oldFiatCurrencyCode = localStorage["fiatCurrencyCode"];
  var exchangeRateCoeff;

  return preferences.setCurrency(localStorage["fiatCurrencyCode"]).then(function(){
      return currencyManager.updateExchangeRate();
  }).then(function(exchangeToBTC){
      return new Promise(function (resolve, reject) {
          if (oldFiatCurrencyCode == 'BTC' && newCurrencyCode == 'mBTC') {
              // from BTC to mBTC
              exchangeRateCoeff = 1000;
              resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
          } else if (oldFiatCurrencyCode == 'mBTC' && newCurrencyCode == 'BTC') {
              // from mBTC to BTC
              exchangeRateCoeff = 1/1000;
              resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
          } else if (newCurrencyCode == 'BTC') {
              // from fiat to BTC
              currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
                  exchangeRateCoeff = 1/rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
              });
          } else if (newCurrencyCode == 'mBTC'){
              currencyManager.getExchangeRate(oldFiatCurrencyCode).then(function(rateObj) {
                  // from fiat to mBTC
                  exchangeRateCoeff = 1000/rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
              });
          } else if (oldFiatCurrencyCode == 'BTC') {
              currencyManager.getExchangeRate(newCurrencyCode).then(function(rateObj) {
                  // from BTC to fiat
                  exchangeRateCoeff = rateObj['24h_avg'];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
              });
          } else if (oldFiatCurrencyCode == 'mBTC') {
            currencyManager.getExchangeRate(newCurrencyCode).then(function(rateObj) {
                // from mBTC to fiat
                exchangeRateCoeff = rateObj['24h_avg']/1000;
                resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
            });
          } else { // fiat to fiat
              util.getJSON('http://api.fixer.io/latest?symbols=' + newCurrencyCode + ',' + oldFiatCurrencyCode)
              .then(function(ratesData){
                  exchangeRateCoeff = ratesData.rates[newCurrencyCode] / ratesData.rates[oldFiatCurrencyCode];
                  resolve({exchangeRateCoeff: exchangeRateCoeff, newCurrencyCode: newCurrencyCode});
              });
          }
      });
  });
}

function exportSubscriptions(){
		db.values('subscriptions').done(function(records) {
		    var savedSubscriptions = [];
		    for (var i in records) {
		        savedSubscriptions.push(records[i])
		    }
		    savedSubscriptions = JSON.stringify(savedSubscriptions);
		    console.log(savedSubscriptions);
		});
}

function importSubscriptions(subscriptionRecords){
    //var subscriptionRecords = JSON.parse(subscriptionRecords);
		for(var i in subscriptionRecords){
				db.put('subscriptions', subscriptionRecords[i]);
		}	
}

function updateGlobalOptionsAmount(exchangeRateCoeff, newCurrencyCode){
    currencyManager.getSymbol(newCurrencyCode).then(function(currencyDetails){
        var roundingFactor = currencyDetails[2];
        if(roundingFactor){
            localStorage['defaultSubscriptionAmountFiat'] = parseFloat(exchangeRateCoeff * localStorage['defaultSubscriptionAmountFiat']).toFixed(roundingFactor);
        } else {
            localStorage['defaultSubscriptionAmountFiat'] = exchangeRateCoeff * localStorage['defaultSubscriptionAmountFiat'];
        }
        $('#default-subscription-amount-fiat').val(localStorage['defaultSubscriptionAmountFiat']);
        localStorage['incidentalTotalFiat'] = exchangeRateCoeff * localStorage['incidentalTotalFiat'];
        db.values('subscriptions').done(function(records) {
            for (var i in records) {
                if(roundingFactor){
                    records[i].amountFiat = parseFloat(exchangeRateCoeff * records[i].amountFiat).toFixed(roundingFactor);
                    if(records[i].amountFiat < 0.05){ records[i].amountFiat = 0.05 }
                } else {
                    records[i].amountFiat = exchangeRateCoeff * records[i].amountFiat;
                }
            }
            db.put('subscriptions', records);
        });
    });
}


// function getAlarm(){
//     chrome.alarms.getAll(function(objs){
//         var date = new Date(objs[0].scheduledTime);
//         console.log(
//             'Alarm Set to ' + date.format()
//         );
//     });
// }
//
// function setAlarm(date){
//     // date formatt "mmm dd yyyy HH:MM:ss"
//     var date = new Date(date);
//     chrome.alarms.getAll(function(objs){
//         objs[0].scheduledTime = date.getTime();
//         console.log(
//             'Alarm Updated! ' + date.format()
//         );
//     });
// }

function updateFiatCurrencyCode() {
    currencyManager.getSymbol().then(function(symbol){
        $.each($(".fiat-code"), function(key, element) {
            element.textContent = symbol[0];
        });
    });
}

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
