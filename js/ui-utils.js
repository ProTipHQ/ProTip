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
